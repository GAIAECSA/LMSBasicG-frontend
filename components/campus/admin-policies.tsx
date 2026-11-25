"use client";
import { ToastMessage } from '@/components/ui/notifications';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Clock3, FilePlus2, FileText, History, Plus, ShieldCheck, Upload, X } from "lucide-react";
import { currentVersion, localDate } from "@/lib/policies/types";
import type { AdminPolicy, PolicyFormat, PolicyVersion } from "@/lib/policies/types";
import { PolicyViewer, type PolicyDocument } from "./policy-viewer";

type EditorMode = {kind:"new"}|{kind:"version";policy:AdminPolicy};

/** Administración CLIENT-only. El frontend NO expone PATCH/DELETE/cancel ni acepta business_id.
 * Cuando un POST crea una obligatoriedad nueva, el backend puede responder 428 después:
 * conducimos al wizard antes de volver a consultar el catálogo.
 */
export function AdminPolicies() {
  const router=useRouter();
  const [policies,setPolicies]=useState<AdminPolicy[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [editor,setEditor]=useState<EditorMode|null>(null);
  const [viewer,setViewer]=useState<PolicyDocument|null>(null);
  const [expanded,setExpanded]=useState<number[]>([]);
  const load=useCallback(async()=>{
    const response=await fetch("/api/policies/admin/catalog",{cache:"no-store"});
    if (response.status===401) {router.replace("/login");return false;}
    if (response.status===428) {router.replace("/policies");return false;}
    const body:unknown=await response.json().catch(()=>null);
    if (!response.ok || !body || typeof body!=="object" || !Array.isArray((body as {policies?:unknown}).policies))
      throw new Error("No fue posible cargar las políticas de tu academia.");
    setPolicies((body as {policies:AdminPolicy[]}).policies);
    return true;
  },[router]);
  useEffect(()=>{
    let active=true;
    void load().catch(()=>{if(active)setError("No se pudo cargar el catálogo de políticas.");})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[load]);
  const total=policies.reduce((n,p)=>n+p.versions.length,0);
  async function afterPublish() {
    setEditor(null);
    // Un nuevo documento obligatorio puede provocar el gate 428 para el propio ADMIN.
    const session=await fetch("/api/auth/session",{cache:"no-store"});
    if (session.status===401) {router.replace("/login");return;}
    if (session.ok) {
      const state=await session.json();
      if (state.status==="pending") {router.replace("/policies");router.refresh();return;}
    }
    setError("");
    try {await load();} catch {setError("La publicación se completó, pero no fue posible actualizar el listado.");}
  }
  return <section className="lms-policies-page">
    <div className="lms-page-heading">
      <div><p className="lms-eyebrow"><ShieldCheck size={15}/> ADMINISTRACIÓN</p>
        <h1>Políticas</h1><p>Gestiona los tipos y las versiones de las políticas de tu academia. Las versiones publicadas son inmutables.</p></div>
      <button className="button button-primary lms-upload-button" type="button" onClick={()=>setEditor({kind:"new"})}>
        <Plus size={18}/> Subir política</button>
    </div>
    <div className="lms-stat-row"><span><strong>{policies.length}</strong> tipos de políticas</span><span><strong>{total}</strong> versiones registradas</span>
      <span><ShieldCheck size={17}/> Solo políticas de tu academia</span></div>
    {error&&<ToastMessage kind="error" message={error}><button type="button" onClick={()=>{setError("");void load().catch(()=>setError("Sigue sin haber conexión con el backend."));}}>Reintentar</button></ToastMessage>}
    {loading?<div className="lms-loading-card">Cargando políticas…</div>:
      policies.length===0?<div className="lms-empty-card"><BookOpen size={35}/><h2>No hay políticas de tu academia</h2>
        <p>Registra la primera política en HTML o PDF. Las políticas globales de la plataforma no se administran aquí.</p>
        <button className="button button-primary" onClick={()=>setEditor({kind:"new"})}>Subir primera política</button></div>:
      <div className="lms-policy-grid">
        {policies.map(p=>{
          const current=p.is_active?currentVersion(p.versions):undefined;
          const sorted=[...p.versions].sort((a,b)=>Date.parse(b.effective_at)-Date.parse(a.effective_at)||b.id-a.id);
          const isExpanded=expanded.includes(p.id);
          return <article className="lms-policy-tile" key={p.id}>
            <div className="lms-policy-tile-top"><span className="lms-tile-icon"><FileText size={21}/></span>
              <span className={`lms-status-pill ${p.is_active&&current?"lms-status-live":"lms-status-neutral"}`}>
                {p.is_active&&current?"Vigente":p.is_active?"Sin versión vigente":"Desactivada"}</span></div>
            <h2>{p.title}</h2><p className="lms-policy-code">{p.code}</p>
            <div className="lms-policy-facts"><span>{p.mandatory?"Aceptación obligatoria":"Solo informativa"}</span>
              <span>{p.versions.length} {p.versions.length===1?"versión":"versiones"}</span></div>
            {current?<div className="lms-current-version"><strong>Versión actual: {current.version}</strong><small>Vigente desde {localDate(current.effective_at)}</small>
                <button type="button" className="lms-text-button" onClick={()=>setViewer(versionDocument(current))}>Ver contenido actual</button></div>:
                <div className="lms-current-version"><strong>Sin documento vigente</strong><small>Se puede publicar una nueva versión.</small></div>}
            <div className="lms-tile-actions">
              <button type="button" className="lms-outline-button" onClick={()=>setExpanded(prev=>prev.includes(p.id)?prev.filter(x=>x!==p.id):[...prev,p.id])} aria-expanded={isExpanded}>
                <History size={17}/> {isExpanded?"Ocultar historial":"Ver historial"}</button>
              {p.is_active&&<button type="button" className="lms-solid-small" onClick={()=>setEditor({kind:"version",policy:p})}><Upload size={16}/> Nueva versión</button>}
            </div>
            {isExpanded&&<div className="lms-history"><h3>Versiones publicadas</h3>
              {sorted.length?sorted.map(v=><div className="lms-history-item" key={v.id}>
                <span className="lms-history-bullet"><Clock3 size={14}/></span>
                <div className="lms-history-main"><strong>Versión {v.version}</strong><small>{localDate(v.effective_at)}</small>
                  <span className="lms-history-status">{!v.is_published?"Cancelada":
                    current?.id===v.id && p.is_active?"Vigente":Date.parse(v.effective_at)>Date.now()?"Programada":"Histórica"} · {v.content_format}</span></div>
                <button type="button" onClick={()=>setViewer(versionDocument(v))} className="lms-text-button">Ver</button>
              </div>):<p className="lms-muted">Todavía no hay versiones publicadas.</p>}</div>}
          </article>;
        })}
      </div>}
    {editor&&<PolicyUploadDialog editor={editor} onClose={()=>setEditor(null)} onSuccess={afterPublish} onPartial={async()=>{
      try {await load();} catch {}
    }}/>} 
    <PolicyViewer document={viewer} onClose={()=>setViewer(null)}/>
  </section>;
}
function versionDocument(v:PolicyVersion):PolicyDocument {return {id:v.id,title:v.title,version:v.version,format:v.content_format};}

function PolicyUploadDialog({editor,onClose,onSuccess,onPartial}: {
  editor:EditorMode;onClose:()=>void;onSuccess:()=>Promise<void>;onPartial:()=>Promise<void>;
}) {
  const [code,setCode]=useState("");
  const [title,setTitle]=useState("");
  const [mandatory,setMandatory]=useState(true);
  const [version,setVersion]=useState("1.0");
  const [format,setFormat]=useState<PolicyFormat>("HTML");
  const [html,setHtml]=useState("<h2>Política</h2>\n<p>Escribe aquí el contenido de esta política.</p>");
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [created,setCreated]=useState<number|null>(null);
  const newType=editor.kind==="new";
  const targetTitle=editor.kind==="version"?editor.policy.title:title;
  const canPublish=useMemo(()=>version.trim().length>0 && version.length<=50 &&
    (format==="HTML"?html.trim().length>0:!!file&&file.size<=25*1024*1024),[version,format,html,file]);
  async function submit(e:FormEvent) {
    e.preventDefault(); if(busy||!canPublish)return;
    setBusy(true);setError("");
    let id=editor.kind==="version"?editor.policy.id:created;
    try {
      if (id===null) {
        const res=await fetch("/api/policies/admin",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({code:code.trim(),title:title.trim(),mandatory})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok)throw new Error(data.message||"No se pudo crear el tipo de política");
        if(!Number.isSafeInteger(data.id))throw new Error("El backend no confirmó el tipo de política");
        id=data.id;setCreated(data.id);
      }
      const url=`/api/policies/admin/${id}/versions/${format.toLowerCase()}`;
      let res:Response;
      if(format==="HTML")res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({version:version.trim(),html_content:html})});
      else {
        const form=new FormData();form.set("version",version.trim());form.set("file",file as File);
        res=await fetch(url,{method:"POST",body:form});
      }
      const body=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(body.message||"No fue posible publicar la versión");
      await onSuccess();
    } catch(e) {
      const detail=e instanceof Error?e.message:"No se pudo completar la publicación";
      setError(created!==null||newType&&id!==null?`El tipo fue registrado, pero su versión no se publicó. Puedes reintentar aquí. ${detail}`:detail);
      if (newType&&id!==null) void onPartial();
    } finally {setBusy(false);}
  }
  return <div className="lms-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
    <section role="dialog" aria-modal="true" aria-label={newType?"Subir nueva política":"Subir nueva versión"} className="lms-modal lms-editor-modal">
      <header className="lms-modal-titlebar"><span className="lms-doc-icon"><FilePlus2 size={21}/></span>
        <span className="lms-modal-heading"><strong>{newType?"Subir política":"Nueva versión"}</strong>
          <small>{newType?"Se registrará un tipo y su primera versión":"La versión anterior permanecerá en el historial"}</small></span>
        <button type="button" className="lms-icon-button" onClick={onClose} disabled={busy} aria-label="Cerrar"><X size={20}/></button>
      </header>
      <form onSubmit={submit} className="lms-editor-form">
        {newType?<><div className="lms-form-row"><label>Identificador del tipo
            <input value={code} onChange={e=>setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,""))}
              disabled={busy||created!==null} required minLength={2} maxLength={100} placeholder="ej. normas_de_uso" pattern="[a-z0-9][a-z0-9_-]{1,99}"/>
          </label><label>Título de la política
            <input value={title} onChange={e=>setTitle(e.target.value)} disabled={busy||created!==null} required maxLength={255} placeholder="Normas de uso del campus"/>
          </label></div><label className="lms-switch-label"><input type="checkbox" checked={mandatory} onChange={e=>setMandatory(e.target.checked)} disabled={busy||created!==null}/>
            <span>Exigir aceptación a los usuarios <small>Si se desmarca, será informativa y solo de lectura.</small></span></label></>:
          <p className="lms-editor-target"><ShieldCheck size={16}/> {targetTitle} <span>({editor.policy.code})</span></p>}
        <div className="lms-form-row"><label>Versión
          <input required value={version} onChange={e=>setVersion(e.target.value)} maxLength={50} disabled={busy} placeholder="Ej. 1.0, 1.1"/>
        </label><label>Formato de documento
          <select value={format} onChange={e=>setFormat(e.target.value as PolicyFormat)} disabled={busy}>
            <option value="HTML">HTML</option><option value="PDF">PDF</option>
          </select></label></div>
        {format==="HTML"?<label>Contenido HTML
          <textarea required rows={11} value={html} onChange={e=>setHtml(e.target.value)} disabled={busy}
            placeholder="<h2>Política</h2><p>Contenido...</p>"/>
          <small>Admite etiquetas básicas, listas y tablas. El backend elimina código y atributos peligrosos. Máximo 256 KiB.</small>
        </label>:<label>Documento PDF
          <input type="file" accept=".pdf,application/pdf" onChange={e=>setFile(e.target.files?.[0]??null)} disabled={busy} required/>
          <small>Máximo 25 MiB. El archivo se almacena de forma privada en FastAPI.</small></label>}
        {error&&<ToastMessage kind="error" message={error} />}
        <p className="lms-publish-help"><CheckCircle2 size={16}/> Al publicar, esta versión entra en vigor de inmediato; las anteriores se conservan y no se pueden editar ni eliminar.</p>
        <div className="lms-editor-actions"><button type="button" className="lms-outline-button" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="button button-primary" type="submit" disabled={busy||!canPublish||newType&&created===null&&(!code||!title.trim())}>
            <Upload size={17}/>{busy?"Publicando…":"Publicar versión"}</button></div>
      </form>
    </section>
  </div>;
}
