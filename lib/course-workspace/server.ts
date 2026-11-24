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
  /** Solo SSR/BFF. Datos ya autorizados y validados nuevamente en el BFF. */
  studentOverview?:unknown;
};
export type WorkspaceResult =
  | {status:'unauthenticated'|'pending'|'unavailable'|'forbidden'}
  | {status:'ready';tenant:TenantPublic;user:AuthUser;expiresAt:string|null;workspace:Workspace};

/** Workspace docente autenticado, obtenido de FastAPI (nunca de URLs públicas). */
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
      // Una matrícula aceptada permite cursar un curso no publicado: el catálogo
      // público solo regula nuevos visitantes, no revoca el acceso académico.
      const own=await apiFetch(`/api/v1/student-courses/${courseId}/overview`,token);
      if(own.status===403||own.status===404)return {status:'forbidden'};
      if(!own.ok)return {status:'unavailable'};
      const overview:unknown=await own.json();
      if(!overview||typeof overview!=='object'||!('course'in overview))return {status:'unavailable'};
      const c=(overview as {course?:{id?:number;name?:string;code?:unknown}}).course;
      if(c?.id!==courseId||typeof c.name!=='string'||!['MOOC','MDT'].includes(String(c.code)))return {status:'unavailable'};
      return {status:'ready',tenant,user:state.user,expiresAt:state.expiresAt,
        workspace:{id:courseId,name:c.name,code:c.code as CourseCode,role:'STUDENT',studentOverview:overview}};
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
