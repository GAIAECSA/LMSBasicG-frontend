'use client';
import { ToastMessage } from '@/components/ui/notifications';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {Award,BookOpen,CheckCircle2,Clock3,FileText,GraduationCap,Layers3,RefreshCw,ArrowRight,AlertTriangle} from 'lucide-react';
import {CourseCover} from './course-cover';
import {StudentCourseContent} from './student-course-content';
import {StudentCertificateTab} from './student-course-certificate';
import {apiErrorMessage,loadOverview,loadGrades,loadEligibility} from '@/lib/student-course/client';
import {scoreLabel,shortDate,type StudentSection,type StudentOverview,type StudentGrades,type StudentEligibility} from '@/lib/student-course/domain';
import css from './student-course.module.css';

type Props={courseId:number;courseName:string;code:'MOOC'|'MDT';section:StudentSection;userId:number};
const tabs:{section:StudentSection;label:string}[]=[{section:'summary',label:'Resumen'},{section:'content',label:'Contenido'},
  {section:'grades',label:'Calificaciones'},{section:'certificate',label:'Certificado'}];

export function StudentCourse({courseId,courseName,code,section,userId}:Props){
 const [overview,setOverview]=useState<StudentOverview|null>(null),[grades,setGrades]=useState<StudentGrades|null>(null),[eligibility,setEligibility]=useState<StudentEligibility|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const refresh=useCallback(async()=>{
  const current=await loadOverview(courseId);setOverview(current);
  if(section==='grades')setGrades(await loadGrades(courseId));
  if(section==='certificate')setEligibility(await loadEligibility(courseId));
 },[courseId,section]);
 useEffect(()=>{let active=true;setLoading(true);setError('');
  refresh().catch(e=>{if(active)setError(apiErrorMessage(e));}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};},[refresh]);
 const course=overview?.course;
 const percent=overview?.progress.percent;
 return <div className={css.page}>
  <header className={css.hero}>
   <div className={css.coverWrap}>{course?<CourseCover courseId={courseId} imageUrl={course.image_url} alt={`Portada de ${course.name}`} className={css.cover}/>:<BookOpen size={45}/>}</div>
   <div className={css.heroText}><span className={css.eyebrow}>TU CURSO {course?.code||code}</span><h1>{course?.name||courseName}</h1>
    <span className={css.enrolled}><CheckCircle2 size={14}/> Matrícula activa</span>
    <p>{course?.description||'Continúa desarrollando tus competencias académicas.'}</p>
    <div className={css.heroFacts}><span><GraduationCap size={16}/> {course?.level||'Formación'}</span>
     <span><Clock3 size={16}/> {course?.duration_hours??'—'} horas</span>
     <span><Layers3 size={16}/> {overview?.progress.total??'—'} contenidos</span>
     <span><BookOpen size={16}/> Progreso {percent===null||percent===undefined?'—':`${percent}%`}</span></div>
   </div>
   <Link className={css.heroContinue} href={`/campus/courses/${courseId}/content`}><ArrowRight size={17}/> Continuar aprendiendo</Link>
  </header>
  <nav aria-label="Secciones del curso" className={css.nav}>{tabs.map(tab=><Link key={tab.section} className={`${css.tab} ${section===tab.section?css.activeTab:''}`} aria-current={section===tab.section?'page':undefined}
   href={`/campus/courses/${courseId}/${tab.section}`}>{tab.section==='certificate'?(code==='MDT'?'Certificado MDT':'Certificado'):tab.label}</Link>)}</nav>
  {error&&<ToastMessage kind="error" message={error}><button className={css.secondary} onClick={()=>{setError('');setLoading(true);refresh().catch(e=>setError(apiErrorMessage(e))).finally(()=>setLoading(false));}}>Reintentar</button></ToastMessage>}
  {loading&&!overview?<div className={css.panel} role="status"><RefreshCw size={19}/> Cargando tu aula…</div>:overview&&<>
   {section==='summary'&&<StudentSummary overview={overview} courseId={courseId}/>}
   {section==='content'&&<StudentCourseContent courseId={courseId} overview={overview} userId={userId} onSaved={refresh}/>}
   {section==='grades'&&(grades?<StudentGradesView grades={grades}/>:<p className={css.muted}>Consultando calificaciones…</p>)}
   {section==='certificate'&&(eligibility?<StudentCertificateTab courseId={courseId} code={code} eligibility={eligibility} refresh={refresh}/>:<p className={css.muted}>Consultando requisitos de certificación…</p>)}
  </>}
 </div>;
}
function StudentSummary({overview,courseId}:{overview:StudentOverview;courseId:number}){
 const percent=overview.progress.percent;
 const pendingDocs=overview.documents.filter(d=>!d.submitted).length;
 return <div className={css.summaryGrid}><div className={css.summaryMain}>
   <section className={css.panel}><h2><FileText size={22}/> Descripción del curso</h2><p>{overview.course.description||'Sin descripción institucional.'}</p></section>
   <section className={css.panel}><h2><CheckCircle2 size={22}/> Objetivos de aprendizaje</h2>
    <ul className={css.bulletList}><li>Revisar los contenidos de cada módulo.</li><li>Realizar las actividades y evaluaciones correspondientes.</li><li>Alcanzar los requisitos para obtener el certificado del curso.</li></ul></section>
   <section className={css.panel}><h2><BookOpen size={22}/> Requisitos del curso</h2><ul className={css.bulletList}><li>Mantener matrícula aceptada.</li>
    <li>Realizar las actividades y obtener una nota final mínima de 7/10.</li>
    {overview.course.code==='MDT'&&<li>Entregar la documentación MDT obligatoria. La asistencia se informa y no bloquea el certificado.</li>}</ul></section>
  </div><aside className={css.summarySide}>
   <section className={css.panel}><h3>Progreso del curso</h3><div className={css.bigProgress}><span>{percent===null?'—':`${percent}%`}</span><strong>{overview.progress.completed} de {overview.progress.total}</strong>
     <small>Recursos y obligaciones completados</small></div><div className={css.progressTrack}><span style={{width:`${percent??0}%`}}/></div>
    <p className={css.help}>El porcentaje de progreso no equivale a la aprobación académica.</p></section>
   {overview.course.code==='MDT'&&<section className={css.panel}><h3>Expediente MDT</h3><p className={pendingDocs?css.warn:css.good}>{pendingDocs?`${pendingDocs} documentos pendientes`:'Documentos al día'}</p>
    <Link className={css.secondary} href={`/campus/courses/${courseId}/content`}>Ir a documentos <ArrowRight size={16}/></Link></section>}
   <section className={css.panel}><h3>Calificación actual</h3><strong className={css.gradeLarge}>{scoreLabel(overview.final_grade)}</strong>
    <Link href={`/campus/courses/${courseId}/grades`} className={css.textButton}>Ver desglose de notas <ArrowRight size={14}/></Link></section>
  </aside></div>;
}
function StudentGradesView({grades}:{grades:StudentGrades}){
 const scored=grades.activities.filter(x=>x.counts_toward_grade),informative=grades.activities.filter(x=>!x.counts_toward_grade);
 return <section className={css.panel}><div className={css.gradeIntro}><div><span className={css.eyebrow}>TU RENDIMIENTO</span><h2>Calificaciones del curso</h2>
   <p>Las actividades informativas se muestran sin modificar el promedio oficial.</p></div><span className={css.method}>{grades.method==='AVERAGE'?'Promedio simple':'Promedio ponderado'}</span></div>
   <div className={css.gradeList}><table className={css.gradeTable}><thead><tr><th>#</th><th>Actividad</th><th>Nota</th><th>Cuenta</th><th>{grades.method==='WEIGHTED'?'Peso':'Cálculo'}</th></tr></thead><tbody>
    {[...scored,...informative].map((item,i)=><tr key={item.id}><td>{i+1}</td><td><strong>{item.title}</strong><small>{item.kind==='quiz'?'Quiz':'Tarea'} · {item.status}{item.assisted?' · Registro asistido':''}</small></td>
     <td><strong>{item.score!==null?`${Number(item.score).toFixed(2)} / 10`:'0.00 / 10*'}</strong><small>{item.performed_at?shortDate(item.performed_at):'No realizado'}</small></td>
     <td>{item.counts_toward_grade?<span className={css.good}>Sí</span>:<span className={css.muted}>No</span>}</td>
     <td>{item.counts_toward_grade?(grades.method==='AVERAGE'?'Promedio':`${Number(item.grade_weight||0).toFixed(2)} %`):'Informativa'}</td></tr>)}
   </tbody></table>{grades.activities.length===0&&<p className={css.muted}>No hay actividades calificables configuradas.</p>}</div>
   <footer className={css.finalGrade}><span><strong>Nota final oficial</strong><small>Solo incluye las actividades que cuentan para la nota</small></span>
    <strong>{scoreLabel(grades.final_grade)}</strong></footer>
   <p className={css.help}>* Las actividades pendientes cuentan como cero en el cálculo oficial, aunque se diferencian de una nota cero efectivamente calificada. La nota se calcula en FastAPI.</p>
 </section>;
}
