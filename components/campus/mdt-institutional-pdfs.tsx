'use client';
import { confirmAction, ToastMessage } from '@/components/ui/notifications';
import {useState,type ChangeEvent} from 'react';
import {Download,Eye,FileCheck2,FileUp,Info,RefreshCw} from 'lucide-react';
import {apiErrorMessage,requestJson} from '@/lib/academic/client';
import {mdtPdfPreviewUrl,mdtPdfUrl,mdtUrl,readMdtPdfUpload,validateMdtFiles,type MdtResourceBlock} from '@/lib/course-workspace/mdt-resources';
import {MdtPdfPreview} from './mdt-pdf-preview';
const when=(v:string|null)=>v&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleString('es-EC'):'Sin fecha registrada';
/** PDF de curso, NO una entrega por alumno. El archivo se guarda como contenido
 * del LessonBlock y únicamente puede consultarlo ADMIN / TEACHER del curso. */
export function MdtInstitutionalPdfs({courseId,blocks,onChanged}:{
  courseId:number;blocks:MdtResourceBlock[];onChanged:()=>Promise<void>;
}){
  const [busyId,setBusyId]=useState<number|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [preview,setPreview]=useState<MdtResourceBlock|null>(null);
  async function upload(block:MdtResourceBlock,event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0]||null;
    event.currentTarget.value='';
    if(!file||busyId!==null)return;
    const invalid=validateMdtFiles([file],'pdf');
    if(invalid){setError(invalid);return;}
    if(block.has_file&&!(await confirmAction(`¿Reemplazar el PDF de «${block.title}»? El archivo anterior dejará de estar disponible.`)))return;
    setBusyId(block.id);setError('');setNotice('');
    const form=new FormData();form.set('file',file,file.name);
    try{
      readMdtPdfUpload(await requestJson(`${mdtUrl(courseId)}/pdf/${block.id}/file`,undefined,{method:'PUT',body:form}),block.id);
      setNotice(`PDF de «${block.title}» ${block.has_file?'reemplazado':'cargado'} correctamente.`);
      await onChanged();
    }catch(e){setError(`No se confirmó la subida: ${apiErrorMessage(e)}. Actualiza los recursos antes de reintentar si hubo una interrupción.`);}
    finally{setBusyId(null);}
  }
  return <section className="workspace-panel mdt-pdfs" aria-label="Evidencias institucionales MDT">
    <div className="workspace-panel-header">
      <h2>Evidencias institucionales</h2>
      <p>Documentos PDF del curso, exclusivos de ADMIN y TEACHER. No se entregan ni califican por estudiante.</p>
    </div>
    {error&&<ToastMessage kind="error" message={error} />}
    {notice&&<ToastMessage kind="success" message={notice} />}
    {!blocks.length?<div className="workspace-empty"><FileCheck2 size={29} aria-hidden="true"/> No hay bloques PDF institucionales configurados para este curso MDT.</div>:
      <div className="mdt-pdf-grid">{blocks.map(block=><article key={block.id} className="mdt-pdf-card">
        <div className="mdt-pdf-card-top"><span className="mdt-pdf-icon"><FileCheck2 size={26} aria-hidden="true"/></span>
          <span className={`mdt-state ${block.has_file?'mdt-done':'mdt-waiting'}`}>
            {block.has_file?'Archivo cargado':'Pendiente de carga'}</span></div>
        <h3>{block.title}</h3>
        {block.instructions&&<p>{block.instructions}</p>}
        {block.has_file?<div className="mdt-pdf-info"><strong>{block.filename||'Documento PDF'}</strong>
          <small>Última actualización: {when(block.updated_at)}</small></div>:
          <p className="mdt-pdf-info mdt-muted">No hay un PDF asociado a este bloque.</p>}
        {!block.is_active&&<small className="mdt-pdf-visibility"><Info size={14} aria-hidden="true"/> Bloque inactivo: sigue disponible para administración.</small>}
        {block.has_file&&!block.can_preview&&<p className="mdt-advisory"><Info size={16}/>
          El documento antiguo no admite vista previa. Reemplázalo con un PDF para activar el visor.</p>}
        <div className="mdt-pdf-actions">
          {block.has_file&&(block.can_preview?<button type="button" className="lms-outline-button"
            onClick={()=>setPreview(block)}><Eye size={16} aria-hidden="true"/> Ver PDF</button>:
            <a className="lms-outline-button" href={mdtPdfUrl(courseId,block.id)}>
              <Download size={16} aria-hidden="true"/> Descargar archivo anterior</a>)}
          <label className={`button button-primary mdt-pdf-upload ${busyId!==null?'mdt-disabled':''}`}>
            {busyId===block.id?<RefreshCw size={17} aria-hidden="true"/>:<FileUp size={17} aria-hidden="true"/>}
            {busyId===block.id?'Subiendo...':block.has_file?'Reemplazar PDF':'Cargar PDF'}
            <input type="file" accept="application/pdf,.pdf" disabled={busyId!==null}
              onChange={e=>void upload(block,e)} aria-label={`${block.has_file?'Reemplazar':'Cargar'} PDF de ${block.title}`}/>
          </label>
        </div>
      </article>)}</div>}
    {preview&&<MdtPdfPreview title={preview.title} filename={preview.filename||'Evidencia institucional'}
      previewUrl={mdtPdfPreviewUrl(courseId,preview.id)} downloadUrl={mdtPdfUrl(courseId,preview.id)}
      onClose={()=>setPreview(null)}/>}
  </section>;
}
