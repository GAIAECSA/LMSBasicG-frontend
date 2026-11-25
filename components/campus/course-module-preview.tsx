'use client';
import { ToastMessage } from '@/components/ui/notifications';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Eye, LoaderCircle, LockKeyhole, X } from 'lucide-react';
import { requestJson,apiErrorMessage } from '@/lib/academic/client';
import { modulesUrl,displayDate } from '@/lib/course-modules/client';
import { isFuture, youtubeId, type BlockDetail, type CourseStructure, type ModuleBlock, type QuizQuestion, type SurveyDetail } from '@/lib/course-modules/domain';
import { plainText } from '@/lib/course-modules/html';
import css from './course-modules.module.css';

export function CourseModulePreview({courseId,tree,onClose}:{courseId:number;tree:CourseStructure;onClose:()=>void}){
 const all=useMemo(()=>tree.modules.flatMap(m=>m.lessons.flatMap(l=>l.blocks)),[tree]);
 const [id,setId]=useState(all[0]?.id||0),[detail,setDetail]=useState<BlockDetail|null>(null),[quiz,setQuiz]=useState<QuizQuestion[]>([]);
 const [survey,setSurvey]=useState<SurveyDetail|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const item=all.find(b=>b.id===id);
 useEffect(()=>{
  if(!id)return;let ignore=false;setLoading(true);setError('');setQuiz([]);setSurvey(null);setDetail(null);
  (async()=>{try{const row=await requestJson(modulesUrl(courseId,'blocks',id)) as BlockDetail;
    if(ignore)return;setDetail(row);
    if(item?.block_type==='quiz'){
     const q=await requestJson(modulesUrl(courseId,'quiz','blocks',id,'questions'));
     if(!ignore)setQuiz(Array.isArray(q)?q as QuizQuestion[]:[]);
    }
    if(item?.block_type==='survey'){
     const list=await requestJson(modulesUrl(courseId,'survey','course'));
     const ref=Array.isArray(list)?list.find(x=>x.lesson_block_id===id):null;
     if(ref){const result=await requestJson(modulesUrl(courseId,'survey','surveys',ref.id));if(!ignore)setSurvey(result as SurveyDetail);}
    }
   }catch(e){if(!ignore)setError(apiErrorMessage(e));}finally{if(!ignore)setLoading(false);}})();
  return()=>{ignore=true;};
 },[id,courseId,item?.block_type]);
 const content=detail?.content||{};const raw=plainText(content.html||content.text||content.instructions||content.description);
 // content.file_url llega como unknown desde FastAPI: convertirlo a boolean antes de usarlo en JSX.
 const hasUploadedFile=typeof content.file_url==='string'&&content.file_url.trim().length>0;
 return <div className={css.backdrop}><section className={`${css.modal} ${css.wide}`} role="dialog" aria-modal="true" aria-label="Vista previa académica">
  <div className={css.modalTop}><div><h2><Eye size={19} style={{display:'inline',verticalAlign:'middle'}}/> Vista previa del curso</h2><p className={css.info} style={{marginTop:8}}>Simulación de solo lectura. No se crean intentos, entregas, respuestas, calificaciones ni progreso.</p></div>
   <button onClick={onClose} aria-label="Cerrar vista previa"><X size={20}/></button></div>
  <div className={css.twoColumns} style={{gridTemplateColumns:'minmax(230px,0.4fr) minmax(0,1fr)'}}>
   <nav className={css.panel} aria-label="Estructura del curso" style={{maxHeight:'68vh',overflowY:'auto'}}>
     {tree.modules.map(m=><div key={m.id} className={css.stack} style={{gap:6}}><strong><BookOpen size={14} style={{display:'inline'}}/> {m.name}</strong>
       {m.lessons.map(l=><div key={l.id} style={{paddingLeft:12}}><span style={{fontSize:12,fontWeight:700}}>{l.name}</span>
        {l.blocks.map(b=><button key={b.id} onClick={()=>setId(b.id)} className={`${css.smallButton} ${id===b.id?css.selected:''}`}
         style={{width:'100%',justifyContent:'start',marginTop:5,textAlign:'left'}}>{isFuture(b.date_available)&&<LockKeyhole size={13}/>} {b.title}</button>)}
       </div>)}</div>)}
   </nav>
   <article className={css.panel} style={{minHeight:300,minWidth:0,overflow:'hidden'}}>
     {!item?<p>Agrega un LessonBlock para ver su contenido.</p>:<>
      <h3>{item.title}</h3><p>{displayDate(item.date_available)}</p>
      {isFuture(item.date_available)&&<p className={css.info}><LockKeyhole size={15} style={{display:'inline'}}/> Esta actividad aparecerá bloqueada hasta su fecha de disponibilidad. El editor autorizado puede previsualizarla.</p>}
      {loading?<p className={css.placeholder}><LoaderCircle className={css.spin}/> Cargando…</p>:
       error?<ToastMessage kind="error" message={error} />:detail&&<div className={css.stack}>
        {['text','image','homework','quiz','survey','forum'].includes(item.block_type)&&raw&&<iframe sandbox="" title="Contenido HTML seguro" srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui;color:#223346;line-height:1.6;overflow-wrap:anywhere">${raw}</body></html>`} style={{width:'100%',border:'1px solid #dfe7f1',height:150,background:'#fff'}}/>}
        {item.block_type==='image'&&hasUploadedFile&&<img alt={item.title} src={modulesUrl(courseId,'blocks',id,'file')} style={{maxWidth:'100%',maxHeight:400,objectFit:'contain'}}/>}
        {item.block_type==='pdf'&&hasUploadedFile&&<iframe title={item.title} src={modulesUrl(courseId,'blocks',id,'file')} style={{width:'100%',minHeight:420,border:0}}/>}
        {item.block_type==='video'&&youtubeId(plainText(content.url))&&<iframe title={item.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
         src={`https://www.youtube-nocookie.com/embed/${youtubeId(plainText(content.url))}`} allowFullScreen style={{width:'100%',aspectRatio:'16/9',border:0}}/>}
        {item.block_type==='homework'&&hasUploadedFile&&<p><a href={modulesUrl(courseId,'blocks',id,'file')+'?download=true'} target="_blank" rel="noreferrer">Consultar archivo de instrucciones</a></p>}
        {item.block_type==='quiz'&&<div className={css.list}>{quiz.map((q,i)=><fieldset className={css.question} disabled key={q.id}>
         <legend>{i+1}. {q.question}</legend>{q.question_type==='TRUE_FALSE'?<><label><input type="radio" name={`sample-${q.id}`}/> Verdadero</label><label><input type="radio" name={`sample-${q.id}`}/> Falso</label></>:
         Array.isArray(q.options)?q.options.map((opt,j)=><label key={j} className={css.check}><input type={q.question_type==='MULTIPLE'?'checkbox':'radio'} name={`sample-${q.id}`}/> {String(opt)}</label>):null}</fieldset>)}
         <p className={css.info}>Preguntas ilustrativas. No se registra un intento ni se revela la clave correcta.</p></div>}
        {item.block_type==='survey'&&<div className={css.list}>{survey?.questions.map((q,i)=><fieldset className={css.question} disabled key={q.id}><legend>{i+1}. {q.question}{q.required?' *':''}</legend>
         {q.question_type==='scale'?<div className={css.inline}>{[1,2,3,4,5].map((n)=><label key={n}><input type="radio" name={`survey-preview-${q.id}`}/> {['😞','😕','😐','🙂','😄'][n-1]} {n}</label>)}</div>:<textarea rows={2}/>}</fieldset>)}
         {!survey&&<p>Configura la encuesta y sus preguntas para visualizarla.</p>}</div>}
        {item.block_type==='forum'&&<p className={css.info}>La conversación real no se modifica en modo vista previa.</p>}
       </div>}
     </>}
   </article>
  </div>
  <div className={css.formActions}><button className="lms-outline-button" onClick={onClose}>Cerrar vista previa</button></div>
 </section></div>;
}
