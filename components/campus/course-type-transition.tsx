"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, CheckCircle2, Eye, RefreshCw } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import {
  parseCourse, parseCourseType, parseList, parseTransition,
  type CourseCode, type CourseTransition, type CourseType,
  type ManagedCourse, type TransitionItem,
} from '@/lib/academic/types';

const isCourseCode=(value:unknown):value is CourseCode=>value==='MOOC'||value==='MDT';
const postJson=(payload:unknown):RequestInit=>({
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify(payload),
});

type PlanDetail={heading:string;items:TransitionItem[]};

/** Cambio de modalidad ADMIN. Operación independiente del PATCH de curso:
 * 1. GET de tipos y capacidades actuales del tenant (sin IDs hardcodeados).
 * 2. POST /type-preview (sin mutaciones), mostrando el plan real de FastAPI.
 * 3. Confirmación humana y POST /type-change (transacción del backend).
 * FastAPI y el BFF revalidan tenant, ADMIN y licencia. Nunca convertir en un PATCH.
 */
export function CourseTypeTransitionCard({courseId,course,disabled,unsaved,onChanged}:{
  courseId:number;
  course:ManagedCourse;
  disabled:boolean;
  unsaved:boolean;
  onChanged:(updated:ManagedCourse)=>void;
}){
  const [types,setTypes]=useState<CourseType[]>([]);
  const [allowed,setAllowed]=useState<CourseCode[]>([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [selectedId,setSelectedId]=useState('');
  const [plan,setPlan]=useState<CourseTransition|null>(null);
  const [confirmed,setConfirmed]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    const controller=new AbortController();
    void (async()=>{
      try{
        const raw=await requestJson('/api/academic/course-types',controller.signal);
        const payload=raw as {types?:unknown;allowed?:unknown}|null;
        const parsed=parseList(payload?.types,parseCourseType);
        const codes=payload?.allowed;
        if(!parsed||!Array.isArray(codes)||!codes.every(isCourseCode))
          throw Error('La lista de modalidades o licencias es inválida.');
        if(!controller.signal.aborted){setTypes(parsed);setAllowed(codes);}
      }catch(e){if(!controller.signal.aborted)setError(apiErrorMessage(e));}
      finally{if(!controller.signal.aborted)setLoading(false);}
    })();
    return()=>controller.abort();
  },[]);

  // Si se actualizó el curso desde otra acción, el plan mostrado no debe poder confirmarse.
  useEffect(()=>{setPlan(null);setConfirmed(false);},[
    course.id,course.course_type_id,course.name,course.grade_calculation_method,
  ]);

  const destinations=types.filter(type=>type.id!==course.course_type_id&&allowed.includes(type.code));
  const target=destinations.find(type=>String(type.id)===selectedId);
  const locked=disabled||working||loading||unsaved;
  const readyPlan=plan && target && plan.course_id===courseId &&
    plan.current_type.id===course.course_type_id && plan.target_type.id===target.id &&
    !plan.data_will_be_deleted ? plan : null;

  function select(id:string){
    setSelectedId(id);setPlan(null);setConfirmed(false);setError('');
  }

  async function preview(){
    if(locked||!target)return;
    setError('');setPlan(null);setConfirmed(false);setWorking(true);
    try{
      const response=await requestJson(`/api/academic/courses/${courseId}/type-preview`,undefined,
        postJson({course_type_id:target.id}));
      const parsed=parseTransition(response);
      if(!parsed||parsed.course_id!==courseId||parsed.current_type.id!==course.course_type_id||
        parsed.target_type.id!==target.id)
        throw Error('FastAPI devolvió un plan que no coincide con el curso. Recarga la página.');
      if(parsed.data_will_be_deleted)
        throw Error('El plan indica eliminación de datos; esta pantalla no permite confirmar ese cambio.');
      setPlan(parsed);
    }catch(e){setError(apiErrorMessage(e));}
    finally{setWorking(false);}
  }

  async function apply(){
    if(locked||!readyPlan||!confirmed||!target)return;
    setError('');setWorking(true);
    try{
      const result=await requestJson(`/api/academic/courses/${courseId}/type-change`,undefined,
        postJson({course_type_id:target.id,confirm:true}));
      const updated=parseCourse(result);
      if(!updated||updated.id!==courseId||updated.course_type_id!==target.id||
        updated.course_type.code!==target.code)
        throw Error('No se pudo verificar el resultado del cambio. Recarga el curso antes de reintentarlo.');
      setPlan(null);setConfirmed(false);setSelectedId('');
      onChanged(updated);
    }catch(e){
      // Si el resultado de la petición fue incierto, no asumir ni éxito ni fracaso.
      setPlan(null);setConfirmed(false);
      setError(`${apiErrorMessage(e)} Verifica la modalidad actual con «Recargar» antes de reintentar.`);
    }finally{setWorking(false);}
  }

  const details:PlanDetail[]=plan?[
    {heading:'Bloques por crear',items:plan.blocks_to_create},
    {heading:'Bloques por reactivar',items:plan.blocks_to_reactivate},
    {heading:'Bloques por desactivar (sin borrar datos)',items:plan.blocks_to_deactivate},
    {heading:'Bloques que se mantienen',items:plan.blocks_to_preserve},
    {heading:'Tipos de certificado por crear',items:plan.certificate_types_to_create},
    {heading:'Tipos de certificado por reactivar',items:plan.certificate_types_to_reactivate},
    {heading:'Tipos de certificado por desactivar',items:plan.certificate_types_to_deactivate},
  ]:[];
  const affectedWithData=plan?.blocks_to_deactivate.filter(item=>item.has_existing_data).length??0;

  return <section className="course-settings-transition" id="course-type-transition"
    aria-labelledby="course-settings-type-title">
    <div className="course-settings-transition-heading">
      <ArrowRightLeft size={23} aria-hidden="true"/>
      <div><h2 id="course-settings-type-title">Cambio de modalidad del curso</h2>
        <p>Modalidad actual: <strong>{course.course_type.code}</strong>. Puedes convertir el curso
          entre MOOC y MDT únicamente si el tenant tiene habilitada la modalidad de destino.</p>
      </div>
    </div>
    {error&&<p className="lms-error" role="alert">{error}</p>}
    <div className="course-settings-transition-controls">
      <label htmlFor="course-settings-target-type">Nueva modalidad
        <select id="course-settings-target-type" value={selectedId}
          disabled={disabled||working||loading||destinations.length===0}
          onChange={e=>select(e.target.value)}>
          <option value="">{loading?'Consultando modalidades...':'Selecciona una modalidad'}</option>
          {destinations.map(type=><option value={type.id} key={type.id}>{type.code} — {type.name}</option>)}
        </select>
      </label>
      <button type="button" className="lms-outline-button" disabled={locked||!target}
        onClick={()=>void preview()}><Eye size={17}/>{working?'Procesando...':'Ver cambios antes de confirmar'}</button>
    </div>
    {!loading&&!error&&destinations.length===0&&
      <p className="course-settings-transition-note">No hay otra modalidad habilitada en la licencia actual. El curso existente conserva su funcionamiento.</p>}
    {unsaved&&<p className="course-settings-transition-alert" role="status">
      Primero guarda o descarta los cambios del formulario de arriba antes de convertir la modalidad.
    </p>}
    {disabled&&<p className="course-settings-transition-note">El cambio de modalidad no está disponible mientras se guarda o sincroniza la edición general.</p>}
    {readyPlan&&<div className="course-settings-transition-plan" aria-label="Vista previa del cambio de modalidad">
      <h3>Confirmar: {readyPlan.current_type.code} → {readyPlan.target_type.code}</h3>
      <p>La vista previa describe lo que hará FastAPI. Se recalculará el plan al confirmar,
        para respetar el estado más reciente del curso y sus licencias.</p>
      <div className="course-settings-transition-counts">
        <div><strong>{readyPlan.blocks_to_create.length}</strong>Bloques nuevos</div>
        <div><strong>{readyPlan.blocks_to_reactivate.length}</strong>Bloques reactivados</div>
        <div><strong>{readyPlan.blocks_to_deactivate.length}</strong>Bloques desactivados</div>
        <div><strong>{readyPlan.certificate_types_to_deactivate.length}</strong>Tipos de certificado desactivados</div>
        <div><strong>{readyPlan.automatic_certificates_to_provision}</strong>Certificados automáticos por provisionar</div>
        <div><strong>{readyPlan.attendance_rows_to_provision}</strong>Asistencias por provisionar</div>
      </div>
      <details className="course-settings-transition-details"><summary>Ver detalle de bloques y certificados</summary>
        {details.map(group=>group.items.length>0&&<div key={group.heading}>
          <strong>{group.heading} ({group.items.length})</strong>
          <ul>{group.items.map((item,index)=><li key={`${item.code}-${item.id??index}`}>
            {item.name}{item.has_existing_data?' — contiene datos existentes':''}</li>)}</ul>
        </div>)}
        <p>Bloques manuales que se conservan: {readyPlan.manual_blocks_untouched}.
          Certificados automáticos existentes que se mantienen: {readyPlan.existing_automatic_certificates_untouched}.</p>
      </details>
      <p className="course-settings-transition-alert"><AlertTriangle size={17} aria-hidden="true"/>
        No se eliminarán registros. Los bloques generados del tipo anterior se desactivarán,
        por lo que podrían dejar de aparecer en actividades y progreso.
        {affectedWithData>0&&` ${affectedWithData} de esos bloques contienen información existente que se conservará.`}
      </p>
      <label className="course-settings-transition-confirm">
        <input type="checkbox" checked={confirmed} disabled={locked}
          onChange={e=>setConfirmed(e.target.checked)}/>
        <span>He revisado los efectos sobre bloques, certificados y asistencias.
          Confirmo el cambio de {readyPlan.current_type.code} a {readyPlan.target_type.code}.</span>
      </label>
      <div className="course-settings-transition-actions">
        <button type="button" className="lms-outline-button" disabled={working}
          onClick={()=>{setPlan(null);setConfirmed(false);}}>Cancelar</button>
        <button type="button" className="button button-primary"
          disabled={locked||!confirmed} onClick={()=>void apply()}>
          {working?<RefreshCw size={17}/>:<CheckCircle2 size={17}/>}
          {working?'Aplicando cambio...':`Cambiar a ${readyPlan.target_type.code}`}
        </button>
      </div>
    </div>}
    <p className="course-settings-transition-note">Esta operación se guarda por separado de «Guardar cambios».
      La conversión no borra bloques ni certificados históricos y no cambia los permisos del profesor.</p>
  </section>;
}
