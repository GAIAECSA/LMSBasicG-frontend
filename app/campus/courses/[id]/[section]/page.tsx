import { notFound,redirect } from 'next/navigation';
import { getCourseWorkspace } from '@/lib/course-workspace/server';
import { mayOpenSection,workspaceItems } from '@/lib/course-workspace/navigation';
import { AdminCourseDetail } from '@/components/campus/admin-course-detail';
import { CourseAttendanceManager } from '@/components/campus/course-attendance-manager';
import { CourseEnrollmentsManager } from '@/components/campus/course-enrollments-manager';
import { CourseMdtResources } from '@/components/campus/course-mdt-resources';
import { CourseGrades } from '@/components/campus/course-grades';
import { CourseModules } from '@/components/campus/course-modules';
import { CourseCertificates } from '@/components/campus/course-certificates';
export const metadata={title:'Curso'};
export default async function CourseSectionPage({params}:{params:Promise<{id:string;section:string}>}){
  const {id,section}=await params;
  if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id)))notFound();
  const result=await getCourseWorkspace(Number(id));
  if(result.status==='unauthenticated')redirect('/login');
  if(result.status==='pending')redirect('/policies');
  if(result.status==='forbidden')notFound();
  if(result.status==='unavailable')return <div className="lms-error" role="alert">No se pudo validar el acceso al curso.</div>;
  // El union WorkspaceResult solo tiene workspace cuando status === "ready".
  // Esta guarda explícita permite a TypeScript acotar el tipo con seguridad.
  if(result.status!=='ready')return <div className="lms-error" role="alert">No se pudo validar el acceso al curso.</div>;
  const ws=result.workspace;
  if(ws.role==='STUDENT'){
    if(section!=='modules')notFound();
    return <section className="lms-course-soon"><h1>{ws.name}</h1><p>El aula del estudiante se incorporará en una próxima fase.</p></section>;
  }
  if(!ws.code||!mayOpenSection(ws.code,ws.role,section))notFound();
  if(section==='modules')return <CourseModules courseId={ws.id} courseName={ws.name} role={ws.role}/>;
  if(section==='attendance')return <CourseAttendanceManager courseId={ws.id} courseName={ws.name}/>;
  if(section==='mdt-resources'&&ws.code==='MDT')return <CourseMdtResources courseId={ws.id} courseName={ws.name}/>;
  if(section==='grades')return <CourseGrades courseId={ws.id} courseName={ws.name}/>;
  if(section==='certificates'){
    if(ws.role!=='ADMIN'||!ws.initialCourse)notFound();
    return <CourseCertificates courseId={ws.id} courseName={ws.name}
      courseCode={ws.code} capabilities={ws.initialCourse.certificate_types}/>;
  }
  if(section==='enrollments'){
    if(ws.role!=='ADMIN')notFound();
    return <CourseEnrollmentsManager courseId={ws.id} courseName={ws.name}/>;
  }
  if(section==='settings'){
    if(ws.role!=='ADMIN'||!ws.initialCourse)notFound();
    return <AdminCourseDetail courseId={ws.id} initialCourse={ws.initialCourse}/>;
  }
  const item=workspaceItems(ws.code,ws.role).find(item=>item.section===section);
  return <section className="lms-course-soon">
    <span className="lms-eyebrow">CURSO {ws.code}</span>
    <h1>{item?.label}</h1>
    <p>Este apartado del curso se implementará en una siguiente fase. Todavía no permite operaciones académicas.</p>
  </section>;
}
