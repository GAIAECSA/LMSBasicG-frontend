import {redirect} from 'next/navigation';
import {getCourseWorkspace} from '@/lib/course-workspace/server';
import {notFound} from 'next/navigation';
export const metadata={title:'Aula del curso'};
/** Entrada canónica: al abrir un curso ADMIN o TEACHER ve Módulos primero.
 * El layout se ocupa de sesión, tenant, matrícula y políticas. */
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id)))notFound();
 const access=await getCourseWorkspace(Number(id));
 if(access.status==='ready'&&access.workspace.role==='STUDENT')redirect(`/campus/courses/${id}/summary`);
 redirect(`/campus/courses/${id}/modules`);
}
