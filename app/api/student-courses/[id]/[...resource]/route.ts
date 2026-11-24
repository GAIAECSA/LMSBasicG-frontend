/** BFF exclusivo del aula: allowlist de operaciones, JWT HttpOnly y autorización
 * por matrícula COURSE/STUDENT. No es un proxy genérico de FastAPI.
 * El backend vuelve a validar cada acción y la pertenencia del recurso.
 */
import {NextRequest,NextResponse} from 'next/server';
import {apiFetch} from '@/lib/auth/backend';
import {SESSION_COOKIE,sameOriginRequest} from '@/lib/auth/server';
import {getCourseWorkspace} from '@/lib/course-workspace/server';
import {findStudentBlock,parseStudentOverview,type StudentOverview} from '@/lib/student-course/domain';

type Params={params:Promise<{id:string;resource:string[]}>};
type Verb='GET'|'POST'|'PUT'|'PATCH';
type Ctx={id:number;token:string;overview:StudentOverview};
const pos=(s:string|undefined):s is string=>!!s&&/^[1-9]\d*$/.test(s)&&Number.isSafeInteger(Number(s));
const resp=(status:number,message:string)=>NextResponse.json({message},{status,headers:{'Cache-Control':'private, no-store'}});
const data=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const isObj=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
async function rejected(upstream:Response){
 let message=`La operación fue rechazada (${upstream.status}).`;
 try{const b:unknown=await upstream.json();if(isObj(b)){
  if(typeof b.detail==='string')message=b.detail;
  else if(typeof b.message==='string')message=b.message;
 }}catch{}
 return resp(upstream.status,message.slice(0,500));
}
async function context(request:NextRequest,params:Params):Promise<Ctx|NextResponse>{
 const raw=(await params.params).id;
 if(!pos(raw))return resp(400,'Curso inválido');
 const token=request.cookies.get(SESSION_COOKIE)?.value;
 if(!token)return resp(401,'Inicia sesión');
 try{
  const access=await getCourseWorkspace(Number(raw));
  if(access.status==='unauthenticated')return resp(401,'Sesión vencida');
  if(access.status==='pending')return resp(428,'Acepta las políticas pendientes');
  if(access.status==='unavailable')return resp(503,'No se pudo verificar el acceso al curso');
  if(access.status!=='ready'||access.workspace.role!=='STUDENT')return resp(403,'Requiere matrícula STUDENT aceptada');
  // getCourseWorkspace ya consultó /overview para validar la matrícula: evitar
  // una segunda consulta de estructura completa en cada petición del BFF.
  const overview=parseStudentOverview(access.workspace.studentOverview,Number(raw));
  return {id:Number(raw),token,overview};
 }catch{return resp(503,'No se pudo comprobar la matrícula del curso');}
}
function allowBlock(ctx:Ctx,raw:string|undefined,types?:string[]):number|null{
 if(!pos(raw))return null;
 const id=Number(raw);const b=findStudentBlock(ctx.overview,id);
 if(!b||!b.is_active||!b.available||(types&&!types.includes(b.kind)))return null;
 return id;
}
function allowHomework(ctx:Ctx,raw:string|undefined){
 const b=allowBlock(ctx,raw,['homework']);
 if(b)return b;
 if(pos(raw)&&ctx.overview.course.code==='MDT'&&ctx.overview.documents.some(d=>d.id===Number(raw)&&d.available))return Number(raw);
 return null;
}
function allowSurvey(ctx:Ctx,raw:string|undefined){
 if(!pos(raw))return null;
 return ctx.overview.modules.some(m=>m.lessons.some(l=>l.blocks.some(b=>
  b.kind==='survey'&&b.survey_id===Number(raw)&&b.is_active&&b.available)))?Number(raw):null;
}
async function ownAttempt(ctx:Ctx,blockId:number,attemptId:number):Promise<boolean>{
 const response=await apiFetch(`/api/v1/quiz/blocks/${blockId}/my-attempts`,ctx.token);
 if(!response.ok)return false;
 const attempts:unknown=await response.json();
 return Array.isArray(attempts)&&attempts.some(x=>isObj(x)&&x.id===attemptId&&!x.assisted);
}
async function body(request:NextRequest,kind:'json'|'form'):Promise<unknown|NextResponse>{
 const length=Number(request.headers.get('content-length'));
 const limit=kind==='form'?52*1024*1024:250*1024;
 if(Number.isFinite(length)&&length>limit)return resp(413,'Solicitud demasiado grande');
 try{
  if(kind==='form'){
   // Límites por bytes REALES, incluso sin Content-Length. Evitar agotar la
   // memoria del proceso Next.js con multipart de tamaño no declarado.
   if(!request.body)return resp(400,'Formulario vacío');
   const reader=request.body.getReader();const chunks:Uint8Array[]=[];let length=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;
    length+=value.byteLength;if(length>limit){await reader.cancel();return resp(413,'Adjuntos demasiado grandes (máximo 50 MiB por envío)');}
    chunks.push(value);
   }}finally{reader.releaseLock();}
   const bytes=new Uint8Array(length);let start=0;
   for(const chunk of chunks){bytes.set(chunk,start);start+=chunk.length;}
   const inner=new Request('http://athena.internal.invalid',{method:'POST',headers:{'Content-Type':request.headers.get('content-type')||''},body:bytes as BodyInit});
   const form=await inner.formData();
   const files=Array.from(form.values()).filter((v):v is File=>v instanceof File);
   if(files.length>10||files.some(f=>f.size>25*1024*1024))return resp(413,'Los archivos superan el máximo permitido');
   return form;
  }
  const text=await request.text();if(text.length>limit)return resp(413,'Solicitud demasiado grande');
  return JSON.parse(text) as unknown;
 }catch{return resp(400,'Solicitud inválida');}
}
function validAnswers(v:unknown,limit=500){
 if(!isObj(v)||!isObj(v.answers)||Object.keys(v).length!==1||Object.keys(v.answers).length>limit)return false;
 return Object.entries(v.answers).every(([key,val])=>pos(key)&&
  (val===null||typeof val==='string'&&val.length<=10000||typeof val==='number'&&Number.isFinite(val)||typeof val==='boolean'||
   Array.isArray(val)&&val.length<=100&&val.every(x=>typeof x==='string'&&x.length<=500)));
}
function validComment(v:unknown){return isObj(v)&&typeof v.comment==='string'&&v.comment.trim().length>0&&v.comment.length<=10000&&
 (v.parent_id===undefined||v.parent_id===null||typeof v.parent_id==='number'&&Number.isSafeInteger(v.parent_id)&&v.parent_id>0)&&
 Object.keys(v).every(k=>['comment','parent_id'].includes(k));}
function fileResult(r:Response){
 const h=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN',
  'Content-Type':r.headers.get('content-type')||'application/octet-stream'});
 const disp=r.headers.get('content-disposition');if(disp)h.set('Content-Disposition',disp);
 return new NextResponse(r.body,{status:r.status,headers:h});
}
async function handler(req:NextRequest,params:Params,method:Verb):Promise<NextResponse>{
 const ctx=await context(req,params);if(ctx instanceof NextResponse)return ctx;
 if(method!=='GET'&&!sameOriginRequest(req))return resp(403,'Origen de petición no autorizado');
 const resource=(await params.params).resource||[];
 const [section,a,b,c,d]=resource;
 let upstream:string|undefined;let file=false;let form=false;let payload:unknown=undefined;
 const only=(...args:string[])=>resource.length===args.length&&args.every((p,i)=>p===resource[i]);
 // Las consultas de estado no incluyen IDs externos aportados por el cliente.
 if(method==='GET'&&only('overview'))return data(ctx.overview);
 if(method==='GET'&&resource.length===1&&['grades','eligibility'].includes(section))
  upstream=`/api/v1/student-courses/${ctx.id}/${section}`;
 else if(section==='blocks'&&pos(a)&&allowBlock(ctx,a)){
  if(method==='GET'&&resource.length===2)upstream=`/api/v1/lesson-blocks/${a}`;
  else if(method==='GET'&&only('blocks',a,'file')){
   upstream=`/api/v1/media/lesson-blocks/${a}/file`+(req.nextUrl.searchParams.get('download')==='true'?'?download=true':'');file=true;
  }else if(method==='POST'&&only('blocks',a,'complete')&&allowBlock(ctx,a,['text','image','pdf','video'])){
   upstream=`/api/v1/blocks-progress/progress/complete?enrollment_id=${ctx.overview.enrollment_id}&lesson_block_id=${a}`;
  }
 }else if(section==='homework'&&pos(a)&&allowHomework(ctx,a)){
  if(method==='GET'&&only('homework',a,'my'))upstream=`/api/v1/homework-response/blocks/${a}/my-submission`;
  else if(['POST','PUT'].includes(method)&&only('homework',a,'submission')){
   upstream=`/api/v1/homework-response/blocks/${a}/submission`;form=true;
  }else if(method==='GET'&&b==='attachments'&&pos(c)&&d==='file'&&resource.length===5){
   // Verificar que el adjunto pertenece realmente a la entrega del titular.
   const mine=await apiFetch(`/api/v1/homework-response/blocks/${a}/my-submission`,ctx.token);
   if(!mine.ok)return rejected(mine);
   const detail:unknown=await mine.json();
   if(!isObj(detail)||!Array.isArray(detail.attachments)||!detail.attachments.some(x=>isObj(x)&&x.id===Number(c)))return resp(404,'Adjunto no encontrado');
   upstream=`/api/v1/homework-response/attachments/${c}/download`;file=true;
  }
 }else if(section==='quiz'&&pos(a)&&allowBlock(ctx,a,['quiz'])){
  if(method==='GET'&&only('quiz',a,'attempts'))upstream=`/api/v1/quiz/blocks/${a}/my-attempts`;
  else if(method==='POST'&&only('quiz',a,'start'))upstream=`/api/v1/quiz/blocks/${a}/attempts`;
  else if(pos(c)&&b==='attempts'&&await ownAttempt(ctx,Number(a),Number(c))){
   if(method==='GET'&&resource.length===3)upstream=`/api/v1/quiz/attempts/${c}`;
   else if(method==='POST'&&only('quiz',a,'attempts',c,'submit'))upstream=`/api/v1/quiz/attempts/${c}/submit`;
  }
 }else if(section==='survey'&&allowSurvey(ctx,a)){
  if(method==='GET'&&only('survey',a,'detail'))upstream=`/api/v1/survey/surveys/${a}`;
  else if(method==='GET'&&only('survey',a,'my'))upstream=`/api/v1/survey/surveys/${a}/my-response`;
  else if(method==='POST'&&only('survey',a,'submit'))upstream=`/api/v1/survey/surveys/${a}/submit`;
 }else if(section==='forum'&&pos(a)&&allowBlock(ctx,a,['forum'])){
  if(method==='GET'&&only('forum',a,'topic'))upstream=`/api/v1/forum-response/blocks/${a}/topic`;
  else if(method==='GET'&&only('forum',a,'posts'))upstream=`/api/v1/forum-response/blocks/${a}/posts`;
  else if(method==='POST'&&only('forum',a,'posts'))upstream=`/api/v1/forum-response/blocks/${a}/posts`;
  else if(method==='PATCH'&&b==='posts'&&pos(c)&&resource.length===3)upstream=`/api/v1/forum-response/posts/${c}`;
 }else if(section==='certificate'&&pos(b)&&ctx.overview.course.code){
  const eligibilityResponse=await apiFetch(`/api/v1/student-courses/${ctx.id}/eligibility`,ctx.token);
  if(!eligibilityResponse.ok)return rejected(eligibilityResponse);
  const eligibility:unknown=await eligibilityResponse.json();
  if(!isObj(eligibility)||!Array.isArray(eligibility.certificates)||!
   eligibility.certificates.some(x=>isObj(x)&&x.id===Number(b)&&x.type===(a==='automatic'?'AUTOMATIC':a==='external-mdt'?'MDT':a==='external-institutional'?'INSTITUTIONAL':undefined)))
   return resp(404,'Certificado no disponible para tu curso');
  if(method==='POST'&&only('certificate','automatic',b,'generate')&&eligibility.can_generate===true&&ctx.overview.course.code==='MOOC')
   upstream=`/api/v1/certificates/${b}/generate`;
  else if(method==='GET'&&['preview','download'].includes(c)&&resource.length===4&&eligibility.can_download===true){
   if(a==='automatic'&&ctx.overview.course.code==='MOOC')upstream=`/api/v1/certificates/${b}/${c}`;
   else if(['external-mdt','external-institutional'].includes(a)&&ctx.overview.course.code==='MDT')upstream=`/api/v1/external-certificates/${b}/${c}`;
   if(upstream)file=true;
  }
 }
 if(!upstream)return resp(404,'Operación del aula no disponible');
 if(method!=='GET'&&!(method==='POST'&&upstream.includes('/progress/complete'))&&!(method==='POST'&&upstream.endsWith('/generate'))&&
   !(method==='POST'&&upstream.includes('/quiz/blocks/')&&upstream.endsWith('/attempts'))){
  const parsed=await body(req,form?'form':'json');if(parsed instanceof NextResponse)return parsed;payload=parsed;
  if(form){
   const f=payload as FormData;const files=f.getAll('files').filter(v=>v instanceof File) as File[];
   if(files.length>10||files.some(file=>file.size===0)||
       (!ctx.overview.modules.flatMap(m=>m.lessons.flatMap(l=>l.blocks)).some(x=>x.id===Number(a))&&
        (files.length!==1||!/^.+\.pdf$/i.test(files[0].name))))return resp(400,'Adjuntos no válidos');
   if(f.has('enrollment_id')||f.has('user_id')||Array.from(f.keys()).some(k=>!['comment','files'].includes(k)))return resp(400,'Campos no autorizados');
  }else if(upstream.endsWith('/submit')&&['quiz','survey'].includes(section)&&!validAnswers(payload))return resp(400,'Respuestas inválidas');
  else if(section==='forum'&&!validComment(payload))return resp(400,'Publicación inválida');
 }
 try{
  const response=await apiFetch(upstream,ctx.token,{method,signal:AbortSignal.timeout(file||form?60000:12000),
   ...(payload===undefined?{}:payload instanceof FormData?{body:payload}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})});
  if(!response.ok)return rejected(response);
  if(file)return fileResult(response);
  if(response.status===204)return new NextResponse(null,{status:204});
  return data(await response.json(),response.status);
 }catch{return resp(503,'No fue posible conectar con FastAPI. Comprueba el resultado antes de repetir la acción');}
}
export const GET=(r:NextRequest,p:Params)=>handler(r,p,'GET');
export const POST=(r:NextRequest,p:Params)=>handler(r,p,'POST');
export const PUT=(r:NextRequest,p:Params)=>handler(r,p,'PUT');
export const PATCH=(r:NextRequest,p:Params)=>handler(r,p,'PATCH');
