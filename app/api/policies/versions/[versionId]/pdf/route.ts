import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { apiFetch, jwtTenantAndExpiry } from "@/lib/auth/backend";
import { SESSION_COOKIE } from "@/lib/auth/server";
import { failed, numericId } from "@/lib/policies/route-guard";

type Params={params:Promise<{versionId:string}>};
/** Nunca publicar URLs directas de private-files. Verifica acceso en FastAPI antes de
 * transmitir el PDF; conserva Content-Disposition inline para visor de navegador.
 */
export async function GET(request:NextRequest,{params}:Params) {
  const id=numericId((await params).versionId);
  if (!id) return failed(400,"Versión inválida");
  const tenant=await resolveTenant();
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if (!token||jwtTenantAndExpiry(token)?.businessId!==tenant.id) return failed(401,"Sesión requerida");
  try {
    const upstream=await apiFetch(`/api/v1/policies/versions/${id}/pdf`,token,{signal:AbortSignal.timeout(30000)});
    if (!upstream.ok || !upstream.body) return failed([401,403,404,409].includes(upstream.status)?upstream.status:502,
      "No fue posible abrir el PDF");
    if (!(upstream.headers.get("content-type")||"").includes("application/pdf")) return failed(502,"El backend devolvió otro formato");
    return new NextResponse(upstream.body,{status:200,headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":`inline; filename="politica-${id}.pdf"`,
      "Cache-Control":"private, no-store",
      "X-Content-Type-Options":"nosniff",
    }});
  } catch {return failed(503,"Backend no disponible");}
}
