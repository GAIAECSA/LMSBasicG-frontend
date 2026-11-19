import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/backend";
import { authState, sameOriginRequest, SESSION_COOKIE } from "@/lib/auth/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { isTenantAdmin } from "@/lib/policies/types";
import type { TenantModule } from "@/lib/auth/types";
import { enabledCourseCodes, type CourseCode } from "./types";

export const error = (status:number,message:string)=>NextResponse.json({message},{status,headers:{"Cache-Control":"private, no-store"}});
export const output = (data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function authorize(request:NextRequest):Promise<
 {token:string;tenantId:number;modules:TenantModule[];allowed:CourseCode[]}|{response:NextResponse}> {
 const token=request.cookies.get(SESSION_COOKIE)?.value;
 if(!token)return {response:error(401,'Sesión requerida')};
 try {
  const state=await authState(await resolveTenant(),token);
  if(state.status==='unauthenticated')return {response:error(401,'Sesión vencida')};
  if(state.status==='pending')return {response:error(428,'Acepta las políticas pendientes')};
  if(state.status==='unavailable')return {response:error(503,'No fue posible comprobar la sesión')};
  if(!isTenantAdmin(state.user.role))return {response:error(403,'Solo administradores')};
  return {token,tenantId:state.user.business_id,modules:state.modules,allowed:enabledCourseCodes(state.modules,{
    MOOC:process.env.ATHENA_LMS_MOOC_CODE||'MOOC',
    MDT:process.env.ATHENA_LMS_MDT_CODE||'MDT'
   })};
 }catch{return {response:error(503,'No fue posible comprobar el tenant')};}
}
export const validIdPath=(raw:string):number|null=>/^[1-9]\d*$/.test(raw)&&Number.isSafeInteger(Number(raw))?Number(raw):null;
export function mutation(request:NextRequest,contentType:'json'|'form'|'any'='json') {
 if(!sameOriginRequest(request))return error(403,'Origen no permitido');
 const ct=(request.headers.get('content-type')||'').toLowerCase();
 if(contentType==='json'&&!ct.startsWith('application/json'))return error(415,'Se requiere JSON');
 if(contentType==='form'&&!ct.startsWith('multipart/form-data;'))return error(415,'Se requiere multipart/form-data');
 return null;
}
export async function json(request:NextRequest,max=16384):Promise<{value:unknown}|{response:NextResponse}> {
 const bytes=await bounded(request,max);
 if('response'in bytes)return bytes;
 try{return {value:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.data))};}
 catch{return {response:error(400,'JSON inválido')};}
}
/** Lee el cuerpo con límite REAL incluso si falta Content-Length. */
async function bounded(request:NextRequest,max:number):Promise<{data:Uint8Array}|{response:NextResponse}> {
 const length=Number(request.headers.get('content-length'));
 if(Number.isFinite(length)&&length>max)return {response:error(413,'Archivo o solicitud demasiado grande')};
 if(!request.body)return {response:error(400,'Falta el cuerpo de la solicitud')};
 const reader=request.body.getReader();let size=0;const parts:Uint8Array[]=[];
 try {for(;;){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;
  if(size>max){await reader.cancel();return {response:error(413,'Archivo o solicitud demasiado grande')};}parts.push(item.value);}
 }catch{return {response:error(400,'No se pudo leer la solicitud')};}finally{reader.releaseLock();}
 const out=new Uint8Array(size);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.byteLength;}
 return {data:out};
}
export async function multipart(request:NextRequest):Promise<{form:FormData}|{response:NextResponse}> {
 const raw=await bounded(request,6*1024*1024);if('response'in raw)return raw;
 try {
  const surrogate=new Request('http://internal.invalid/',{method:'POST',headers:{'Content-Type':request.headers.get('content-type')||''},body:raw.data as BodyInit});
  const form=await surrogate.formData();return {form};
 }catch{return {response:error(400,'Formulario multipart inválido')};}
}
export async function upstream(response:Response):Promise<NextResponse> {
 const status=[400,401,403,404,409,413,415,422,428].includes(response.status)?response.status:502;
 let message: string = status===409?'La operación entra en conflicto con datos existentes':
  status===404?'Recurso no encontrado':status===422?'Verifica los campos del formulario':
  status===428?'Debes aceptar las políticas':status===403?'Sin autorización':'No se pudo completar la operación';
 if([400,404,409,422].includes(status))try {
  const body:unknown=await response.json();if(body&&typeof body==='object'&&'detail'in body){
   const detail=(body as {detail:unknown}).detail;
   if(typeof detail==='string')message=detail.slice(0,250);
   else if(Array.isArray(detail)&&typeof detail[0]?.msg==='string')message=detail[0].msg.slice(0,250);
  }
 }catch{}
 return error(status,message);
}
export async function upstreamJson(path:string,token:string,parse:(v:unknown)=>unknown|null,init:RequestInit={},status=200):Promise<NextResponse> {
 try {const response=await apiFetch(path,token,init);if(!response.ok)return upstream(response);
  if(response.status===204)return new NextResponse(null,{status:204});
  const parsed=parse(await response.json());return parsed===null?error(502,'Respuesta inesperada de FastAPI'):output(parsed,status);
 }catch{return error(503,'No fue posible conectar con FastAPI');}
}
export const postJson=(value:unknown)=>({headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
export function validatedText(v:unknown,max=200):v is string{return typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;}
export const isRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function validCategoriesBody(v:unknown):v is {name:string} {return isRecord(v)&&Object.keys(v).every(k=>k==='name')&&validatedText(v.name,150);}
export function validSubcategoriesBody(v:unknown):v is {name:string;category_id:number} {return isRecord(v)&&
 Object.keys(v).every(k=>k==='name'||k==='category_id')&&validatedText(v.name,150)&&Number.isSafeInteger(v.category_id)&&(v.category_id as number)>0;}
export function allowedType(courseTypeId:number,types:{id:number;code:CourseCode}[],allowed:CourseCode[]):boolean {
 const selected=types.find(t=>t.id===courseTypeId);return !!selected&&allowed.includes(selected.code);
}
