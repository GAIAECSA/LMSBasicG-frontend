"use client";
import { ToastMessage } from '@/components/ui/notifications';

import { useEffect, useState } from "react";
import { ExternalLink, FileText, X } from "lucide-react";
import type { PolicyFormat } from "@/lib/policies/types";

export type PolicyDocument = {
  id:number;
  title:string;
  version:string;
  format?:PolicyFormat; // El historial de aceptaciones del backend no devuelve este campo.
};

/** Vista de solo lectura. HTML sanitizado por FastAPI y aislado mediante iframe sandbox.
 * PDF privado: el navegador consulta el BFF; jamás la ruta de archivos privados.
 */
function htmlFrame(html:string):string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"></head><body style="margin:0;padding:24px;color:#1c293b;font:15px/1.75 system-ui;overflow-wrap:anywhere">${html}</body></html>`;
}

export function PolicyViewer({document,onClose}:{document:PolicyDocument|null;onClose:()=>void}) {
  const [resolved,setResolved]=useState<PolicyFormat|null>(null);
  const [html,setHtml]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const versionId=document?.id,format=document?.format;
  useEffect(()=>{
    if (!versionId) return;
    const controller=new AbortController();
    // Si el formato es desconocido (acceptances/me), probar HTML y detectar 409 PDF.
    async function load() {
      setLoading(true);setError("");setHtml("");setResolved(null);
      if (format==="PDF") {setResolved("PDF");setLoading(false);return;}
      try {
        const response=await fetch(`/api/policies/versions/${versionId}/html`,{cache:"no-store",signal:controller.signal});
        if (response.status===409 && !format) {setResolved("PDF");return;}
        if (!response.ok) throw new Error("No fue posible leer esta versión. Tal vez tu sesión venció.");
        const value:unknown=await response.json();
        if (!value||typeof value!=="object"||typeof (value as {html?:unknown}).html!=="string") throw new Error("Documento inválido");
        if (!controller.signal.aborted) {setResolved("HTML");setHtml((value as {html:string}).html);}
      } catch(e) {
        if (!controller.signal.aborted) setError(e instanceof Error?e.message:"Error al abrir el documento");
      } finally {if(!controller.signal.aborted)setLoading(false);}
    }
    void load();
    return ()=>controller.abort();
  },[versionId,format]);
  useEffect(()=>{
    if (!document) return;
    const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[document,onClose]);
  if (!document) return null;
  const pdfUrl=`/api/policies/versions/${document.id}/pdf`;
  return <div className="lms-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section className="lms-modal lms-modal-large" role="dialog" aria-modal="true" aria-label={`Documento: ${document.title}`}>
      <header className="lms-modal-titlebar"><span className="lms-doc-icon"><FileText size={20}/></span>
        <span className="lms-modal-heading"><strong>{document.title}</strong><small>Versión {document.version} · Solo lectura</small></span>
        <button type="button" className="lms-icon-button" onClick={onClose} aria-label="Cerrar visor"><X size={21}/></button>
      </header>
      {loading?<div className="lms-document-loading">Cargando documento…</div>:
        error?<ToastMessage kind="error" message={error} />:
        resolved==="HTML"?<iframe className="lms-document-frame" title={document.title} sandbox="" referrerPolicy="no-referrer" srcDoc={htmlFrame(html)}/>:
        resolved==="PDF"?<><object className="lms-document-frame" data={pdfUrl} type="application/pdf" aria-label={document.title}>
          <p>El navegador no pudo mostrar el PDF. Puedes abrirlo en otra pestaña.</p>
        </object><a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="lms-pdf-open"><ExternalLink size={16}/> Abrir PDF en otra pestaña</a></>:
        <p className="lms-error">No se identificó el formato del documento.</p>}
    </section>
  </div>;
}
