'use client';
import {useEffect,useRef} from 'react';
import {Download,ExternalLink,FileText,X} from 'lucide-react';
import css from './course-certificates.module.css';

/** Visor protegido. Acepta únicamente URL BFF same-origin o blob efímero
 * creado por la vista previa local de plantilla (sin persistencia). */
export function CertificatePdfViewer({title,previewUrl,downloadUrl,onClose,temporary=false}:{
  title:string;previewUrl:string;downloadUrl?:string;onClose:()=>void;temporary?:boolean;
}){
  const closeRef=useRef(onClose);
  const node=useRef<HTMLElement>(null);
  useEffect(()=>{closeRef.current=onClose;},[onClose]);
  useEffect(()=>{
    const prior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    node.current?.querySelector<HTMLButtonElement>('[data-close]')?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();closeRef.current();}
      if(event.key==='Tab'&&node.current){
        const elements=Array.from(node.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],iframe'));
        const first=elements.at(0),last=elements.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);prior?.focus();};
  },[]);
  return <div className="lms-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section ref={node} className={`${css.pdfDialog} lms-modal`} role="dialog" aria-modal="true" aria-labelledby="cert-pdf-title">
      <header className={css.pdfHeader}>
        <div><h2 id="cert-pdf-title"><FileText size={21} aria-hidden="true"/> {title}</h2>
          <p>{temporary?'Documento de prueba: no emitido, no almacenado y sin validez.':'Vista privada. Solo usuarios autorizados.'}</p></div>
        <button type="button" className={css.iconButton} data-close onClick={onClose} aria-label="Cerrar visor PDF"><X size={20}/></button>
      </header>
      <iframe title={title} src={previewUrl} className={css.pdfFrame} referrerPolicy="no-referrer"/>
      <footer className={css.pdfFooter}>
        <span>Si no puedes visualizarlo, utiliza «Abrir en otra pestaña».</span>
        <div className={css.actions}>
          <a className="lms-outline-button" target="_blank" rel="noopener noreferrer" href={previewUrl}><ExternalLink size={16}/> Abrir en otra pestaña</a>
          {downloadUrl&&<a className="button button-primary" href={downloadUrl}><Download size={16}/> Descargar PDF</a>}
        </div>
      </footer>
    </section>
  </div>;
}
