'use client';
import { confirmAction, ToastMessage } from '@/components/ui/notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Plus, RefreshCw, Search, Trash2, Upload, UserPlus, Users } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { blankPerson, rowsFromSpanishTable, type CourseRole, type ImportPerson } from '@/lib/course-workspace/bulk-enrollment';
import { existingBatchPayload, massiveBatchPayload, readBatchResult, type BatchResult } from '@/lib/course-workspace/phase12-contract';
import { readFirstSheet } from '@/lib/course-workspace/excel-import';
import type { ManagedUser } from '@/lib/users/types';

type Enrollment={id:number;status:'PENDIENTE'|'ACEPTADO'|'RECHAZADO'|'CANCELADO';
  role:{code:CourseRole;id:number};user:{id:number;firstname:string;lastname:string;idnumber:string|null};
  course:{id:number};created_at:string};
type Result={label:string;status:'ok'|'skip'|'fail';detail:string};
type ImportItem={key:number;value:ImportPerson};
const json=(payload:unknown,method='POST'):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
const newRow=(key:number):ImportItem=>({key,value:blankPerson()});
const stamp=(user:ManagedUser)=>`${user.firstname} ${user.lastname} · ${user.username} · ${user.idnumber||''} · ${user.email||''}`;
const getEnrollments=(data:unknown):Enrollment[]=>{
  if(!Array.isArray(data))throw Error('FastAPI devolvió matrículas inválidas');
  return data.map(item=>{
    if(!item||typeof item!=='object'||!Number.isSafeInteger(item.id)||!item.user||!item.role||!item.course||
      typeof item.role.code!=='string'||!Number.isSafeInteger(item.user.id))throw Error('Matrícula inválida');
    return item as Enrollment;
  });
};
type UserSearchPage={items:ManagedUser[];total:number;page:number;page_size:number};
const getUserPage=(data:unknown):UserSearchPage=>{
  if(!data||typeof data!=='object'||!('items'in data)||!Array.isArray(data.items)||
    !('total'in data)||!Number.isSafeInteger(data.total)||Number(data.total)<0||
    !('page'in data)||!Number.isSafeInteger(data.page)||
    !('page_size'in data)||!Number.isSafeInteger(data.page_size))throw Error('Búsqueda de usuarios inválida');
  return data as UserSearchPage;
};
function resultLines(batch:BatchResult,labels:string[]):Result[]{
  const result:Result[]=[];
  for(const [key,title,status] of [
    ['created','Matrícula creada','ok'],['reactivated','Matrícula reactivada','ok'],
    ['skipped','Ya matriculado; rol conservado','skip'],['failed','Error','fail'],
  ] as const){
    for(const row of batch[key]){
      const index=row.row-1;
      const label=labels[index]||`Fila ${row.row||'?'}`;
      result.push({label,status,detail:row.reason||`${title}${row.role_code?` · ${row.role_code==='TEACHER'?'Profesor':'Estudiante'}`:''}${row.user_created?' · cuenta creada':''}`});
    }
  }
  return result;
}
export function CourseEnrollmentsManager({courseId,courseName}:{courseId:number;courseName:string}){
  const url=`/api/course-workspace/${courseId}/enrollments`;
  const [users,setUsers]=useState<ManagedUser[]>([]),[enrollments,setEnrollments]=useState<Enrollment[]>([]);
  const [searchPage,setSearchPage]=useState(1),[searchTotal,setSearchTotal]=useState(0);
  const [searching,setSearching]=useState(true),[searchVersion,setSearchVersion]=useState(0);
  const [selected,setSelected]=useState<Record<number,ManagedUser>>({});
  const [tab,setTab]=useState<'existing'|'mass'|'list'>('existing');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [query,setQuery]=useState(''),[role,setRole]=useState<CourseRole>('STUDENT');
  const [listQuery,setListQuery]=useState(''),[listStatus,setListStatus]=useState('ALL');
  const [mass,setMass]=useState<ImportItem[]>([newRow(1)]),[massRole,setMassRole]=useState<CourseRole>('STUDENT');
  const [results,setResults]=useState<Result[]>([]);

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{setEnrollments(getEnrollments(await requestJson(url)));setSearchVersion(x=>x+1);}
    catch(exc){setError(apiErrorMessage(exc));}finally{setLoading(false);}
  },[url]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(tab!=='existing')return;
    const controller=new AbortController();
    setSearching(true);
    const timer=setTimeout(()=>{
      const params=new URLSearchParams({q:query.trim(),page:String(searchPage),page_size:'25'});
      requestJson(`${url}/users?${params}`,controller.signal).then(getUserPage).then(page=>{
        if(!controller.signal.aborted){setUsers(page.items);setSearchTotal(page.total);}
      }).catch(e=>{if(!controller.signal.aborted)setError(apiErrorMessage(e));})
        .finally(()=>{if(!controller.signal.aborted)setSearching(false);});
    },250);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[url,tab,query,searchPage,searchVersion]);
  const personById=useMemo(()=>new Map([...users,...Object.values(selected)].map(u=>[u.id,u])),[users,selected]);
  const byUser=useMemo(()=>new Map(enrollments.map(e=>[e.user.id,e])),[enrollments]);
  const available=useMemo(()=>users.filter(u=>u.is_active&&u.role?.code==='VISITOR'),[users]);
  const visibleEnrollments=useMemo(()=>enrollments.filter(e=>{
    const person=personById.get(e.user.id);
    const name=person?stamp(person):`${e.user.firstname} ${e.user.lastname} ${e.user.idnumber||''}`;
    return (listStatus==='ALL'||listStatus===e.status)&&name.toLowerCase().includes(listQuery.toLowerCase());
  }),[enrollments,personById,listQuery,listStatus]);
  const massChange=(key:number,field:keyof ImportPerson,value:string)=>{
    setMass(old=>old.map(row=>row.key===key?{...row,value:{...row.value,[field]:value}}:row));setResults([]);
  };
  async function enrollExisting(){
    const people=Object.values(selected);
    if(!people.length||busy)return;
    if(!(await confirmAction(`¿Matricular ${people.length} usuario(s) en «${courseName}» como ${role==='STUDENT'?'estudiantes':'profesores'}? El lote será atómico.`)))return;
    setBusy(true);setError('');setNotice('');setResults([]);
    try{
      const payload=existingBatchPayload(courseId,people.map(u=>({id:u.id,role_code:role})));
      const batch=readBatchResult(await requestJson(`${url}/bulk`,undefined,json(payload)));
      setResults(resultLines(batch,people.map(u=>u.username)));
      setNotice(`Confirmado: ${batch.summary.created} creadas, ${batch.summary.reactivated} reactivadas y ${batch.summary.skipped} omitidas. Una sola transacción.`);
      setSelected({});await load();
    }catch(e){setError(`No se confirmó el lote. Ninguna fila debe quedar guardada si FastAPI respondió con error: ${apiErrorMessage(e)}. Ante un corte de red, comprueba la lista antes de reintentar.`);}
    finally{setBusy(false);}
  }
  async function manageEnrollment(e:Enrollment,action:'accept'|'reject'|'cancel'|'role',newRole?:CourseRole){
    if(busy)return;
    if(!(await confirmAction(action==='role'?`¿Cambiar rol a ${newRole==='TEACHER'?'Profesor':'Estudiante'}?`:
      `¿${action==='accept'?'Aceptar':action==='reject'?'Rechazar':'Cancelar'} esta matrícula?`)))return;
    setBusy(true);setError('');setNotice('');
    try{
      await requestJson(`${url}/${e.id}/${action}`,undefined,json(action==='role'?{role_code:newRole}:{comment:''},action==='role'?'PATCH':'POST'));
      setNotice('La matrícula se actualizó correctamente.');await load();
    }catch(exc){setError(apiErrorMessage(exc));}finally{setBusy(false);}
  }
  async function importExcel(file:File){
    setError('');setNotice('');setResults([]);
    try{
      if(!file.name.toLowerCase().endsWith('.xlsx'))throw Error('Selecciona un archivo Excel .xlsx.');
      const rows=rowsFromSpanishTable(await readFirstSheet(file));
      if(!rows.length)throw Error('La plantilla no contiene filas de usuarios.');
      if(rows.length>300)throw Error('Importa hasta 300 usuarios por lote.');
      setMass(rows.map((value,index)=>({key:index+1,value})));setMassRole('STUDENT');
      setNotice(`Se importaron ${rows.length} filas. Revísalas antes de matricular.`);
    }catch(e){setError(apiErrorMessage(e));}
  }
  async function enrollMass(){
    if(busy||!mass.length)return;
    setError('');setNotice('');setResults([]);
    let payload:ReturnType<typeof massiveBatchPayload>;
    try{payload=massiveBatchPayload(courseId,mass.map(item=>item.value));}
    catch(e){setError(apiErrorMessage(e));return;}
    if(!(await confirmAction(`¿Matricular ${mass.length} personas en «${courseName}»? FastAPI buscará primero cada cédula y procesará TODO en una transacción.`)))return;
    setBusy(true);
    try{
      const batch=readBatchResult(await requestJson(`${url}/massive`,undefined,json(payload)));
      setResults(resultLines(batch,mass.map((item,i)=>`Fila ${i+1} · ${item.value.idnumber}`)));
      setNotice(`Lote confirmado: ${batch.summary.created} creadas, ${batch.summary.reactivated} reactivadas, ${batch.summary.skipped} ya matriculadas. Sin resultados parciales.`);
      // No retener las contraseñas temporales después de un envío exitoso.
      setMass(old=>old.map(item=>({...item,value:{...item.value,password:''}})));
      await load();
    }catch(e){setError(`No se confirmó la importación: ${apiErrorMessage(e)}. FastAPI revierte todo el lote si detecta un error; ante fallos de red verifica las matrículas antes de reenviar.`);}
    finally{setBusy(false);}
  }
  return <main className="campus-workspace lms-academic">
    <header className="workspace-heading"><div><p className="lms-eyebrow">GESTIÓN DEL CURSO / ADMIN</p><h1>Matrículas</h1>
      <p>Gestiona estudiantes y profesores del curso. La matrícula administrativa se acepta directamente.</p></div>
      <button className="lms-outline-button" onClick={()=>void load()} disabled={busy}><RefreshCw size={17}/> Recargar</button></header>
    {error&&<ToastMessage kind="error" message={error} />}{notice&&<ToastMessage kind="success" message={notice} />}
    <div className="workspace-tabs" role="tablist" aria-label="Opciones de matrículas">
      <button role="tab" aria-selected={tab==='existing'} className={tab==='existing'?'selected':''} onClick={()=>{setTab('existing');setResults([]);}}><UserPlus size={18}/> Usuarios existentes</button>
      <button role="tab" aria-selected={tab==='mass'} className={tab==='mass'?'selected':''} onClick={()=>{setTab('mass');setResults([]);}}><FileSpreadsheet size={18}/> Matrícula masiva / Excel</button>
      <button role="tab" aria-selected={tab==='list'} className={tab==='list'?'selected':''} onClick={()=>{setTab('list');setResults([]);}}><Users size={18}/> Matrículas ({enrollments.length})</button>
    </div>
    {tab==='existing'&&<section className="workspace-panel"><div className="workspace-panel-header"><h2>Matricular usuarios del sistema</h2>
        <p>Busca por nombre, usuario, cédula o correo y selecciona todos los participantes.</p></div>
      <div className="workspace-filter-row"><label className="workspace-search"><Search size={18}/>
        <input placeholder="Buscar usuarios..." value={query} onChange={e=>{setQuery(e.target.value);setSearchPage(1);}}/></label>
        <label className="workspace-short-field">Rol para seleccionados<select value={role} onChange={e=>setRole(e.target.value as CourseRole)} disabled={busy}>
          <option value="STUDENT">Estudiante</option><option value="TEACHER">Profesor</option></select></label></div>
      <div className="workspace-people-list">{available.map(user=>{
        const previous=byUser.get(user.id);const checked=Boolean(selected[user.id]);
        return <label key={user.id} className="workspace-person-row"><input type="checkbox" checked={checked} disabled={busy||previous?.status==='ACEPTADO'}
          onChange={e=>setSelected(old=>{const next={...old};if(e.target.checked)next[user.id]=user;else delete next[user.id];return next;})}/>
          <span><strong>{user.firstname} {user.lastname}</strong><small>{user.username} · {user.idnumber||'Sin cédula'} · {user.email||'Sin correo'}</small></span>
          {previous&&<span className="workspace-row-state">{previous.status} · {previous.role.code==='TEACHER'?'Profesor':'Estudiante'}</span>}</label>;
      })}{!searching&&!available.length&&<p className="workspace-empty">No se encontraron usuarios disponibles.</p>}
      {searching&&<p className="workspace-fineprint">Buscando usuarios...</p>}</div>
      <div className="workspace-actions workspace-bottom-actions">
        <span>Página {searchPage} · {searchTotal} resultado(s) · 25 por página</span>
        <button className="lms-outline-button" disabled={searching||searchPage<=1} onClick={()=>setSearchPage(page=>page-1)}>Anterior</button>
        <button className="lms-outline-button" disabled={searching||searchPage*25>=searchTotal} onClick={()=>setSearchPage(page=>page+1)}>Siguiente</button>
      </div>
      {Object.keys(selected).length>0&&<p className="workspace-fineprint">Seleccionados en todas las páginas: {Object.values(selected).map(u=>u.username).join(', ')}. <button className="lms-outline-button" type="button" disabled={busy} onClick={()=>setSelected({})}>Limpiar selección</button></p>}
      <div className="workspace-actions workspace-bottom-actions"><span>{Object.keys(selected).length} seleccionado(s)</span>
        <button className="button button-primary" disabled={busy||!Object.keys(selected).length||loading} onClick={()=>void enrollExisting()}><CheckCircle2 size={17}/>
          {busy?'Guardando lote...':`Matricular ${Object.keys(selected).length} participante(s)`}</button></div></section>}
    {tab==='mass'&&<section className="workspace-panel"><div className="workspace-panel-header"><h2>Crear usuarios y matricular masivamente</h2>
        <p>Completa filas manualmente o importa la plantilla Excel con encabezados en español. El rol se asigna por persona.</p></div>
      <div className="workspace-import-toolbar"><a className="lms-outline-button" href="/plantilla_matricula_es.xlsx" download><Download size={17}/> Descargar plantilla Excel</a>
        <label className="lms-outline-button workspace-upload-button"><Upload size={17}/> Importar Excel (.xlsx)
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} hidden
            onChange={e=>{const file=e.target.files?.[0];if(file)void importExcel(file);e.target.value='';}}/></label>
        <button className="lms-outline-button" disabled={busy||mass.length>=300} onClick={()=>setMass(old=>[...old,{key:Math.max(0,...old.map(x=>x.key))+1,value:{...blankPerson(),role_code:massRole}}])}>
          <Plus size={16}/> Agregar fila</button>
        <button className="lms-outline-button" disabled={busy} onClick={()=>{setMass([newRow(1)]);setResults([]);}}><Trash2 size={16}/> Limpiar</button></div>
      <div className="workspace-mass-global"><label>Aplicar este rol a todas las filas<select value={massRole} onChange={e=>{
        const next=e.target.value as CourseRole;setMassRole(next);setMass(rows=>rows.map(item=>({...item,value:{...item.value,role_code:next}})));}}>
          <option value="STUDENT">Estudiante</option><option value="TEACHER">Profesor</option></select></label>
        <p>Se busca primero por cédula en el tenant. Si existe, se matricula esa cuenta sin comparar ni modificar los demás campos del Excel. Si no existe, deben proporcionarse usuario, contraseña de 8+ caracteres, nombres, apellidos y un correo válido para crearla. Rol predeterminado: Estudiante.</p></div>
      <div className="workspace-mass-rows">{mass.map((item,index)=>{
        const v=item.value;return <article className="workspace-mass-person" key={item.key}>
          <div className="workspace-mass-person-title"><strong>Participante {index+1}</strong>
          <button type="button" title="Eliminar fila" className="workspace-icon-button" disabled={busy||mass.length===1}
            onClick={()=>setMass(old=>old.filter(row=>row.key!==item.key))}><Trash2 size={17}/></button></div>
          <div className="workspace-form-grid workspace-person-grid">
            {([['username','Usuario (nuevo)','jperez'],['password','Contraseña (nuevo usuario)','Mínimo 8 caracteres'],
              ['firstname','Nombres (nuevo)','Juan'],['lastname','Apellidos (nuevo)','Pérez'],['idnumber','Cédula *','0102030405'],
              ['email','Correo (nuevo)','juan@correo.com'],['phone_number','Teléfono','0999999999'],['province','Provincia','Chimborazo']] as const)
              .map(([field,label,placeholder])=><label key={field}>{label}<input type={field==='password'?'password':'text'}
                autoComplete="off" placeholder={placeholder} value={v[field]} disabled={busy} onChange={e=>massChange(item.key,field,e.target.value)}/></label>)}
            <label>Rol del curso<select value={v.role_code} disabled={busy} onChange={e=>massChange(item.key,'role_code',e.target.value)}>
              <option value="STUDENT">Estudiante</option><option value="TEACHER">Profesor</option></select></label>
          </div></article>;
      })}</div>
      <div className="workspace-actions workspace-bottom-actions"><span>{mass.length} persona(s)</span>
        <button className="button button-primary" disabled={busy||!mass.length||loading}
          onClick={()=>void enrollMass()}><CheckCircle2 size={17}/>{busy?'Procesando lote...':'Matricular lote completo'}</button></div>
      <p className="workspace-fineprint"><AlertCircle size={15}/> No importes claves definitivas. El backend valida y confirma todo el lote de forma atómica: si falla una fila, se revierten también los usuarios y las asistencias generadas. No se realizan creaciones individuales desde Next.js.</p>
    </section>}
    {tab==='list'&&<section className="workspace-panel"><div className="workspace-panel-header"><h2>Participantes y solicitudes</h2>
      <p>Puedes aceptar, rechazar, cancelar y cambiar el rol sin crear matrículas duplicadas.</p></div>
      <div className="workspace-filter-row"><label className="workspace-search"><Search size={17}/><input placeholder="Buscar matrícula..." value={listQuery} onChange={e=>setListQuery(e.target.value)}/></label>
        <select aria-label="Estado de matrícula" value={listStatus} onChange={e=>setListStatus(e.target.value)}>
          <option value="ALL">Todos los estados</option>{['PENDIENTE','ACEPTADO','RECHAZADO','CANCELADO'].map(s=><option key={s}>{s}</option>)}</select></div>
      <div className="workspace-table-scroll"><table className="workspace-table"><thead><tr><th>Participante</th><th>Estado</th><th>Rol</th><th>Acciones</th></tr></thead>
        <tbody>{visibleEnrollments.map(e=>{
          const user=personById.get(e.user.id);
          return <tr key={e.id}><td><strong>{user?`${user.firstname} ${user.lastname}`:`${e.user.firstname} ${e.user.lastname}`}</strong>
            <small>{user?.username||e.user.idnumber||`ID ${e.user.id}`}</small></td>
            <td><span className="workspace-row-state">{e.status}</span></td>
            <td><select aria-label={`Rol de ${e.user.firstname}`} value={e.role.code} disabled={busy||e.status!=='ACEPTADO'}
              onChange={event=>void manageEnrollment(e,'role',event.target.value as CourseRole)}>
                <option value="STUDENT">Estudiante</option><option value="TEACHER">Profesor</option></select></td>
            <td><div className="workspace-actions">{e.status!=='ACEPTADO'&&<button className="lms-outline-button" disabled={busy} onClick={()=>void manageEnrollment(e,'accept')}>Aceptar</button>}
              {e.status==='PENDIENTE'&&<button className="lms-outline-button" disabled={busy} onClick={()=>void manageEnrollment(e,'reject')}>Rechazar</button>}
              {e.status==='ACEPTADO'&&<button className="lms-outline-button" disabled={busy} onClick={()=>void manageEnrollment(e,'cancel')}>Cancelar</button>}</div></td></tr>;
        })}</tbody></table>{!loading&&!visibleEnrollments.length&&<p className="workspace-empty">Sin matrículas para estos filtros.</p>}</div>
    </section>}
    {results.length>0&&<section className="workspace-panel workspace-result-panel" aria-live="polite"><h2>Resultado por participante</h2>
      <div>{results.map((item,i)=><p key={`${item.label}-${i}`} className={`workspace-result ${item.status}`}>
        {item.status==='ok'?<CheckCircle2 size={17}/>:<AlertCircle size={17}/>}<strong>{item.label}</strong><span>{item.detail}</span></p>)}</div>
    </section>}
  </main>;
}
