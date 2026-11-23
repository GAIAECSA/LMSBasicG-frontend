import { requestJson } from '@/lib/academic/client';
export const modulesUrl=(courseId:number,...parts:(string|number)[])=>`/api/course-modules/${courseId}/${parts.map(encodeURIComponent).join('/')}`;
export function sendJson(url:string,method:'POST'|'PUT'|'PATCH'|'DELETE',data?:unknown):Promise<unknown>{
  return requestJson(url,undefined,{method,...(data===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})});
}
export async function sendFile(url:string,form:FormData,method:'POST'|'PUT'='POST'){
  return requestJson(url,undefined,{method,body:form});
}
export function displayDate(date:string|null){return date?new Date(date).toLocaleString('es-EC',{dateStyle:'medium',timeStyle:'short'}):'Disponible desde ahora';}
