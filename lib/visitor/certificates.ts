/** Certificados VISITOR: el listado privado no depende del catálogo publicado.
 * No aceptar file_url, cédula ni IDs de titular dentro de estas respuestas.
 */
import {cookies} from 'next/headers';
import {apiFetch} from '@/lib/auth/backend';
import {SESSION_COOKIE} from '@/lib/auth/server';

import {parseVisitorCertList,type VisitorCertState} from './certificate-types';

export async function loadVisitorCerts(page=1):Promise<VisitorCertState>{
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return {status:'unavailable'};
 try{
  const r=await apiFetch(`/api/v1/visitor-certificates/my?page=${page}&page_size=24`,token);
  if(!r.ok)return {status:'unavailable'};
  const data=parseVisitorCertList(await r.json());
  return data?{status:'ok',data}:{status:'unavailable'};
 }catch{return {status:'unavailable'};}
}
