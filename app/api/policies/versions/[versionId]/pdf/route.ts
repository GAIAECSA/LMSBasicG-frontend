import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { apiFetch, jwtTenantAndExpiry } from "@/lib/auth/backend";
import { SESSION_COOKIE } from "@/lib/auth/server";
import { parsePendingPolicies } from "@/lib/auth/types";

type Params={params:Promise<{versionId:string}>};
export async function GET(request:NextRequest,{params}:Params) {
  const {versionId}=await params; const id=Number(versionId);
  if (!Number.isSafeInteger(id)||id<1) return NextResponse.json({message:"Versión inválida"},{status:400});
  const tenant=await resolveTenant();const token=request.cookies.get(SESSION_COOKIE)?.value;
  if (!token||jwtTenantAndExpiry(token)?.businessId!==tenant.id) return NextResponse.json({message:"Sin sesión"},{status:401});
  try {
    const check=await apiFetch("/api/v1/policies/pending",token);
    if (!check.ok) return NextResponse.json({message:"No disponible"},{status:check.status===401?401:503});
    const pending=parsePendingPolicies(await check.json());
    if (!pending) return NextResponse.json({message:"Respuesta inválida"},{status:502});
    if (!pending.some(p=>p.version_id===id&&p.content_format==="PDF")) return NextResponse.json({message:"Versión no pendiente"},{status:404});
    const pdf=await apiFetch(`/api/v1/policies/versions/${id}/pdf`,token);
    if (!pdf.ok||!pdf.body) return NextResponse.json({message:"Documento no disponible"},{status:502});
    if (!(pdf.headers.get("content-type")||"").includes("application/pdf")) return NextResponse.json({message:"Formato inesperado"},{status:502});
    return new NextResponse(pdf.body,{status:200,headers:{
      "Content-Type":"application/pdf", "Content-Disposition":`inline; filename="politica-${id}.pdf"`,
      "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff",
    }});
  } catch {return NextResponse.json({message:"Error de comunicación"},{status:503});}
}
