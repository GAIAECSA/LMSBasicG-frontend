import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState, SESSION_COOKIE } from "@/lib/auth/server";

/** Heartbeat / enfoque de pestaña: los fallos transitorios no eliminan la sesión.
 * Solo un 401 verificado invalida el token; la falta de red siempre es 503.
 */
export async function GET(request: NextRequest) {
  let state: Awaited<ReturnType<typeof authState>>;
  try {
    state = await authState(await resolveTenant(), request.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    return NextResponse.json({status:"unavailable"},
      {status:503,headers:{"Cache-Control":"no-store"}});
  }
  if (state.status === "unauthenticated") {
    const response = NextResponse.json({status:state.status},{status:401,headers:{"Cache-Control":"no-store"}});
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  if (state.status === "unavailable") return NextResponse.json({status:state.status},
    {status:503,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json(state,{headers:{"Cache-Control":"no-store"}});
}
