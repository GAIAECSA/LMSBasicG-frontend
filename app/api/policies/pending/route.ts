import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { apiFetch, jwtTenantAndExpiry } from "@/lib/auth/backend";
import { SESSION_COOKIE } from "@/lib/auth/server";
import { parsePendingPolicies } from "@/lib/auth/types";

export async function GET(request: NextRequest) {
  const tenant=await resolveTenant();
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || jwtTenantAndExpiry(token)?.businessId !== tenant.id) return NextResponse.json({message:"Sin sesión"},{status:401});
  try {
    const upstream=await apiFetch("/api/v1/policies/pending",token);
    if (!upstream.ok) return NextResponse.json({message:"No se pudieron cargar las políticas"},{status:upstream.status===401?401:503});
    const pending=parsePendingPolicies(await upstream.json());
    if (!pending) return NextResponse.json({message:"Respuesta inválida"},{status:502});
    return NextResponse.json({pending},{headers:{"Cache-Control":"private, no-store"}});
  } catch {return NextResponse.json({message:"Backend no disponible"},{status:503});}
}
