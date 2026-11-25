'use client';
import { notify } from '@/components/ui/notifications';
import { useEffect, useRef, useState } from 'react';
import { Code2, Eye, Bold, Italic, Underline, List, ListOrdered, Link2 } from 'lucide-react';
import { safeAcademicHtml } from '@/lib/course-modules/html';
import css from './course-modules.module.css';

export function CourseModuleHtmlEditor({value,onChange}:{value:string;onChange:(next:string)=>void}){
 const [mode,setMode]=useState<'visual'|'html'>('visual');const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(mode==='visual'&&ref.current&&ref.current.innerHTML!==safeAcademicHtml(value))ref.current.innerHTML=safeAcademicHtml(value);},[value,mode]);
 function command(cmd:string,argument?:string){ref.current?.focus();document.execCommand(cmd,false,argument);onChange(safeAcademicHtml(ref.current?.innerHTML||''));}
 function link(){const href=window.prompt('URL HTTPS del enlace');if(!href)return;try{if(new URL(href).protocol!=='https:')throw Error();command('createLink',href);}catch{notify('Introduce una URL https:// válida.','error');}}
 return <div className={css.stack}>
  <div className={css.tabs}><button className={mode==='visual'?css.selected:''} onClick={()=>{onChange(safeAcademicHtml(value));setMode('visual');}} type="button"><Eye size={14}/> Visual</button>
   <button type="button" className={mode==='html'?css.selected:''} onClick={()=>{onChange(safeAcademicHtml(ref.current?.innerHTML||value));setMode('html');}}><Code2 size={14}/> HTML</button></div>
  {mode==='visual'?<><div className={css.editorToolbar}>
   <button type="button" className={css.smallButton} onClick={()=>command('bold')} title="Negrita"><Bold size={15}/></button>
   <button type="button" className={css.smallButton} onClick={()=>command('italic')} title="Cursiva"><Italic size={15}/></button>
   <button type="button" className={css.smallButton} onClick={()=>command('underline')} title="Subrayado"><Underline size={15}/></button>
   <button type="button" className={css.smallButton} onClick={()=>command('insertUnorderedList')} title="Lista"><List size={15}/></button>
   <button type="button" className={css.smallButton} onClick={()=>command('insertOrderedList')} title="Lista numerada"><ListOrdered size={15}/></button>
   <button type="button" className={css.smallButton} onClick={()=>command('formatBlock','h2')} title="Título H2">H2</button>
   <button type="button" className={css.smallButton} onClick={()=>command('formatBlock','p')} title="Párrafo">P</button>
   <button type="button" className={css.smallButton} onClick={link} title="Enlace HTTPS"><Link2 size={15}/></button>
  </div><div ref={ref} className={css.htmlArea} contentEditable role="textbox" aria-multiline="true" aria-label="Editor de contenido enriquecido"
   onInput={e=>onChange(safeAcademicHtml(e.currentTarget.innerHTML))} onPaste={e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));}} suppressContentEditableWarning/></>:
   <textarea className={css.textarea} spellCheck={false} aria-label="Código HTML" style={{minHeight:260,fontFamily:'monospace'}} value={value} onChange={e=>onChange(e.target.value)} />}
  <small className={css.info}>Se admiten formatos HTML seguros con estilos inline. Los scripts, iframes y eventos HTML se eliminan antes de guardar.</small>
 </div>;
}
