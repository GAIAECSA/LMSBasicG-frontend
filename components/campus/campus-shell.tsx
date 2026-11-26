"use client";
/* eslint-disable @next/next/no-img-element -- Logo validado y publicado por el endpoint de tenant; evita optimización remota. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Award, BarChart3, BookOpen, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, FolderOpen, GraduationCap, House, Info, LogOut, Menu, Settings2, ShieldCheck, UsersRound, X } from "lucide-react";
import { workspaceItems, type CourseSection, type WorkspaceRole } from "@/lib/course-workspace/navigation";
import type { CourseCode } from "@/lib/academic/types";
import type { TenantPublic } from "@/lib/tenant/types";
import type { AuthUser } from "@/lib/auth/types";
import { isTenantAdmin } from "@/lib/policies/types";
import { SessionMonitor } from "@/components/auth/session-monitor";

/** Shell compartido de todos los roles. No concede permisos: todas las páginas y BFF
 * revalidan sesión, tenant, políticas y rol en el servidor. No se imprime ATHENA.
 */
type CourseWorkspaceNav = { id:number; name:string; code:CourseCode; role:WorkspaceRole };
const courseIcon: Record<CourseSection,typeof BookOpen> = {
  modules:BookOpen, attendance:CalendarDays, 'mdt-resources':FolderOpen,
  grades:ClipboardCheck, enrollments:UsersRound,
  certificates:Award, reports:BarChart3, settings:Settings2,
};
export function CampusShell({tenant,user,expiresAt,children,courseWorkspace}: {
  tenant:TenantPublic;user:AuthUser;expiresAt:string|null;children:ReactNode;
  courseWorkspace?:CourseWorkspaceNav;
}) {
  const router=useRouter(),pathname=usePathname();
  const menuRef=useRef<HTMLElement|null>(null);
  const admin=isTenantAdmin(user.role);
  const visitor=user.role.code==="VISITOR" && user.role.scope==="PLATFORM";
  const inPolicies=pathname==="/campus/policies";
  const inSettings=admin&&pathname==="/campus/settings";
  const inUsers=pathname==="/campus/users";
  const inCourses=pathname==="/campus/courses"||pathname==="/campus/categories"||pathname==="/campus/subcategories";
  const [expanded,setExpanded]=useState(inPolicies||inSettings);
  const [usersExpanded,setUsersExpanded]=useState(inUsers);
  const [coursesExpanded,setCoursesExpanded]=useState(inCourses);
  const [mobile,setMobile]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  // La preferencia visual se guarda por tenant; nunca se comparte identidad académica.
  useEffect(() => {
    try { setCollapsed(window.localStorage.getItem(`athena:sidebar:${tenant.id}`) === "collapsed"); }
    catch { /* Almacenamiento privado/restringido: funciona sin persistencia. */ }
  }, [tenant.id]);
  const [closing,setClosing]=useState(false);
  const policyHeading=admin?"Administración":"Información";
  const PersonIcon=admin?ShieldCheck:Info;
  const name=[user.firstname,user.lastname].filter(Boolean).join(" ")||user.username;
  const initial=(user.firstname?.[0]||user.username[0]||"U").toUpperCase()+
    (user.lastname?.[0]||"").toUpperCase();
  async function logout() {
    if (closing) return;
    setClosing(true);
    try {await fetch("/api/auth/logout",{method:"POST",cache:"no-store"});}
    finally {router.replace("/login");router.refresh();}
  }
  function closeMobile() {setMobile(false);}
  function toggleDesktop() {
    setCollapsed(value => {
      const next = !value;
      try {window.localStorage.setItem(`athena:sidebar:${tenant.id}`, next ? "collapsed" : "expanded");}
      catch { /* Preferencia opcional. */ }
      return next;
    });
    // Los submenús no ocupan espacio al colapsar; al reabrir se pueden desplegar.
    if (!collapsed) {setExpanded(false);setUsersExpanded(false);setCoursesExpanded(false);}
  }
  function openGroup(group:"policies"|"users"|"courses") {
    if (collapsed) {
      setCollapsed(false);
      try {window.localStorage.setItem(`athena:sidebar:${tenant.id}`, "expanded");} catch {}
    }
    if (group === "policies") setExpanded(value => !value);
    if (group === "users") setUsersExpanded(value => !value);
    if (group === "courses") setCoursesExpanded(value => !value);
  }
  // Si un enlace del curso se abre por URL directa o desde otra sección,
  // asegura que el elemento seleccionado sea visible dentro del menú desplazable.
  // Se ajusta SOLO scrollTop del menú; nunca se desplaza la página principal.
  useEffect(()=>{
    if(!courseWorkspace)return;
    const menu=menuRef.current;
    const current=menu?.querySelector<HTMLElement>('[aria-current="page"]');
    if(!menu||!current)return;
    const panel=menu.getBoundingClientRect(),item=current.getBoundingClientRect();
    if(item.bottom>panel.bottom)menu.scrollTop+=item.bottom-panel.bottom+8;
    else if(item.top<panel.top)menu.scrollTop-=panel.top-item.top+8;
  },[pathname,courseWorkspace?.id,courseWorkspace?.code,mobile]);
  return <div className={`lms-shell ${collapsed ? "lms-shell-collapsed" : ""}`}>
    <SessionMonitor expiresAt={expiresAt}/>
    <button type="button" className="lms-mobile-open" aria-label="Abrir menú" onClick={()=>setMobile(true)}><Menu size={22}/></button>
    {mobile&&<button aria-label="Cerrar menú" type="button" className="lms-sidebar-backdrop" onClick={closeMobile}/>}
    <aside id="athena-sidebar" className={`lms-sidebar ${courseWorkspace?"lms-sidebar-course ":""}${mobile?"lms-sidebar-open":""}`} aria-label="Menú del campus">
      <div className="lms-brand">
        <span className="lms-brand-mark">
          {tenant.logoUrl?<img alt="" src={tenant.logoUrl}/>:<GraduationCap size={26} aria-hidden="true"/>}
        </span>
        <div className="lms-brand-copy"><strong title={tenant.name}>{tenant.name}</strong><small>CAMPUS VIRTUAL</small></div>
        <button type="button" aria-label="Cerrar menú" className="lms-menu-close lms-menu-close-mobile" onClick={closeMobile}><ChevronLeft size={21}/></button>
        <button type="button" aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          aria-expanded={!collapsed} aria-controls="athena-sidebar" title={collapsed ? "Expandir menú" : "Contraer menú"}
          className="lms-menu-close lms-menu-close-desktop" onClick={toggleDesktop}>
          {collapsed ? <ChevronRight size={21}/> : <ChevronLeft size={21}/>}
        </button>
      </div>
      <nav className="lms-menu" ref={menuRef} tabIndex={courseWorkspace?0:undefined} aria-label={courseWorkspace?"Secciones del curso":"Módulos"}>
        {courseWorkspace ? <>
          <Link href={courseWorkspace.role==='ADMIN'?'/campus/courses':'/campus/my-courses'}
            className="lms-nav-item lms-course-back" title="Volver al listado de cursos" onClick={closeMobile}>
            <ArrowLeft size={20}/><span>{courseWorkspace.role==='ADMIN'?'Volver a administración':'Volver a mis cursos'}</span>
          </Link>
          <div className="lms-course-nav-heading" title={courseWorkspace.name}>
            <span className="lms-course-nav-label">CURSO {courseWorkspace.code}</span>
            <strong>{courseWorkspace.name}</strong>
          </div>
          {workspaceItems(courseWorkspace.code,courseWorkspace.role).map(item=>{
            const href=`/campus/courses/${courseWorkspace.id}/${item.section}`;
            const active=pathname===href;
            const Icon=courseIcon[item.section];
            return <Link key={item.section} href={href} onClick={closeMobile}
              className={`lms-nav-item ${active?'lms-nav-selected':''}`} title={item.label}
              aria-current={active?'page':undefined}>
              <Icon size={20}/><span>{item.label}</span>
            </Link>;
          })}
        </> : <>
        {!visitor && <Link href="/campus" onClick={closeMobile} title="Inicio" className={`lms-nav-item ${pathname==="/campus"?"lms-nav-selected":""}`}>
          <House size={20}/> <span>Inicio</span>
        </Link>}
        {visitor && <>
          <Link href="/campus/my-courses" onClick={closeMobile} className={`lms-nav-item ${pathname==="/campus/my-courses"?"lms-nav-selected":""}`}
            title="Mis cursos" aria-current={pathname==="/campus/my-courses"?"page":undefined}><GraduationCap size={20}/><span>Mis cursos</span></Link>
          <Link href="/campus/catalog" onClick={closeMobile} className={`lms-nav-item ${pathname==="/campus/catalog"?"lms-nav-selected":""}`}
            title="Cursos" aria-current={pathname==="/campus/catalog"?"page":undefined}><BookOpen size={20}/><span>Cursos</span></Link>
          <Link href="/campus/certificates" onClick={closeMobile} className={`lms-nav-item ${pathname==="/campus/certificates"?"lms-nav-selected":""}`}
            title="Certificados" aria-current={pathname==="/campus/certificates"?"page":undefined}><Award size={20}/><span>Certificados</span></Link>
        </>}
        {admin && <>
          <button type="button" className={`lms-nav-item ${usersExpanded || inUsers ? "lms-nav-selected" : ""}`}
            aria-expanded={usersExpanded} aria-controls="lms-users-submenu"
            onClick={() => openGroup("users")} title="Gestión de usuarios">
            <UsersRound size={20}/><span>Gestión de usuarios</span><ChevronDown size={17} className={usersExpanded ? "lms-chevron-open" : ""}/>
          </button>
          {usersExpanded && <div id="lms-users-submenu" className="lms-submenu">
            <Link href="/campus/users" onClick={closeMobile} className={inUsers ? "lms-submenu-active" : ""}
              aria-current={inUsers ? "page" : undefined}>Usuarios</Link>
          </div>}
        </>}
        {admin && <>
          <button type="button" className={`lms-nav-item ${coursesExpanded || inCourses ? "lms-nav-selected" : ""}`}
            aria-expanded={coursesExpanded} aria-controls="lms-courses-submenu"
            onClick={() => openGroup("courses")} title="Cursos">
            <BookOpen size={20}/><span>Cursos</span><ChevronDown size={17} className={coursesExpanded ? "lms-chevron-open" : ""}/>
          </button>
          {coursesExpanded && <div id="lms-courses-submenu" className="lms-submenu">
            {([['/campus/categories','Categorías'],['/campus/subcategories','Subcategorías'],['/campus/courses','Cursos']] as const).map(([href,label])=>{
              const active=href==='/campus/courses'?pathname.startsWith(href):pathname===href;
              return <Link key={href} href={href} onClick={closeMobile} className={active?'lms-submenu-active':''}
                aria-current={active?'page':undefined}>{label}</Link>;
            })}
          </div>}
        </>}
        <button type="button" className={`lms-nav-item ${expanded?"lms-nav-selected":""}`} aria-expanded={expanded}
          aria-controls="lms-policies-submenu" onClick={()=>openGroup("policies")} title={policyHeading}>
          <PersonIcon size={20}/><span>{policyHeading}</span><ChevronDown size={17} className={expanded?"lms-chevron-open":""}/>
        </button>
        {expanded&&<div id="lms-policies-submenu" className="lms-submenu">
          <Link href="/campus/policies" onClick={closeMobile} className={inPolicies?"lms-submenu-active":""} aria-current={inPolicies?"page":undefined}>Políticas</Link>
          {admin&&<Link href="/campus/settings" onClick={closeMobile} className={inSettings?"lms-submenu-active":""} aria-current={inSettings?"page":undefined}>Configuración</Link>}
        </div>}
        </>}
      </nav>
      <div className="lms-sidebar-bottom">
        <div className="lms-support" title="El módulo de soporte se implementará posteriormente"><CircleHelp size={19}/> Ayuda y soporte <span className="sr-only">(próximamente)</span></div>
        <div className="lms-account">
          <span className="lms-avatar">{initial}</span>
          <span className="lms-account-copy"><strong title={name}>{name}</strong><small>{admin?"Administrador":user.role.name||user.role.code}</small></span>
          <button onClick={logout} type="button" className="lms-account-logout" disabled={closing} aria-label="Cerrar sesión" title="Cerrar sesión">
            {closing?<X size={18}/>:<LogOut size={18}/>}</button>
        </div>
      </div>
    </aside>
    <main className="lms-main"><div className="lms-main-inner">{children}</div></main>
  </div>;
}
