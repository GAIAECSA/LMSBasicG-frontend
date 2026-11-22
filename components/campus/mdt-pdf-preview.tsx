'use client';
import {useEffect,useRef} from 'react';
import {Download,ExternalLink,FileText,X} from 'lucide-react';

/** Previsualización privada por iframe: el navegador solo ve un endpoint BFF
 * same-origin con cookie HttpOnly. No lee JWT ni direcciones uploads_private.
 * El backend controla tenant, curso, matrícula y acceso sobre cada GET.
 */
export function MdtPdfPreview({title,filename,previewUrl,downloadUrl,onClose}:{
  title:string;filename:string;previewUrl:string;downloadUrl:string;onClose:()=>void;
}){
  const dialogRef=useRef<HTMLElement|null>(null);
  const onCloseRef=useRef(onClose);
  useEffect(()=>{onCloseRef.current=onClose;},[onClose]);
  useEffect(()=>{
    const previouslyFocused=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const closeButton=dialogRef.current?.querySelector<HTMLButtonElement>('[data-mdt-close]');
    closeButton?.focus();
    function onKeyDown(event:KeyboardEvent){
      if(event.key==='Escape'){event.preventDefault();onCloseRef.current();return;}
      if(event.key!=='Tab'||!dialogRef.current)return;
      const candidates=Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],iframe[title]'));
      const first=candidates[0],last=candidates[candidates.length-1];
      if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener('keydown',onKeyDown);
    return ()=>{document.removeEventListener('keydown',onKeyDown);previouslyFocused?.focus();};
  },[]);
  return <div className="lms-modal-backdrop mdt-preview-backdrop" role="presentation"
    onMouseDown={event=>{if(event.currentTarget===event.target)onClose();}}>
    <section ref={dialogRef} className="lms-modal mdt-preview-dialog" role="dialog" aria-modal="true"
      aria-labelledby="mdt-preview-title" aria-describedby="mdt-preview-description">
      <header className="mdt-preview-header">
        <div className="mdt-preview-heading"><FileText size={22} aria-hidden="true"/>
          <div><h2 id="mdt-preview-title">{title}</h2>
            <p id="mdt-preview-description" title={filename}>{filename}</p></div></div>
        <button type="button" data-mdt-close className="mdt-icon-button" onClick={onClose} aria-label="Cerrar visor PDF">
          <X size={20}/></button>
      </header>
      <div className="mdt-preview-frame-wrap">
        <iframe className="mdt-preview-frame" title={`Vista previa PDF: ${filename}`}
          src={previewUrl} referrerPolicy="no-referrer" loading="eager"/>
      </div>
      <footer className="mdt-preview-footer">
        <p>Vista previa protegida. Si tu navegador no muestra el PDF, ábrelo en otra pestaña.</p>
        <div className="mdt-preview-actions">
          <a className="lms-outline-button" href={previewUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} aria-hidden="true"/> Abrir en otra pestaña</a>
          <a className="button button-primary" href={downloadUrl}>
            <Download size={16} aria-hidden="true"/> Descargar PDF</a>
        </div>
      </footer>
    </section>
  </div>;
}
