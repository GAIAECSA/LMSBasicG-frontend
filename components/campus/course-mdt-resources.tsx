'use client';
import { ToastMessage } from '@/components/ui/notifications';
import {useCallback,useEffect,useState} from 'react';
import {FileCheck2,FileStack,History,RefreshCw} from 'lucide-react';
import {apiErrorMessage,requestJson} from '@/lib/academic/client';
import {mdtUrl,readMdtSummary,type MdtResourcesSummary} from '@/lib/course-workspace/mdt-resources';
import {MdtStudentDocuments} from './mdt-student-documents';
import {MdtInstitutionalPdfs} from './mdt-institutional-pdfs';
import {MdtResourceHistory} from './mdt-resource-history';

type Tab='documents'|'pdfs';
/** Módulo único por curso MDT. El servidor valida rol, tenant y licencia;
 * ni este componente ni los botones son controles de autorización.
 */
export function CourseMdtResources({courseId,courseName}:{courseId:number;courseName:string}){
  const [summary,setSummary]=useState<MdtResourcesSummary|null>(null);
  const [tab,setTab]=useState<Tab>('documents');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{setSummary(readMdtSummary(await requestJson(mdtUrl(courseId)),courseId));}
    catch(e){setError(apiErrorMessage(e));}
    finally{setLoading(false);}
  },[courseId]);
  useEffect(()=>{void load();},[load]);
  async function updated(){
    setRevision(r=>r+1);
    await load();
  }
  const total=summary?.student_documents.length||0;
  const uploaded=summary?.student_documents.reduce((n,item)=>n+(item.uploaded_students||0),0)||0;
  const needed=summary?.student_documents.reduce((n,item)=>n+(item.total_students||0),0)||0;
  return <div className="lms-users-page lms-academic mdt-resources-page">
    <header className="workspace-heading">
      <div>
        <p className="lms-eyebrow">CURSO MDT #{courseId} / GESTIÓN DOCUMENTAL</p>
        <h1>Recursos MDT</h1>
        <p>Administra los documentos de estudiantes y las evidencias institucionales de «{courseName}».</p>
      </div>
      <div className="workspace-actions">
        <button type="button" className="lms-outline-button" disabled={loading} onClick={()=>void load()}>
          <RefreshCw size={17} aria-hidden="true"/> Actualizar
        </button>
      </div>
    </header>
    {error&&<ToastMessage kind="error" message={error}><button type="button" onClick={()=>void load()}>Reintentar</button></ToastMessage>}
    {loading&&!summary?<div className="lms-loading-card" role="status">Cargando recursos MDT...</div>:summary&&<>
      <section className="mdt-summary" aria-label="Resumen documental">
        <div className="mdt-summary-tile"><FileStack size={22} aria-hidden="true"/>
          <span>Requisitos de estudiantes</span><strong>{total}</strong><small>Bloques Homework de curso</small></div>
        <div className="mdt-summary-tile"><FileCheck2 size={22} aria-hidden="true"/>
          <span>Documentos recibidos</span><strong>{uploaded} / {needed}</strong><small>Entregas por requisito y estudiante</small></div>
        <div className="mdt-summary-tile"><FileStack size={22} aria-hidden="true"/>
          <span>PDF institucionales</span><strong>{summary.institutional_pdfs.filter(item=>item.has_file).length} / {summary.institutional_pdfs.length}</strong>
          <small>Evidencias cargadas en el curso</small></div>
      </section>
      <div className="workspace-tabs mdt-tabs" role="tablist" aria-label="Tipos de recursos MDT">
        <button type="button" role="tab" id="mdt-tab-documents" aria-controls="mdt-panel-documents" aria-selected={tab==='documents'}
          className={tab==='documents'?'selected':''} onClick={()=>setTab('documents')}>
          <FileStack size={18} aria-hidden="true"/> Archivos de estudiantes</button>
        <button type="button" role="tab" id="mdt-tab-pdfs" aria-controls="mdt-panel-pdfs" aria-selected={tab==='pdfs'}
          className={tab==='pdfs'?'selected':''} onClick={()=>setTab('pdfs')}>
          <FileCheck2 size={18} aria-hidden="true"/> Evidencias institucionales</button>
      </div>
      <div role="tabpanel" id={tab==='documents'?'mdt-panel-documents':'mdt-panel-pdfs'}
        aria-labelledby={tab==='documents'?'mdt-tab-documents':'mdt-tab-pdfs'}>
        {tab==='documents'?<MdtStudentDocuments courseId={courseId} blocks={summary.student_documents} onChanged={updated}/>:
          <MdtInstitutionalPdfs courseId={courseId} blocks={summary.institutional_pdfs} onChanged={updated}/>}
      </div>
      <section className="workspace-panel mdt-history-section" aria-label="Auditoría documental">
        <div className="mdt-history-heading"><div><History size={19} aria-hidden="true"/><h2>Historial de cambios</h2></div>
          <small>Se registra quién cargó o reemplazó un archivo desde la implementación de Recursos MDT.</small></div>
        <MdtResourceHistory courseId={courseId} blocks={[...summary.student_documents,...summary.institutional_pdfs]} revision={revision}/>
      </section>
    </>}
  </div>;
}
