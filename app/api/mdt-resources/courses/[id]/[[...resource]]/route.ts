/** BFF para Recursos MDT. Nunca entrega JWT, paths de uploads_private ni toma
 * business_id del navegador. FastAPI vuelve a validar permisos y matrícula.
 * Los cuerpos multipart se transmiten en streaming, con límite de 1 PDF de 25 MiB.
 */
import {NextRequest,NextResponse} from 'next/server';
import {apiFetch} from '@/lib/auth/backend';
import {SESSION_COOKIE} from '@/lib/auth/server';
import {error,mutation,output,upstream,validIdPath} from '@/lib/academic/bff';
import {getCourseWorkspace} from '@/lib/course-workspace/server';
import {readMdtSummary,readMdtStudents,readMdtHomeworkResponse,readMdtPdfUpload,readMdtEvents,MAX_MDT_PDF} from '@/lib/course-workspace/mdt-resources';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Params={params:Promise<{id:string;resource?:string[]}>};
type Context={courseId:number;token:string;segments:string[]};
const backendPath=(courseId:number)=>`/api/v1/mdt-resources/courses/${courseId}`;
const multipartMax=MAX_MDT_PDF+128*1024; // PDF + cabeceras multipart y comentario opcional.
function validPage(value:string|null,defaultValue:number,max:number):number|null{
  if(value===null)return defaultValue;
  if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)>max)return null;
  return Number(value);
}
async function authorize(request:NextRequest,params:Params):Promise<Context|NextResponse>{
  const {id,resource=[]}=await params.params;
  const courseId=validIdPath(id);
  if(!courseId)return error(400,'Identificador de curso inválido');
  if(resource.length>6)return error(404,'Ruta no encontrada');
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if(!token)return error(401,'Inicia sesión');
  try {
    const result=await getCourseWorkspace(courseId);
    if(result.status==='unauthenticated')return error(401,'Sesión vencida');
    if(result.status==='pending')return error(428,'Acepta las políticas obligatorias');
    if(result.status==='unavailable')return error(503,'No se pudo comprobar el acceso');
    if(result.status!=='ready'||result.workspace.role==='STUDENT')return error(403,'Acceso denegado');
    if(result.workspace.code!=='MDT')return error(404,'El curso no dispone de Recursos MDT');
    return {courseId,token,segments:resource};
  }catch{return error(503,'No fue posible comprobar el tenant o la sesión');}
}
async function readJson(path:string,ctx:Context,parse:(value:unknown)=>unknown):Promise<NextResponse>{
  try{
    const response=await apiFetch(path,ctx.token);
    if(!response.ok)return upstream(response);
    let parsed:unknown;
    try{parsed=parse(await response.json());}
    catch{return error(502,'FastAPI devolvió un contrato de Recursos MDT inválido');}
    return output(parsed);
  }catch{return error(503,'No fue posible consultar los Recursos MDT');}
}
function numeric(raw:string|undefined):number|null{return raw?validIdPath(raw):null;}
/** Transmite medios privados. La modalidad inline/attachment es una decisión
 * explícita del BFF, nunca dependiente de Content-Disposition del backend.
 * No se siguen redirecciones ni se expone Authorization al navegador.
 */
async function media(ctx:Context,path:string,mode:'preview'|'download',pdf:boolean):Promise<NextResponse>{
  try{
    const response=await apiFetch(path,ctx.token,{redirect:'error',signal:AbortSignal.timeout(60000)});
    if(!response.ok)return upstream(response);
    if(!response.body)return error(502,'Respuesta de archivo inválida');
    const type=response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()||'';
    if(pdf&&type!=='application/pdf'){
      await response.body.cancel();return error(502,'El recurso no es un PDF válido');
    }
    const headers=new Headers({
      'Content-Type':pdf?'application/pdf':'application/octet-stream',
      'Cache-Control':'private, no-store, max-age=0',
      'Content-Disposition':mode==='preview'?'inline; filename="recurso-mdt.pdf"':
        'attachment; filename="recurso-mdt"',
      'X-Content-Type-Options':'nosniff',
      'X-Frame-Options':'SAMEORIGIN',
      'Referrer-Policy':'no-referrer',
      'Content-Security-Policy':"frame-ancestors 'self'",
    });
    if(mode==='download'){
      // Solo se propagan nombres seguros cuando Starlette obliga a descargar.
      const disposition=response.headers.get('content-disposition');
      if(disposition&&disposition.length<=800&&!/[\r\n]/.test(disposition)&&
        /^attachment(?:\s*;|$)/i.test(disposition))headers.set('Content-Disposition',disposition);
      else headers.set('Content-Disposition',pdf?'attachment; filename="recurso-mdt.pdf"':
        'attachment; filename="documento-anterior"');
    }
    const length=response.headers.get('content-length');
    if(length&&/^\d+$/.test(length))headers.set('Content-Length',length);
    return new NextResponse(response.body,{status:200,headers});
  }catch{return error(503,'No se pudo recuperar el archivo privado');}
}
/** No materializa archivos PDF en memoria; controla bytes reales del multipart
 * incluso cuando el navegador omite Content-Length. FastAPI verifica firma y cantidad.
 */
async function upload(request:NextRequest,ctx:Context,path:string,pdf:boolean):Promise<NextResponse>{
  const origin=mutation(request,'form');if(origin)return origin;
  const max=multipartMax;
  const declared=request.headers.get('content-length');
  if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>max))return error(413,'Archivos demasiado grandes');
  if(!request.body)return error(400,'Debes seleccionar archivos');
  let tooLarge=false;let size=0;
  const limiter=new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){
    size+=chunk.byteLength;
    if(size>max){tooLarge=true;throw Error('Límite de tamaño excedido');}
    controller.enqueue(chunk);
  }});
  try{
    const init:RequestInit&{duplex:'half'}={
      method:'PUT',
      headers:{'Content-Type':request.headers.get('content-type')||''},
      body:request.body.pipeThrough(limiter),duplex:'half',
      redirect:'error',signal:AbortSignal.timeout(180000),
    };
    const response=await apiFetch(path,ctx.token,init);
    if(!response.ok)return upstream(response);
    try{
      const value:unknown=await response.json();
      const parsed=pdf?readMdtPdfUpload(value,Number(ctx.segments[1])):
        readMdtHomeworkResponse(value);
      return output(parsed);
    }catch{return error(502,'FastAPI no devolvió confirmación válida de la operación');}
  }catch{return tooLarge?error(413,'El tamaño total excede el límite permitido'):
    error(503,'No se confirmó la subida. Consulta el estado antes de reintentar.');}
}
export async function GET(request:NextRequest,params:Params){
  const auth=await authorize(request,params);if(auth instanceof NextResponse)return auth;
  const {segments:s,courseId}=auth;
  const base=backendPath(courseId);
  if(!s.length)return readJson(base,auth,v=>readMdtSummary(v,courseId));
  if(s.length===3&&s[0]==='homework'&&s[2]==='students'){
    const block=numeric(s[1]);if(!block)return error(400,'Bloque inválido');
    const query=request.nextUrl.searchParams;
    const allowed=new Set(['page','page_size','search','status']);
    if([...query.keys()].some(key=>!allowed.has(key)))return error(400,'Filtro no admitido');
    const page=validPage(query.get('page'),1,100000000);
    const size=validPage(query.get('page_size'),25,100);
    const status=query.get('status')||'TODOS';const search=query.get('search')?.trim()||'';
    if(!page||!size||!['TODOS','ENTREGADO','PENDIENTE'].includes(status)||search.length>150)
      return error(400,'Filtros inválidos');
    const q=new URLSearchParams({page:String(page),page_size:String(size),status});
    if(search)q.set('search',search);
    return readJson(`${base}/homework/${block}/students?${q}`,auth,v=>readMdtStudents(v,courseId,block));
  }
  if(s.length===3&&s[0]==='pdf'&&['download','preview'].includes(s[2])){
    const block=numeric(s[1]);if(!block)return error(400,'PDF inválido');
    // Bloque dentro del curso y recurso existente: permiso real también en FastAPI.
    try{
      const res=await apiFetch(base,auth.token);
      if(!res.ok)return upstream(res);
      const resource=readMdtSummary(await res.json(),courseId).institutional_pdfs.find(item=>item.id===block);
      if(!resource?.has_file)return error(404,'Evidencia no encontrada en este curso');
      if(s[2]==='preview'&&!resource.can_preview)return error(415,'Este archivo anterior debe actualizarse a PDF');
    }catch{return error(503,'No fue posible verificar el PDF');}
    return media(auth,`/api/v1/media/lesson-blocks/${block}/file?${s[2]==='preview'?'preview=true':'download=true'}`,
      s[2] as 'preview'|'download',s[2]==='preview');
  }
  if(s.length===3&&s[0]==='attachments'&&['download','preview'].includes(s[2])){
    const attachment=numeric(s[1]);if(!attachment)return error(400,'Adjunto inválido');
    // FastAPI controla la matrícula y solo habilita preview para PDF de raíz MDT.
    return media(auth,`/api/v1/homework-response/attachments/${attachment}/${s[2]}`,
      s[2] as 'preview'|'download',s[2]==='preview');
  }
  if(s.length===1&&s[0]==='events'){
    const q=request.nextUrl.searchParams;
    if([...q.keys()].some(key=>!['page','page_size','block_id','enrollment_id'].includes(key)))return error(400,'Filtro no admitido');
    const page=validPage(q.get('page'),1,100000000);
    const pageSize=validPage(q.get('page_size'),15,100);
    if(!page||!pageSize)return error(400,'Paginación inválida');
    const qs=new URLSearchParams({page:String(page),page_size:String(pageSize)});
    for(const key of ['block_id','enrollment_id']){
      const v=q.get(key);if(v!==null){const parsed=validIdPath(v);if(!parsed)return error(400,'Filtro inválido');qs.set(key,String(parsed));}
    }
    return readJson(`${base}/events?${qs}`,auth,v=>readMdtEvents(v));
  }
  return error(404,'Ruta no encontrada');
}
export async function PUT(request:NextRequest,params:Params){
  // Validar CSRF incluso antes de iniciar operaciones costosas.
  const origin=mutation(request,'form');if(origin)return origin;
  const auth=await authorize(request,params);if(auth instanceof NextResponse)return auth;
  const {segments:s,courseId}=auth;
  const base=backendPath(courseId);
  if(s.length===5&&s[0]==='homework'&&s[2]==='students'&&s[4]==='files'){
    const block=numeric(s[1]),enrollment=numeric(s[3]);
    if(!block||!enrollment)return error(400,'Bloque o matrícula inválida');
    return upload(request,auth,`${base}/homework/${block}/students/${enrollment}/files`,false);
  }
  if(s.length===3&&s[0]==='pdf'&&s[2]==='file'){
    const block=numeric(s[1]);if(!block)return error(400,'Bloque PDF inválido');
    return upload(request,auth,`${base}/pdf/${block}/file`,true);
  }
  return error(404,'Ruta no encontrada');
}
