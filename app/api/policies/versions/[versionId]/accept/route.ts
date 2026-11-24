import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { apiFetch, jwtTenantAndExpiry } from "@/lib/auth/backend";
import { SESSION_COOKIE, sameOriginRequest } from "@/lib/auth/server";
import { parsePendingPolicies } from "@/lib/auth/types";

type Params={params:Promise<{versionId:string}>};
/** POST sin identidad de usuario/business desde el cliente; la obtiene el backend del JWT. */
export async function POST(request:NextRequest,{params}:Params) {
  if (!sameOriginRequest(request)) return NextResponse.json({message:"Origen inválido"},{status:403});
  const {versionId}=await params;const id=Number(versionId);
  if (!Number.isSafeInteger(id)||id<1) return NextResponse.json({message:"Versión inválida"},{status:400});
  const tenant=await resolveTenant();const token=request.cookies.get(SESSION_COOKIE)?.value;
  if (!token||jwtTenantAndExpiry(token)?.businessId!==tenant.id) return NextResponse.json({message:"Sin sesión"},{status:401});
  try {
    const pendingRes=await apiFetch("/api/v1/policies/pending",token);
    if (!pendingRes.ok) return NextResponse.json({message:"No se pudieron verificar las políticas"},{status:pendingRes.status===401?401:503});
    const before=parsePendingPolicies(await pendingRes.json());
    if (!before) return NextResponse.json({message:"Respuesta inválida"},{status:502});
    if (!before.some(p=>p.version_id===id)) return NextResponse.json({message:"La versión ya no está pendiente"},{status:409});
    const result=await apiFetch(`/api/v1/policies/versions/${id}/accept`,token,{method:"POST"});
    if (!result.ok) return NextResponse.json({message:result.status===409?"La política cambió; actualiza la página":"No se registró la aceptación"},{status:result.status===409?409:502});
    const next=await apiFetch("/api/v1/policies/pending",token);
    if (!next.ok) return NextResponse.json({message:"Aceptada. Vuelve a cargar para comprobar el siguiente documento"},{status:503});
    const pending=parsePendingPolicies(await next.json());
    if (!pending) return NextResponse.json({message:"Respuesta inválida"},{status:502});
    return NextResponse.json({pending},{headers:{"Cache-Control":"private, no-store"}});
  } catch {return NextResponse.json({message:"Error de comunicación"},{status:503});}
}
