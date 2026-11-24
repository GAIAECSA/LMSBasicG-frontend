import type { ReactNode } from 'react';
import { notFound,redirect } from 'next/navigation';
import { CampusShell } from '@/components/campus/campus-shell';
import { getCourseWorkspace } from '@/lib/course-workspace/server';

export default async function CourseLayout({children,params}:{children:ReactNode;params:Promise<{id:string}>}){
  const {id}=await params;
  if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id)))notFound();
  const result=await getCourseWorkspace(Number(id));
  if(result.status==='unauthenticated')redirect('/login');
  if(result.status==='pending')redirect('/policies');
  if(result.status==='forbidden')notFound();
  if(result.status==='unavailable')return <main className="state-page" role="alert">No se pudo validar el acceso a este curso. Reintenta cuando esté disponible el servicio académico.</main>;
  // WorkspaceResult no incluye workspace en estados de error.
  // Validar "ready" explícitamente evita un error de tipos en el build.
  if(result.status!=='ready')return <main className="state-page" role="alert">No se pudo validar el acceso a este curso.</main>;
  const workspace=result.workspace;
  return <CampusShell tenant={result.tenant} user={result.user} expiresAt={result.expiresAt}
    courseWorkspace={workspace.role==='STUDENT'?undefined:{id:workspace.id,name:workspace.name,
      code:workspace.code!,role:workspace.role}}>{children}</CampusShell>;
}
