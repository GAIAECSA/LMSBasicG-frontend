import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/backend";
import { sameOriginRequest } from "@/lib/auth/server";
import { failed, protectedPolicyRequest, safeError } from "@/lib/policies/route-guard";

/** Solo crea un TIPO CLIENT (sin editar ni eliminar lo existente).
 * La primera versión se publica después mediante /versions/html|pdf.
 */
export async function POST(request:NextRequest) {
  if (!sameOriginRequest(request)) return failed(403,"Origen inválido");
  const context=await protectedPolicyRequest(request,true);
  if ("response" in context) return context.response;
  let body:unknown;
  try {body=await request.json();} catch {return failed(400,"JSON inválido");}
  if (!body||typeof body!=="object") return failed(400,"Solicitud inválida");
  const {code,title,mandatory}=body as Record<string,unknown>;
  if (typeof code!=="string"||! /^[a-z0-9][a-z0-9_-]{1,99}$/.test(code)||
      typeof title!=="string"||!title.trim()||title.length>255||typeof mandatory!=="boolean") return failed(400,"Datos de la política inválidos");
  try {
    const response=await apiFetch("/api/v1/policies/admin",context.token,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({code,title:title.trim(),mandatory}),
    });
    if (!response.ok) return failed(response.status===409?409:response.status===422?400:502,
      await safeError(response,"No se pudo crear el tipo de política"));
    const created:unknown=await response.json();
    if (!created||typeof created!=="object"||!Number.isSafeInteger((created as {id?:unknown}).id)) return failed(502,"Respuesta de creación inválida");
    return NextResponse.json({id:(created as {id:number}).id},{status:201,headers:{"Cache-Control":"private, no-store"}});
  } catch {return failed(503,"Backend no disponible");}
}
