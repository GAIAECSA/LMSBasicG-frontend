import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { SESSION_COOKIE } from '@/lib/auth/server';
import { getCourseWorkspace } from '@/lib/course-workspace/server';
import { REPORT_CODES, type ReportCode } from '@/lib/course-reports/catalog';

/** No exponer JWT ni permitir un proxy arbitrario a FastAPI. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = {params: Promise<{id:string; resource:string[]}>};
const validId=(value:string)=>/^[1-9]\d*$/.test(value)&&Number.isSafeInteger(Number(value));
const err=(status:number,message:string)=>NextResponse.json({detail:message},{status,headers:{'Cache-Control':'no-store'}});
const codeIsValid=(v:string):v is ReportCode=>REPORT_CODES.includes(v as ReportCode);

export async function GET(req:NextRequest,{params}:Params){
  const {id,resource}=await params;
  if(!validId(id))return err(400,'Curso inválido');
  const token=req.cookies.get(SESSION_COOKIE)?.value;
  if(!token)return err(401,'Debes iniciar sesión');
  let state:Awaited<ReturnType<typeof getCourseWorkspace>>;
  try{state=await getCourseWorkspace(Number(id));}
  catch{return err(503,'No se pudo verificar el acceso al curso');}
  if(state.status==='unauthenticated')return err(401,'Sesión vencida');
  if(state.status==='pending')return err(428,'Acepta las políticas obligatorias');
  if(state.status==='unavailable')return err(503,'Servicio académico no disponible');
  if(state.status!=='ready'||state.workspace.role!=='ADMIN'||state.workspace.code!=='MDT')return err(403,'Reportes exclusivos de ADMIN en cursos MDT');
  let path:string;
  let isPdf=false;
  if(resource.length===1&&resource[0]==='catalog'&&req.nextUrl.searchParams.size===0){
    path=`/api/v1/reports/courses/${id}/catalog`;
  }else if(resource.length===2&&resource[1]==='pdf'&&codeIsValid(resource[0])){
    isPdf=true;
    const qs=req.nextUrl.searchParams;
    if([...qs.keys()].some(key=>key!=='activity_ids')||qs.getAll('activity_ids').length>500)return err(400,'Selección inválida');
    const ids=qs.getAll('activity_ids');
    if(ids.some(i=>!validId(i))||new Set(ids).size!==ids.length)return err(400,'Actividades inválidas');
    if(ids.length&&!['diagnostic','practical','theoretical','final-grades'].includes(resource[0]))return err(400,'Este PDF no admite actividades');
    path=`/api/v1/reports/courses/${id}/${resource[0]}/pdf${ids.length?'?'+new URLSearchParams(ids.map(value=>['activity_ids',value])).toString():''}`;
  }else return err(404,'Recurso inexistente');
  try{
    const response=await apiFetch(path,token,{signal:AbortSignal.timeout(120000)});
    if(!response.ok){
      let detail='No se pudo generar el reporte';
      try{const body:unknown=await response.json();if(body&&typeof body==='object'&&'detail'in body&&typeof body.detail==='string')detail=body.detail;}catch{}
      return err(response.status,detail);
    }
    if(!isPdf){
      const data:unknown=await response.json();
      return NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}});
    }
    const contentType=response.headers.get('content-type')||'';
    if(!contentType.includes('application/pdf'))return err(502,'Respuesta de PDF inválida');
    const headers=new Headers({'Content-Type':'application/pdf','Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN'});
    const disposition=response.headers.get('content-disposition');
    if(disposition&&/^attachment; filename="[a-zA-Z0-9_.-]+\.pdf"$/.test(disposition))headers.set('Content-Disposition',disposition);
    return new NextResponse(response.body,{status:200,headers});
  }catch{return err(503,'No se pudo conectar con FastAPI');}
}
