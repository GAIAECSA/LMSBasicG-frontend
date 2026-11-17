import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/backend";
import { sameOriginRequest, SESSION_COOKIE } from "@/lib/auth/server";

/** Logout intenta revocar jti/sesión en la BD. Limpia siempre la cookie local. */
export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return NextResponse.json({message:"Origen inválido"},{status:403});
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let revoked = !token;
  if (token) {
    try {
      const result = await apiFetch("/api/v1/auth/logout",token,{method:"POST"});
      revoked = result.ok || result.status === 401;
    } catch { revoked = false; }
  }
  const response = NextResponse.json({ok:true,revoked},{headers:{"Cache-Control":"no-store"}});
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
