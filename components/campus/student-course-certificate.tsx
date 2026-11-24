'use client';
import {useState} from 'react';
import {Award,CheckCircle2,Clock3,Download,FileBadge2,LockKeyhole,ShieldCheck,AlertCircle} from 'lucide-react';
import {action,apiErrorMessage} from '@/lib/student-course/client';
import {studentApi,type StudentEligibility,type StudentCertificate} from '@/lib/student-course/domain';
import {CertificatePdfViewer} from './certificate-pdf-viewer';
import css from './student-course.module.css';

export function StudentCertificateTab({courseId,code,eligibility,refresh}:{courseId:number;code:'MOOC'|'MDT';eligibility:StudentEligibility;refresh:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[viewer,setViewer]=useState<StudentCertificate|null>(null);
 const [notice,setNotice]=useState('');
 const possible=eligibility.certificates.filter(c=>c.status==='EMITIDO');
 const certPath=(cert:StudentCertificate,mode:'preview'|'download')=>studentApi(courseId,'certificate',cert.type==='AUTOMATIC'?'automatic':cert.type==='MDT'?'external-mdt':'external-institutional',cert.id,mode);
 async function generate(){const cert=eligibility.certificates.find(c=>c.type==='AUTOMATIC');if(!cert){setError('La reserva del certificado no está disponible.');return;}
  setBusy(true);setError('');try{
   await action(courseId,['certificate','automatic',cert.id,'generate'],'POST',{});
   await refresh();setNotice('Tu certificado automático está emitido y disponible para consulta.');
  }catch(e){setError(apiErrorMessage(e));}finally{setBusy(false);}}
 return <section className={css.certificates}>
  <div className={css.panel}><div className={css.certTop}><span className={css.certIcon}><Award size={26}/></span><div><h2>{code==='MDT'?'Certificados MDT':'Certificado del curso'}</h2>
   <p>{code==='MDT'?'Consulta los documentos emitidos por la institución al completar tu formación.':'Comprueba los requisitos y recupera tu certificado automático.'}</p></div></div>
   <div className={css.checklist}><div><strong>Estado académico</strong><span className={eligibility.academic_eligible?css.good:css.warn}>{eligibility.academic_eligible?'Requisitos académicos cumplidos':'Requisitos pendientes'}</span></div>
    <div><span>Actividades completadas</span><b>{eligibility.completed_activities} de {eligibility.total_activities}</b></div>
    {code==='MDT'&&<div><span>Documentos obligatorios</span><b>{eligibility.documents_submitted} de {eligibility.documents_total}</b></div>}
    <div><span>Nota final</span><b>{eligibility.final_grade===null?'Sin nota':`${Number(eligibility.final_grade).toFixed(2)} / 10`}</b></div>
    <div><span>Nota mínima requerida</span><b>{Number(eligibility.minimum_grade).toFixed(2)} / 10</b></div>
    <div><span>Asistencia MDT</span><b>Informativa; no bloquea el certificado</b></div>
   </div>
   {!eligibility.grade_ok&&<div className={css.warningLine}><AlertCircle size={18}/> La nota final todavía no alcanza el mínimo requerido.</div>}
   {eligibility.missing_activities.length>0&&<div className={css.missing}><h3>Actividades pendientes</h3><ul>{eligibility.missing_activities.map(x=><li key={x.block_id}><Clock3 size={15}/>{x.title}</li>)}</ul></div>}
   {eligibility.missing_documents.length>0&&<div className={css.missing}><h3>Documentos pendientes</h3><ul>{eligibility.missing_documents.map(x=><li key={x.id}><FileBadge2 size={15}/>{x.title}</li>)}</ul></div>}
   {error&&<p className={css.error} role="alert">{error}</p>}{notice&&<p className={css.success} role="status">{notice}</p>}
   {!eligibility.academic_eligible&&!eligibility.can_download?<div className={css.statusCard}><LockKeyhole size={19}/><span>Completa los requisitos anteriores para acceder a tu certificado.</span></div>:
     eligibility.can_download&&possible.length>0?<div className={css.certChoices}><h3><ShieldCheck size={20}/> {possible.length>1?'Escoge tu certificado':'Tu certificado está disponible'}</h3>
      {possible.map(cert=><div className={css.certChoice} key={cert.id}><span><Award size={19}/> {cert.type==='MDT'?'Certificado ministerial MDT':cert.type==='INSTITUTIONAL'?'Certificado institucional':'Certificado automático MOOC'}</span>
       <div><button className={css.secondary} onClick={()=>setViewer(cert)} type="button">Ver PDF</button><a className={css.primary} href={certPath(cert,'download')}><Download size={16}/> Descargar</a></div></div>)}
     </div>:code==='MOOC'&&eligibility.can_generate?<button className={css.primary} type="button" disabled={busy} onClick={generate}><Award size={17}/>{busy?'Emitiendo certificado…':'Generar mi certificado'}</button>:
       eligibility.pending_institutional_upload?<p className={css.statusCard}><Clock3 size={18}/> Requisitos cumplidos. Tu academia todavía no ha cargado el certificado MDT o institucional.</p>:
       <p className={css.statusCard}><AlertCircle size={18}/> El certificado todavía no está preparado para descarga. Contacta con la administración académica.</p>}
  </div>
  {viewer&&<CertificatePdfViewer title="Certificado académico" previewUrl={certPath(viewer,'preview')} downloadUrl={certPath(viewer,'download')} onClose={()=>setViewer(null)}/>}
 </section>;
}
