import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { backendBaseUrl } from "@/lib/backend/config";
import { apiFetch } from "@/lib/auth/backend";
import { sameOriginRequest, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/server";
import { parsePendingPolicies, validUser } from "@/lib/auth/types";

/** Credenciales siempre se procesan en el servidor y contra el tenant resuelto por Host. */
export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return NextResponse.json({message:"Origen inválido"},{status:403});
  const tenant = await resolveTenant();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({message:"Solicitud inválida"},{status:400}); }
  if (!body || typeof body !== "object") return NextResponse.json({message:"Solicitud inválida"},{status:400});
  const {username,password} = body as Record<string,unknown>;
  if (typeof username !== "string" || !username.trim() || username.length > 190 ||
      typeof password !== "string" || !password || password.length > 128) {
    return NextResponse.json({message:"Completa tus credenciales"},{status:400});
  }
  let token: string | null = null;
  try {
    const result = await fetch(`${backendBaseUrl()}/api/v1/auth/login`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({username:username.trim(),password,domain:tenant.tenantDomain}),
      cache:"no-store",signal:AbortSignal.timeout(10000),
    });
    if (!result.ok) return NextResponse.json({message:result.status===401?"Credenciales incorrectas":
      result.status===403?"Tu rol no permite iniciar sesión":"No fue posible iniciar sesión"},
      {status:result.status>=500?502:result.status});
    const login = await result.json();
    token = login?.access_token;
    if (typeof token !== "string" || !validUser(login?.user) ||
        login.user.business_id !== tenant.id || login.user.role.scope !== "PLATFORM") {
      return NextResponse.json({message:"La sesión no corresponde a esta academia"},{status:403});
    }
    // No se debe permitir entrar al campus si no se puede verificar el bloqueo de policies.
    const policiesResponse = await apiFetch("/api/v1/policies/pending",token);
    const pending = policiesResponse.ok ? parsePendingPolicies(await policiesResponse.json()) : null;
    if (!pending) {
      await revokeQuietly(token);
      return NextResponse.json({message:"No se pudieron verificar las políticas obligatorias"},{status:503});
    }
    const expiry = Date.parse(login.expires_at);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      await revokeQuietly(token);
      return NextResponse.json({message:"La sesión emitida ya está vencida"},{status:503});
    }
    const response = NextResponse.json({requiresPolicies:pending.length>0},
      {headers:{"Cache-Control":"no-store"}});
    const maxAge = Math.max(1,Math.min(Math.floor((expiry-Date.now())/1000),86400));
    const secure = request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:";
    response.cookies.set(SESSION_COOKIE,token,sessionCookieOptions(secure,maxAge));
    return response;
  } catch {
    if (token) await revokeQuietly(token);
    return NextResponse.json({message:"El servicio de autenticación no está disponible"},{status:502});
  }
}

async function revokeQuietly(token: string) {
  try { await apiFetch("/api/v1/auth/logout",token,{method:"POST"}); } catch { /* No ocultar error principal. */ }
}
