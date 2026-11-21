'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, CirclePlus, Clock, Pencil, RefreshCw, Save, Search, Trash2, Users } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { normalizeTime, schedulePreview, type SessionDraft, type WeeklySlots } from '@/lib/course-workspace/attendance-schedule';
import { recurringPayload, readRecurringPreview, readRecurringCreation, type RecurringPreview } from '@/lib/course-workspace/phase12-contract';

type Session=SessionDraft & {id:number;course_id:number};
type AttendanceState='PENDIENTE'|'PRESENTE'|'AUSENTE'|'ATRASADO'|'JUSTIFICADO';
type RecordRow={id:number;attendance_state:AttendanceState;role_id:number;role_code:'STUDENT'|'TEACHER'|null;
  enrollment:{id:number;status:string;user:{id:number;firstname:string;lastname:string;idnumber?:string|null}}};
const weekdays=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const today=()=>{const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);return local.toISOString().slice(0,10);};
const initialSlots=():WeeklySlots=>Object.fromEntries(Array.from({length:7},(_,i)=>[i,{enabled:i>=1&&i<=5,start:'18:00',end:'20:00'}])) as WeeklySlots;
const http=(value:unknown):RequestInit=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
const parsedSessions=(v:unknown):Session[]=>{
  if(!Array.isArray(v))throw Error('FastAPI devolvió una lista de sesiones inválida.');
  return v.map(item=>{
    if(!item||typeof item!=='object'||!Number.isSafeInteger(item.id)||typeof item.day!=='string'||
      typeof item.start_time!=='string'||typeof item.end_time!=='string')throw Error('Sesión inválida');
    return item as Session;
  });
};
const parsedRecords=(v:unknown):RecordRow[]=>{
  if(!Array.isArray(v))throw Error('No se pudieron interpretar las asistencias.');
  return v.map(item=>{
    if(!item||typeof item!=='object'||!Number.isSafeInteger(item.id)||!item.enrollment||
      typeof item.enrollment!=='object'||!item.enrollment.user||typeof item.enrollment.user.firstname!=='string')
      throw Error('Una asistencia está incompleta');
    return item as RecordRow;
  });
};
const states:AttendanceState[]=['PENDIENTE','PRESENTE','AUSENTE','ATRASADO','JUSTIFICADO'];
const display=(s:Session)=>`${s.day} · ${normalizeTime(s.start_time)}–${normalizeTime(s.end_time)}`;

/** Asistencia MOOC/MDT. Previsualización y creación recurrente son autoritativas en FastAPI;
 * una sola transacción provisiona sesiones y participantes STUDENT/TEACHER aceptados. */
export function CourseAttendanceManager({courseId,courseName}:{courseId:number;courseName:string}){
  const url=`/api/course-workspace/${courseId}/attendance`;
  const [sessions,setSessions]=useState<Session[]>([]);
  const [activeId,setActiveId]=useState<number|null>(null);
  const [rows,setRows]=useState<RecordRow[]>([]);
  const [loading,setLoading]=useState(true),[loadingRows,setLoadingRows]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [mode,setMode]=useState<'list'|'create'>('list');
  const [from,setFrom]=useState(today()),[to,setTo]=useState(today());
  const [slots,setSlots]=useState<WeeklySlots>(initialSlots);
  const [exclusions,setExclusions]=useState('');
  const [serverPreview,setServerPreview]=useState<RecurringPreview|null>(null);
  const [previewSignature,setPreviewSignature]=useState('');
  const [filter,setFilter]=useState(''),[roleFilter,setRoleFilter]=useState('ALL');
  const [edit,setEdit]=useState<SessionDraft|null>(null);
  const active=sessions.find(s=>s.id===activeId)||null;
  const preview=useMemo(()=>schedulePreview({from,to,slots,exclusions},[]),[from,to,slots,exclusions]);
  const signature=JSON.stringify({from,to,slots,exclusions});
  const confirmedPreview=previewSignature===signature?serverPreview:null;
  const load=useCallback(async(preserveError=false)=>{
    setLoading(true);if(!preserveError)setError('');
    try{
      const response=parsedSessions(await requestJson(url));
      setSessions(response.sort((a,b)=>b.day.localeCompare(a.day)||a.start_time.localeCompare(b.start_time)));
      setActiveId(old=>old&&response.some(s=>s.id===old)?old:response[0]?.id??null);
    }catch(e){setError(apiErrorMessage(e));}finally{setLoading(false);}
  },[url]);
  useEffect(()=>{void load();},[load]);
  const loadRows=useCallback(async(sid:number)=>{
    setLoadingRows(true);setRows([]);
    try{setRows(parsedRecords(await requestJson(`${url}/${sid}/records`)));}
    catch(e){setError(apiErrorMessage(e));}
    finally{setLoadingRows(false);}
  },[url]);
  useEffect(()=>{if(activeId)void loadRows(activeId);else setRows([]);},[activeId,loadRows]);
  const filtered=rows.filter(r=>{
    const name=`${r.enrollment.user.firstname} ${r.enrollment.user.lastname} ${r.enrollment.user.idnumber||''}`.toLocaleLowerCase('es');
    return name.includes(filter.toLocaleLowerCase('es'))&&(roleFilter==='ALL'||r.role_code===roleFilter);
  });
  async function previewRecurrence(){
    if(busy||preview.error)return;
    setBusy(true);setError('');setNotice('');setServerPreview(null);setPreviewSignature('');
    try{
      const data=recurringPayload(courseId,from,to,slots,exclusions);
      const checked=readRecurringPreview(await requestJson(`${url}/recurring/preview`,undefined,http(data)));
      setServerPreview(checked);setPreviewSignature(signature);
    }catch(e){setError(apiErrorMessage(e));}
    finally{setBusy(false);}
  }
  async function generate(){
    if(busy||!confirmedPreview||!confirmedPreview.to_create.length)return;
    if(!window.confirm(`¿Crear ${confirmedPreview.to_create.length} sesiones de «${courseName}» en una única transacción?`))return;
    setBusy(true);setError('');setNotice('');
    try{
      const data=recurringPayload(courseId,from,to,slots,exclusions);
      const result=readRecurringCreation(await requestJson(`${url}/recurring`,undefined,http(data)));
      setNotice(`Se crearon ${result.created.length} sesiones. ${result.skipped_existing} ya existían. Operación confirmada por FastAPI.`);
      setMode('list');setServerPreview(null);setPreviewSignature('');
    }catch(e){setError(`No se confirmó el lote: ${apiErrorMessage(e)}. Se aplicó rollback si FastAPI rechazó la operación. Si hubo un error de conexión, recarga antes de reintentar.`);}
    finally{setBusy(false);await load(true);}
  }
  async function updateSession(){
    if(!active||!edit||busy)return;
    if(!edit.day||!edit.start_time||!edit.end_time||edit.end_time<=edit.start_time){setError('Horario inválido');return;}
    setBusy(true);setError('');setNotice('');
    try{
      const result=await requestJson(`${url}/${active.id}`,undefined,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(edit)});
      if(!result||typeof result!=='object')throw Error('No se confirmó la actualización');
      setEdit(null);setNotice('Sesión actualizada');await load();
    }catch(e){setError(apiErrorMessage(e));}finally{setBusy(false);}
  }
  async function deleteSession(){
    if(!active||busy||!window.confirm('¿Archivar esta sesión? Se conservará su historial de asistencia.'))return;
    setBusy(true);setError('');setNotice('');
    try{await requestJson(`${url}/${active.id}`,undefined,{method:'DELETE'});setActiveId(null);setNotice('Sesión archivada');await load();}
    catch(e){setError(apiErrorMessage(e));}finally{setBusy(false);}
  }
  async function changeState(item:RecordRow,state:AttendanceState){
    if(busy||item.attendance_state===state)return;
    setBusy(true);setError('');setNotice('');
    try{
      const response=await requestJson(`${url}/${activeId}/records/${item.id}`,undefined,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({attendance_state:state})});
      if(!response||typeof response!=='object')throw Error('No se confirmó el cambio de asistencia');
      setRows(previous=>previous.map(row=>row.id===item.id?{...row,attendance_state:state}:row));
    }catch(e){setError(`${item.enrollment.user.firstname}: ${apiErrorMessage(e)}`);}
    finally{setBusy(false);}
  }
  const count=(state:AttendanceState)=>rows.filter(r=>r.attendance_state===state).length;
  return <main className="campus-workspace lms-academic">
    <header className="workspace-heading"><div><p className="lms-eyebrow">GESTIÓN ACADÉMICA / MOOC Y MDT</p><h1>Asistencia</h1>
      <p>Programa sesiones y registra la asistencia de estudiantes y profesores.</p></div>
      <div className="workspace-actions"><button className="lms-outline-button" onClick={()=>void load()} disabled={busy}><RefreshCw size={17}/> Recargar</button>
      <button className="button button-primary" onClick={()=>{setMode(mode==='create'?'list':'create');setError('');}} disabled={busy}>
        <CirclePlus size={17}/>{mode==='create'?'Cerrar programación':'Programar sesiones'}</button></div></header>
    {error&&<p className="lms-error" role="alert">{error}</p>}
    {notice&&<p className="lms-users-success" role="status">{notice}</p>}
    {mode==='create'&&<section className="workspace-panel"><div className="workspace-panel-header"><h2>Programar sesiones recurrentes</h2>
      <p>Selecciona un período, activa los días y asigna sus horarios. También sirve para crear una sola sesión.</p></div>
      <div className="workspace-form-grid"><label>Desde<input type="date" value={from} disabled={busy} onChange={e=>setFrom(e.target.value)}/></label>
        <label>Hasta<input type="date" value={to} disabled={busy} onChange={e=>setTo(e.target.value)}/></label></div>
      <div className="workspace-schedule-grid">{[1,2,3,4,5,6,0].map(day=>{
        const slot=slots[day];return <div key={day} className={`workspace-schedule-day ${slot.enabled?'enabled':''}`}>
          <label className="workspace-day-toggle"><input type="checkbox" checked={slot.enabled} disabled={busy}
            onChange={e=>setSlots(v=>({...v,[day]:{...v[day],enabled:e.target.checked}}))}/>{weekdays[day]}</label>
          <div className="workspace-time-pair"><input aria-label={`Inicio ${weekdays[day]}`} type="time" value={slot.start} disabled={busy||!slot.enabled}
            onChange={e=>setSlots(v=>({...v,[day]:{...v[day],start:e.target.value}}))}/>
            <input aria-label={`Fin ${weekdays[day]}`} type="time" value={slot.end} disabled={busy||!slot.enabled}
            onChange={e=>setSlots(v=>({...v,[day]:{...v[day],end:e.target.value}}))}/></div></div>;})}</div>
      <label className="workspace-full-label">Fechas excluidas (feriados o días sin clase)
        <textarea rows={2} placeholder="2026-12-25, 2027-01-01" value={exclusions} disabled={busy} onChange={e=>setExclusions(e.target.value)}/>
        <small>Separar con comas, espacios o saltos de línea. Formato AAAA-MM-DD.</small></label>
      <div className="workspace-preview"><h3>Vista previa</h3>
        {preview.error?<p className="workspace-warning">{preview.error}</p>:<>
          <p>Estimación local: <strong>{preview.rows.length}</strong> sesión(es) en el período. Confirma con el backend antes de crear.</p>
          {confirmedPreview?<>
            <p role="status"><strong>{confirmedPreview.to_create.length}</strong> nuevas · {confirmedPreview.existing.length} ya existentes · {confirmedPreview.excluded.length} fechas excluidas.</p>
            <div className="workspace-preview-dates">{confirmedPreview.to_create.slice(0,14).map(item=><span key={`${item.day}-${item.start_time}`}>{item.day} · {normalizeTime(item.start_time)}–{normalizeTime(item.end_time)}</span>)}
              {confirmedPreview.to_create.length>14&&<span>+ {confirmedPreview.to_create.length-14} más</span>}
            </div>
          </>:<p className="workspace-fineprint">Consulta la vista previa en FastAPI. Las sesiones existentes se omiten sin duplicarse.</p>}
        </>}
        <p className="workspace-fineprint">La creación es transaccional: o se guardan todas las sesiones nuevas con sus asistencias, o no se guarda ninguna.</p></div>
      <div className="workspace-actions"><button className="lms-outline-button" type="button" disabled={busy} onClick={()=>setMode('list')}>Cancelar</button>
        <button className="lms-outline-button" type="button" disabled={busy||!!preview.error} onClick={()=>void previewRecurrence()}>
          <Search size={17}/> {busy?'Consultando...':'Consultar vista previa'}</button>
        <button className="button button-primary" type="button" disabled={busy||!confirmedPreview||confirmedPreview.to_create.length===0} onClick={()=>void generate()}>
          <Save size={17}/>{busy?'Guardando...':`Crear ${confirmedPreview?.to_create.length??0} sesiones`}</button></div></section>}
    <div className="workspace-attendance-layout">
      <section className="workspace-panel workspace-session-list"><div className="workspace-panel-header"><h2>Sesiones del curso</h2>
          <p>{loading?'Cargando...':`${sessions.length} sesión(es) registradas`}</p></div>
        <div className="workspace-session-scroll">{sessions.map(item=><button key={item.id} type="button"
          className={`workspace-session-item ${activeId===item.id?'is-selected':''}`} onClick={()=>{setActiveId(item.id);setEdit(null);setError('');}}>
          <CalendarDays size={19}/><span><strong>{item.day}</strong><small>{normalizeTime(item.start_time)}–{normalizeTime(item.end_time)}</small></span><ChevronDown size={15}/></button>)}
          {!loading&&!sessions.length&&<p className="workspace-empty">Todavía no hay sesiones. Utiliza «Programar sesiones».</p>}</div></section>
      <section className="workspace-panel workspace-attendance-detail"><div className="workspace-panel-header">
        <h2>{active?'Control de asistencia':'Selecciona una sesión'}</h2>
        {active&&<><p>{display(active)}</p><div className="workspace-actions"><button className="lms-outline-button" disabled={busy} onClick={()=>setEdit(edit?null:{day:active.day,start_time:normalizeTime(active.start_time),end_time:normalizeTime(active.end_time)})}><Pencil size={16}/> Editar sesión</button>
        <button className="lms-outline-button" disabled={busy} onClick={()=>void deleteSession()}><Trash2 size={16}/> Archivar</button></div></>}
      </div>
      {active&&edit&&<div className="workspace-inline-editor"><div className="workspace-form-grid workspace-form-three"><label>Día<input type="date" value={edit.day} onChange={e=>setEdit({...edit,day:e.target.value})}/></label>
        <label>Desde<input type="time" value={edit.start_time} onChange={e=>setEdit({...edit,start_time:e.target.value})}/></label>
        <label>Hasta<input type="time" value={edit.end_time} onChange={e=>setEdit({...edit,end_time:e.target.value})}/></label></div>
        <button className="button button-primary" disabled={busy} onClick={()=>void updateSession()}><Check size={16}/> Guardar horario</button></div>}
      {active&&<><div className="workspace-stats">{(['PRESENTE','AUSENTE','ATRASADO','JUSTIFICADO','PENDIENTE'] as AttendanceState[]).map(s=><div key={s}>
        <strong>{count(s)}</strong><small>{s.charAt(0)+s.slice(1).toLowerCase()}</small></div>)}</div>
        <div className="workspace-filter-row"><label className="workspace-search"><Search size={17}/><input placeholder="Buscar participante..." value={filter} onChange={e=>setFilter(e.target.value)}/></label>
          <select aria-label="Filtrar por rol" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="ALL">Todos los roles</option><option value="STUDENT">Estudiantes</option><option value="TEACHER">Profesores</option></select></div>
        <div className="workspace-table-scroll"><table className="workspace-table"><thead><tr><th>Participante</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>{filtered.map(row=><tr key={row.id}><td><strong>{row.enrollment.user.firstname} {row.enrollment.user.lastname}</strong>
            <small>{row.enrollment.user.idnumber||`Matrícula #${row.enrollment.id}`}</small></td>
            <td>{row.role_code==='TEACHER'?'Profesor':row.role_code==='STUDENT'?'Estudiante':'Por identificar'}</td>
            <td><select aria-label={`Estado de ${row.enrollment.user.firstname} ${row.enrollment.user.lastname}`} value={row.attendance_state} disabled={busy}
              onChange={e=>void changeState(row,e.target.value as AttendanceState)}>{states.map(s=><option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table>
          {!loadingRows&&!filtered.length&&<p className="workspace-empty">Sin participantes para los filtros indicados.</p>}
          {loadingRows&&<p className="workspace-empty">Cargando participantes...</p>}</div>
        <p className="workspace-fineprint"><Users size={14}/> El registro incluye STUDENT y TEACHER aceptados. Puedes modificar tu propia asistencia si eres profesor.</p>
      </>}
      {!active&&<p className="workspace-empty"><Clock size={23}/> Selecciona o programa una sesión para gestionar sus estados.</p>}
      </section></div>
  </main>;
}
