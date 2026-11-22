'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {CheckCircle2,Download,Eye,FilePlus2,Files,History,RefreshCw,Search,UploadCloud} from 'lucide-react';
import {CERT_IMPORT_BATCH,certificateApi,certificateRequest,displayDate,
  parseRoster,parseImportSummary,parseEvents,readableError,validPdf,
  type ExternalRoster,type ExternalStudent,type ImportResult,type CertEvent} from '@/lib/course-workspace/certificates';
import {CertificatePdfViewer} from './certificate-pdf-viewer';
import css from './course-certificates.module.css';

export function CertificateExternalManager({courseId,code}:{courseId:number;code:'MDT'|'INSTITUTIONAL'}){
  const [roster,setRoster]=useState<ExternalRoster|null>(null);
  const [page,setPage]=useState(1);
  const [draft,setDraft]=useState('');
  const [search,setSearch]=useState('');
  const [revision,setRevision]=useState(0);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [selection,setSelection]=useState<File[]>([]);
  const [results,setResults]=useState<ImportResult[]|null>(null);
  const [uploadTarget,setUploadTarget]=useState<ExternalStudent|null>(null);
  const [uploaded,setUploaded]=useState<File|null>(null);
  const [reason,setReason]=useState('');
  const [viewer,setViewer]=useState<{id:number;studentName:string}|null>(null);
  const [historyId,setHistoryId]=useState<number|null>(null);
  const [events,setEvents]=useState<CertEvent[]|null>(null);
  const [historyError,setHistoryError]=useState('');
  const api=useCallback((path:string)=>certificateApi(courseId,path),[courseId]);
  const kindLabel=code==='MDT'?'Ministerio del Trabajo':'Institucional';

  useEffect(()=>{
    const timeout=setTimeout(()=>setSearch(value=>value===draft.trim()?value:draft.trim()),350);
    return()=>clearTimeout(timeout);
  },[draft]);
  useEffect(()=>setPage(1),[search,code]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    const q=new URLSearchParams({certificate_type:code,page:String(page),page_size:'25'});
    if(search)q.set('search',search);
    void certificateRequest(api(`external/students?${q}`),{signal:controller.signal})
      .then(v=>{if(!controller.signal.aborted)setRoster(parseRoster(v,courseId,code));})
      .catch(e=>{if(!controller.signal.aborted)setError(readableError(e));})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[courseId,code,page,search,revision,api]);
  useEffect(()=>{
    if(historyId===null)return;
    let active=true;setEvents(null);setHistoryError('');
    void certificateRequest(api(`external/${historyId}/history`))
      .then(v=>{if(active)setEvents(parseEvents(v));})
      .catch(e=>{if(active)setHistoryError(readableError(e));});
    return()=>{active=false;};
  },[courseId,historyId,code,api]);
  const uploadedCount=useMemo(()=>roster?.students.filter(s=>s.certificate_id!==null).length??0,[roster]);
  const pages=roster?Math.max(1,Math.ceil(roster.total/roster.page_size)):1;

  function onBatch(files:FileList|null){
    if(!files)return;
    const received=Array.from(files);
    const invalid=received.find(f=>validPdf(f));
    if(invalid){setError(`${invalid.name}: ${validPdf(invalid)}`);return;}
    if(received.length>400){setError('Selecciona hasta 400 PDF por importación para evitar bloquear el navegador.');return;}
    setError('');setSelection(received);setResults(null);
  }
  async function runBatch(){
    if(!selection.length)return;
    setWorking(true);setError('');setResults(null);setNotice('');
    const collected:ImportResult[]=[];
    try{
      for(let index=0;index<selection.length;index+=CERT_IMPORT_BATCH){
        const files=selection.slice(index,index+CERT_IMPORT_BATCH);
        const form=new FormData();form.append('course_id',String(courseId));
        form.append('certificate_type',code);
        for(const file of files)form.append('files',file);
        const value=await certificateRequest(api(`external/import?type=${code}`),{method:'POST',body:form});
        const result=parseImportSummary(value,courseId,code);
        collected.push(...result.results);setResults([...collected]);
      }
      setNotice('La importación terminó. Revisa el resultado de cada archivo.');
      setSelection([]);setRevision(n=>n+1);
    }catch(e){setError(`${readableError(e)}. Si se interrumpió un lote, comprueba el listado antes de reintentarlo.`);}
    finally{setWorking(false);}
  }
  function openUpload(student:ExternalStudent){
    setUploadTarget(student);setUploaded(null);setReason('');setError('');
  }
  async function saveStudent(){
    const student=uploadTarget,file=uploaded;
    if(!student||!file)return;
    const problem=validPdf(file);
    if(problem){setError(problem);return;}
    const correction=student.certificate_id!==null;
    if(correction&&!reason.trim()){setError('Debes indicar el motivo de la corrección.');return;}
    setWorking(true);setError('');setNotice('');
    try{
      const form=new FormData();form.append('file',file);
      if(correction)form.append('reason',reason.trim());
      else form.append('certificate_type',code);
      const target=correction?api(`external/${student.certificate_id}/file`):api(`external/students/${student.enrollment_id}`);
      await certificateRequest(target,{method:correction?'PUT':'POST',body:form});
      setUploadTarget(null);setUploaded(null);setReason('');
      setNotice(correction?'Documento corregido. Se conservó la versión anterior en el historial.':'PDF registrado correctamente para este estudiante.');
      setRevision(n=>n+1);
    }catch(e){setError(readableError(e));}
    finally{setWorking(false);}
  }
  return <div className="workspace-panel" aria-label={`Certificados ${kindLabel}`}>
    <div className="workspace-panel-header"><h2>{kindLabel}</h2>
      <p>Certificados PDF externos guardados por identidad protegida. Importa por cédula del nombre o selecciona una matrícula aceptada.</p>
    </div>
    <section className={css.importPanel} aria-label="Importación masiva">
      <div><h3><Files size={19}/> Importación masiva</h3>
        <p>Admite nombres como <code>1804124160-signed.pdf</code> o <code>signed-1804124160-signed.pdf</code>, siempre con una única cédula ecuatoriana válida. El backend comprueba cada PDF.</p>
        <p className={css.hint}>Se envían lotes de máximo {CERT_IMPORT_BATCH} archivos. Cada PDF debe ser menor o igual a 25 MiB.</p>
      </div>
      <div className={css.importControls}>
        <label className={css.fileInput}><UploadCloud size={18}/> Seleccionar PDFs
          <input type="file" accept="application/pdf,.pdf" multiple disabled={working}
            onChange={event=>{onBatch(event.target.files);event.target.value='';}}/>
        </label>
        <button type="button" className="button button-primary" disabled={!selection.length||working}
          onClick={()=>void runBatch()}><Files size={17}/>{working?'Procesando...':`Importar ${selection.length} PDF`}</button>
      </div>
      {selection.length>0&&<p className={css.hint}>{selection.length} archivos seleccionados. Tamaño total: {(selection.reduce((n,f)=>n+f.size,0)/1048576).toFixed(1)} MiB.</p>}
      {results&&<div className={css.importResults} role="status" aria-label="Resultado por archivo">
        <strong>Resultados: {results.filter(r=>r.status.toLowerCase()==='imported').length} importados de {results.length} procesados</strong>
        <div className={css.resultsScroll}>{results.map((r,i)=><div key={`${i}-${r.filename}`}>
          <span className={r.status.toLowerCase()==='imported'?css.resultOk:css.resultError}>
            {r.status.toLowerCase()==='imported'?'Importado':'No importado'}</span>
          <span title={r.filename}>{r.filename}</span>{r.message&&<small>{r.message}</small>}
        </div>)}</div>
      </div>}
    </section>
    {notice&&<p className={css.success} role="status"><CheckCircle2 size={16}/>{notice}</p>}
    {error&&<div className="lms-error" role="alert">{error}</div>}
    <div className={css.rosterHeader}><div><h3>Certificados por estudiante</h3>
      <p>Solo matrículas STUDENT ACEPTADO. La asociación se determina mediante la cédula cifrada y su índice de búsqueda.</p></div>
      <div className={css.rosterStats}><strong>{uploadedCount}</strong> cargados en esta página</div>
    </div>
    <div className={css.filterBar}>
      <label className={css.search}><Search size={18}/><input type="search" maxLength={160}
        value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Nombre, usuario o correo"/></label>
      <button className="lms-outline-button" type="button" disabled={loading} onClick={()=>setRevision(n=>n+1)}><RefreshCw size={16}/> Actualizar</button>
    </div>
    {loading?<p className={css.empty} role="status">Consultando certificados...</p>:roster&&<>
      {roster.students.length===0?<p className={css.empty}>No se encontraron estudiantes aceptados para esta búsqueda.</p>:
        <div className={css.tableScroll}><table className={css.table}>
          <thead><tr><th>Estudiante</th><th>Estado</th><th>Documento</th><th>Gestión</th></tr></thead>
          <tbody>{roster.students.map(student=><tr key={student.enrollment_id}>
            <td><strong>{student.student_name}</strong><small>{student.email||student.username}</small></td>
            <td><span className={`${css.status} ${student.certificate_id!==null?css.statusOk:css.statusPending}`}>
              {student.certificate_id!==null?'Cargado':'Pendiente'}</span></td>
            <td>{student.certificate_id!==null?
              <button type="button" className="lms-outline-button" onClick={()=>setViewer({id:student.certificate_id!,studentName:student.student_name})}>
                <Eye size={16}/> Ver PDF</button>:<span className={css.muted}>Sin adjuntos</span>}</td>
            <td><div className={css.tableActions}>
              <button type="button" className="lms-outline-button" disabled={!student.has_identity} onClick={()=>openUpload(student)}>
                <FilePlus2 size={15}/> {student.certificate_id!==null?'Corregir PDF':'Subir PDF'}</button>
              {student.certificate_id!==null&&<button type="button" className="lms-outline-button" onClick={()=>setHistoryId(student.certificate_id)}>
                <History size={15}/> Historial</button>}
              {!student.has_identity&&<small className={css.muted}>Falta cédula del estudiante</small>}
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      <div className={css.pager}>
        <button type="button" className="lms-outline-button" onClick={()=>setPage(n=>n-1)} disabled={page<=1}>Anterior</button>
        <span>{roster.total} estudiantes · página {page} de {pages}</span>
        <button type="button" className="lms-outline-button" onClick={()=>setPage(n=>n+1)} disabled={page>=pages}>Siguiente</button>
      </div>
    </>}
    {viewer&&<CertificatePdfViewer title={`${kindLabel} · ${viewer.studentName}`}
      previewUrl={api(`external/${viewer.id}/preview`)} downloadUrl={api(`external/${viewer.id}/download`)} onClose={()=>setViewer(null)}/>}
    {uploadTarget&&<div className="lms-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!working)setUploadTarget(null);}}>
      <section className={`lms-modal ${css.actionModal}`} role="dialog" aria-modal="true" aria-labelledby="external-upload-title">
        <h2 id="external-upload-title">{uploadTarget.certificate_id!==null?'Corregir':'Subir'} certificado {kindLabel}</h2>
        <p>Estudiante: <strong>{uploadTarget.student_name}</strong></p>
        <p className={css.hint}>La cédula se obtiene de la matrícula seleccionada. No es necesario escribirla en el nombre del PDF.</p>
        <label className={css.formLabel}>Documento PDF (máximo 25 MiB)
          <input type="file" accept="application/pdf,.pdf" onChange={e=>{
            const chosen=e.target.files?.[0]??null;e.target.value='';
            if(chosen){const problem=validPdf(chosen);if(problem){setError(problem);setUploaded(null);return;}}
            setError('');setUploaded(chosen);
          }}/>
        </label>
        {uploaded&&<p className={css.hint}>{uploaded.name} · {(uploaded.size/1048576).toFixed(2)} MiB</p>}
        {uploadTarget.certificate_id!==null&&<label className={css.reason}>Motivo de corrección
          <textarea maxLength={500} rows={3} value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="Por ejemplo: documento incorrecto o ilegible"/>
        </label>}
        {error&&<div className="lms-error" role="alert">{error}</div>}
        <div className={css.actions}>
          <button type="button" className="lms-outline-button" disabled={working} onClick={()=>{setUploadTarget(null);setError('');}}>Cancelar</button>
          <button type="button" className="button button-primary" disabled={working||!uploaded||
            (uploadTarget.certificate_id!==null&&!reason.trim())} onClick={()=>void saveStudent()}>
            {working?'Subiendo...':uploadTarget.certificate_id!==null?'Confirmar corrección':'Subir PDF'}</button>
        </div>
      </section>
    </div>}
    {historyId!==null&&<div className="lms-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setHistoryId(null);}}>
      <section className={`lms-modal ${css.historyModal}`} role="dialog" aria-modal="true" aria-labelledby="external-history-title">
        <div className={css.modalTitle}><h2 id="external-history-title">Historial del documento</h2>
          <button type="button" className="lms-outline-button" onClick={()=>setHistoryId(null)}>Cerrar</button></div>
        {historyError&&<div className="lms-error" role="alert">{historyError}</div>}
        {events===null?<p>Cargando eventos...</p>:events.length===0?<p>No hay eventos registrados.</p>:
          <div className={css.historyList}>{events.map(event=><article key={event.id}>
            <div><strong>{event.action==='IMPORT'?'Importación':event.action==='CORRECT'?'Corrección':event.action}</strong>
              <small>{displayDate(event.created_at)} · Actor #{event.actor_user_id}</small></div>
            {event.reason&&<p>Motivo: {event.reason}</p>}
            <div className={css.actions}>
              <a className="lms-outline-button" href={api(`external/${historyId}/history/${event.id}/pdf`)}><Download size={15}/> PDF registrado</a>
              {event.action==='CORRECT'&&<a className="lms-outline-button" href={api(`external/${historyId}/history/${event.id}/previous-pdf`)}>PDF anterior</a>}
            </div>
          </article>)}</div>}
      </section>
    </div>}
  </div>;
}
