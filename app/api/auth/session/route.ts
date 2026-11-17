import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState, SESSION_COOKIE } from "@/lib/auth/server";

/** 60 s heartbeat / enfoque de pestaña; comprueba revocación, rol, expiración y policies nuevas. */
export async function GET(request: NextRequest) {
  const state = await authState(await resolveTenant(),request.cookies.get(SESSION_COOKIE)?.value);
  if (state.status === "unauthenticated") {
    const response = NextResponse.json({status:state.status},{status:401,headers:{"Cache-Control":"no-store"}});
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  if (state.status === "unavailable") return NextResponse.json({status:state.status},
    {status:503,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json(state,{headers:{"Cache-Control":"no-store"}});
}
