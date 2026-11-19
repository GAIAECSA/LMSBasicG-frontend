"use client";
/* eslint-disable @next/next/no-img-element -- Logo validado y publicado por el endpoint de tenant; evita optimización remota. */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronDown, ChevronLeft, CircleHelp, GraduationCap,
  House, Info, LayoutGrid, LogOut, Menu, ShieldCheck, UsersRound, X } from "lucide-react";
import type { TenantPublic } from "@/lib/tenant/types";
import type { AuthUser } from "@/lib/auth/types";
import { isTenantAdmin } from "@/lib/policies/types";
import { SessionMonitor } from "@/components/auth/session-monitor";

/** Shell compartido de todos los roles. No concede permisos: todas las páginas y BFF
 * revalidan sesión, tenant, políticas y rol en el servidor. No se imprime ATHENA.
 */
export function CampusShell({tenant,user,expiresAt,children}: {
  tenant:TenantPublic;user:AuthUser;expiresAt:string|null;children:ReactNode;
}) {
  const router=useRouter(),pathname=usePathname();
  const admin=isTenantAdmin(user.role);
  const inPolicies=pathname==="/campus/policies";
  const [expanded,setExpanded]=useState(inPolicies);
  const [mobile,setMobile]=useState(false);
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
  return <div className="lms-shell">
    <SessionMonitor expiresAt={expiresAt}/>
    <button type="button" className="lms-mobile-open" aria-label="Abrir menú" onClick={()=>setMobile(true)}><Menu size={22}/></button>
    {mobile&&<button aria-label="Cerrar menú" type="button" className="lms-sidebar-backdrop" onClick={closeMobile}/>}
    <aside className={`lms-sidebar ${mobile?"lms-sidebar-open":""}`} aria-label="Menú del campus">
      <div className="lms-brand">
        <span className="lms-brand-mark">
          {tenant.logoUrl?<img alt="" src={tenant.logoUrl}/>:<GraduationCap size={26} aria-hidden="true"/>}
        </span>
        <div className="lms-brand-copy"><strong title={tenant.name}>{tenant.name}</strong><small>CAMPUS VIRTUAL</small></div>
        <button type="button" aria-label="Cerrar menú" className="lms-menu-close" onClick={closeMobile}><ChevronLeft size={21}/></button>
      </div>
      <nav className="lms-menu" aria-label="Módulos">
        <Link href="/campus" onClick={closeMobile} className={`lms-nav-item ${pathname==="/campus"?"lms-nav-selected":""}`}>
          <House size={20}/> <span>Inicio</span>
        </Link>
        <button type="button" className="lms-nav-item lms-nav-disabled" disabled title="Módulo pendiente de implementar">
          <UsersRound size={20}/><span>Gestión de usuarios</span><ChevronDown size={17}/>
        </button>
        <button type="button" className="lms-nav-item lms-nav-disabled" disabled title="Módulo pendiente de implementar">
          <BookOpen size={20}/><span>Cursos y contenidos</span><ChevronDown size={17}/>
        </button>
        <button type="button" className="lms-nav-item lms-nav-disabled" disabled title="Módulo pendiente de implementar">
          <LayoutGrid size={20}/><span>Matrículas y notas</span><ChevronDown size={17}/>
        </button>
        <button type="button" className={`lms-nav-item ${expanded?"lms-nav-selected":""}`} aria-expanded={expanded}
          aria-controls="lms-policies-submenu" onClick={()=>setExpanded(v=>!v)}>
          <PersonIcon size={20}/><span>{policyHeading}</span><ChevronDown size={17} className={expanded?"lms-chevron-open":""}/>
        </button>
        {expanded&&<div id="lms-policies-submenu" className="lms-submenu">
          <Link href="/campus/policies" onClick={closeMobile} className={inPolicies?"lms-submenu-active":""} aria-current={inPolicies?"page":undefined}>Políticas</Link>
        </div>}
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
