import { NextRequest } from 'next/server';
import { authorize,error,json,mutation,output,postJson,upstream } from '@/lib/academic/bff';
import { apiFetch } from '@/lib/auth/backend';
import { parseProfile,parseProfilePatch } from '@/lib/tenant/profile';
import { invalidateTenantDomains } from '@/lib/tenant/lookup';
import { resolveTenant } from '@/lib/tenant/resolve';
export const runtime='nodejs';
const path='/api/v1/tenant/admin/profile';
export async function GET(request:NextRequest){
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 try{const response=await apiFetch(path,ctx.token);if(!response.ok)return upstream(response);
  const profile=parseProfile(await response.json(),ctx.tenantId);const tenant=await resolveTenant();
  return profile&&profile.tenant_domain===tenant.tenantDomain?output(profile):error(502,'Perfil institucional inesperado');
 }catch{return error(503,'No se pudo consultar el perfil institucional');}
}
export async function PATCH(request:NextRequest){
 const invalid=mutation(request);if(invalid)return invalid;
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const body=await json(request);if('response'in body)return body.response;
 const patch=parseProfilePatch(body.value);if(!patch)return error(400,'Revisa los campos institucionales y los colores HEX');
 try{
  const tenant=await resolveTenant();
  // Consultar dominios antes de mutar para invalidarlos incluso si falla la respuesta.
  const current=await apiFetch(path,ctx.token);if(!current.ok)return upstream(current);
  const before=parseProfile(await current.json(),ctx.tenantId);if(!before||before.tenant_domain!==tenant.tenantDomain)return error(502,'Perfil institucional inesperado');
  try{
   const response=await apiFetch(path,ctx.token,{method:'PATCH',...postJson(patch)});if(!response.ok)return upstream(response);
   const profile=parseProfile(await response.json(),ctx.tenantId);if(!profile||profile.tenant_domain!==before.tenant_domain||profile.landing_domain!==before.landing_domain)return error(502,'No se pudo confirmar el perfil actualizado');
   return output(profile);
  }finally{invalidateTenantDomains(before.tenant_domain,before.landing_domain,tenant.matchedDomain);}
 }catch{return error(503,'No se pudo confirmar la actualización institucional; vuelve a consultar el perfil');}
}
