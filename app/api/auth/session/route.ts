import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authenticatedUser, SESSION_COOKIE } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const tenant = await resolveTenant();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await authenticatedUser(token) : null;
  if (!user || user.business_id !== tenant.id) {
    const response = NextResponse.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  return NextResponse.json({ authenticated: true, user }, { headers: { "Cache-Control": "no-store" } });
}
