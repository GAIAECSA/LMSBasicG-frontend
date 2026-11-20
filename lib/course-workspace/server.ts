import { cache } from 'react';
import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/auth/backend';
import { authState,SESSION_COOKIE } from '@/lib/auth/server';
import { isTenantAdmin } from '@/lib/policies/types';
import { parseCourse, type CourseCode, type ManagedCourse } from '@/lib/academic/types';
import { parseVisitorEnrollments } from '@/lib/visitor/types';
import { resolveTenant } from '@/lib/tenant/resolve';
import type { TenantPublic } from '@/lib/tenant/types';
import type { AuthUser } from '@/lib/auth/types';
import type { WorkspaceRole } from './navigation';

export type Workspace = {
  id:number; name:string; code:CourseCode|null;
  role:WorkspaceRole|'STUDENT';
  initialCourse?:ManagedCourse;
};
export type WorkspaceResult =
  | {status:'unauthenticated'|'pending'|'unavailable'|'forbidden'}
  | {status:'ready';tenant:TenantPublic;user:AuthUser;expiresAt:string|null;workspace:Workspace};

/** Contrato propuesto para la lectura docente, NO para el catálogo público:
 * GET /api/v1/courses/{id}/workspace, autenticado con mismo tenant y matrícula
 * ACEPTADO de TEACHER (y también se podrá admitir ADMIN). La respuesta mínima:
 * {course_id:1,name:'Curso',course_type:{code:'MOOC'|'MDT'}}.
 * El backend actual aún NO expone esa ruta. Hasta entonces el acceso docente
 * falla cerrado; no se infiere el tipo desde IDs de blocks ni módulos licenciados.
 */
function parseTeacherWorkspace(value:unknown,id:number):{name:string;code:CourseCode}|null {
  if(!value||typeof value!=='object')return null;
  const row=value as Record<string,unknown>;
  const type=row.course_type;
  if(row.course_id!==id||typeof row.name!=='string'||!row.name.trim()||!type||typeof type!=='object')return null;
  const code=(type as Record<string,unknown>).code;
  return code==='MOOC'||code==='MDT'?{name:row.name,code}:null;
}

/** cache() es por petición render SSR: layout y página reutilizan el mismo gate. */
export const getCourseWorkspace = cache(async(courseId:number):Promise<WorkspaceResult>=>{
  if(!Number.isSafeInteger(courseId)||courseId<1)return {status:'forbidden'};
  const tenant=await resolveTenant();
  const state=await authState(tenant);
  if(state.status!=='ready')return {status:state.status};
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  if(!token)return {status:'unauthenticated'};

  try {
    if(isTenantAdmin(state.user.role)){
      // ADMIN es rol general y jamás necesita matrícula para entrar al curso.
      const response=await apiFetch(`/api/v1/courses/${courseId}`,token);
      if(response.status===404||response.status===403)return {status:'forbidden'};
      if(!response.ok)return {status:'unavailable'};
      const course=parseCourse(await response.json());
      if(!course||course.id!==courseId)return {status:'unavailable'};
      return {status:'ready',tenant,user:state.user,expiresAt:state.expiresAt,
        workspace:{id:course.id,name:course.name,code:course.course_type.code,role:'ADMIN',initialCourse:course}};
    }
    if(state.user.role.code!=='VISITOR'||state.user.role.scope!=='PLATFORM')return {status:'forbidden'};
    const response=await apiFetch('/api/v1/enrollments/me',token);
    if(!response.ok)return {status:'unavailable'};
    const enrollments=parseVisitorEnrollments(await response.json(),state.user.id);
    if(!enrollments)return {status:'unavailable'};
    const enrollment=enrollments.find(item=>item.course.id===courseId&&item.status==='ACEPTADO');
    if(!enrollment)return {status:'forbidden'};
    if(enrollment.role.code==='STUDENT'){
      // El aula del alumno sigue pendiente; conservar menú VISITOR.
      if(!enrollment.course.is_published)return {status:'forbidden'};
      return {status:'ready',tenant,user:state.user,expiresAt:state.expiresAt,
        workspace:{id:courseId,name:enrollment.course.name,code:null,role:'STUDENT'}};
    }
    if(enrollment.role.code!=='TEACHER')return {status:'forbidden'};
    // No publicar datos privados de borradores usando el catálogo público.
    const ctx=await apiFetch(`/api/v1/courses/${courseId}/workspace`,token);
    if(ctx.status===403||ctx.status===404)return {status:'unavailable'};
    if(!ctx.ok)return {status:'unavailable'};
    const detail=parseTeacherWorkspace(await ctx.json(),courseId);
    if(!detail)return {status:'unavailable'};
    return {status:'ready',tenant,user:state.user,expiresAt:state.expiresAt,
      workspace:{id:courseId,name:detail.name,code:detail.code,role:'TEACHER'}};
  }catch{return {status:'unavailable'};}
});
