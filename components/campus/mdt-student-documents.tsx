'use client';
import { confirmAction, ToastMessage } from '@/components/ui/notifications';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,ChevronLeft,ChevronRight,Download,Eye,FilePlus2,FolderOpen,Info,Search,UploadCloud,X} from 'lucide-react';
import {apiErrorMessage,requestJson} from '@/lib/academic/client';
import {mdtAttachmentUrl,mdtAttachmentPreviewUrl,mdtUrl,readMdtHomeworkResponse,readMdtStudents,
  validateMdtFiles,type MdtResourceBlock,type MdtStudentDocument,
  type MdtStudentDocumentPage,type MdtStudentStatus} from '@/lib/course-workspace/mdt-resources';
import {MdtPdfPreview} from './mdt-pdf-preview';

const pageSize=25;
const humanSize=(bytes:number)=>bytes<1024?`${bytes} B`:bytes<1024*1024?`${(bytes/1024).toFixed(1)} KiB`:`${(bytes/1024/1024).toFixed(1)} MiB`;
const person=(row:MdtStudentDocument)=>`${row.firstname} ${row.lastname}`.trim()||row.username;

export function MdtStudentDocuments({courseId,blocks,onChanged}:{
  courseId:number;blocks:MdtResourceBlock[];onChanged:()=>Promise<void>;
}){
  const [chosen,setChosen]=useState<number|null>(null);
  const [page,setPage]=useState(1),[status,setStatus]=useState<MdtStudentStatus>('TODOS');
  const [searchDraft,setSearchDraft]=useState(''),[search,setSearch]=useState('');
  const [rows,setRows]=useState<MdtStudentDocumentPage|null>(null);
  const [loading,setLoading]=useState(false),[reload,setReload]=useState(0);
  const [error,setError]=useState(''),[notice,setNotice]=useState('');
  const [editor,setEditor]=useState<MdtStudentDocument|null>(null);
  const [files,setFiles]=useState<File[]>([]),[comment,setComment]=useState('');
  const [busy,setBusy]=useState(false),[editorError,setEditorError]=useState('');
  const [preview,setPreview]=useState<{filename:string;title:string;id:number}|null>(null);
  const selected=blocks.find(item=>item.id===chosen)||blocks[0]||null;
  const blockId=selected?.id??null;
  const url=mdtUrl(courseId);
  const loadRows=useCallback(async(signal:AbortSignal)=>{
    if(blockId===null){setRows(null);return;}
    setLoading(true);setError('');setRows(null);
    const params=new URLSearchParams({page:String(page),page_size:String(pageSize),status});
    if(search)params.set('search',search);
    try{
      const value=await requestJson(`${url}/homework/${blockId}/students?${params}`,signal);
      if(!signal.aborted)setRows(readMdtStudents(value,courseId,blockId));
    }catch(e){if(!signal.aborted)setError(apiErrorMessage(e));}
    finally{if(!signal.aborted)setLoading(false);}
  },[blockId,page,status,search,courseId,url]);
  useEffect(()=>{
    const controller=new AbortController();void loadRows(controller.signal);
    return ()=>controller.abort();
  },[loadRows,reload]);
  function choose(id:number){
    setChosen(id);setPage(1);setSearch('');setSearchDraft('');setStatus('TODOS');
    setNotice('');setError('');setRows(null);
  }
  function filter(e:FormEvent){e.preventDefault();setPage(1);setSearch(searchDraft.trim());}
  function openEditor(row:MdtStudentDocument){
    setEditor(row);setFiles([]);setComment(row.response?.comment||'');setEditorError('');
  }
  function closeEditor(){if(!busy){setEditor(null);setFiles([]);setEditorError('');}}
  async function upload(e:FormEvent){
    e.preventDefault();if(!editor||!selected||busy)return;
    const validation=validateMdtFiles(files,'homework');
    if(validation){setEditorError(validation);return;}
    if(comment.length>20000){setEditorError('El comentario supera 20 000 caracteres.');return;}
    if(editor.submitted&&!(await confirmAction(`¿Reemplazar el documento actual de ${person(editor)}? El archivo anterior dejará de estar disponible.`)))return;
    setBusy(true);setEditorError('');setError('');setNotice('');
    const form=new FormData();form.append('files',files[0],files[0].name);
    // Enviar incluso vacío permite eliminar un comentario anterior.
    form.set('comment',comment.trim());
    try{
      const result=readMdtHomeworkResponse(await requestJson(
        `${url}/homework/${selected.id}/students/${editor.enrollment_id}/files`,undefined,{method:'PUT',body:form}));
      if(result.enrollment_id!==editor.enrollment_id||result.lesson_block_id!==selected.id||result.attachments.length!==1)
        throw Error('FastAPI devolvió una entrega no relacionada con esta matrícula.');
      setEditor(null);setFiles([]);
      setNotice(`PDF de ${person(editor)} ${editor.submitted?'reemplazado':'guardado'} correctamente.`);
      setReload(v=>v+1);
      await onChanged();
    }catch(e){setEditorError(`No se pudo confirmar la operación: ${apiErrorMessage(e)}. Actualiza el listado antes de reintentar si se perdió la conexión.`);}
    finally{setBusy(false);}
  }
  if(!blocks.length)return <div className="workspace-panel workspace-empty"><FolderOpen size={30} aria-hidden="true"/>
    No hay requisitos Homework de raíz para este curso MDT. No se crean bloques nuevos desde Recursos MDT.</div>;
  return <div className="mdt-documents-layout">
    <aside className="workspace-panel mdt-requirements" aria-label="Requisitos documentales">
      <div className="workspace-panel-header"><h2>Requisitos</h2><p>Selecciona un bloque para gestionar las entregas de sus estudiantes.</p></div>
      <div className="mdt-requirement-list">
        {blocks.map(item=>{
          const total=item.total_students??0,done=item.uploaded_students??0,active=item.id===selected?.id;
          return <button type="button" key={item.id} className={`mdt-requirement ${active?'active':''}`}
            aria-pressed={active} onClick={()=>choose(item.id)}>
            <strong>{item.title}</strong><small>{done} de {total} entregados {item.is_active?'':'· Inactivo para estudiante'}</small>
            <span className="mdt-progress" role="img" aria-label={`${total?Math.round(done/total*100):0}% completado`}>
              <span style={{width:`${total?Math.min(100,done/total*100):0}%`}}/></span>
          </button>;
        })}
      </div>
    </aside>
    <section className="workspace-panel mdt-students" aria-label="Entregas de estudiantes">
      <div className="workspace-panel-header">
        <h2>{selected?.title}</h2>
        {selected?.instructions&&<p>{selected.instructions}</p>}
        <p>Incluye matrículas STUDENT aceptadas. Cada requisito admite un solo PDF de hasta 25 MiB, sin calificación.</p>
      </div>
      {notice&&<ToastMessage kind="success" message={notice} />}
      {error&&<ToastMessage kind="error" message={error}><button type="button" onClick={()=>setReload(v=>v+1)}>Reintentar</button></ToastMessage>}
      <form className="mdt-filters" onSubmit={filter}>
        <label className="workspace-search"><Search size={17} aria-hidden="true"/>
          <span className="sr-only">Buscar estudiante</span>
          <input value={searchDraft} maxLength={150} placeholder="Nombre, usuario o correo" onChange={e=>setSearchDraft(e.target.value)}/>
        </label>
        <label className="sr-only" htmlFor="mdt-status">Filtrar por entrega</label>
        <select id="mdt-status" value={status} onChange={e=>{setStatus(e.target.value as MdtStudentStatus);setPage(1);}}>
          <option value="TODOS">Todos</option><option value="ENTREGADO">Entregados</option><option value="PENDIENTE">Pendientes</option>
        </select>
        <button className="lms-outline-button" type="submit" disabled={loading}>Buscar</button>
        {(search||status!=='TODOS')&&<button type="button" className="mdt-link-button" onClick={()=>{
          setSearch('');setSearchDraft('');setStatus('TODOS');setPage(1);
        }}>Limpiar</button>}
      </form>
      {loading?<div className="workspace-empty" role="status">Consultando estudiantes...</div>:rows&&<>
        <p className="mdt-list-count" role="status">{rows.total} estudiante(s) · página {rows.page} de {Math.max(1,Math.ceil(rows.total/pageSize))}</p>
        <div className="workspace-table-scroll"><table className="workspace-table mdt-students-table">
          <thead><tr><th>Estudiante</th><th>Estado</th><th>Documento</th><th>Gestión</th></tr></thead>
          <tbody>{rows.items.map(row=><tr key={row.enrollment_id}>
            <td><strong>{person(row)}</strong><small>{row.username}{row.email?` · ${row.email}`:''}</small></td>
            <td>{row.submitted?<span className="mdt-state mdt-done"><CheckCircle2 size={15}/> Entregado</span>:
              <span className="mdt-state mdt-waiting">Pendiente</span>}
              {row.legacy_requires_migration&&<small className="mdt-legacy">Entrega antigua por actualizar</small>}
              {row.requires_pdf_update&&<small className="mdt-legacy">Requiere reemplazar por un único PDF</small>}</td>
            <td>{row.response?.attachments.length?<ul className="mdt-attachment-list">{row.response.attachments.map(file=><li key={file.id}>
              {(file.can_preview||/\.pdf$/i.test(file.original_filename))?<button type="button" className="lms-outline-button mdt-document-view"
                onClick={()=>setPreview({id:file.id,filename:file.original_filename,title:`${selected?.title} · ${person(row)}`})}>
                <Eye size={15} aria-hidden="true"/> Ver PDF</button>:
                <a className="mdt-legacy-download" href={mdtAttachmentUrl(courseId,file.id)}
                  title={`Descargar documento anterior: ${file.original_filename}`}>
                  <Download size={14} aria-hidden="true"/> Descargar anterior</a>}
              </li>)}</ul>:<span className="mdt-muted">Sin adjuntos</span>}</td>
            <td><button type="button" className="lms-outline-button" onClick={()=>openEditor(row)}>
              {row.submitted?'Reemplazar':'Subir archivo'} <FilePlus2 size={15} aria-hidden="true"/></button></td>
          </tr>)}</tbody></table></div>
        {!rows.items.length&&<div className="workspace-empty">No se encontraron estudiantes con esos filtros.</div>}
        <nav className="mdt-pagination" aria-label="Paginación de estudiantes">
          <button type="button" className="lms-outline-button" disabled={rows.page<=1} onClick={()=>setPage(p=>p-1)}>
            <ChevronLeft size={16}/> Anterior</button>
          <span>{rows.total?`${(rows.page-1)*pageSize+1}–${Math.min(rows.page*pageSize,rows.total)} de ${rows.total}`:'Sin resultados'}</span>
          <button type="button" className="lms-outline-button" disabled={rows.page*pageSize>=rows.total} onClick={()=>setPage(p=>p+1)}>
            Siguiente <ChevronRight size={16}/></button>
        </nav>
      </>}
    </section>
    {editor&&<div className="lms-modal-backdrop" role="presentation" onMouseDown={e=>{
      if(e.target===e.currentTarget)closeEditor();
    }}><section className="lms-modal mdt-upload-dialog" role="dialog" aria-modal="true"
      aria-labelledby="mdt-upload-heading" aria-describedby="mdt-upload-description">
      <header className="mdt-dialog-header"><div><p className="lms-eyebrow">DOCUMENTO MDT</p>
        <h2 id="mdt-upload-heading">{editor.submitted?'Reemplazar PDF':'Subir PDF'}</h2>
        </div><button type="button" className="mdt-icon-button" aria-label="Cerrar" disabled={busy} onClick={closeEditor}><X size={20}/></button></header>
      <p id="mdt-upload-description"><strong>{person(editor)}</strong> · {selected?.title} · matrícula #{editor.enrollment_id}</p>
      {editor.submitted&&<p className="mdt-advisory"><Info size={17}/> El PDF anterior será sustituido. El estudiante podrá reemplazar nuevamente su documento desde su entrega MDT.</p>}
      {editor.legacy_requires_migration&&<p className="mdt-advisory"><Info size={17}/> La entrega antigua requiere actualización. El nuevo PDF sustituirá el documento anterior sin borrar la auditoría.</p>}
      <form className="mdt-upload-form" onSubmit={e=>void upload(e)}>
        <label className="mdt-file-picker"><UploadCloud size={24} aria-hidden="true"/>
          <span>Seleccionar PDF</span><small>Exactamente 1 archivo PDF · máximo 25 MiB.</small>
          <input type="file" required disabled={busy}
            accept=".pdf,application/pdf"
            onChange={e=>{setFiles(e.currentTarget.files?.[0]?[e.currentTarget.files[0]]:[]);setEditorError('');}}/>
        </label>
        {!!files.length&&<ul className="mdt-selected-files">{files.map((file,i)=><li key={`${file.name}-${i}`}>{file.name} <small>{humanSize(file.size)}</small></li>)}</ul>}
        <label className="mdt-comment-label">Comentario (opcional)
          <textarea value={comment} disabled={busy} maxLength={20000} rows={3}
            onChange={e=>setComment(e.target.value)} placeholder="Observaciones sobre la entrega"/></label>
        {editorError&&<ToastMessage kind="error" message={editorError} />}
        <div className="mdt-dialog-actions"><button type="button" className="lms-outline-button" disabled={busy} onClick={closeEditor}>Cancelar</button>
          <button className="button button-primary" type="submit" disabled={busy||!files.length}>
            <UploadCloud size={17}/>{busy?'Subiendo...':editor.submitted?'Confirmar reemplazo':'Guardar entrega'}</button></div>
      </form>
    </section></div>}
    {preview&&<MdtPdfPreview title={preview.title} filename={preview.filename}
      previewUrl={mdtAttachmentPreviewUrl(courseId,preview.id)}
      downloadUrl={mdtAttachmentUrl(courseId,preview.id)} onClose={()=>setPreview(null)}/>}
  </div>;
}
