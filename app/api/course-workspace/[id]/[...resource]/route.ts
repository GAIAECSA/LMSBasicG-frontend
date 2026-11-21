import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { SESSION_COOKIE } from '@/lib/auth/server';
import { getCourseWorkspace } from '@/lib/course-workspace/server';
import { error, json, mutation, output, upstream, validIdPath } from '@/lib/academic/bff';
import { attendanceApi, enrichAttendanceRoles } from '@/lib/course-workspace/attendance-api';

export const runtime='nodejs';
type Params={params:Promise<{id:string;resource:string[]}>};
type Context={token:string;courseId:number;role:'ADMIN'|'TEACHER'};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const pos=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
const date=/^\d{4}-\d{2}-\d{2}$/;
const time=/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/;
const states=['PENDIENTE','PRESENTE','AUSENTE','ATRASADO','JUSTIFICADO'];
async function auth(request:NextRequest,params:Params,adminOnly=false):Promise<Context|NextResponse>{
  const id=validIdPath((await params.params).id);
  if(!id)return error(400,'Curso inválido');
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if(!token)return error(401,'Inicia sesión');
  const result=await getCourseWorkspace(id);
  if(result.status==='unauthenticated')return error(401,'Sesión vencida');
  if(result.status==='pending')return error(428,'Acepta las políticas pendientes');
  if(result.status==='unavailable')return error(503,'No se pudo verificar el acceso al curso');
  if(result.status!=='ready'||result.workspace.role==='STUDENT')return error(403,'Acceso denegado');
  const role=result.workspace.role;
  if(adminOnly&&role!=='ADMIN')return error(403,'Solo administradores pueden gestionar matrículas');
  return {token,courseId:id,role};
}
async function call(ctx:Context,path:string,method='GET',body?:unknown):Promise<NextResponse>{
  try{
    const response=await apiFetch(path,ctx.token,{method,...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
    if(!response.ok)return upstream(response);
    if(response.status===204)return new NextResponse(null,{status:204});
    return output(await response.json(),method==='POST'?201:200);
  }catch{return error(503,'FastAPI no está disponible. Comprueba el resultado antes de reintentar.');}
}
async function sessionInCourse(ctx:Context,sessionId:number):Promise<NextResponse|null>{
  try{
    const response=await apiFetch(attendanceApi.session(sessionId),ctx.token);
    if(!response.ok)return upstream(response);
    const session:unknown=await response.json();
    if(!record(session)||session.course_id!==ctx.courseId||session.id!==sessionId)
      return error(404,'Sesión no pertenece a este curso');
    return null;
  }catch{return error(503,'No fue posible verificar la sesión');}
}
async function body(request:NextRequest,maxBytes=8192):Promise<unknown|NextResponse>{
  const origin=mutation(request,'json');if(origin)return origin;
  const decoded=await json(request,maxBytes);return 'response'in decoded?decoded.response:decoded.value;
}
const validSession=(v:unknown,courseId:number):v is {course_id:number;day:string;start_time:string;end_time:string}=>
  record(v)&&v.course_id===courseId&&typeof v.day==='string'&&date.test(v.day)&&
  typeof v.start_time==='string'&&time.test(v.start_time)&&
  typeof v.end_time==='string'&&time.test(v.end_time)&&v.end_time>v.start_time&&
  Object.keys(v).every(k=>['course_id','day','start_time','end_time'].includes(k));
const validSessionEdit=(v:unknown):v is Record<string,string>=>record(v)&&
  Object.keys(v).length>0&&Object.keys(v).every(k=>['day','start_time','end_time'].includes(k))&&
  (!('day'in v)||(typeof v.day==='string'&&date.test(v.day)))&&
  (!('start_time'in v)||(typeof v.start_time==='string'&&time.test(v.start_time)))&&
  (!('end_time'in v)||(typeof v.end_time==='string'&&time.test(v.end_time)));
const validEnroll=(v:unknown,courseId:number):v is {user_id:number;course_id:number;role_code:string}=>
  record(v)&&v.course_id===courseId&&pos(v.user_id)&&
  (v.role_code==='STUDENT'||v.role_code==='TEACHER')&&
  Object.keys(v).every(k=>['user_id','course_id','role_code'].includes(k));

const validRole=(value:unknown)=>value==='STUDENT'||value==='TEACHER';
const validBulkEnroll=(value:unknown,courseId:number):boolean=>{
  if(!record(value)||value.course_id!==courseId||!Array.isArray(value.enrollments)||
    value.enrollments.length<1||value.enrollments.length>300)return false;
  const seen=new Set<number>();
  return value.enrollments.every((row:unknown)=>{
    if(!record(row)||row.course_id!==courseId||!pos(row.user_id)||!validRole(row.role_code)||
      Object.keys(row).some(key=>!['course_id','user_id','role_code'].includes(key))||seen.has(row.user_id as number))return false;
    seen.add(row.user_id as number);return true;
  });
};
const importFields=['idnumber','username','password','firstname','lastname','email','phone_number','province','role_code'];
const validMassive=(value:unknown,courseId:number):boolean=>{
  if(!record(value)||value.course_id!==courseId||!Array.isArray(value.users)||
    value.users.length<1||value.users.length>300)return false;
  return value.users.every((row:unknown)=>record(row)&&validRole(row.role_code)&&
    Object.keys(row).every(k=>importFields.includes(k))&&
    typeof row.idnumber==='string'&&row.idnumber.trim().length>0&&row.idnumber.length<=100&&
    importFields.filter(k=>k!=='role_code'&&k!=='idnumber').every(k=>
      !(k in row)||row[k]===null||(typeof row[k]==='string'&&(row[k] as string).length<500)));
};
const validRecurring=(value:unknown,courseId:number):boolean=>{
  if(!record(value)||value.course_id!==courseId||typeof value.from_date!=='string'||!date.test(value.from_date)||
    typeof value.to_date!=='string'||!date.test(value.to_date)||!Array.isArray(value.weekly)||
    value.weekly.length<1||value.weekly.length>7||!Array.isArray(value.excluded_dates)||
    value.excluded_dates.length>366||typeof value.skip_existing!=='boolean'||
    Object.keys(value).some(k=>!['course_id','from_date','to_date','weekly','excluded_dates','skip_existing'].includes(k)))return false;
  const days=new Set<number>();
  const weekly=value.weekly.every((slot:unknown)=>{
    if(!record(slot)||!Number.isSafeInteger(slot.weekday)||Number(slot.weekday)<0||Number(slot.weekday)>6||
       days.has(slot.weekday as number)||typeof slot.start_time!=='string'||typeof slot.end_time!=='string'||
       !time.test(slot.start_time)||!time.test(slot.end_time)||slot.end_time<=slot.start_time||
       Object.keys(slot).some(k=>!['weekday','start_time','end_time'].includes(k)))return false;
    days.add(slot.weekday as number);return true;
  });
  return weekly&&value.excluded_dates.every((d:unknown)=>typeof d==='string'&&date.test(d));
};

export async function GET(request:NextRequest,params:Params){
  const resource=(await params.params).resource;
  if(resource.length===1&&resource[0]==='attendance'){
    const ctx=await auth(request,params);if(ctx instanceof NextResponse)return ctx;
    return call(ctx,attendanceApi.course(ctx.courseId));
  }
  if(resource.length===3&&resource[0]==='attendance'&&resource[2]==='records'){
    const ctx=await auth(request,params);if(ctx instanceof NextResponse)return ctx;
    const sid=validIdPath(resource[1]);if(!sid)return error(400,'Sesión inválida');
    const failure=await sessionInCourse(ctx,sid);if(failure)return failure;
    const response=await call(ctx,attendanceApi.records(sid));
    if(!response.ok)return response;
    // Se utiliza role_id únicamente si se encuentra el código verdadero de su matrícula.
    // ADMIN consulta matrículas del curso; TEACHER obtiene su role_id desde /enrollments/me.
    try{
      const rows:unknown=await response.json();if(!Array.isArray(rows))return error(502,'Asistencias inválidas');
      // /enrollments/ (con barra final) evita un 307 adicional de FastAPI.
      // Un docente solo puede leer /enrollments/me; no llamar al listado ADMIN.
      const enrollmentPath=ctx.role==='ADMIN'
        ? `/api/v1/enrollments/?course_id=${ctx.courseId}`
        : '/api/v1/enrollments/me';
      const ref=await apiFetch(enrollmentPath,ctx.token);
      if(!ref.ok)return upstream(ref);
      const enrollments:unknown=await ref.json();
      if(!Array.isArray(enrollments))return error(502,'Matrículas inválidas');
      return output(enrichAttendanceRoles(rows,enrollments,ctx.courseId,ctx.role));
    }catch{return error(503,'No se pudo completar la lista de asistencia');}
  }
  if(resource.length===2&&resource[0]==='enrollments'&&resource[1]==='users'){
    const ctx=await auth(request,params,true);if(ctx instanceof NextResponse)return ctx;
    const search=request.nextUrl.searchParams;
    const q=search.get('q')||'';
    const page=Number(search.get('page')||1);
    const pageSize=Number(search.get('page_size')||25);
    if(q.length>120||!Number.isSafeInteger(page)||page<1||page>10000||
      !Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100)return error(400,'Búsqueda inválida');
    const query=new URLSearchParams({q,page:String(page),page_size:String(pageSize),active_only:'true',role_code:'VISITOR'});
    return call(ctx,`/api/v1/users/search?${query.toString()}`);
  }
  if(resource.length===1&&resource[0]==='enrollments'){
    const ctx=await auth(request,params,true);if(ctx instanceof NextResponse)return ctx;
    return call(ctx,`/api/v1/enrollments?course_id=${ctx.courseId}`);
  }
  return error(404,'Recurso no disponible');
}
export async function POST(request:NextRequest,params:Params){
  const resource=(await params.params).resource;
  const adminOnly=resource[0]==='enrollments';
  const ctx=await auth(request,params,adminOnly);if(ctx instanceof NextResponse)return ctx;
  const batchOperation=(resource[0]==='enrollments'&&resource.length===2&&
    ['bulk','massive'].includes(resource[1]));
  const payload=await body(request,batchOperation?350000:8192);if(payload instanceof NextResponse)return payload;
  if(resource.length===3&&resource[0]==='attendance'&&resource[1]==='recurring'&&resource[2]==='preview'){
    if(!validRecurring(payload,ctx.courseId))return error(400,'Programación recurrente inválida');
    return call(ctx,attendanceApi.recurringPreview,'POST',payload);
  }
  if(resource.length===2&&resource[0]==='attendance'&&resource[1]==='recurring'){
    if(!validRecurring(payload,ctx.courseId))return error(400,'Programación recurrente inválida');
    return call(ctx,attendanceApi.recurring,'POST',payload);
  }
  if(resource.length===2&&resource[0]==='enrollments'&&resource[1]==='bulk'){
    if(!validBulkEnroll(payload,ctx.courseId))return error(400,'Lote de matrículas inválido');
    return call(ctx,'/api/v1/enrollments/admin/bulk','POST',payload);
  }
  if(resource.length===2&&resource[0]==='enrollments'&&resource[1]==='massive'){
    if(!validMassive(payload,ctx.courseId))return error(400,'Importación inválida');
    return call(ctx,'/api/v1/enrollments/massive','POST',payload);
  }
  if(resource.length===1&&resource[0]==='attendance'){
    if(!validSession(payload,ctx.courseId))return error(400,'Fecha u horario inválido');
    return call(ctx,attendanceApi.createSession,'POST',payload);
  }
  if(resource.length===1&&resource[0]==='enrollments'){
    if(!validEnroll(payload,ctx.courseId))return error(400,'Matrícula inválida');
    return call(ctx,'/api/v1/enrollments/admin','POST',payload);
  }
  if(resource.length===3&&resource[0]==='enrollments'){
    const enrollmentId=validIdPath(resource[1]);const action=resource[2];
    if(!enrollmentId||!['accept','reject','cancel'].includes(action)||!record(payload)||
      Object.keys(payload).some(k=>k!=='comment')||('comment'in payload&&typeof payload.comment!=='string'))
      return error(400,'Acción de matrícula inválida');
    // Validar que el ID pertenece al curso antes de mutar.
    const enrollment=await apiFetch(`/api/v1/enrollments/${enrollmentId}`,ctx.token);
    if(!enrollment.ok)return upstream(enrollment);
    const value:unknown=await enrollment.json();
    if(!record(value)||!record(value.course)||value.course.id!==ctx.courseId)return error(404,'Matrícula fuera del curso');
    return call(ctx,`/api/v1/enrollments/${enrollmentId}/${action}`,'POST',payload);
  }
  return error(404,'Operación no disponible');
}
export async function PUT(request:NextRequest,params:Params){
  const resource=(await params.params).resource;
  if(resource[0]!=='attendance')return error(405,'Operación no permitida');
  const ctx=await auth(request,params);if(ctx instanceof NextResponse)return ctx;
  const payload=await body(request);if(payload instanceof NextResponse)return payload;
  const sid=resource.length>1?validIdPath(resource[1]):null;
  if(!sid)return error(400,'Sesión inválida');
  const failed=await sessionInCourse(ctx,sid);if(failed)return failed;
  if(resource.length===2){
    if(!validSessionEdit(payload))return error(400,'Actualización de sesión inválida');
    return call(ctx,attendanceApi.session(sid),'PUT',payload);
  }
  if(resource.length===4&&resource[2]==='records'){
    const recordId=validIdPath(resource[3]);
    if(!recordId||!record(payload)||Object.keys(payload).length!==1||!states.includes(String(payload.attendance_state)))
      return error(400,'Estado de asistencia inválido');
    // Impedir modificar mediante esta URL registros de otras sesiones.
    const original=await apiFetch(attendanceApi.record(recordId),ctx.token);
    if(!original.ok)return upstream(original);
    const row:unknown=await original.json();
    if(!record(row)||row.course_attendance_id!==sid)return error(404,'Asistencia fuera de la sesión');
    return call(ctx,attendanceApi.record(recordId),'PUT',payload);
  }
  return error(404,'Operación no disponible');
}
export async function PATCH(request:NextRequest,params:Params){
  const resource=(await params.params).resource;
  if(resource.length!==3||resource[0]!=='enrollments'||resource[2]!=='role')return error(404,'No disponible');
  const ctx=await auth(request,params,true);if(ctx instanceof NextResponse)return ctx;
  const payload=await body(request);if(payload instanceof NextResponse)return payload;
  const eid=validIdPath(resource[1]);
  if(!eid||!record(payload)||Object.keys(payload).length!==1||!['STUDENT','TEACHER'].includes(String(payload.role_code)))
    return error(400,'Rol inválido');
  const origin=await apiFetch(`/api/v1/enrollments/${eid}`,ctx.token);
  if(!origin.ok)return upstream(origin);
  const value:unknown=await origin.json();
  if(!record(value)||!record(value.course)||value.course.id!==ctx.courseId)return error(404,'Matrícula fuera del curso');
  return call(ctx,`/api/v1/enrollments/${eid}/role`,'PATCH',payload);
}
export async function DELETE(request:NextRequest,params:Params){
  const resource=(await params.params).resource;
  if(resource.length!==2||resource[0]!=='attendance')return error(404,'No disponible');
  const bad=mutation(request,'any');if(bad)return bad;
  const ctx=await auth(request,params);if(ctx instanceof NextResponse)return ctx;
  const sid=validIdPath(resource[1]);if(!sid)return error(400,'Sesión inválida');
  const failed=await sessionInCourse(ctx,sid);if(failed)return failed;
  return call(ctx,attendanceApi.session(sid),'DELETE');
}
