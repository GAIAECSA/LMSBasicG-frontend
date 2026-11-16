import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { backendBaseUrl } from "@/lib/backend/config";
import { sameOriginRequest, SESSION_COOKIE } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return NextResponse.json({ message: "Origen inválido" }, { status: 403 });
  const tenant = await resolveTenant();
  let values: unknown;
  try { values = await request.json(); } catch { return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 }); }
  if (!values || typeof values !== "object") return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 });
  const { username, password } = values as Record<string, unknown>;
  if (typeof username !== "string" || !username.trim() || username.length > 190 ||
      typeof password !== "string" || password.length > 128 || !password) {
    return NextResponse.json({ message: "Completa tus credenciales" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${backendBaseUrl()}/api/v1/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password, domain: tenant.tenantDomain }),
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ message: upstream.status === 401 ? "Credenciales incorrectas" : "No se pudo iniciar sesión" }, { status: upstream.status >= 500 ? 502 : upstream.status });
    }
    const payload = await upstream.json();
    if (!payload || payload.user?.business_id !== tenant.id || typeof payload.access_token !== "string") {
      return NextResponse.json({ message: "La sesión no corresponde a esta academia" }, { status: 403 });
    }
    const response = NextResponse.json({ user: payload.user }, { headers: { "Cache-Control": "no-store" } });
    const expiresMs = Date.parse(payload.expires_at);
    const maxAge = Number.isFinite(expiresMs) ? Math.max(1, Math.min(Math.floor((expiresMs - Date.now()) / 1000), 86400)) : 3600;
    // Cookie host-only (sin Domain), aislada entre dominios incluso con la misma IP.
    response.cookies.set(SESSION_COOKIE, payload.access_token, {
      httpOnly: true, secure: request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:",
      sameSite: "lax", path: "/", maxAge,
    });
    return response;
  } catch {
    return NextResponse.json({ message: "El servicio de autenticación no está disponible" }, { status: 502 });
  }
}
