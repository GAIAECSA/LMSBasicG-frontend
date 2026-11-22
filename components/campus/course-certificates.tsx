'use client';
import {useState} from 'react';
import {FileBadge2,FileStack,LayoutTemplate,ShieldCheck} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {CourseCode,CertificateCapability} from '@/lib/academic/types';
import {CertificateTemplateEditor} from './certificate-template-editor';
import {CertificateAutomaticManager} from './certificate-automatic-manager';
import {CertificateExternalManager} from './certificate-external-manager';
import css from './course-certificates.module.css';

type CertificateTab='design'|'automatic'|'MDT'|'INSTITUTIONAL';
type CertificateTabItem={id:CertificateTab;title:string;icon:LucideIcon};

type Props={courseId:number;courseName:string;courseCode:CourseCode;
  capabilities:CertificateCapability[]};
export function CourseCertificates({courseId,courseName,courseCode,capabilities}:Props){
  const [tab,setTab]=useState<CertificateTab>(
    courseCode==='MOOC'?'design':'MDT');
  const enabled=(code:string)=>capabilities.some(c=>c.certificate_type.code===code&&c.is_active);
  const isMooc=courseCode==='MOOC';
  const institutional=enabled('INSTITUTIONAL');
  // Los elementos se agregan mediante push para conservar el tipo literal
  // CertificateTab en cada ID. Los spreads condicionales inferían string
  // incluso al anotar `tabs` como CertificateTabItem[].
  const tabs: CertificateTabItem[] = [];
  if (isMooc) {
    tabs.push(
      {id:'design',title:'Plantilla y diseño',icon:LayoutTemplate},
      {id:'automatic',title:'Certificados automáticos',icon:FileBadge2},
    );
  } else {
    tabs.push({id:'MDT',title:'Ministerio del Trabajo',icon:FileStack});
    if (institutional) {
      tabs.push({id:'INSTITUTIONAL',title:'Institucional',icon:ShieldCheck});
    }
  }
  return <section className={`lms-users-page lms-academic ${css.page}`} aria-label="Certificados del curso">
    <header className="workspace-heading"><div>
      <p className="lms-eyebrow">CURSO #{courseId} / ADMINISTRACIÓN DOCUMENTAL</p>
      <h1>Certificados</h1>
      <p>{courseName} · {courseCode==='MOOC'?'Certificados institucionales automáticos':'Certificados ministeriales y externos'}</p>
    </div></header>
    <div className={css.intro}>
      {isMooc?
        <><ShieldCheck size={20} aria-hidden="true"/>
          <span>ADMIN diseña y prueba plantillas, revoca y renueva certificados. La emisión real se solicita únicamente desde el futuro espacio STUDENT, cuando FastAPI valide el 100% de actividades y la nota mínima.</span></>:
        <><FileStack size={20} aria-hidden="true"/>
          <span>Los PDF oficiales e institucionales son documentos externos: puedes importarlos, verlos y corregirlos. No se revocan ni se regeneran en Athena.</span></>}
    </div>
    {!isMooc&&enabled('AUTOMATIC')&&<p className={css.info}>La capacidad AUTOMATIC de este curso MDT permanece configurada, pero su generación no está habilitada en esta fase.</p>}
    <nav className={css.tabs} aria-label="Secciones de certificados">
      {tabs.map(item=><button type="button" key={item.id} className={`${css.tab} ${tab===item.id?css.tabSelected:''}`}
        aria-current={tab===item.id?'page':undefined} onClick={()=>setTab(item.id)}>
        <item.icon size={16} aria-hidden="true"/> {item.title}</button>)}
    </nav>
    {isMooc? <>
      {!enabled('AUTOMATIC')&&<p className={css.warning}>La capacidad AUTOMATIC está desactivada para este curso. Puedes consultar los certificados existentes, pero la emisión no está disponible hasta que se habilite en Configuraciones.</p>}
      {tab==='design'&&<CertificateTemplateEditor courseId={courseId} courseName={courseName}/>}
      {tab==='automatic'&&<CertificateAutomaticManager courseId={courseId}/>}
    </>:<>
      {(tab==='MDT'||tab==='INSTITUTIONAL')&&<CertificateExternalManager key={`${courseId}-${tab}`}
        courseId={courseId} code={tab} />}
    </>}
  </section>;
}
