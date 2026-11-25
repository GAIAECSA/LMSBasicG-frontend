"use client";
import { ToastMessage } from '@/components/ui/notifications';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Clock3, FileText, Info, ShieldCheck } from "lucide-react";
import { localDate } from "@/lib/policies/types";
import type { CurrentPolicy, StudentPolicyCatalog } from "@/lib/policies/types";
import { PolicyViewer, type PolicyDocument } from "./policy-viewer";

/** Información para estudiantes/usuarios no ADMIN: solo documentos vigentes visibles
 * y última aceptación histórica de tipos que ya no están vigentes. Nunca usa /admin.
 */
export function MyPolicies() {
  const router=useRouter();
  const [catalog,setCatalog]=useState<StudentPolicyCatalog|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [viewer,setViewer]=useState<PolicyDocument|null>(null);
  const load=useCallback(async()=>{
    const response=await fetch("/api/policies/catalog",{cache:"no-store"});
    if(response.status===401){router.replace("/login");return;}
    if(response.status===428){router.replace("/policies");return;}
    if(!response.ok)throw new Error("No se pudieron consultar tus políticas.");
    const data:StudentPolicyCatalog=await response.json();
    if(!Array.isArray(data.current)||!Array.isArray(data.history))throw new Error("Respuesta del backend inválida");
    setCatalog(data);
  },[router]);
  useEffect(()=>{
    let mounted=true;
    void load().catch(e=>{if(mounted)setError(e instanceof Error?e.message:"Error inesperado");})
      .finally(()=>{if(mounted)setLoading(false);});
    return ()=>{mounted=false;};
  },[load]);
  const historicOnly=useMemo(()=>{
    if(!catalog)return [];
    const visible=new Set(catalog.current.map(p=>p.code.toLowerCase()));
    const newest=new Map<string,(typeof catalog.history)[number]>();
    for(const h of [...catalog.history].sort((a,b)=>Date.parse(b.accepted_at)-Date.parse(a.accepted_at))){
      const key=h.code.toLowerCase();
      if(!visible.has(key)&&!newest.has(key))newest.set(key,h);
    }
    return Array.from(newest.values());
  },[catalog]);
  return <section className="lms-policies-page">
    <div className="lms-page-heading"><div><p className="lms-eyebrow"><Info size={15}/> INFORMACIÓN</p>
      <h1>Políticas</h1><p>Consulta las políticas vigentes de tu academia y de la plataforma. También puedes ver tu última aceptación histórica.</p></div></div>
    {loading?<div className="lms-loading-card">Cargando políticas disponibles…</div>:
      error?<ToastMessage kind="error" message={error}><button type="button" onClick={()=>{setError("");void load().catch(()=>setError("No fue posible conectar."));}}>Reintentar</button></ToastMessage>:
      catalog&&catalog.current.length===0&&historicOnly.length===0?<div className="lms-empty-card"><BookOpen size={35}/>
        <h2>No hay políticas disponibles</h2><p>Cuando se publiquen, podrás consultarlas desde aquí.</p></div>:
      <div className="lms-policy-grid">
        {catalog?.current.map(p=><CurrentPolicyCard key={`${p.provider}:${p.code}`} policy={p} onView={setViewer}/>)}
        {historicOnly.map(h=><article key={h.code} className="lms-policy-tile">
          <div className="lms-policy-tile-top"><span className="lms-tile-icon"><FileText size={21}/></span>
            <span className="lms-status-pill lms-status-neutral">Aceptación histórica</span></div>
          <h2>{h.title}</h2><p className="lms-policy-code">{h.provider==="ATHENA"?"Plataforma":"Academia"} · {h.code}</p>
          <div className="lms-policy-facts"><span>Última versión que aceptaste: {h.version}</span></div>
          <p className="lms-muted">Aceptada el {localDate(h.accepted_at)}. Esta política ya no figura entre las vigentes.</p>
          <button type="button" className="lms-outline-button lms-single-button" onClick={()=>setViewer({id:h.version_id,title:h.title,version:h.version})}>
            <FileText size={16}/> Ver versión aceptada</button>
        </article>)}
      </div>}
    <PolicyViewer document={viewer} onClose={()=>setViewer(null)}/>
  </section>;
}

function CurrentPolicyCard({policy,onView}:{policy:CurrentPolicy;onView:(v:PolicyDocument)=>void}) {
  const informative=!policy.mandatory;
  return <article className="lms-policy-tile">
    <div className="lms-policy-tile-top"><span className="lms-tile-icon">{informative?<Info size={21}/>:<ShieldCheck size={21}/>}</span>
      <span className={`lms-status-pill ${informative?"lms-status-neutral":"lms-status-live"}`}>
        {informative?"Informativa":policy.accepted?"Aceptada":"Pendiente"}</span></div>
    <h2>{policy.title}</h2><p className="lms-policy-code">{policy.provider==="ATHENA"?"Plataforma":"Academia"} · {policy.code}</p>
    <div className="lms-policy-facts"><span>Versión vigente {policy.version}</span><span>{policy.content_format}</span></div>
    {informative?<p className="lms-muted"><Info size={15}/> Solo lectura; no requiere aceptación.</p>:
      policy.accepted_at?<p className="lms-muted"><CheckCircle2 size={15}/> Aceptada el {localDate(policy.accepted_at)}</p>:
      <p className="lms-muted"><Clock3 size={15}/> Debes aceptar esta versión antes de acceder a otros módulos.</p>}
    <button type="button" className="lms-outline-button lms-single-button" onClick={()=>onView({id:policy.version_id,title:policy.title,
        version:policy.version,format:policy.content_format})}><FileText size={16}/> Ver contenido</button>
  </article>;
}
