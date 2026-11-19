import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant/resolve';
import { authState } from '@/lib/auth/server';
import { isTenantAdmin } from '@/lib/policies/types';
import { CampusShell } from '@/components/campus/campus-shell';
import { AdminCourseDetail } from '@/components/campus/admin-course-detail';
export const metadata={title:'Gestionar curso'};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const tenant=await resolveTenant();const state=await authState(tenant);
 if(state.status==='unauthenticated')redirect('/login');
 if(state.status==='pending')redirect('/policies');
 if(state.status==='unavailable')return <main className="state-page" role="alert">No se pudo validar la sesión.</main>;
 if(state.status!=='ready')return <main className="state-page">Acceso no disponible</main>;
 if(!isTenantAdmin(state.user.role))redirect('/campus');
 const {id}=await params;if(!/^[1-9]\d*$/.test(id))redirect('/campus/courses');
 return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}>
  <AdminCourseDetail courseId={Number(id)}/></CampusShell>;
}
