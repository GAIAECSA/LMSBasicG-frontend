'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { modulesUrl, sendJson } from '@/lib/course-modules/client';
import type { GradePlanDraft, GradePlanItem } from '@/lib/course-modules/domain';
import css from './course-modules.module.css';

type ServerPlan={course_id:number;method:'AVERAGE'|'WEIGHTED';active_items:{lesson_block_id:number;counts_toward_grade:boolean;grade_weight:string|number}[];draft:GradePlanDraft|null};
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export function CourseModulePlan({courseId,count,onClose,onSaved}:{courseId:number;count:number;onClose:()=>void;onSaved:()=>void}){
 const [method,setMethod]=useState<'AVERAGE'|'WEIGHTED'>('AVERAGE'),[items,setItems]=useState<GradePlanItem[]>([]),[titles,setTitles]=useState<Record<number,string>>({});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[dirty,setDirty]=useState(false);
 const load=useCallback(async()=>{setLoading(true);setError('');try{
  const [data,structure]=await Promise.all([requestJson(modulesUrl(courseId,'grade-plan')),requestJson(modulesUrl(courseId,'structure'))]);
  const plan=data as ServerPlan;
  if(!plan||!Array.isArray(plan.active_items)||!['AVERAGE','WEIGHTED'].includes(plan.method))throw Error('Plan inválido');
  const draft=plan.draft;setMethod(draft?.method||plan.method);
  setItems((draft?.items||plan.active_items).map(v=>({lesson_block_id:v.lesson_block_id,counts_toward_grade:v.counts_toward_grade,grade_weight:Number(v.grade_weight)||1})));
  if(structure&&typeof structure==='object'&&'modules'in structure&&Array.isArray(structure.modules)){
   const names:Record<number,string>={};for(const m of structure.modules)for(const l of m.lessons||[])for(const b of l.blocks||[])names[b.id]=b.title;
   setTitles(names);
  }
  setDirty(false);
 }catch(e){setError(apiErrorMessage(e));}finally{setLoading(false);}},[courseId]);
 useEffect(()=>{void load();},[load]);
 const total=useMemo(()=>round(items.reduce((acc,item)=>acc+(item.counts_toward_grade?Number(item.grade_weight)||0:0),0)),[items]);
 const valid=method==='AVERAGE'||(total===100&&items.some(i=>i.counts_toward_grade));
 const setItem=(id:number,update:Partial<GradePlanItem>)=>{setDirty(true);setNotice('');setItems(s=>s.map(i=>i.lesson_block_id===id?{...i,...update}:i));};
 const payload:GradePlanDraft={method,items};
 function check(){if(items.length!==count)throw Error('La estructura del curso cambió; actualiza el plan antes de aplicar.');
  if(items.some(x=>!Number.isFinite(x.grade_weight)||x.grade_weight<=0||x.grade_weight>100))throw Error('Todos los pesos deben ser mayores de 0 y como máximo 100.');
 }
 async function save(activate=false){if(busy)return;setBusy(true);setError('');setNotice('');try{
  check();if(activate&&!valid)throw Error('La suma de pesos activos debe ser exactamente 100%. Guarda un borrador mientras redistribuyes.');
  await sendJson(modulesUrl(courseId,'grade-plan','draft'),'PUT',payload);
  setDirty(false);
  if(activate){const result=await sendJson(modulesUrl(courseId,'grade-plan','activate'),'POST');
    const n=Number((result as {enrollments_recalculated?:number})?.enrollments_recalculated||0);
    setNotice(`Plan activado. FastAPI recalculó ${n} matrículas.`);onSaved();await load();
  }else setNotice('Borrador guardado. No se modificó la nota vigente.');
 }catch(e){setError(apiErrorMessage(e));}finally{setBusy(false);}}
 return <div className={css.backdrop}><section role="dialog" aria-modal="true" aria-label="Plan de calificación" className={`${css.modal} ${css.wide}`}>
  <div className={css.modalTop}><h2>Plan de calificación</h2><button aria-label="Cerrar" onClick={onClose}><X size={21}/></button></div>
  <p className={css.info}>Define qué Quiz y tareas cuentan. En ponderación se guardan todos los cambios juntos; el plan activo solo cambia al alcanzar exactamente el 100%. Las notas pendientes cuentan como cero.</p>
  {error&&<div className={css.error} role="alert">{error}</div>}{notice&&<div className={css.success} role="status">{notice}</div>}
  {loading?<p className={css.placeholder}><LoaderCircle className={css.spin}/> Cargando plan…</p>:<div className={css.stack}>
   <label className={css.field}>Método<select value={method} onChange={e=>{setMethod(e.target.value as 'AVERAGE'|'WEIGHTED');setDirty(true);}}>
     <option value="AVERAGE">Promedio simple (actividades habilitadas por igual)</option><option value="WEIGHTED">Ponderado por pesos (%)</option></select></label>
   <div className={css.tableScroll}><table className={css.table}><thead><tr><th>Actividad</th><th>Cuenta</th><th>Peso (%)</th></tr></thead><tbody>
    {items.map(item=><tr key={item.lesson_block_id}><td>{titles[item.lesson_block_id]||`Actividad #${item.lesson_block_id}`}</td>
     <td><input type="checkbox" aria-label={`Cuenta para nota: ${titles[item.lesson_block_id]||item.lesson_block_id}`} checked={item.counts_toward_grade}
       onChange={e=>setItem(item.lesson_block_id,{counts_toward_grade:e.target.checked})}/></td>
     <td><input style={{width:105}} type="number" min="0.01" max="100" step="0.01" value={item.grade_weight}
       disabled={method==='AVERAGE'} aria-label={`Peso de ${titles[item.lesson_block_id]||item.lesson_block_id}`}
       onChange={e=>setItem(item.lesson_block_id,{grade_weight:Number(e.target.value)})}/></td></tr>)}
    {!items.length&&<tr><td colSpan={3}>Añade un Quiz o Homework para configurar el plan.</td></tr>}
   </tbody></table></div>
   <div className={css.gradeSummary}><span>{method==='WEIGHTED'?'Total ponderado de actividades activas':'El promedio es automático'}</span>
    <strong>{method==='WEIGHTED'?`${total.toFixed(2)} / 100 %`:`${items.filter(i=>i.counts_toward_grade).length} actividades`}</strong>
    {method==='WEIGHTED'&&total!==100?<AlertCircle size={19} aria-label="Plan incompleto"/>:<CheckCircle2 size={19} aria-label="Plan completo"/>}</div>
   {method==='WEIGHTED'&&<div role="img" aria-label={`Peso asignado ${total}% de 100%`} style={{height:10,borderRadius:10,background:'#e2e8f0',overflow:'hidden'}}>
    <div style={{width:`${Math.min(total,100)}%`,height:'100%',background:'var(--tenant-primary,#315c96)'}}/></div>}
   <div className={css.formActions}><button className="lms-outline-button" onClick={onClose}>Cerrar</button>
    <button className="lms-outline-button" disabled={busy||!items.length} onClick={()=>void save(false)}>{busy?'Guardando…':'Guardar borrador'}</button>
    <button className="button-primary" disabled={busy||!items.length||!valid} onClick={()=>void save(true)}>{dirty?'Guardar y activar plan':'Activar plan'}</button></div>
  </div>}
 </section></div>;
}
