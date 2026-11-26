import { NextRequest,NextResponse } from 'next/server';
import { authorize,error,mutation,multipart,output,upstream } from '@/lib/academic/bff';
import { apiFetch } from '@/lib/auth/backend';
import { invalidateTenantDomains } from '@/lib/tenant/lookup';
import { resolveTenant } from '@/lib/tenant/resolve';
import { LOGO_MAX_BYTES,parseProfile,record,safeLogo,validLogoFile } from '@/lib/tenant/profile';
export const runtime='nodejs';
async function change(request:NextRequest,method:'POST'|'DELETE'){
 const invalid=mutation(request,method==='POST'?'form':'any');if(invalid)return invalid;
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 let body:FormData|undefined;
 if(method==='POST'){
  const data=await multipart(request,LOGO_MAX_BYTES+64*1024);if('response'in data)return data.response;
  const file=data.form.get('file');
  if([...data.form.keys()].length!==1||!(file instanceof File)||!validLogoFile(file))return error(400,'Logo inválido: PNG, JPEG o WebP, máximo 10 MiB');
  body=new FormData();body.set('file',file);
 }
 try{
  const tenant=await resolveTenant();const current=await apiFetch('/api/v1/tenant/admin/profile',ctx.token);if(!current.ok)return upstream(current);
  const before=parseProfile(await current.json(),ctx.tenantId);if(!before||before.tenant_domain!==tenant.tenantDomain)return error(502,'Perfil institucional inesperado');
  try{
   const response=await apiFetch('/api/v1/tenant/admin/logo',ctx.token,{method,body,signal:AbortSignal.timeout(120_000)});if(!response.ok)return upstream(response);
   if(method==='DELETE')return response.status===204?new NextResponse(null,{status:204,headers:{'Cache-Control':'private, no-store'}}):error(502,'No se pudo confirmar la eliminación del logo');
   const data:unknown=await response.json();const logo=record(data)?safeLogo(data.logo_url,before.tenant_domain):null;
   return logo?output({logo_url:logo}):error(502,'No se pudo confirmar el logo actualizado');
  }finally{invalidateTenantDomains(before.tenant_domain,before.landing_domain,tenant.matchedDomain);}
 }catch{return error(503,'No se pudo confirmar el cambio de logo; vuelve a consultar el perfil');}
}
export const POST=(request:NextRequest)=>change(request,'POST');
export const DELETE=(request:NextRequest)=>change(request,'DELETE');
