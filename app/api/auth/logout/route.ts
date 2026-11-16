import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "@/lib/backend/config";
import { sameOriginRequest, SESSION_COOKIE } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return NextResponse.json({ message: "Origen inválido" }, { status: 403 });
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await fetch(`${backendBaseUrl()}/api/v1/auth/logout`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", signal: AbortSignal.timeout(7000),
      });
    } catch { /* Cierre local de sesión incluso con upstream no disponible. */ }
  }
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
