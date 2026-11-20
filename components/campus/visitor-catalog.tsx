"use client";

import { useMemo, useState } from "react";
import { BookOpen, Clock3, GraduationCap, Search, Sparkles, Tag } from "lucide-react";
import type { PublicCourse } from "@/lib/courses";
import { CourseCover } from "./course-cover";

function normalize(value:string){return value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();}
function money(amount:number,currency:string){
  try {return new Intl.NumberFormat("es-EC",{style:"currency",currency,minimumFractionDigits:2}).format(amount);}
  catch{return `${currency} ${amount.toFixed(2)}`;}
}
function price(course:PublicCourse){
  if(course.is_free)return {main:"Gratis",old:null};
  const base=Number(course.price);
  const discount=course.discount_price===null?null:Number(course.discount_price);
  const reduced=discount!==null&&Number.isFinite(discount)&&discount>=0&&discount<base;
  return {main:money(reduced?discount:base,course.currency),old:reduced?money(base,course.currency):null};
}

function PublicCourseCard({course}:{course:PublicCourse}) {
  const priceInfo=price(course);
  return <article className="visitor-catalog-card">
    <div className="visitor-catalog-cover">
      <CourseCover courseId={course.id} imageUrl={course.image_url} alt={`Portada de ${course.name}`} size={56}/>
      <span className="visitor-cover-level">{course.level.toLowerCase()}</span>
    </div>
    <div className="visitor-catalog-body">
      <div className="visitor-catalog-meta"><span><GraduationCap size={15}/> Curso de formación</span>{course.duration_hours>0&&<span><Clock3 size={15}/> {course.duration_hours} h</span>}</div>
      <h2>{course.name}</h2>
      <p className="visitor-catalog-description">{course.description}</p>
      <div className="visitor-catalog-price"><span>PRECIO</span><div><strong>{priceInfo.main}</strong>{priceInfo.old&&<s>{priceInfo.old}</s>}</div></div>
      <div className="visitor-catalog-foot"><BookOpen size={17}/><span>Disponible en el catálogo de la academia</span></div>
    </div>
  </article>;
}

export function VisitorCatalog({courses,status}:{courses:PublicCourse[];status:"ok"|"unavailable"}) {
  const [search,setSearch]=useState("");
  const [level,setLevel]=useState("TODOS");
  const levels=useMemo(()=>[...new Set(courses.map(course=>course.level).filter(Boolean))].sort(),[courses]);
  const shown=useMemo(()=>courses.filter(course=>
    (level==="TODOS"||course.level===level) && normalize(`${course.name} ${course.description}`).includes(normalize(search))
  ),[courses,level,search]);
  return <div className="visitor-page">
    <header className="visitor-catalog-hero">
      <div className="visitor-catalog-hero-copy">
        <p className="visitor-hero-eyebrow"><Sparkles size={16}/> DESCUBRE Y APRENDE</p>
        <h1>Explora nuestros <span>cursos</span></h1>
        <p>Conoce los cursos publicados por tu academia. Descubre nuevas oportunidades de aprendizaje a tu ritmo.</p>
        <span className="visitor-hero-note"><BookOpen size={17}/> Catálogo informativo · Inscripciones próximamente</span>
      </div>
      <div className="visitor-hero-decoration" aria-hidden="true"><GraduationCap size={100}/><span/></div>
    </header>
    <section className="visitor-catalog-section" aria-labelledby="visitor-catalog-title">
      <div className="visitor-catalog-topline"><div><p className="lms-eyebrow"><Tag size={14}/> OFERTA ACADÉMICA</p><h2 id="visitor-catalog-title">Cursos disponibles</h2><p>Solo se muestran cursos publicados.</p></div>
        <span className="visitor-total-count">{courses.length} {courses.length===1?"curso":"cursos"}</span>
      </div>
      {status==="unavailable"?<div className="lms-error" role="alert">No fue posible cargar el catálogo en este momento. Vuelve a cargar la página para reintentar.</div>:<>
        <div className="visitor-filterbar visitor-catalog-filters">
          <label className="visitor-search"><Search size={20} aria-hidden="true"/><span className="sr-only">Buscar en el catálogo</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cursos por nombre o descripción..." maxLength={120}/></label>
          <label className="visitor-level-filter"><span>Nivel</span><select value={level} onChange={e=>setLevel(e.target.value)}><option value="TODOS">Todos los niveles</option>{levels.map(item=><option key={item} value={item}>{item.charAt(0)+item.slice(1).toLowerCase()}</option>)}</select></label>
        </div>
        {shown.length?<div className="visitor-catalog-grid">{shown.map(course=><PublicCourseCard key={course.id} course={course}/>)}</div>:<div className="visitor-empty">
          <Search size={42} aria-hidden="true"/><h3>{courses.length?"No encontramos cursos con esos filtros":"Todavía no hay cursos publicados"}</h3>
          <p>{courses.length?"Prueba con otra palabra o selecciona todos los niveles.":"Cuando la academia publique cursos, los encontrarás aquí."}</p>
        </div>}
      </>}
    </section>
  </div>;
}
