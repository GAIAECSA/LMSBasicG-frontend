'use client';
import { ToastMessage } from '@/components/ui/notifications';
/* eslint-disable @next/next/no-img-element -- Archivo privado mismo origen BFF; no se optimiza externamente. */
import {useEffect,useMemo,useState} from 'react';
import {BookOpen,CheckCircle2,ChevronDown,ChevronRight,ClipboardList,FileText,Image as ImageIcon,LockKeyhole,MessageSquare,ScrollText,Video,Clock3,ArrowRight} from 'lucide-react';
import {requestJson} from '@/lib/academic/client';
import {safeAcademicHtml,plainText} from '@/lib/course-modules/html';
import {youtubeId} from '@/lib/course-modules/domain';
import {action,apiErrorMessage} from '@/lib/student-course/client';
import {studentApi,flattenBlocks,findStudentBlock,studentBlockStatus,type StudentOverview,type StudentBlock,shortDate} from '@/lib/student-course/domain';
import {StudentDocuments,StudentQuiz,StudentHomework,StudentSurvey,StudentForum} from './student-course-activities';
import css from './student-course.module.css';

const glyphs={text:BookOpen,image:ImageIcon,pdf:FileText,video:Video,quiz:ClipboardList,homework:ScrollText,survey:CheckCircle2,forum:MessageSquare};
const names={text:'Lectura',image:'Imagen',pdf:'PDF',video:'Video',quiz:'Evaluación',homework:'Tarea',survey:'Encuesta',forum:'Foro'};
type Props={courseId:number;overview:StudentOverview;userId:number;onSaved:()=>Promise<void>};
type Detail={id:number;is_locked?:boolean;content:Record<string,unknown>};
const url=(id:number,...parts:(number|string)[])=>studentApi(id,...parts);
function iframeHtml(html:string){
 const safe=safeAcademicHtml(html);
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,Arial,sans-serif;font-size:15px;color:#152337;line-height:1.7;overflow-wrap:anywhere;padding:8px 14px">${safe}</body></html>`;
}
export function StudentCourseContent({courseId,overview,userId,onSaved}:Props){
 const all=useMemo(()=>flattenBlocks(overview),[overview]);
 const [selected,setSelected]=useState<number|null>(null),[expanded,setExpanded]=useState<Record<number,boolean>>({});
 const [detail,setDetail]=useState<Detail|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const active=selected!==null?findStudentBlock(overview,selected):null;
 useEffect(()=>{
  if(selected===null&&all.length>0){
   const first=all.find(b=>b.is_active&&b.available)||all[0];setSelected(first.id);
  }
 },[all,selected]);
 useEffect(()=>{
  if(selected===null)return;
  const block=findStudentBlock(overview,selected);
  if(!block||!block.is_active||!block.available){setDetail(null);setError('');return;}
  let valid=true;setLoading(true);setError('');setDetail(null);
  (async()=>{
   const d=await requestJson(url(courseId,'blocks',selected)) as Detail;
   if(!valid)return;if(!d||d.id!==selected||d.is_locked)throw Error('Recurso no disponible todavía');
   setDetail(d);
   // Para los recursos de lectura, abrir el recurso es la acción de progreso.
   if(['text','image','pdf','video'].includes(block.kind)&&!block.completed){
    try{await action(courseId,['blocks',selected,'complete'],'POST',{});
      if(valid)await onSaved();
    }catch(e){if(valid)setMessage(`Contenido visible, pero no se pudo registrar el progreso: ${apiErrorMessage(e)}`);}
   }
  })().catch(e=>{if(valid)setError(apiErrorMessage(e));}).finally(()=>{if(valid)setLoading(false);});
  return()=>{valid=false;};
 // La dependencia de la matrícula se limita al bloque elegido: un refresh de
 // progreso no vuelve a abrir el documento ni duplica el evento de lectura.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[courseId,selected]);
 const toggle=(id:number)=>setExpanded(old=>({...old,[id]:!(old[id]??false)}));
 const choose=(block:StudentBlock)=>{
  if(!block.is_active||!block.available)return;
  setSelected(block.id);setMessage('');
  const lesson=overview.modules.flatMap(m=>m.lessons).find(l=>l.blocks.some(b=>b.id===block.id));
  if(lesson)setExpanded(prev=>({...prev,[lesson.id]:true}));
 };
 const navigation=all.filter(b=>b.is_active);const index=active?navigation.findIndex(b=>b.id===active.id):-1;
 const next=navigation.slice(index+1).find(b=>b.available);
 const content=detail?.content||{};
 const description=plainText(content.html||content.text||content.instructions||content.description);
 const hasFile=typeof content.file_url==='string'&&content.file_url.length>0;
 const id=active?.id||0;
 return <div className={css.contentLayout}>
  <aside className={css.indexPanel} aria-label="Índice del curso"><div className={css.indexHead}><h2>Índice del curso</h2>
   <p>Selecciona un recurso. Las marcas muestran tu avance.</p></div>
   {overview.modules.map(m=><section key={m.id} className={css.indexModule}>
    <header className={css.indexModuleHead}><span>MÓDULO {m.order+1}</span><strong>{m.name}</strong>
      <small>{m.lessons.flatMap(l=>l.blocks).filter(b=>b.completed).length}/{m.lessons.flatMap(l=>l.blocks).length} realizados</small></header>
    {m.lessons.map(l=>{
     const open=expanded[l.id]??l.blocks.some(b=>b.id===selected);
     return <div key={l.id} className={css.indexLesson}>
      <button type="button" className={css.lessonToggle} aria-expanded={open} onClick={()=>toggle(l.id)}><span>Lección {l.order+1}: {l.name}</span>{open?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</button>
      {open&&<div className={css.indexBlocks}>{l.blocks.filter(b=>b.is_active).map(b=>{const Icon=glyphs[b.kind];const status=studentBlockStatus(b);
       return <button type="button" disabled={status==='locked'} key={b.id} className={`${css.indexBlock} ${selected===b.id?css.indexSelected:''}`} onClick={()=>choose(b)}>
        <span className={css.blockIcon}><Icon size={17}/></span><span className={css.blockCopy}><strong>{b.title}</strong><small>{names[b.kind]}</small></span>
        {status==='complete'?<CheckCircle2 className={css.done} size={17} aria-label="Completado"/>:status==='grading'?<Clock3 className={css.wait} size={17} aria-label="Pendiente de nota"/>:
        status==='locked'?<LockKeyhole size={16} aria-label="Bloqueado"/>:<span className={css.pendingDot} aria-label="Pendiente"/>}
       </button>;
      })}</div>}
     </div>;
    })}
   </section>)}
  </aside>
  <div className={css.contentRight}>
   {overview.course.code==='MDT'&&overview.documents.length>0&&<StudentDocuments courseId={courseId} documents={overview.documents} onSaved={onSaved}/>}
   {!active?<div className={css.panel}><h2>No hay recursos disponibles</h2><p>Aún no se han configurado los contenidos del curso.</p></div>:
   <article className={css.panel}>
    <header className={css.resourceHead}><span className={css.resourceType}>{names[active.kind]}</span>
     <h2>{active.title}</h2><div className={css.resourceStatus}>
      {active.completed?<span className={css.good}><CheckCircle2 size={16}/> Realizado</span>:<span className={css.warn}>Pendiente</span>}
      {active.counts_toward_grade&&<span className={css.help}>Cuenta para la nota final</span>}
      {!active.available&&<span className={css.warn}><LockKeyhole size={15}/> Disponible desde {shortDate(active.date_available)}</span>}
     </div></header>
    {!active.available?<div className={css.locked}><LockKeyhole size={30}/><strong>Contenido todavía bloqueado</strong><p>Podrás acceder a partir del {shortDate(active.date_available)}.</p></div>:
    loading?<div className={css.muted}>Cargando recurso…</div>:error?<ToastMessage kind="error" message={error} />:detail?<div className={css.resourceBody}>
     {['text','image','quiz','homework','survey','forum'].includes(active.kind)&&description&&<iframe title={`Descripción: ${active.title}`} sandbox="" className={css.htmlFrame} srcDoc={iframeHtml(description)}/>}
     {active.kind==='image'&&hasFile&&<img alt={active.title} className={css.resourceImage} src={url(courseId,'blocks',id,'file')}/>}
     {active.kind==='pdf'&&hasFile&&<iframe title={active.title} className={css.pdfFrame} src={url(courseId,'blocks',id,'file')}/>}
     {active.kind==='video'&&youtubeId(plainText(content.url||content.video_url))&&<iframe title={active.title} className={css.videoFrame} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" src={`https://www.youtube-nocookie.com/embed/${youtubeId(plainText(content.url||content.video_url))}`}/>}
     {active.kind==='homework'&&hasFile&&<a className={css.secondary} href={url(courseId,'blocks',id,'file')+'?download=true'}><FileText size={16}/> Archivo de instrucciones</a>}
     {active.kind==='quiz'&&<StudentQuiz courseId={courseId} block={active} userId={userId} onSaved={onSaved}/>}
     {active.kind==='homework'&&<StudentHomework courseId={courseId} block={active} userId={userId} onSaved={onSaved}/>}
     {active.kind==='survey'&&<StudentSurvey courseId={courseId} block={active} userId={userId} onSaved={onSaved}/>}
     {active.kind==='forum'&&<StudentForum courseId={courseId} block={active} userId={userId} onSaved={onSaved}/>}
     {['text','image','pdf','video'].includes(active.kind)&&<div className={css.readNotice}><CheckCircle2 size={18}/> Abrir este recurso registra automáticamente su avance.</div>}
    </div>:null}
    <footer className={css.contentFooter}><span>{index+1} / {navigation.length} recursos</span>
     {next&&<button className={css.secondary} type="button" onClick={()=>choose(next)}>Siguiente contenido <ArrowRight size={16}/></button>}</footer>
   </article>}
   {message&&<ToastMessage kind="success" message={message} />}
  </div>
 </div>;
}
