"use client";
/* eslint-disable @next/next/no-img-element -- Las portadas se cargan desde el proxy same-origin autenticado. */
import Link from 'next/link';
import { useCallback,useEffect,useState } from 'react';
import { ArrowLeft, Award, BookOpen, CalendarCheck, ClipboardCheck, GraduationCap, Info, RefreshCw, Settings2, UsersRound, AlertTriangle } from 'lucide-react';
import { apiErrorMessage,requestJson } from '@/lib/academic/client';
import { parseCourse,parseCourseType,parseTransition,parseList,
 type ManagedCourse,type CourseTransition,type CourseCode,type CourseType,type GradeMethod } from '@/lib/academic/types';

function Summary({name,items}:{name:string;items:{name:string;has_existing_data:boolean}[]}){
 if(!items.length)return null;
 return <div className="lms-academic-preview-group"><strong>{name} ({items.length})</strong><ul>
  {items.map((item,i)=><li key={`${i}-${item.name}`}>{item.name}{item.has_existing_data?' — contiene datos existentes':''}</li>)}
 </ul></div>;
}
export function AdminCourseDetail({courseId}:{courseId:number}){
 const [course,setCourse]=useState<ManagedCourse|null>(null),[types,setTypes]=useState<CourseType[]>([]),[allowed,setAllowed]=useState<CourseCode[]>([]);
 const [target,setTarget]=useState(''),[preview,setPreview]=useState<CourseTransition|null>(null);
 const [method,setMethod]=useState<GradeMethod>('AVERAGE'),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const refresh=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);setError('');
  try{const [a,b]=await Promise.all([requestJson(`/api/academic/courses/${courseId}`,signal),requestJson('/api/academic/course-types',signal)]);
   const c=parseCourse(a),body=b as {types?:unknown;allowed?:unknown}|null;
   const ts=parseList(body?.types,parseCourseType);
   const codes=Array.isArray(body?.allowed)&&body.allowed.every(v=>v==='MOOC'||v==='MDT')?body.allowed as CourseCode[]:null;
   if(!c||c.id!==courseId||!ts||!codes)throw Error('No se pudo validar el curso');
   if(!signal?.aborted){setCourse(c);setTypes(ts);setAllowed(codes);setMethod(c.grade_calculation_method);
    setTarget(String(ts.find(t=>t.id!==c.course_type_id&&codes.includes(t.code))?.id||''));setPreview(null);}
  }catch(e){if(!signal?.aborted)setError(apiErrorMessage(e));}
  finally{if(!signal?.aborted)setLoading(false);}
 },[courseId]);
 useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);return()=>controller.abort();},[refresh]);
 async function saveGrade(){if(!course||busy||method===course.grade_calculation_method)return;
  setBusy(true);setError('');setNotice('');
  try{const result=await requestJson(`/api/academic/courses/${courseId}/grade-method`,undefined,
   {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({method})});
   const data=result as {method?:string;enrollments_recalculated?:number}|null;
   if(!data||data.method!==method||typeof data.enrollments_recalculated!=='number')throw Error('FastAPI no confirmó el recálculo');
   setCourse({...course,grade_calculation_method:method});setNotice(`Método actualizado. Matrículas recalculadas: ${data.enrollments_recalculated}.`);
  }catch(e){setError(apiErrorMessage(e));}finally{setBusy(false);}
 }
 async function previewChange(){if(!course||!target||busy)return;setBusy(true);setError('');setNotice('');setPreview(null);
  try{const result=await requestJson(`/api/academic/courses/${courseId}/type-preview`,undefined,
   {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({course_type_id:Number(target)})});
   const p=parseTransition(result);if(!p||p.course_id!==courseId||p.target_type.id!==Number(target))throw Error('Vista previa inválida');
   setPreview(p);
  }catch(e){setError(apiErrorMessage(e));}finally{setBusy(false);}
 }
 async function confirmChange(){if(!course||!preview||preview.target_type.id!==Number(target)||busy)return;
  setBusy(true);setError('');
  try{const result=await requestJson(`/api/academic/courses/${courseId}/type-change`,undefined,
   {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({course_type_id:preview.target_type.id,confirm:true})});
   const saved=parseCourse(result);if(!saved||saved.course_type_id!==preview.target_type.id)throw Error('FastAPI no confirmó la transición');
   setNotice(`El curso ahora es ${saved.course_type.code}. La estructura de bloques fue gestionada por FastAPI.`);
   setCourse(saved);setMethod(saved.grade_calculation_method);setPreview(null);
   setTarget(String(types.find(t=>t.id!==saved.course_type_id&&allowed.includes(t.code))?.id||''));
  }catch(e){setError(apiErrorMessage(e));}finally{setBusy(false);}
 }
 const candidate=types.filter(t=>t.id!==course?.course_type_id&&allowed.includes(t.code));
 return <div className="lms-users-page lms-academic lms-academic-detail">
  <div className="lms-academic-back"><Link href="/campus/courses"><ArrowLeft size={17}/> Volver a cursos</Link></div>
  {error&&<p className="lms-error" role="alert">{error}</p>}
  {notice&&<p className="lms-users-success" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Cerrar aviso">×</button></p>}
  {loading&&<div className="lms-loading-card">Cargando configuración del curso...</div>}
  {!loading&&course&&<>
   <div className="lms-page-heading lms-users-heading"><div><p className="lms-eyebrow">ADMINISTRACIÓN / CURSO #{course.id}</p>
    <h1>{course.name}</h1><p>Configuración general, método de evaluación y transición segura entre MOOC y MDT.</p></div>
    <button className="lms-outline-button" disabled={busy||loading} onClick={()=>void refresh()}><RefreshCw size={16}/> Recargar</button></div>
   <section className="lms-users-panel lms-academic-course-overview">
    <div className="lms-academic-overview-image">{course.is_published&&course.image_url?
     <img alt="Portada del curso" src={`/api/academic/courses/${course.id}/image`}/>:<BookOpen size={54} aria-hidden="true"/>}</div>
    <div className="lms-academic-overview-info"><div className="lms-academic-tags"><span className="lms-users-role lms-users-role-admin">{course.course_type.code}</span>
     <span className={`lms-users-state ${course.is_published?'lms-users-state-on':'lms-users-state-off'}`}>{course.is_published?'Publicado':'Borrador'}</span>
     <span className="lms-users-role">{course.open_enrollment?'Matrícula abierta':'Matrícula cerrada'}</span></div>
     <p>{course.description}</p><div className="lms-academic-overview-facts">
      <span><strong>Duración</strong>{course.duration_hours} h</span><span><strong>Nivel</strong>{course.level}</span>
      <span><strong>Precio</strong>{course.is_free?'Gratis':`${course.price} ${course.currency}`}</span>
      <span><strong>Estudiantes</strong>{course.total_students}</span></div>
     <p className="lms-academic-help">Las opciones generales (nombre, portada, publicación, matrícula y fechas) se editan desde el listado de cursos.</p></div>
   </section>
   <div className="lms-academic-settings-grid">
    <section className="lms-users-panel lms-academic-setting"><h2><ClipboardCheck size={20}/> Método de calificación</h2>
     <p>El backend recalcula las notas del curso cuando confirmas un cambio.</p>
     <div className="lms-academic-grade-options"><label><input type="radio" name="method" value="AVERAGE" checked={method==='AVERAGE'} onChange={()=>setMethod('AVERAGE')}/>
      <span><strong>Promedio (AVERAGE)</strong><small>Media de las actividades evaluables.</small></span></label>
      <label><input type="radio" name="method" value="WEIGHTED" checked={method==='WEIGHTED'} onChange={()=>setMethod('WEIGHTED')}/>
      <span><strong>Ponderado (WEIGHTED)</strong><small>Considera los pesos configurados en los bloques evaluables.</small></span></label></div>
     <button className="button button-primary small-button" onClick={()=>void saveGrade()} disabled={busy||method===course.grade_calculation_method}>
      {busy?'Guardando...':'Guardar método y recalcular'}</button>
    </section>
    <section className="lms-users-panel lms-academic-setting"><h2><Settings2 size={20}/> Tipo de curso</h2>
     <p>FastAPI genera, conserva o desactiva los bloques predeterminados según el tipo. Nunca se borran datos históricos por una transición.</p>
     {!candidate.length?<p className="lms-academic-note">No hay otro tipo autorizado por el plan actual. El curso puede continuar funcionando sin cambiar de modalidad.</p>:
     <><label className="lms-academic-select-label">Cambiar a
       <select value={target} onChange={e=>{setTarget(e.target.value);setPreview(null)}}>
        {candidate.map(t=><option key={t.id} value={t.id}>{t.code}</option>)}
       </select></label><button className="lms-outline-button" disabled={busy||!target} onClick={()=>void previewChange()}>Previsualizar cambios</button></>}
    </section>
   </div>
   {preview&&<section className="lms-users-panel lms-academic-transition" aria-label="Previsualización del cambio de tipo">
    <h2><AlertTriangle size={20}/> Confirmación de transición: {preview.current_type.code} → {preview.target_type.code}</h2>
    <p>Revisa el impacto en bloques, certificados, matrículas y asistencias antes de ejecutar la operación.</p>
    <div className="lms-academic-preview-grid"><Summary name="Bloques nuevos" items={preview.blocks_to_create}/>
     <Summary name="Bloques reactivados" items={preview.blocks_to_reactivate}/>
     <Summary name="Bloques desactivados" items={preview.blocks_to_deactivate}/>
     <Summary name="Bloques conservados" items={preview.blocks_to_preserve}/>
     <Summary name="Certificados agregados" items={preview.certificate_types_to_create}/>
     <Summary name="Certificados reactivados" items={preview.certificate_types_to_reactivate}/>
     <Summary name="Certificados desactivados" items={preview.certificate_types_to_deactivate}/></div>
    <p><strong>Bloques manuales intactos:</strong> {preview.manual_blocks_untouched} · <strong>Certificados automáticos a provisionar:</strong> {preview.automatic_certificates_to_provision} · <strong>Asistencias a provisionar:</strong> {preview.attendance_rows_to_provision}</p>
    {preview.data_will_be_deleted&&<p className="lms-error">FastAPI reporta pérdida de datos: no confirmes la transición.</p>}
    <div className="lms-editor-actions"><button className="lms-outline-button" onClick={()=>setPreview(null)} disabled={busy}>Cancelar</button>
     <button className="button button-primary small-button" onClick={()=>void confirmChange()} disabled={busy||preview.data_will_be_deleted}>
      {busy?'Aplicando...':`Confirmar cambio a ${preview.target_type.code}`}</button></div>
   </section>}
   <section className="lms-users-panel lms-academic-setting"><h2><Award size={20}/> Certificados habilitados</h2>
    <p>Se configuran desde FastAPI según las reglas del tipo de curso. La gestión detallada se incorporará en su módulo.</p>
    <div className="lms-academic-tags">{course.certificate_types.filter(t=>t.is_active).length?
     course.certificate_types.filter(t=>t.is_active).map(t=><span key={t.id} className="lms-users-role">{t.certificate_type.name}</span>):<span className="lms-users-role">Sin capacidades de certificado activas</span>}</div></section>
   <section className="lms-users-panel lms-academic-setting"><h2><Info size={20}/> Próximos apartados del curso</h2>
    <p>Estas secciones se habilitarán posteriormente, dentro de este mismo curso y respetando matrículas por rol.</p>
    <div className="lms-academic-upcoming">{[
     {label:'Módulos y contenidos',icon:BookOpen},{label:'Matrículas y docentes',icon:UsersRound},
     {label:'Calificaciones por actividad',icon:GraduationCap},{label:'Asistencias',icon:CalendarCheck},
     {label:'Certificados y reportes',icon:Award}
    ].map(item=><div key={item.label} aria-disabled="true"><item.icon size={19}/><span>{item.label}</span><small>Próximamente</small></div>)}</div>
   </section>
  </>}
 </div>;
}
