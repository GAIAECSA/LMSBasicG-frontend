'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Award,ArrowRight,BookOpen,CheckCircle2,Clock3,Download,Eye,FileBadge2,
  GraduationCap,LockKeyhole,RefreshCw,Search,ShieldCheck,Sparkles} from 'lucide-react';
import {CertificatePdfViewer} from './certificate-pdf-viewer';
import type {VisitorCertCourse,VisitorCertItem,VisitorCertState} from '@/lib/visitor/certificate-types';
import css from './visitor-certificates.module.css';

type Filter='all'|'MOOC'|'MDT';
const certTypeLabel=(type:string)=>type==='AUTOMATIC'?'Certificado MOOC':type==='MDT'?'Certificado ministerial MDT':'Certificado institucional';
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const endpoint=(courseId:number,cert:VisitorCertItem,action:'preview'|'download'|'generate')=>
 `/api/visitor/certificates/${courseId}/${cert.type}/${cert.id}/${action}`;
const formattedDate=(value:string|null)=>{
 if(!value)return '—';const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toLocaleDateString('es-EC',{day:'2-digit',month:'short',year:'numeric'}):'—';
};

function CertRow({course,cert,onView,onGenerate,busy}:{course:VisitorCertCourse;cert:VisitorCertItem;
 onView:(c:VisitorCertCourse,cert:VisitorCertItem)=>void;onGenerate:(c:VisitorCertCourse,cert:VisitorCertItem)=>Promise<void>;busy:boolean}){
 const available=cert.can_download;
 return <div className={css.document}>
  <div className={css.docIcon}><FileBadge2 size={23} aria-hidden="true"/></div>
  <div className={css.docInfo}>
   <strong>{certTypeLabel(cert.type)}</strong>
   <span>{available?'PDF emitido y disponible':cert.can_generate?'Listo para generar':'Pendiente de requisitos'}</span>
   {cert.registered_at&&<small>Registro: {formattedDate(cert.registered_at)}</small>}
  </div>
  <div className={css.docActions}>
   {available?<>
    <button type="button" className={css.outline} onClick={()=>onView(course,cert)} aria-label={`Ver ${certTypeLabel(cert.type)} de ${course.course_name}`}><Eye size={16}/> Ver PDF</button>
    <a className={css.action} href={endpoint(course.course_id,cert,'download')} download aria-label={`Descargar ${certTypeLabel(cert.type)} de ${course.course_name}`}><Download size={16}/> Descargar</a>
   </>:cert.can_generate?<button type="button" className={css.action} disabled={busy} onClick={()=>void onGenerate(course,cert)}>
    <Award size={16}/>{busy?'Generando…':'Generar certificado'}
   </button>:<span className={css.locked}><LockKeyhole size={15}/> Bloqueado</span>}
  </div>
 </div>;
}

export function VisitorCertificates({result}:{result:VisitorCertState}){
 const router=useRouter();
 const [query,setQuery]=useState('');const [filter,setFilter]=useState<Filter>('all');
 const [busy,setBusy]=useState<number|null>(null);const [error,setError]=useState('');
 const [view,setView]=useState<{course:VisitorCertCourse;cert:VisitorCertItem}|null>(null);
 const data=result.status==='ok'?result.data:null;
 const courses=data?.courses||[];
 const filtered=useMemo(()=>courses.filter(c=>(filter==='all'||c.course_type===filter)&&
  normalize(c.course_name).includes(normalize(query))),[courses,filter,query]);
 const available=courses.reduce((n,c)=>n+c.certificates.filter(x=>x.can_download).length,0);
 const pending=courses.reduce((n,c)=>n+c.certificates.filter(x=>x.can_generate||!x.can_download).length,0);
 async function generate(course:VisitorCertCourse,cert:VisitorCertItem){
  if(busy!==null)return;setBusy(cert.id);setError('');
  try{
   const r=await fetch(endpoint(course.course_id,cert,'generate'),{method:'POST',cache:'no-store'});
   if(!r.ok){const body:unknown=await r.json().catch(()=>({}));
    throw Error(body&&typeof body==='object'&&'message' in body&&typeof body.message==='string'?body.message:'No se pudo emitir el certificado.');}
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'No fue posible emitir el certificado.');}
  finally{setBusy(null);}
 }
 return <div className="visitor-page">
  <header className="visitor-page-head"><div>
   <p className="lms-eyebrow"><Sparkles size={16}/> TUS LOGROS ACADÉMICOS</p>
   <h1>Mis certificados</h1>
   <p>Consulta tus certificados de cursos MOOC y MDT, incluso si la academia ya no publica esos cursos en su catálogo.</p>
  </div><Link className="visitor-secondary-action" href="/campus/my-courses"><BookOpen size={17}/> Mis cursos <ArrowRight size={16}/></Link></header>
  {result.status==='unavailable'?<div className="lms-error" role="alert">
   No pudimos consultar tus certificados. Comprueba tu conexión y vuelve a cargar esta página.
  </div>:<>
   <div className={css.stats}>
    <div className={css.stat}><span className={css.statIcon}><GraduationCap size={22}/></span><div><small>CURSOS CON CERTIFICADOS</small><strong>{data?.total??0}</strong><span>Incluye cursos no publicados</span></div></div>
    <div className={css.stat}><span className={css.statIcon}><CheckCircle2 size={22}/></span><div><small>PDF DISPONIBLES EN ESTA PÁGINA</small><strong>{available}</strong><span>Ministeriales, institucionales y MOOC</span></div></div>
    <div className={css.stat}><span className={css.statIcon}><Clock3 size={22}/></span><div><small>POR GENERAR O BLOQUEADOS</small><strong>{pending}</strong><span>Comprueba los requisitos del curso</span></div></div>
   </div>
   <div className={css.filters}>
    <div className={css.tabs} role="group" aria-label="Filtrar certificados">
     {([['all','Todos'],['MOOC','MOOC'],['MDT','MDT']] as const).map(([value,label])=><button key={value}
      type="button" aria-pressed={filter===value} className={filter===value?css.selected:''} onClick={()=>setFilter(value)}>{label}</button>)}
    </div>
    <label className={css.search}><Search size={17}/><span className="sr-only">Buscar cursos certificados</span>
     <input value={query} maxLength={120} placeholder="Buscar por curso…" onChange={e=>setQuery(e.target.value)}/></label>
   </div>
   {error&&<p className={css.error} role="alert">{error}</p>}
   {filtered.length?<div className={css.list}>
    {filtered.map(course=><article className={css.course} key={course.course_id}>
     <div className={css.head}>
      <span className={css.courseIcon}><Award size={25} aria-hidden="true"/></span>
      <div className={css.courseInfo}><div className={css.badges}>
       <span>{course.course_type}</span>
       {!course.is_published&&<span className={css.unpublished}><ShieldCheck size={13}/> Disponible aunque el curso esté oculto</span>}
      </div><h2>{course.course_name}</h2>
      <p>{course.certificates.length===1?'1 certificado registrado':`${course.certificates.length} certificados registrados`}</p></div>
      <Link className={css.courseLink} href={`/campus/courses/${course.course_id}`}>Ir al curso <ArrowRight size={15}/></Link>
     </div>
     <div className={css.docs}>{course.certificates.map(c=><CertRow key={`${c.type}-${c.id}`} course={course} cert={c}
       onView={(c,cert)=>setView({course:c,cert})} onGenerate={generate} busy={busy===c.id}/>)}</div>
     {course.certificate_note&&<p className={css.note}><LockKeyhole size={15}/>{course.certificate_note} Puedes consultar los requisitos dentro del curso.</p>}
    </article>)}
   </div>:<div className={css.empty}>
    <Award size={45} aria-hidden="true"/><h2>{courses.length===0?'Todavía no tienes certificados disponibles':'No hay certificados con esos filtros'}</h2>
    <p>{courses.length===0?'Cuando tu academia cargue un certificado MDT o puedas emitir uno MOOC, aparecerá aquí, aunque el curso esté oculto.':'Prueba con otro nombre o cambia el tipo de certificado.'}</p>
   </div>}
   {data&&data.total>data.page_size&&<nav className={css.pagination} aria-label="Paginación de certificados">
    {data.page>1?<Link href={`/campus/certificates?page=${data.page-1}`}>Página anterior</Link>:<span/>}
    <span>Página {data.page} de {Math.ceil(data.total/data.page_size)}</span>
    {data.page*data.page_size<data.total?<Link href={`/campus/certificates?page=${data.page+1}`}>Página siguiente</Link>:<span/>}
   </nav>}
  </>}
  {view&&<CertificatePdfViewer title={certTypeLabel(view.cert.type)}
   previewUrl={endpoint(view.course.course_id,view.cert,'preview')}
   downloadUrl={endpoint(view.course.course_id,view.cert,'download')}
   onClose={()=>setView(null)}/>}
 </div>;
}
