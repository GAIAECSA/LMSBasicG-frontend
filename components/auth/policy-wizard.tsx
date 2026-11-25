"use client";
import { ToastMessage } from '@/components/ui/notifications';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import type { TenantPublic } from "@/lib/tenant/types";
import type { PendingPolicy } from "@/lib/auth/types";
import { SessionMonitor } from "./session-monitor";

/** Contenido HTML ya saneado por FastAPI; sandbox y CSP ofrecen una segunda barrera XSS. */
function isolatedPolicyHtml(html:string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"></head><body style="font:15px/1.75 system-ui;padding:20px;color:#182134;overflow-wrap:anywhere">${html}</body></html>`;
}

export function PolicyWizard({tenant,initialPending}: {tenant:TenantPublic;initialPending:PendingPolicy[]}) {
  const router=useRouter();
  const [pending,setPending]=useState(initialPending);
  const [html,setHtml]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [checked,setChecked]=useState(false);
  const [completed,setCompleted]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const current=pending[0];
  useEffect(()=>{
    if (!current) {router.replace("/campus");router.refresh();return;}
    setChecked(false);setHtml(null);setError("");
    if (current.content_format==="PDF") {setLoading(false);return;}
    const controller=new AbortController();setLoading(true);
    fetch(`/api/policies/versions/${current.version_id}/html`,{signal:controller.signal,cache:"no-store"})
      .then(async response=>{if(!response.ok)throw new Error("No fue posible cargar esta política");return response.json();})
      .then(value=>{if(!controller.signal.aborted)setHtml(typeof value.html==="string"?value.html:null);})
      .catch(()=>{if(!controller.signal.aborted)setError("No fue posible leer el documento. Recarga para reintentar.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[current?.version_id,current?.content_format,router]);

  async function accept() {
    if (!current||!checked||busy||loading||error) return;
    setBusy(true);setError("");
    try {
      const res=await fetch(`/api/policies/versions/${current.version_id}/accept`,{method:"POST",cache:"no-store"});
      const value=await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(value.message||"No se registró la aceptación");
      if (!Array.isArray(value.pending)) throw new Error("Respuesta inesperada");
      setCompleted(n=>n+1);
      setPending(value.pending);
      if (value.pending.length===0) {router.replace("/campus");router.refresh();}
    } catch(e) {setError(e instanceof Error?e.message:"No fue posible aceptar");}
    finally {setBusy(false);}
  }

  async function reject() {
    if (busy) return;
    setBusy(true);
    try {await fetch("/api/auth/logout",{method:"POST",cache:"no-store"});}
    finally {router.replace("/");router.refresh();}
  }

  if (!current) return <main className="auth-page">Preparando tu acceso…</main>;
  return <main className="policy-page"><SessionMonitor expiresAt={null}/>
    <section className="policy-card">
      <div className="auth-brand"><BrandLogo name={tenant.name} logoUrl={tenant.logoUrl}/><span>{tenant.name}</span></div>
      <p className="policy-step">Documento {completed+1} · {pending.length} pendiente(s)</p>
      <h1>{current.title}</h1>
      <p className="policy-subtitle">Versión {current.version} · {current.provider==="ATHENA"?"Política general del servicio":"Política de la academia"}. Debes revisarla antes de continuar.</p>
      {loading?<p>Obteniendo documento…</p>:current.content_format==="HTML"?
        html!==null?<iframe className="policy-document" title={current.title} sandbox="" referrerPolicy="no-referrer" srcDoc={isolatedPolicyHtml(html)}/>:null:
        <><object className="policy-document" type="application/pdf" data={`/api/policies/versions/${current.version_id}/pdf`} aria-label={current.title}>
          <p>Tu navegador no puede visualizar este PDF.</p></object>
          <a className="policy-pdf-link" href={`/api/policies/versions/${current.version_id}/pdf`} target="_blank" rel="noopener noreferrer">Abrir documento PDF en otra pestaña</a></>}
      {error&&<ToastMessage kind="error" message={error} />}
      <label className="policy-check"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} disabled={busy||loading||!!error}/>
        He leído la política y acepto esta versión.</label>
      <div className="policy-actions"><button type="button" className="button button-secondary" onClick={reject} disabled={busy}>No acepto, cerrar sesión</button>
        <button type="button" className="button button-primary" onClick={accept} disabled={!checked||busy||loading||!!error}>
          {busy?"Guardando…":pending.length===1?"Aceptar y acceder":"Aceptar y continuar"}</button></div>
    </section>
  </main>;
}
