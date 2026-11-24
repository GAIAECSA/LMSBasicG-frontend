/** BFF de certificados del visitante: allowlist estricta, sin proxy de URL libre.
 * El titular y la matrícula se comprueban en FastAPI en cada operación.
 * Una descarga externa solicita /download para actualizar visited_at.
 */
import {NextRequest,NextResponse} from 'next/server';
import {resolveTenant} from '@/lib/tenant/resolve';
import {apiFetch} from '@/lib/auth/backend';
import {authState,sameOriginRequest} from '@/lib/auth/server';
import type {VisitorCertCourse,VisitorCertItem,VisitorCertType} from '@/lib/visitor/certificate-types';

type Params={params:Promise<{courseId:string;kind:string;certificateId:string;action:string}>};
const positive=(s:string)=>/^[1-9]\d*$/.test(s)&&Number.isSafeInteger(Number(s));
const failure=(status:number,message:string)=>NextResponse.json({message},{status,headers:{'Cache-Control':'private, no-store'}});

async function handle(request:NextRequest,route:Params,method:'GET'|'POST'){
 const {courseId,certificateId,kind,action}=await route.params;
 if(!positive(courseId)||!positive(certificateId)||!['AUTOMATIC','MDT','INSTITUTIONAL'].includes(kind)||
   !['preview','download','generate'].includes(action)||
   (action==='generate'&&method!=='POST')||(action!=='generate'&&method!=='GET'))
  return failure(404,'Operación no disponible');
 if(method==='POST'&&!sameOriginRequest(request))return failure(403,'Origen no autorizado');
 try{
  const tenant=await resolveTenant();
  const state=await authState(tenant);
  if(state.status==='pending')return failure(428,'Acepta las políticas pendientes');
  if(state.status==='unavailable')return failure(503,'No se pudo validar la sesión');
  if(state.status!=='ready')return failure(401,'Inicia sesión');
  if(state.user.role.code!=='VISITOR'||state.user.role.scope!=='PLATFORM')return failure(403,'Operación para VISITOR');
  const token=request.cookies.get('athena_lms_session')?.value;
  if(!token)return failure(401,'Sesión no disponible');
  const detail=await apiFetch(`/api/v1/visitor-certificates/courses/${courseId}`,token);
  if(!detail.ok)return failure(detail.status===403?403:404,'Certificado no encontrado o sin autorización');
  const row=await detail.json() as VisitorCertCourse;
  if(row.course_id!==Number(courseId)||!Array.isArray(row.certificates))return failure(502,'Respuesta inesperada');
  const cert=row.certificates.find((c:VisitorCertItem)=>c.id===Number(certificateId)&&c.type===kind as VisitorCertType);
  if(!cert||!(action==='generate'?cert.can_generate:action==='preview'?cert.can_preview:cert.can_download))
   return failure(403,'Certificado no disponible para esta acción');
  const path=kind==='AUTOMATIC'?`/api/v1/certificates/${certificateId}/${action}`:
    `/api/v1/external-certificates/${certificateId}/${action}`;
  const result=await apiFetch(path,token,{method,signal:AbortSignal.timeout(action==='generate'?30000:60000)});
  if(!result.ok){
   let message=`La operación no pudo completarse (${result.status}).`;
   try{const d:unknown=await result.json();if(d&&typeof d==='object'&&'detail' in d&&typeof d.detail==='string')message=d.detail;}catch{}
   return failure(result.status,message.slice(0,350));
  }
  if(action==='generate')return NextResponse.json(await result.json(),{headers:{'Cache-Control':'private, no-store'}});
  const headers=new Headers({'Content-Type':'application/pdf','Cache-Control':'private, no-store',
   'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN'});
  const disposition=result.headers.get('content-disposition');
  if(disposition)headers.set('Content-Disposition',disposition);
  return new NextResponse(result.body,{status:200,headers});
 }catch{return failure(503,'No fue posible verificar o recuperar el certificado');}
}
export const GET=(req:NextRequest,params:Params)=>handle(req,params,'GET');
export const POST=(req:NextRequest,params:Params)=>handle(req,params,'POST');
