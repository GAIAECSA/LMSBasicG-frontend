/** Matriz de notas: BFF de consulta, exclusivo de ADMIN y TEACHER del curso.
 * El navegador envía filtros, nunca JWT, business_id, user_id ni notas. Las
 * respuestas son privadas y no cacheables; FastAPI vuelve a validar permisos.
 */
import {NextRequest,NextResponse} from 'next/server';
import {apiFetch} from '@/lib/auth/backend';
import {SESSION_COOKIE} from '@/lib/auth/server';
import {error,output,upstream,validIdPath} from '@/lib/academic/bff';
import {getCourseWorkspace} from '@/lib/course-workspace/server';
import {readCourseGradesMatrix} from '@/lib/course-workspace/grades';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Params={params:Promise<{id:string}>};
const allowed=new Set(['page','page_size','search','activity_filter','activity_type',
  'activity_page','activity_page_size']);
function page(value:string|null,fallback:number,max:number):number|null{
  if(value===null)return fallback;
  if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)>max)return null;
  return Number(value);
}
export async function GET(request:NextRequest,{params}:Params){
  const courseId=validIdPath((await params).id);
  if(!courseId)return error(400,'Curso inválido');
  const inputs=request.nextUrl.searchParams;
  if([...inputs.keys()].some(key=>!allowed.has(key))||
    [...allowed].some(key=>inputs.getAll(key).length>1))return error(400,'Filtro no admitido');
  const p=page(inputs.get('page'),1,100000000);
  const size=page(inputs.get('page_size'),25,100);
  const ap=page(inputs.get('activity_page'),1,100000000);
  const as=page(inputs.get('activity_page_size'),15,100);
  const filter=inputs.get('activity_filter')||'ALL';
  const type=inputs.get('activity_type')||'ALL';
  const search=(inputs.get('search')||'').trim();
  if(!p||!size||!ap||!as||!['ALL','COUNTED','NOT_COUNTED'].includes(filter)||
    !['ALL','quiz','homework'].includes(type)||search.length>150)return error(400,'Filtros inválidos');
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if(!token)return error(401,'Inicia sesión');
  try{
    const access=await getCourseWorkspace(courseId);
    if(access.status==='unauthenticated')return error(401,'Sesión vencida');
    if(access.status==='pending')return error(428,'Acepta las políticas obligatorias');
    if(access.status==='unavailable')return error(503,'No se pudo validar el acceso al curso');
    if(access.status!=='ready'||access.workspace.role==='STUDENT')return error(403,'Acceso denegado');
    const query=new URLSearchParams({page:String(p),page_size:String(size),
      activity_page:String(ap),activity_page_size:String(as),
      activity_filter:filter,activity_type:type});
    if(search)query.set('search',search);
    const response=await apiFetch(`/api/v1/courses/${courseId}/grades?${query}`,token);
    if(!response.ok)return upstream(response);
    let parsed;
    try{parsed=readCourseGradesMatrix(await response.json(),courseId);}
    catch{return error(502,'FastAPI devolvió un contrato de calificaciones inválido');}
    return output(parsed);
  }catch{return error(503,'No fue posible consultar las calificaciones');}
}
