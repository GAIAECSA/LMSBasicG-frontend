"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Search, Sparkles, UserRoundCheck, Clock3,
  CheckCircle2, ArrowRight, Layers3 } from "lucide-react";
import { CourseCover } from "./course-cover";
import type { MyCoursesData, VisitorCourse } from "@/lib/visitor/types";

function normalize(value:string) {
  return value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
type Tab = "all" | "progress" | "completed";

function ProgressBar({course}:{course:VisitorCourse}) {
  if (course.role === "TEACHER") return <div className="visitor-progress-empty">
    <UserRoundCheck size={18} aria-hidden="true"/><span>Progreso académico: no aplica al profesor</span>
  </div>;
  if (course.progressPercent === null) return <div className="visitor-progress-empty">
    <Clock3 size={18} aria-hidden="true"/><span>Progreso aún no disponible</span>
  </div>;
  return <div className="visitor-progress" aria-label={`Progreso de bloques: ${course.progressPercent}%`}>
    <div className="visitor-progress-copy"><span>PROGRESO DE BLOQUES</span><strong>{course.progressPercent}%</strong></div>
    <div className="visitor-progress-rail"><div className="visitor-progress-fill" style={{width:`${course.progressPercent}%`}}/></div>
  </div>;
}

function CourseRow({item}:{item:VisitorCourse}) {
  const complete=item.role==="STUDENT" && item.progressPercent===100;
  return <article className="visitor-enrolled-card">
    <div className="visitor-enrolled-cover">
      <CourseCover courseId={item.course.id} imageUrl={item.course.image_url} alt={`Portada de ${item.course.name}`} size={44}/>
      <span className="visitor-enrolled-cover-label">{item.role==="TEACHER"?"PROFESOR":"ESTUDIANTE"}</span>
    </div>
    <div className="visitor-enrolled-main">
      <div className="visitor-badge-row">
        <span className="visitor-status-badge"><CheckCircle2 size={14}/> Matrícula aceptada</span>
        {complete && <span className="visitor-complete-badge">100% de bloques</span>}
        <span className="visitor-neutral-badge"><Layers3 size={14}/> {item.course.level.toLowerCase()}</span>
      </div>
      <h2>{item.course.name}</h2>
      <p className="visitor-enrolled-description">{item.course.description}</p>
      <ProgressBar course={item}/>
    </div>
    <aside className="visitor-enrolled-access">
      <div className="visitor-access-panel"><span><GraduationCap size={16}/> TU ROL</span>
        <strong>{item.role==="TEACHER"?"Profesor":"Estudiante"}</strong>
        <small>En este curso</small>
      </div>
      <Link className="visitor-secondary-action" href={`/campus/courses/${item.course.id}`}>
        {item.role==='TEACHER'?'Ir a módulos':'Ver curso'} <ArrowRight size={16}/>
      </Link>
      {item.role==='STUDENT'&&<small className="visitor-not-yet">Aula próximamente</small>}
    </aside>
  </article>;
}

export function VisitorMyCourses({name,data}:{name:string;data:MyCoursesData}) {
  const [query,setQuery]=useState("");
  const [tab,setTab]=useState<Tab>("all");
  const courses=data.courses;
  const studentCount=courses.filter(item=>item.role==="STUDENT").length;
  const teacherCount=courses.filter(item=>item.role==="TEACHER").length;
  const completedCount=courses.filter(item=>item.role==="STUDENT" && item.progressPercent===100).length;
  const inProgressCount=courses.filter(item=>item.role==="STUDENT" && item.progressPercent!==null && item.progressPercent<100).length;
  const filtered=useMemo(()=>courses.filter(item=>{
    if(tab==="completed" && !(item.role==="STUDENT" && item.progressPercent===100))return false;
    if(tab==="progress" && !(item.role==="STUDENT" && item.progressPercent!==null && item.progressPercent<100))return false;
    return normalize(item.course.name+" "+item.course.description).includes(normalize(query));
  }),[courses,tab,query]);

  return <div className="visitor-page">
    <header className="visitor-page-head">
      <div><p className="lms-eyebrow"><Sparkles size={15}/> TU FORMACIÓN</p>
        <h1>Mis cursos</h1>
        <p>Hola, <strong>{name}</strong>. Continúa tu formación y revisa tus cursos publicados con matrícula aceptada.</p>
      </div>
      <Link className="visitor-secondary-action" href="/campus/catalog">Explorar cursos <ArrowRight size={17}/></Link>
    </header>
    {data.status==="unavailable" ? <div className="lms-error" role="alert">No fue posible consultar las matrículas o los cursos publicados. Vuelve a cargar la página para reintentar.</div> : <>
      <div className="visitor-stat-grid" aria-label="Resumen de mis cursos">
        <div className="visitor-stat"><span className="visitor-stat-icon"><BookOpen size={24}/></span><div><span>MATRÍCULAS ACTIVAS</span><strong>{courses.length}</strong><small>Cursos publicados</small></div></div>
        <div className="visitor-stat"><span className="visitor-stat-icon"><GraduationCap size={24}/></span><div><span>COMO ESTUDIANTE</span><strong>{studentCount}</strong><small>En cursos</small></div></div>
        <div className="visitor-stat"><span className="visitor-stat-icon"><UserRoundCheck size={24}/></span><div><span>COMO PROFESOR</span><strong>{teacherCount}</strong><small>En cursos</small></div></div>
        <div className="visitor-stat"><span className="visitor-stat-icon"><Clock3 size={24}/></span><div><span>SOLICITUDES PENDIENTES</span><strong>{data.pendingCount}</strong><small>En cursos publicados</small></div></div>
      </div>
      <section aria-label="Listado de mis cursos">
        <div className="visitor-filterbar">
          <div role="group" aria-label="Filtrar mis cursos" className="visitor-tabs">
            <button type="button" aria-pressed={tab==="all"} className={tab==="all"?"visitor-tab-active":""} onClick={()=>setTab("all")}>Todos ({courses.length})</button>
            <button type="button" aria-pressed={tab==="progress"} className={tab==="progress"?"visitor-tab-active":""} onClick={()=>setTab("progress")}>En progreso ({inProgressCount})</button>
            <button type="button" aria-pressed={tab==="completed"} className={tab==="completed"?"visitor-tab-active":""} onClick={()=>setTab("completed")}>Completados ({completedCount})</button>
          </div>
          <label className="visitor-search"><Search size={20} aria-hidden="true"/><span className="sr-only">Buscar mis cursos</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar mis cursos..." maxLength={120}/></label>
        </div>
        <p className="visitor-filter-info">{filtered.length} {filtered.length===1?"curso":"cursos"} encontrados. El porcentaje representa bloques activos completados, no la calificación.</p>
        {filtered.length ? <div className="visitor-enrolled-list">{filtered.map(item=><CourseRow key={item.enrollmentId} item={item}/>)}</div> : <div className="visitor-empty">
          <BookOpen size={42} aria-hidden="true"/><h2>{courses.length===0?"Todavía no tienes cursos activos":"No hay cursos que coincidan"}</h2>
          <p>{courses.length===0?"Los cursos con matrícula aceptada y publicados aparecerán aquí. Puedes conocer los cursos disponibles mientras tanto.":"Prueba otro nombre o cambia el filtro para ver más resultados."}</p>
          {courses.length===0 && <Link className="visitor-primary-action" href="/campus/catalog">Ver cursos <ArrowRight size={16}/></Link>}
        </div>}
      </section>
    </>}
  </div>;
}
