/* eslint-disable @next/next/no-img-element -- Imágenes públicas desde FastAPI sin optimizador remoto. */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, GraduationCap, Search, ShieldCheck } from "lucide-react";
import type { PublicCourse } from "@/lib/courses";
import type { TenantPublic } from "@/lib/tenant/types";
import { BrandLogo } from "@/components/ui/brand-logo";

function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/uploads/") || path.startsWith("/api/v1/")) return path;
  try {
    const url = new URL(path);
    // URLs externas explícitamente HTTPS; bloqueamos javascript:, data:, blob: y HTTP.
    return url.protocol === "https:" ? url.href : null;
  } catch { return null; }
}

function money(value: string | number | null | undefined, currency = "USD") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Consultar precio";
  try { return new Intl.NumberFormat("es-EC", { style: "currency", currency }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}

function priceLabel(course: PublicCourse) {
  if (course.is_free) return "Gratis";
  const price = Number(course.price);
  const discount = Number(course.discount_price);
  return money(course.discount_price !== null && discount >= 0 && discount < price ? discount : course.price, course.currency);
}

function textSearch(text: string) {
  return text.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function CoursePicture({ course, className = "" }: { course: PublicCourse; className?: string }) {
  const [broken, setBroken] = useState(false);
  const src = imageUrl(course.image_url);
  if (!src || broken) return <div className={`course-placeholder ${className}`}><GraduationCap size={54}/><span>Formación continua</span></div>;
  return <img className={`course-picture ${className}`} src={src} alt={`Portada de ${course.name}`} loading="lazy" onError={() => setBroken(true)}/>;
}

export function HomeClient({ tenant, courses, coursesStatus }: {
  tenant: TenantPublic; courses: PublicCourse[]; coursesStatus: "ok" | "unavailable";
}) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("TODOS");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const availableLevels = useMemo(() => Array.from(new Set(courses.map((course) => course.level).filter(Boolean))).sort(), [courses]);
  const filtered = useMemo(() => courses.filter(course =>
    (level === "TODOS" || course.level === level) &&
    textSearch(`${course.name} ${course.description ?? ""}`).includes(textSearch(search.trim())),
  ), [courses, level, search]);

  useEffect(() => {
    if (courses.length < 2) return;
    const interval = window.setInterval(() => setFeaturedIndex(index => (index + 1) % courses.length), 6500);
    return () => window.clearInterval(interval);
  }, [courses.length]);

  const featured = courses.length ? courses[featuredIndex % courses.length] : null;
  return <div className="public-app" id="inicio">
    <header className="site-header">
      <div className="container header-inner">
        <a href="#inicio" className="brand"><BrandLogo name={tenant.name} logoUrl={tenant.logoUrl}/><span className="brand-name">{tenant.name}</span></a>
        <nav aria-label="Navegación principal" className="header-nav"><a href="#cursos">Cursos</a><a href="#beneficios">El campus</a></nav>
        <Link href="/login" className="button button-primary login-header">Iniciar sesión <ArrowRight size={18}/></Link>
      </div>
    </header>

    <main>
      <section className="container hero" aria-label="Bienvenida">
        <div className="hero-content">
          <span className="eyebrow">{tenant.hero.eyebrow}</span>
          <h1>{tenant.hero.title}</h1>
          <p className="hero-description">{tenant.hero.description}</p>
          <div className="hero-actions"><a className="button button-primary big-button" href="#cursos">{tenant.hero.ctaText}<ArrowRight size={19}/></a><Link className="button button-secondary big-button" href="/login">Acceder al campus</Link></div>
          <p className="hero-footnote"><ShieldCheck size={19}/> Plataforma de aprendizaje de {tenant.name}</p>
        </div>
        <div className="hero-showcase">
          <div className="showcase-frame">
            {featured ? <>
              <CoursePicture key={featured.id} course={featured} className="featured-image"/>
              <span className="showcase-chip">Curso disponible</span>
              {courses.length > 1 && <div className="showcase-controls"><button type="button" aria-label="Curso anterior" onClick={() => setFeaturedIndex(i => (i + courses.length - 1) % courses.length)}><ChevronLeft size={20}/></button><button type="button" aria-label="Siguiente curso" onClick={() => setFeaturedIndex(i => (i + 1) % courses.length)}><ChevronRight size={20}/></button></div>}
              <div className="featured-card"><span className="featured-label">FORMACIÓN DISPONIBLE</span><h2>{featured.name}</h2><p>{featured.description || "Consulta los detalles del curso en nuestro campus."}</p><div className="featured-bottom"><div><span className="price-caption">INVERSIÓN</span><strong>{priceLabel(featured)}</strong></div><Link href="/login" className="button button-primary small-button">Acceder <ArrowRight size={16}/></Link></div></div>
            </> : <div className="showcase-empty"><div className="showcase-empty-icon"><BrandLogo name={tenant.name} logoUrl={tenant.logoUrl} large /></div><h2>Tu espacio para aprender</h2><p>{coursesStatus === "unavailable" ? "El catálogo no está disponible temporalmente." : "Próximamente encontrarás los cursos publicados de esta academia."}</p></div>}
          </div>
        </div>
      </section>

      <section id="beneficios" className="container benefit-grid" aria-label="Información del campus">
        <div className="benefit"><div className="benefit-icon"><BookOpen size={30}/></div><div><strong>{coursesStatus === "ok" ? courses.length : "—"} {courses.length === 1 ? "curso disponible" : "cursos disponibles"}</strong><p>Explora la oferta de formación actual.</p></div></div>
        <div className="benefit"><div className="benefit-icon"><Clock3 size={30}/></div><div><strong>Aprende a tu ritmo</strong><p>Consulta las actividades de tus cursos.</p></div></div>
        <div className="benefit"><div className="benefit-icon"><CalendarDays size={30}/></div><div><strong>Un campus digital</strong><p>Accede a tu espacio de aprendizaje.</p></div></div>
      </section>

      <section id="cursos" className="container catalog-section">
        <div className="catalog-heading"><div><span className="section-label">CATÁLOGO ACADÉMICO</span><h2>Cursos disponibles</h2><p>Encuentra la capacitación que necesitas en {tenant.name}.</p></div><div className="catalog-filters"><label className="search-input"><Search size={19}/><span className="sr-only">Buscar cursos</span><input type="search" placeholder="Buscar cursos..." value={search} onChange={event => setSearch(event.target.value)}/></label><label className="level-select"><span className="sr-only">Filtrar por nivel</span><select value={level} onChange={event=>setLevel(event.target.value)}><option value="TODOS">Todos los niveles</option>{availableLevels.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div></div>
        {coursesStatus === "unavailable" ? <div className="empty-state" role="status"><h3>El catálogo no está disponible</h3><p>Ocurrió un problema al consultar los cursos. Intenta cargar la página nuevamente.</p></div>
          : filtered.length === 0 ? <div className="empty-state"><h3>{courses.length ? "No se encontraron cursos" : "Todavía no hay cursos publicados"}</h3><p>{courses.length ? "Prueba otra búsqueda o nivel." : "Vuelve más tarde para consultar las novedades de esta academia."}</p></div>
          : <div className="course-grid">{filtered.map((course) => <article key={course.id} className="course-card"><div className="course-card-media"><CoursePicture course={course}/><span className="course-level">{course.level || "CURSO"}</span></div><div className="course-card-content"><h3>{course.name}</h3><p>{course.description || "Consulta los contenidos de este curso."}</p><div className="course-card-footer"><strong>{priceLabel(course)}</strong><Link href="/login" className="course-link">Acceder <ArrowRight size={16}/></Link></div></div></article>)}</div>}
      </section>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><span>© {new Date().getFullYear()} {tenant.name}</span><a href="#inicio">Volver al inicio ↑</a></div></footer>
  </div>;
}
