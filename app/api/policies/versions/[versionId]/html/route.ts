import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { apiFetch, jwtTenantAndExpiry } from "@/lib/auth/backend";
import { SESSION_COOKIE } from "@/lib/auth/server";
import { failed, numericId } from "@/lib/policies/route-guard";

type Params={params:Promise<{versionId:string}>};
/** El mismo lector sirve al wizard y a los historiales. El backend decide si la
 * versión es vigente, aceptada previamente o propia del administrador del tenant.
 */
export async function GET(request:NextRequest,{params}:Params) {
  const id=numericId((await params).versionId);
  if (!id) return failed(400,"Versión inválida");
  const tenant=await resolveTenant();
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if (!token||jwtTenantAndExpiry(token)?.businessId!==tenant.id) return failed(401,"Sesión requerida");
  try {
    const upstream=await apiFetch(`/api/v1/policies/versions/${id}/html`,token);
    if (!upstream.ok) return failed([401,403,404,409].includes(upstream.status)?upstream.status:502,
      upstream.status===409?"La versión es un PDF":"No se pudo leer el documento");
    const data:unknown=await upstream.json();
    if (!data||typeof data!=="object"||typeof (data as {html_content?:unknown}).html_content!=="string" ||
        (data as {version_id?:unknown}).version_id!==id) return failed(502,"Respuesta HTML inválida");
    return NextResponse.json({html:(data as {html_content:string}).html_content},
      {headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  } catch {return failed(503,"Backend no disponible");}
}
