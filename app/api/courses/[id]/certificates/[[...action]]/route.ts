/** BFF único de Certificados ADMIN. Cada ruta está en la allowlist; nunca acepta
 * URLs arbitrarias, IDs de tenant/usuario ni rutas físicas del cliente.
 * Todos los PDF e imágenes permanecen privados y se retransmiten sin JWT.
 */
import {NextRequest,NextResponse} from 'next/server';
import {apiFetch} from '@/lib/auth/backend';
import {SESSION_COOKIE} from '@/lib/auth/server';
import {error,mutation,output,postJson,upstream,validIdPath,json} from '@/lib/academic/bff';
import {getCourseWorkspace} from '@/lib/course-workspace/server';
import {parseAutomaticCerts,parsePresets,parseTemplate,parseEvents,parseRoster,
  parseImportSummary,MAX_CERT_BACKGROUND,MAX_CERT_PDF,CERT_IMPORT_BATCH} from '@/lib/course-workspace/certificates';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Params={params:Promise<{id:string;action?:string[]}>};
type Context={courseId:number;token:string;action:string[]};
const certs='/api/v1/certificates';
const templates='/api/v1/certificate-templates';
const external='/api/v1/external-certificates';
const matches=(segments:string[],...pattern:string[])=>segments.length===pattern.length&&
  pattern.every((part,index)=>part==='$id'?!!validIdPath(segments[index]):segments[index]===part);
const resourceId=(segments:string[],index:number)=>validIdPath(segments[index])!;
const notFound=()=>error(404,'Recurso de certificados no encontrado');

async function authorize(request:NextRequest,context:Params):Promise<Context|NextResponse>{
  const {id,action=[]}=await context.params;
  const courseId=validIdPath(id);
  if(!courseId||action.length>8||action.some(s=>s.length>40))return error(404,'Curso o ruta inválidos');
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if(!token)return error(401,'Inicia sesión');
  try{
    const state=await getCourseWorkspace(courseId);
    if(state.status==='unauthenticated')return error(401,'Sesión vencida');
    if(state.status==='pending')return error(428,'Acepta las políticas pendientes');
    if(state.status==='unavailable')return error(503,'No se pudo validar la sesión');
    if(state.status!=='ready'||state.workspace.role!=='ADMIN')return error(403,'Solo ADMIN del tenant');
    return {courseId,token,action};
  }catch{return error(503,'No se pudo verificar el acceso al curso');}
}
async function jsonResponse(ctx:Context,path:string,parser:(v:unknown)=>unknown,init:RequestInit={}):Promise<NextResponse>{
  try{
    const response=await apiFetch(path,ctx.token,{...init,redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!response.ok)return upstream(response);
    try{return output(parser(await response.json()));}
    catch{return error(502,'FastAPI devolvió un contrato de certificados inválido');}
  }catch{return error(503,'No fue posible conectar con el servicio de certificados');}
}
function validNumber(raw:string|null,fallback:number,max:number,allowZero=false):number|null{
  if(raw===null)return fallback;
  if(!/^(?:0|[1-9]\d*)$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)>max||(!allowZero&&Number(raw)<1))return null;
  return Number(raw);
}
async function fileResponse(ctx:Context,path:string,mode:'preview'|'download'|'background'):Promise<NextResponse>{
  try{
    const response=await apiFetch(path,ctx.token,{redirect:'error',signal:AbortSignal.timeout(90000)});
    if(!response.ok)return upstream(response);
    if(!response.body)return error(502,'Archivo privado vacío');
    const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase().trim();
    const permitted=mode==='background'?['image/jpeg','image/png','image/webp']:['application/pdf'];
    if(!permitted.includes(mime)){await response.body.cancel();return error(502,'El servidor devolvió un archivo inesperado');}
    const headers=new Headers({
      'Content-Type':mime,
      'Cache-Control':'private, no-store, max-age=0',
      'Content-Disposition':mode==='download'?'attachment; filename="certificado.pdf"':
        mode==='background'?'inline; filename="fondo"':'inline; filename="certificado.pdf"',
      'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"frame-ancestors 'self'",
      'X-Frame-Options':'SAMEORIGIN',
      'Referrer-Policy':'no-referrer',
    });
    const length=response.headers.get('content-length');
    if(length&&/^\d+$/.test(length))headers.set('Content-Length',length);
    return new NextResponse(response.body,{status:200,headers});
  }catch{return error(503,'No fue posible recuperar el documento privado');}
}
/** Multiparts de hasta 20 PDFs, transmitidos sin cargar todo en memoria.
 * Comprobación del tamaño REAL además de Content-Length. FastAPI valida MIME,
 * firma, extensión, curso, matrícula, tipo, duplicados e identidad.
 */
async function formRequest(request:NextRequest,ctx:Context,path:string,method:'POST'|'PUT',
                           maxBytes:number,parse:(value:unknown)=>unknown,expectPdf=false):Promise<NextResponse>{
  const rejected=mutation(request,'form');if(rejected)return rejected;
  const declared=request.headers.get('content-length');
  if(declared&&(!/^\d+$/.test(declared)||Number(declared)>maxBytes))return error(413,'Archivo demasiado grande');
  if(!request.body)return error(400,'Formulario vacío');
  let size=0,tooLarge=false;
  const limiter=new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){
    size+=chunk.byteLength;
    if(size>maxBytes){tooLarge=true;throw new Error('Límite excedido');}
    controller.enqueue(chunk);
  }});
  try{
    const init:RequestInit&{duplex:'half'}={method,headers:{'Content-Type':request.headers.get('content-type')||''},
      body:request.body.pipeThrough(limiter),duplex:'half',redirect:'error',signal:AbortSignal.timeout(240000)};
    const response=await apiFetch(path,ctx.token,init);
    if(!response.ok)return upstream(response);
    if(expectPdf){
      if((response.headers.get('content-type')||'').split(';')[0]!=='application/pdf'||!response.body)return error(502,'Vista previa PDF inválida');
      return new NextResponse(response.body,{status:200,headers:{'Content-Type':'application/pdf',
        'Content-Disposition':'inline; filename="certificado-prueba.pdf"','Cache-Control':'private, no-store',
        'X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':"frame-ancestors 'self'",'X-Content-Type-Options':'nosniff'}});
    }
    try{return output(parse(await response.json()));}
    catch{return error(502,'Confirmación de certificados inválida');}
  }catch{return tooLarge?error(413,'Superaste el límite de tamaño de subida'):
    error(503,'No se confirmó la operación; consulta el estado antes de reintentar');}
}
const templateLimit=MAX_CERT_BACKGROUND+256*1024;
const singleLimit=MAX_CERT_PDF+256*1024;
const batchLimit=CERT_IMPORT_BATCH*MAX_CERT_PDF+512*1024;
const unchanged=(v:unknown)=>v;

export async function GET(request:NextRequest,params:Params){
  const auth=await authorize(request,params);if(auth instanceof NextResponse)return auth;
  const {courseId,action:a}=auth;
  if(matches(a,'presets'))return jsonResponse(auth,`${templates}/presets`,parsePresets);
  if(matches(a,'template'))return jsonResponse(auth,`${templates}/courses/${courseId}`,
    v=>parseTemplate(v,courseId));
  if(matches(a,'template','background'))return fileResponse(auth,`${templates}/courses/${courseId}/background`,'background');
  if(matches(a,'automatic')){
    const qs=request.nextUrl.searchParams;
    if([...qs.keys()].some(k=>!['limit','offset'].includes(k))||qs.getAll('limit').length>1||qs.getAll('offset').length>1)return error(400,'Filtros inválidos');
    const limit=validNumber(qs.get('limit'),50,200);
    const offset=validNumber(qs.get('offset'),0,100000000,true);
    if(!limit||offset===null)return error(400,'Paginación inválida');
    return jsonResponse(auth,`${certs}/?course_id=${courseId}&limit=${limit}&offset=${offset}`,
      v=>parseAutomaticCerts(v,courseId));
  }
  if(matches(a,'automatic','$id','history'))return jsonResponse(auth,`${certs}/${resourceId(a,1)}/history`,parseEvents);
  if(matches(a,'automatic','$id','preview')||matches(a,'automatic','$id','download'))
    return fileResponse(auth,`${certs}/${resourceId(a,1)}/${a[2]}`,a[2] as 'preview'|'download');
  if(matches(a,'automatic','$id','history','$id','pdf')||matches(a,'automatic','$id','history','$id','previous-pdf'))
    return fileResponse(auth,`${certs}/${resourceId(a,1)}/history/${resourceId(a,3)}/${a[4]}`,'download');
  if(matches(a,'external','students')){
    const qs=request.nextUrl.searchParams;
    if([...qs.keys()].some(k=>!['certificate_type','page','page_size','search'].includes(k))||
       ['certificate_type','page','page_size','search'].some(k=>qs.getAll(k).length>1))return error(400,'Parámetros inválidos');
    const code=qs.get('certificate_type');
    const page=validNumber(qs.get('page'),1,100000000),size=validNumber(qs.get('page_size'),25,100);
    const search=(qs.get('search')||'').trim();
    if((code!=='MDT'&&code!=='INSTITUTIONAL')||!page||!size||search.length>160)return error(400,'Filtros inválidos');
    const query=new URLSearchParams({certificate_type:code,page:String(page),page_size:String(size)});
    if(search)query.set('search',search);
    return jsonResponse(auth,`${external}/courses/${courseId}/students?${query}`,
      v=>parseRoster(v,courseId,code));
  }
  if(matches(a,'external','$id','history'))return jsonResponse(auth,`${external}/${resourceId(a,1)}/history`,parseEvents);
  if(matches(a,'external','$id','preview')||matches(a,'external','$id','download'))
    return fileResponse(auth,`${external}/${resourceId(a,1)}/${a[2]}`,a[2] as 'preview'|'download');
  if(matches(a,'external','$id','history','$id','pdf')||matches(a,'external','$id','history','$id','previous-pdf'))
    return fileResponse(auth,`${external}/${resourceId(a,1)}/history/${resourceId(a,3)}/${a[4]}`,'download');
  return notFound();
}

export async function POST(request:NextRequest,params:Params){
  const auth=await authorize(request,params);if(auth instanceof NextResponse)return auth;
  const {courseId,action:a}=auth;
  if(matches(a,'template','preview'))return formRequest(request,auth,`${templates}/courses/${courseId}/preview`,'POST',templateLimit,unchanged,true);
  if(matches(a,'external','import')){
    const qs=request.nextUrl.searchParams;const code=qs.get('type');
    if(qs.size!==1||(code!=='MDT'&&code!=='INSTITUTIONAL'))return error(400,'Debes indicar el tipo de certificado externo');
    return formRequest(request,auth,`${external}/import`,'POST',batchLimit,
      v=>parseImportSummary(v,courseId,code));
  }
  if(matches(a,'external','students','$id'))return formRequest(request,auth,
    `${external}/courses/${courseId}/students/${resourceId(a,2)}`,'POST',singleLimit,unchanged);
  if(matches(a,'automatic','$id','revoke')||matches(a,'automatic','$id','renew')){
    const rejected=mutation(request,'json');if(rejected)return rejected;
    const parsed=await json(request,1500);if('response' in parsed)return parsed.response;
    const body:unknown=parsed.value;
    if(!body||typeof body!=='object'||Array.isArray(body)||
      Object.keys(body).some(k=>k!=='reason')||
      typeof (body as {reason?:unknown}).reason!=='string'||
      !(body as {reason:string}).reason.trim()||(body as {reason:string}).reason.length>500)return error(400,'Motivo obligatorio (máximo 500 caracteres)');
    return jsonResponse(auth,`${certs}/${resourceId(a,1)}/${a[2]}`,unchanged,
      {method:'POST',...postJson({reason:(body as {reason:string}).reason.trim()})});
  }
  return notFound();
}
export async function PUT(request:NextRequest,params:Params){
  const auth=await authorize(request,params);if(auth instanceof NextResponse)return auth;
  const {courseId,action:a}=auth;
  if(matches(a,'template'))return formRequest(request,auth,`${templates}/courses/${courseId}`,'PUT',templateLimit,
    v=>parseTemplate(v,courseId));
  if(matches(a,'external','$id','file'))return formRequest(request,auth,`${external}/${resourceId(a,1)}/file`,'PUT',singleLimit,unchanged);
  return notFound();
}
