'use client';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { parseDuplicateInput } from '@/lib/academic/course-duplicate';
import { parseCourse,type ManagedCourse } from '@/lib/academic/types';
import { apiErrorMessage,requestJson } from '@/lib/academic/client';
import { notify } from '@/components/ui/notifications';

export function CourseDuplicateDialog({course,onClose,onCheck}:{course:ManagedCourse;onClose:()=>void;onCheck:()=>Promise<void>}){
 const router=useRouter(),dialog=useRef<HTMLDialogElement>(null),lock=useRef(false);
 const [name,setName]=useState(()=>`${[...course.name].slice(0,239).join('')} - Nueva edición`);
 const [start,setStart]=useState(''),[end,setEnd]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[uncertain,setUncertain]=useState(false);
 useEffect(()=>{const node=dialog.current;if(node&&!node.open)node.showModal();return()=>{node?.close();};},[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(lock.current||uncertain)return;
  const input=parseDuplicateInput({name,init_date:start||null,finish_date:end||null});
  if(!input){setError('Introduce un nombre válido y revisa las fechas.');return;}
  lock.current=true;setBusy(true);setError('');
  try {
   // No cancelar ni repetir la operación: el servidor podría confirmar tras una desconexión.
   const response=await fetch(`/api/academic/courses/${course.id}/duplicate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'});
   if(!response.ok){
    let message=`No se pudo confirmar la copia (HTTP ${response.status})`;
    try{const data=await response.json();if(typeof data?.message==='string')message=data.message;}catch{}
    if(response.status>=500||response.status===408)setUncertain(true);
    throw Error(message);
   }
   const copied=parseCourse(await response.json());
   if(!copied||copied.id===course.id||copied.is_published||copied.open_enrollment||copied.total_students!==0||copied.name!==input.name){setUncertain(true);throw Error('Respuesta inesperada al confirmar la copia.');}
   notify(`Curso «${copied.name}» copiado como borrador.`,'success');
   router.push(`/campus/courses/${copied.id}`);onClose();
  }catch(e){setError(apiErrorMessage(e));if(e instanceof TypeError||e instanceof SyntaxError)setUncertain(true);}
  finally{lock.current=false;setBusy(false);}
 }
 async function check(){
  if(lock.current)return;lock.current=true;setBusy(true);
  try{
   const courses=await requestJson('/api/academic/courses');
   if(!Array.isArray(courses))throw Error('No se pudo comprobar el listado.');
   const copied=courses.map(parseCourse).find(c=>c&&c.id!==course.id&&c.name.trim().toLocaleLowerCase('es-EC')===name.trim().toLocaleLowerCase('es-EC'));
   if(copied){notify('Ya existe un curso con ese nombre. Revisa su contenido.','info');router.push(`/campus/courses/${copied.id}`);onClose();return;}
   await onCheck();setError('Todavía no aparece en el listado. La operación podría seguir en curso. Cierra este diálogo y vuelve a comprobar más tarde antes de intentar otra copia.');
  }catch(e){setError(apiErrorMessage(e));}finally{lock.current=false;setBusy(false);}
 }
 return <dialog ref={dialog} className="lms-modal athena-duplicate-dialog" aria-labelledby="duplicate-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
  <div className="lms-modal-titlebar"><Copy size={23}/><div className="lms-modal-heading"><h2 id="duplicate-title">Copiar curso</h2><small>Origen: {course.name} · {course.course_type.code}</small></div></div>
  <form className="lms-editor-form" onSubmit={e=>void submit(e)}>
   <label>Nombre de la nueva edición<input autoFocus required maxLength={255} value={name} disabled={busy||uncertain} onChange={e=>setName(e.target.value)}/></label>
   <div className="lms-form-row"><label>Fecha de inicio (opcional)<input type="date" value={start} disabled={busy||uncertain} onChange={e=>setStart(e.target.value)}/></label><label>Fecha de finalización (opcional)<input type="date" min={start||undefined} value={end} disabled={busy||uncertain} onChange={e=>setEnd(e.target.value)}/></label></div>
   <p className="lms-academic-note"><strong>Se copiarán:</strong> estructura, actividades y preguntas, reglas de calificación, archivos independientes y configuración de certificados.</p>
   <p className="lms-academic-note"><strong>No se copiarán:</strong> matrículas, asistencias ni sesiones programadas, resultados, entregas, participaciones, documentos personales o certificados emitidos. El curso anterior permanecerá intacto.</p>
   <p>La nueva edición será un borrador con matrícula cerrada. Las fechas de actividades se reinician.</p>
   {busy&&<p role="status">Procesando. Si el curso tiene archivos grandes, puede demorar. No cierres esta página.</p>}
   {error&&<p role="alert" className="lms-academic-note">{error}</p>}
   {uncertain&&<p role="status">No se pudo confirmar el resultado. Comprueba el listado antes de volver a copiar.</p>}
   <div className="lms-editor-actions"><button type="button" className="lms-outline-button" disabled={busy} onClick={onClose}>{uncertain?'Cerrar':'Cancelar'}</button>{uncertain?<button type="button" className="button button-primary" disabled={busy} onClick={()=>void check()}>Comprobar listado</button>:<button type="submit" className="button button-primary" disabled={busy}><Copy size={16}/>{busy?'Copiando…':'Copiar curso'}</button>}</div>
  </form>
 </dialog>;
}
