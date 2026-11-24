import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/backend";
import { sameOriginRequest } from "@/lib/auth/server";
import { failed, numericId, protectedPolicyRequest, safeError } from "@/lib/policies/route-guard";

type Params={params:Promise<{policyId:string}>};
/** Publicación inmutable. No se ofrece PATCH, DELETE, cancel ni effective_at desde el frontend. */
export async function POST(request:NextRequest,{params}:Params) {
  if (!sameOriginRequest(request)) return failed(403,"Origen inválido");
  const id=numericId((await params).policyId);
  if (!id) return failed(400,"Política inválida");
  const context=await protectedPolicyRequest(request,true);
  if ("response" in context) return context.response;
  let payload:unknown;
  try {payload=await request.json();} catch {return failed(400,"JSON inválido");}
  if (!payload||typeof payload!=="object") return failed(400,"Solicitud inválida");
  const {version,html_content}=payload as Record<string,unknown>;
  if (typeof version!=="string"||!version.trim()||version.length>50||
      typeof html_content!=="string"||!html_content.trim()||
      Buffer.byteLength(html_content,"utf8")>262144) return failed(400,"Versión o HTML inválido (máximo 256 KiB)");
  try {
    const response=await apiFetch(`/api/v1/policies/admin/${id}/versions/html`,context.token,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({version:version.trim(),html_content,effective_at:null}),
    });
    if (!response.ok) return failed([400,409,422].includes(response.status)?response.status:502,
      await safeError(response,"No se pudo publicar el documento HTML"));
    const created:unknown=await response.json();
    if (!created||typeof created!=="object"||!Number.isSafeInteger((created as {id?:unknown}).id)) return failed(502,"Respuesta de publicación inválida");
    return NextResponse.json({id:(created as {id:number}).id,ok:true},{status:201,headers:{"Cache-Control":"private, no-store"}});
  } catch {return failed(503,"Backend no disponible");}
}
