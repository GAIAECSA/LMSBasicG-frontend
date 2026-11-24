import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/backend";
import { sameOriginRequest } from "@/lib/auth/server";
import { failed, numericId, protectedPolicyRequest, safeError } from "@/lib/policies/route-guard";

type Params={params:Promise<{policyId:string}>};
const MAX_PDF_BYTES=25*1024*1024; // Coincide con el perfil privado PDF de FastAPI.
export async function POST(request:NextRequest,{params}:Params) {
  if (!sameOriginRequest(request)) return failed(403,"Origen inválido");
  const id=numericId((await params).policyId);
  if (!id) return failed(400,"Política inválida");
  const context=await protectedPolicyRequest(request,true);
  if ("response" in context) return context.response;
  if (!(request.headers.get("content-type")||"").startsWith("multipart/form-data")) return failed(415,"Se requiere multipart/form-data");
  const length=Number(request.headers.get("content-length"));
  if (Number.isFinite(length)&&length>MAX_PDF_BYTES+1024*128) return failed(413,"PDF demasiado grande (máximo 25 MiB)");
  let form:FormData;
  try {form=await request.formData();} catch {return failed(400,"Formulario PDF inválido");}
  const version=form.get("version"),file=form.get("file");
  if (typeof version!=="string"||!version.trim()||version.length>50||!(file instanceof File)||
      file.size<5||file.size>MAX_PDF_BYTES||!file.name.toLowerCase().endsWith(".pdf")) return failed(400,"Versión o archivo PDF inválido (máximo 25 MiB)");
  // El backend comprueba el perfil/magic bytes y guarda en almacenamiento privado por tenant.
  const upstreamForm=new FormData();
  upstreamForm.set("version",version.trim());
  upstreamForm.set("file",file,file.name);
  try {
    const response=await apiFetch(`/api/v1/policies/admin/${id}/versions/pdf`,context.token,{
      method:"POST",body:upstreamForm,signal:AbortSignal.timeout(120000),
    });
    if (!response.ok) return failed([400,409,413,422].includes(response.status)?response.status:502,
      await safeError(response,"No se pudo publicar el documento PDF"));
    const created:unknown=await response.json();
    if (!created||typeof created!=="object"||!Number.isSafeInteger((created as {id?:unknown}).id)) return failed(502,"Respuesta de publicación inválida");
    return NextResponse.json({id:(created as {id:number}).id,ok:true},{status:201,headers:{"Cache-Control":"private, no-store"}});
  } catch {return failed(503,"Backend no disponible");}
}
