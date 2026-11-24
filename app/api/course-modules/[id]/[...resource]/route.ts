import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { SESSION_COOKIE } from '@/lib/auth/server';
import { getCourseWorkspace } from '@/lib/course-workspace/server';
import { error, json, mutation, upstream, validIdPath } from '@/lib/academic/bff';
import { resolveModuleRoute, type Verb } from '@/lib/course-modules/paths';
import { obj, pos } from '@/lib/course-modules/domain';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Params={params:Promise<{id:string;resource:string[]}>};
type Context={token:string;courseId:number;role:'ADMIN'|'TEACHER'};
const LIMIT_MULTIPART=28*1024*1024;

async function context(request:NextRequest,params:Params):Promise<Context|NextResponse>{
  const id=validIdPath((await params.params).id);
  if(!id)return error(400,'Curso inválido');
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if(!token)return error(401,'Sesión requerida');
  let session: Awaited<ReturnType<typeof getCourseWorkspace>>;
  try { session=await getCourseWorkspace(id); }
  catch { return error(503,'No fue posible comprobar el tenant o la sesión'); }
  if(session.status==='unauthenticated')return error(401,'Sesión vencida');
  if(session.status==='pending')return error(428,'Acepta las políticas pendientes');
  if(session.status==='unavailable')return error(503,'Servicio académico no disponible');
  if(session.status!=='ready'||session.workspace.role==='STUDENT')return error(403,'Solo ADMIN/TEACHER autorizados');
  return {token,courseId:id,role:session.workspace.role};
}
async function readMultipart(req:NextRequest):Promise<FormData|NextResponse>{
  const len=Number(req.headers.get('content-length'));
  if(Number.isFinite(len)&&len>LIMIT_MULTIPART)return error(413,'Adjunto demasiado grande (máximo 25 MiB)');
  if(!req.body)return error(400,'Solicitud sin contenido');
  let count=0;const chunks:Uint8Array[]=[];const reader=req.body.getReader();
  try{for(;;){const {value,done}=await reader.read();if(done)break;
    count+=value.byteLength;if(count>LIMIT_MULTIPART){await reader.cancel();return error(413,'Adjunto demasiado grande');}
    chunks.push(value);
  }}catch{return error(400,'No se pudo leer el archivo');}finally{reader.releaseLock();}
  const bytes=new Uint8Array(count);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{const r=new Request('http://internal.invalid',{method:'POST',headers:{'Content-Type':req.headers.get('content-type')||''},body:bytes as BodyInit});
    const form=await r.formData();
    const files=[...form.values()].filter(v=>v instanceof File);
    if(files.length>5||files.some(f=>f.size>25*1024*1024))return error(413,'Límite de archivos excedido');
    return form;
  }catch{return error(400,'Formato de archivo inválido');}
}
async function courseContains(ctx:Context,resource:string,id:number):Promise<boolean|NextResponse>{
  try{const response=await apiFetch(`/api/v1/academic-modules/${ctx.courseId}/structure`,ctx.token);
    if(!response.ok)return upstream(response);
    const tree:unknown=await response.json();
    if(!obj(tree)||!Array.isArray(tree.modules))return error(502,'Estructura inesperada');
    const modules=tree.modules.filter(obj);
    if(resource==='module')return modules.some(m=>m.id===id);
    const lessons=modules.flatMap(m=>Array.isArray(m.lessons)?m.lessons.filter(obj):[]);
    if(resource==='lesson')return lessons.some(l=>l.id===id);
    const blocks=lessons.flatMap(l=>Array.isArray(l.blocks)?l.blocks.filter(obj):[]);
    return blocks.some(b=>b.id===id);
  }catch{return error(503,'No se pudo validar el curso');}
}
/** La comprobación de relaciones impide publicar IDs ajenos a este curso desde su BFF.
 * La autoridad final de permisos y pertenencia sigue siendo FastAPI.
 */
async function localGuard(ctx:Context,segments:string[],method:Verb,value:unknown):Promise<NextResponse|null>{
  const [domain,raw]=segments;
  let kind:'module'|'lesson'|'block'|null=null,id:number|undefined;
  if(['modules','lessons','blocks'].includes(domain)&&raw&&pos(Number(raw))) {
    kind=domain==='modules'?'module':domain==='lessons'?'lesson':'block';id=Number(raw);
  }else if(method==='POST'&&domain==='lessons'&&obj(value)){
    kind='module';id=Number(value.module_id);
  }else if(method==='POST'&&domain==='blocks'&&value instanceof FormData){
    kind='lesson';id=Number(value.get('lesson_id'));
  }else if(domain==='quiz'&&segments[1]==='blocks'&&pos(Number(segments[2]))){
    kind='block';id=Number(segments[2]);
  }else if((domain==='forum'||domain==='homework')&&segments[1]==='blocks'&&pos(Number(segments[2]))){
    kind='block';id=Number(segments[2]);
  }else if(domain==='assisted'&&['quiz','forum','homework'].includes(segments[1])&&segments[2]==='blocks'){
    kind='block';id=Number(segments[3]);
  }
  if(domain==='modules'&&method==='POST'&&obj(value)&&value.course_id!==ctx.courseId)
    return error(400,'No se pueden crear módulos en otro curso');
  if(kind&&id){const owned=await courseContains(ctx,kind,id);
    if(owned instanceof NextResponse)return owned;
    if(!owned)return error(404,'El recurso no pertenece al curso');
  }
  return null;
}
function safeQuery(request:NextRequest,segments:string[]){
  const key=segments.join('/');const allowed=new URLSearchParams();const input=request.nextUrl.searchParams;
  if(key==='participants'){
    const page=Math.max(1,Math.min(10000,Number(input.get('page')||1)||1));
    allowed.set('page',String(page));allowed.set('page_size','100');
    const search=(input.get('search')||'').trim().slice(0,100);if(search)allowed.set('search',search);
  }else if(key==='assisted/events'){
    const enrollment=input.get('enrollment_id');if(enrollment&&pos(Number(enrollment)))allowed.set('enrollment_id',enrollment);
    allowed.set('page',String(Math.max(1,Math.min(10000,Number(input.get('page')||1)||1))));
    allowed.set('page_size','50');
  }else if(/^survey\/surveys\/\d+\/results$/.test(key)){
    const role=input.get('role');if(role==='STUDENT'||role==='TEACHER')allowed.set('role',role);
  }else if(/^blocks\/\d+\/file$/.test(key)){
    if(input.get('download')==='true')allowed.set('download','true');
  }
  return allowed.toString();
}
async function handler(request:NextRequest,params:Params,method:Verb):Promise<NextResponse>{
  const {resource}=await params.params;
  const ctx=await context(request,params);if(ctx instanceof NextResponse)return ctx;
  const match=resolveModuleRoute(resource,method,ctx.courseId);if(!match)return error(404,'Operación no disponible');
  if(method!=='GET'){
    const origin=mutation(request,match.form?'form':'json');
    // DELETE sin payload solo exige Origin, no Content-Type.
    if(method!=='DELETE'&&origin)return origin;
    if(method==='DELETE'&&!request.headers.get('origin'))return error(403,'Origen requerido');
    if(method==='DELETE'&&mutationOriginOnly(request))return error(403,'Origen no permitido');
  }
  let body:FormData|unknown;
  if(method!=='GET'&&method!=='DELETE'){
    if(match.form){
      const parsed=await readMultipart(request);if(parsed instanceof NextResponse)return parsed;body=parsed;
      if(resource.join('/')==='blocks'&&(!pos(Number(parsed.get('lesson_id')))||!pos(Number(parsed.get('block_type_id')))||
        typeof parsed.get('content')!=='string'))return error(400,'Datos incompletos del LessonBlock');
    }else{
      const decoded=await json(request,650000);if('response'in decoded)return decoded.response;
      body=decoded.value;
      if(!obj(body))return error(400,'El cuerpo debe ser un objeto');
    }
  }
  const scoped=await localGuard(ctx,resource,method,body);if(scoped)return scoped;
  if(resource.join('/')==='participants/teachers'&&method==='GET'){
    const search=(request.nextUrl.searchParams.get('search')||'').trim().slice(0,100);
    const endpoint=`/api/v1/academic-assisted/courses/${ctx.courseId}/teachers`+
      (search?`?search=${encodeURIComponent(search)}`:'');
    try{const r=await apiFetch(endpoint,ctx.token);if(!r.ok)return upstream(r);
      const teachers:unknown=await r.json();if(!Array.isArray(teachers))return error(502,'Docentes inválidos');
      return NextResponse.json(teachers,{headers:{'Cache-Control':'private, no-store'}});
    }catch{return error(503,'No se pudieron consultar las matrículas docentes');}
  }
  const query=method==='GET'?safeQuery(request,resource):'';
  try{
    const isDownload=resource[0]==='blocks'&&resource[2]==='file'||resource[0]==='homework'&&resource[1]==='attachments'&&resource[3]==='download';
    const upstreamResponse=await apiFetch(match.path+(query?'?'+query:''),ctx.token,{method,
      ...(isDownload?{signal:AbortSignal.timeout(60000)}:{}),
      ...(method==='GET'||method==='DELETE'?{}:body instanceof FormData?{body}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
    if(!upstreamResponse.ok)return upstream(upstreamResponse);
    if((resource.length===3&&resource[0]==='blocks'&&resource[2]==='file')||
       (resource.length===4&&resource[0]==='homework'&&resource[1]==='attachments'&&resource[3]==='download')){
      const disposition=upstreamResponse.headers.get('content-disposition');
      const headers=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
        'X-Frame-Options':'SAMEORIGIN','Content-Type':upstreamResponse.headers.get('content-type')||'application/octet-stream'});
      if(disposition)headers.set('Content-Disposition',disposition);
      return new NextResponse(upstreamResponse.body,{status:upstreamResponse.status,headers});
    }
    if(upstreamResponse.status===204)return new NextResponse(null,{status:204});
    return NextResponse.json(await upstreamResponse.json(),{status:upstreamResponse.status,headers:{'Cache-Control':'private, no-store'}});
  }catch{return error(503,'FastAPI no respondió. Comprueba el resultado antes de reintentar.');}
}
function mutationOriginOnly(req:NextRequest):boolean{
  const origin=req.headers.get('origin'),host=req.headers.get('host');
  if(!origin||!host)return true;
  try{const u=new URL(origin);return !['http:','https:'].includes(u.protocol)||u.host.toLowerCase()!==host.toLowerCase();}catch{return true;}
}
export const GET=(r:NextRequest,p:Params)=>handler(r,p,'GET');
export const POST=(r:NextRequest,p:Params)=>handler(r,p,'POST');
export const PUT=(r:NextRequest,p:Params)=>handler(r,p,'PUT');
export const PATCH=(r:NextRequest,p:Params)=>handler(r,p,'PATCH');
export const DELETE=(r:NextRequest,p:Params)=>handler(r,p,'DELETE');
