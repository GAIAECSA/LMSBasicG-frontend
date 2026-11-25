'use client';
import { confirmAction, ToastMessage } from '@/components/ui/notifications';
import {useCallback,useEffect,useMemo,useState,type FormEvent,type ChangeEvent,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,FileUp,LoaderCircle,MessageCircle,Send,Upload} from 'lucide-react';
import {requestJson} from '@/lib/academic/client';
import {apiErrorMessage,action} from '@/lib/student-course/client';
import {studentApi,type StudentBlock,isRecord,shortDate,isPdfFile} from '@/lib/student-course/domain';
import css from './student-course.module.css';

type Props={courseId:number;block:StudentBlock;onSaved:()=>Promise<void>;userId:number};
type QuizQuestion={id:number;question:string;question_type:string;options:unknown[]|null;value?:unknown};
type Attempt={id:number;status:string;attempt_number:number;score?:string|null;assisted?:boolean;questions?:QuizQuestion[]};
type Homework={id:number;comment:string|null;status:string;score:string|null;teacher_feedback:string|null;assisted:boolean;
  attachments:{id:number;original_filename:string;size:number;content_type:string}[]};
type SurveyQuestion={id:number;question:string;question_type:string;options:unknown[]|null;required:boolean;order:number};
type Survey={id:number;title:string;description:string|null;questions:SurveyQuestion[]};
type ForumTopic={id:number;title:string;description:string;is_closed:boolean};
type ForumPost={id:number;author_user_id:number;parent_id:number|null;comment:string|null;is_hidden:boolean;assisted:boolean;created_at:string};

const url=(id:number,...p:(string|number)[])=>studentApi(id,...p);
const err=(e:unknown)=>apiErrorMessage(e);

export function StudentQuiz({courseId,block,onSaved}:Props){
 const [attempts,setAttempts]=useState<Attempt[]>([]),[attempt,setAttempt]=useState<Attempt|null>(null),[answers,setAnswers]=useState<Record<number,unknown>>({});
 const [step,setStep]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const reload=useCallback(async()=>{
  const rows=await requestJson(url(courseId,'quiz',block.id,'attempts'));
  if(!Array.isArray(rows))throw Error('El historial de intentos es inválido');
  setAttempts(rows as Attempt[]);
  const active=(rows as Attempt[]).find(x=>x.status==='EN_PROGRESO'&&!x.assisted);
  if(active){const detail=await requestJson(url(courseId,'quiz',block.id,'attempts',active.id)) as Attempt;
   setAttempt(detail);setAnswers({});setStep(0);
  }else setAttempt(null);
 },[courseId,block.id]);
 useEffect(()=>{let ok=true;setLoading(true);setError('');
  reload().catch(e=>{if(ok)setError(err(e));}).finally(()=>{if(ok)setLoading(false);});
  return()=>{ok=false;};},[reload]);
 const questions=useMemo(()=>attempt?.questions||[],[attempt]);
 const q=questions[step];
 async function begin(){setBusy(true);setError('');setNotice('');try{
  const opened=await action(courseId,['quiz',block.id,'start'],'POST',{}) as Attempt;
  setAttempt(opened);setAnswers({});setStep(0);await onSaved();
 }catch(e){setError(err(e));}finally{setBusy(false);}}
 async function submit(){if(!attempt)return;if(!(await confirmAction('¿Entregar este intento? Las respuestas quedarán definitivas y se calculará tu nota.')))return;
  setBusy(true);setError('');try{
   const payload:Record<number,unknown>={};for(const item of questions)payload[item.id]=answers[item.id]??null;
   const result=await action(courseId,['quiz',block.id,'attempts',attempt.id,'submit'],'POST',{answers:payload}) as {score:string;status:string};
   setNotice(`Intento entregado. Nota obtenida: ${Number(result.score).toFixed(2)} / 10.`);
   await reload();await onSaved();
  }catch(e){setError(err(e));}finally{setBusy(false);}}
 const update=(id:number,val:unknown)=>setAnswers(prev=>({...prev,[id]:val}));
 return <section className={css.activity} aria-label="Realizar Quiz">
  <div className={css.activityHeader}><h3>Evaluación</h3><span className={css.help}>La nota de cada intento se calcula en el servidor.</span></div>
  {error&&<ToastMessage kind="error" message={error} />}{notice&&<ToastMessage kind="success" message={notice} />}
  {loading?<p className={css.muted}><LoaderCircle size={16}/> Consultando tus intentos…</p>:<>
   {attempt&&questions.length>0?<>
    <div className={css.quizHeader}><strong>Intento #{attempt.attempt_number}</strong><span>Pregunta {step+1} de {questions.length}</span></div>
    <div className={css.quizDots} aria-label="Navegación libre entre preguntas">{questions.map((item,i)=><button type="button" key={item.id}
     aria-label={`Ir a pregunta ${i+1}`} aria-current={i===step?'step':undefined} className={`${css.quizDot} ${i===step?css.current:''} ${answers[item.id]!==undefined?css.answered:''}`}
     onClick={()=>setStep(i)}>{i+1}</button>)}</div>
    <fieldset className={css.question} key={q.id}><legend>{q.question}</legend>
     {q.question_type==='TRUE_FALSE'?<div className={css.options}>{[[true,'Verdadero'],[false,'Falso']].map(([v,label])=><label className={`${css.option} ${answers[q.id]===v?css.chosen:''}`} key={String(v)}><input type="radio" name={`quiz-${q.id}`} checked={answers[q.id]===v} onChange={()=>update(q.id,v)}/>{label}</label>)}</div>:
      q.question_type==='OPEN'?<textarea className={css.textarea} value={typeof answers[q.id]==='string'?answers[q.id] as string:''} onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>update(q.id,e.target.value)} rows={5} placeholder="Escribe tu respuesta"/>:
      <div className={css.options}>{(q.options||[]).map((opt,i)=>{const v=String(opt);const multi=q.question_type==='MULTIPLE';
       const checked=multi?Array.isArray(answers[q.id])&&(answers[q.id] as string[]).includes(v):answers[q.id]===v;
       return <label className={`${css.option} ${checked?css.chosen:''}`} key={`${i}-${v}`}>
        <input type={multi?'checkbox':'radio'} name={`quiz-${q.id}`} checked={checked}
         onChange={()=>update(q.id,multi?(checked?(answers[q.id] as string[]).filter(x=>x!==v):[...(Array.isArray(answers[q.id])?answers[q.id] as string[]:[]),v]):v)}/>{v}</label>;
      })}</div>}
    </fieldset>
    <div className={css.actionRow}><button type="button" className={css.secondary} disabled={step===0||busy} onClick={()=>setStep(i=>i-1)}><ArrowLeft size={16}/> Anterior</button>
     {step<questions.length-1?<button type="button" className={css.primary} onClick={()=>setStep(i=>i+1)} disabled={busy}>Siguiente <ArrowRight size={16}/></button>:
      <button type="button" className={css.primary} onClick={submit} disabled={busy}><Send size={16}/> {busy?'Enviando…':'Entregar intento'}</button>}
    </div><p className={css.help}>Puedes volver a cualquier pregunta antes de entregar. Las respuestas se envían juntas al finalizar; si sales antes, las no enviadas no quedan guardadas.</p>
   </>:attempt?<p className={css.error}>El intento no contiene preguntas. Consulta al docente antes de comenzar otro.</p>:<>
    {attempts.length===0?<p className={css.muted}>Todavía no has realizado esta evaluación.</p>:<div className={css.attemptList}>{attempts.map(x=><div key={x.id} className={css.attemptRow}><span>Intento #{x.attempt_number} · {x.status}{x.assisted?' · Registro asistido':''}</span><strong>{x.status==='CALIFICADO'?`${Number(x.score).toFixed(2)} / 10`:'Pendiente'}</strong></div>)}</div>}
    <button className={css.primary} type="button" onClick={begin} disabled={busy}><ArrowRight size={16}/>{busy?'Abriendo…':attempts.length?'Iniciar otro intento':'Comenzar evaluación'}</button>
    <p className={css.help}>El número máximo de intentos está controlado por el Quiz. Si ya agotaste tus intentos, el servidor rechazará uno nuevo.</p>
   </>}
  </>}
 </section>;
}

export function StudentHomework({courseId,block,onSaved}:Props){
 const [mine,setMine]=useState<Homework|null>(null),[comment,setComment]=useState(''),[files,setFiles]=useState<File[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const reload=useCallback(async()=>{const v=await requestJson(url(courseId,'homework',block.id,'my')) as Homework|null;
  setMine(v&&isRecord(v)?v:null);setComment(v?.comment||'');},[courseId,block.id]);
 useEffect(()=>{let active=true;setLoading(true);setError('');reload().catch(e=>{if(active)setError(err(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[reload]);
 async function submit(e:FormEvent){e.preventDefault();setError('');setNotice('');
  if(!comment.trim()&&files.length===0){setError('Escribe una respuesta o adjunta archivos.');return;}
  if(files.length>10||files.some(f=>f.size===0||f.size>25*1024*1024)){setError('Máximo 10 archivos de hasta 25 MiB cada uno.');return;}
  if(mine&&files.length&&!(await confirmAction('Los nuevos archivos reemplazarán los adjuntos de la entrega anterior. ¿Continuar?')))return;
  setBusy(true);try{const form=new FormData();form.set('comment',comment);files.forEach(f=>form.append('files',f));
   await action(courseId,['homework',block.id,'submission'],mine?'PUT':'POST',form);
   await reload();setFiles([]);await onSaved();setNotice('Entrega guardada correctamente.');
  }catch(e){setError(err(e));}finally{setBusy(false);}}
 const graded=mine?.status==='CALIFICADO';
 return <section className={css.activity} aria-label="Entregar tarea"><h3>Tu entrega</h3>
  {error&&<ToastMessage kind="error" message={error} />}{notice&&<ToastMessage kind="success" message={notice} />}
  {loading?<p className={css.muted}>Consultando tu entrega…</p>:<>
   {mine&&<div className={css.statusCard}><strong><CheckCircle2 size={16}/> {graded?'Tarea calificada':'Tarea entregada; pendiente de calificación'}</strong>
    {graded&&<p>Nota: <b>{Number(mine.score).toFixed(2)} / 10</b></p>}
    {mine.teacher_feedback&&<p>Observaciones del profesor: {mine.teacher_feedback}</p>}
    {mine.attachments.length>0&&<div className={css.attachmentList}>{mine.attachments.map(f=><a key={f.id} href={url(courseId,'homework',block.id,'attachments',f.id,'file')} target="_blank" rel="noopener noreferrer">{f.original_filename} · Descargar</a>)}</div>}
   </div>}
   {!graded?<form onSubmit={submit} className={css.fieldStack}>
    <label htmlFor={`homework-${block.id}`}>Respuesta / comentario</label>
    <textarea id={`homework-${block.id}`} className={css.textarea} maxLength={20000} rows={5} value={comment} onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>setComment(e.target.value)} placeholder="Escribe tu entrega aquí…"/>
    <label htmlFor={`homework-files-${block.id}`}>Archivos adjuntos (hasta 10)</label>
    <input id={`homework-files-${block.id}`} type="file" multiple className={css.input} onChange={(e:ChangeEvent<HTMLInputElement>)=>setFiles(Array.from(e.target.files||[]))}/>
    {files.length>0&&<p className={css.help}>{files.map(f=>f.name).join(', ')}</p>}
    <button type="submit" className={css.primary} disabled={busy}><Upload size={16}/> {busy?'Guardando…':mine?'Actualizar entrega':'Enviar tarea'}</button>
   </form>:<p className={css.help}>Una tarea calificada no puede volver a editarse.</p>}
  </>}
 </section>;
}

const likert=[{n:1,emoji:'😠',label:'Muy en desacuerdo'},{n:2,emoji:'🙁',label:'En desacuerdo'},{n:3,emoji:'😐',label:'Neutral'},{n:4,emoji:'🙂',label:'De acuerdo'},{n:5,emoji:'😄',label:'Muy de acuerdo'}];
export function StudentSurvey({courseId,block,onSaved}:Props){
 const [survey,setSurvey]=useState<Survey|null>(null),[mine,setMine]=useState<{submitted:boolean;answers:Record<string,unknown>}|null>(null);
 const [answers,setAnswers]=useState<Record<number,unknown>>({}),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const surveyId=block.survey_id;
 const load=useCallback(async()=>{
  if(!surveyId)throw Error('La encuesta todavía no está configurada.');
  const [s,m]=await Promise.all([requestJson(url(courseId,'survey',surveyId,'detail')) as Promise<Survey>,
    requestJson(url(courseId,'survey',surveyId,'my')) as Promise<{submitted:boolean;answers:Record<string,unknown>}>]);
  setSurvey(s);setMine(m);if(m.submitted)setAnswers(m.answers as Record<number,unknown>);
 },[courseId,surveyId]);
 useEffect(()=>{let active=true;setLoading(true);setError('');load().catch(e=>{if(active)setError(err(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[load]);
 async function submit(e:FormEvent){e.preventDefault();if(!survey||!surveyId||mine?.submitted)return;
  const result:Record<number,unknown>={};for(const q of survey.questions){const a=answers[q.id];
   if(q.required&&(a===undefined||a===null||a==='')){setError(`Debes responder: ${q.question}`);return;}
   if(a!==undefined&&a!==null&&a!=='')result[q.id]=a;
  }
  if(!(await confirmAction('¿Enviar tus respuestas? Esta encuesta solo se puede responder una vez.')))return;
  setBusy(true);setError('');try{await action(courseId,['survey',surveyId,'submit'],'POST',{answers:result});
   await load();await onSaved();setNotice('Encuesta enviada correctamente.');
  }catch(e){setError(err(e));}finally{setBusy(false);}}
 return <section className={css.activity}><h3>Encuesta de satisfacción</h3>
  {error&&<ToastMessage kind="error" message={error} />}{notice&&<ToastMessage kind="success" message={notice} />}
  {loading?<p className={css.muted}>Cargando encuesta…</p>:mine?.submitted?<div className={css.statusCard}><CheckCircle2 size={19}/> Tus respuestas están registradas. Solo se permite una participación por matrícula.</div>:
   survey?<form onSubmit={submit}><p className={css.muted}>{survey.description}</p>
    {[...survey.questions].sort((a,b)=>a.order-b.order).map((q,i)=><fieldset key={q.id} className={css.surveyQuestion}>
     <legend><b className={css.questionNumber}>{i+1}</b> {q.question}{q.required&&<span className={css.required}> *</span>}</legend>
     {q.question_type==='scale'?<div className={css.likert}>{likert.map(item=><label key={item.n} className={`${css.likertOption} ${answers[q.id]===item.n?css.chosen:''}`}>
      <input type="radio" name={`survey-${q.id}`} checked={answers[q.id]===item.n} onChange={()=>setAnswers(v=>({...v,[q.id]:item.n}))}/>
      <span className={css.face}>{item.emoji}</span><strong>{item.label}</strong>
     </label>)}</div>:
     q.question_type==='text'?<textarea rows={3} maxLength={10000} className={css.textarea} value={String(answers[q.id]??'')} onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>setAnswers(v=>({...v,[q.id]:e.target.value}))} placeholder="Escribe tu respuesta…"/>:
     <div className={css.options}>{(q.options||[]).map((opt,index)=>{const text=String(opt);const multiple=q.question_type==='multiple';
      const checked=multiple?Array.isArray(answers[q.id])&&(answers[q.id] as string[]).includes(text):answers[q.id]===text;
      return <label className={css.option} key={index}><input type={multiple?'checkbox':'radio'} name={`survey-${q.id}`} checked={checked}
       onChange={()=>setAnswers(a=>({...a,[q.id]:multiple?(checked?(a[q.id] as string[]).filter(x=>x!==text):[...(Array.isArray(a[q.id])?a[q.id] as string[]:[]),text]):text}))}/>{text}</label>;
     })}</div>}
    </fieldset>)}
    <button type="submit" className={css.primary} disabled={busy}><Send size={16}/> {busy?'Enviando…':'Enviar encuesta'}</button>
   </form>:null}
 </section>;
}

export function StudentForum({courseId,block,onSaved,userId}:Props){
 const [topic,setTopic]=useState<ForumTopic|null>(null),[posts,setPosts]=useState<ForumPost[]>([]),[replyTo,setReplyTo]=useState<number|null>(null),[editing,setEditing]=useState<number|null>(null),[text,setText]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{const [t,p]=await Promise.all([
  requestJson(url(courseId,'forum',block.id,'topic')) as Promise<ForumTopic>,
  requestJson(url(courseId,'forum',block.id,'posts')) as Promise<ForumPost[]>]);setTopic(t);setPosts(p);},[courseId,block.id]);
 useEffect(()=>{let active=true;setLoading(true);setError('');load().catch(e=>{if(active)setError(err(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[load]);
 async function send(e:FormEvent){e.preventDefault();if(!text.trim()||busy)return;
  setBusy(true);setError('');try{
   if(editing!==null)await action(courseId,['forum',block.id,'posts',editing],'PATCH',{comment:text.trim()});
   else await action(courseId,['forum',block.id,'posts'],'POST',{comment:text.trim(),parent_id:replyTo});
   setText('');setEditing(null);setReplyTo(null);await load();await onSaved();setNotice('Participación registrada.');
  }catch(e){setError(err(e));}finally{setBusy(false);}}
 const children=(parent:number|null,depth=0):ReactNode=>posts.filter(p=>p.parent_id===parent).map(p=><div key={p.id} className={css.post} style={{marginLeft:Math.min(depth,4)*15}}>
  <div className={css.postHeader}><b>{p.author_user_id===userId?'Tú':`Participante #${p.author_user_id}`}</b>
   <span>{shortDate(p.created_at)} {p.assisted?'· Registro asistido':''}</span></div>
  <p>{p.is_hidden?'Publicación moderada':p.comment}</p>
  {!p.is_hidden&&!topic?.is_closed&&<div className={css.actionRow}><button className={css.textButton} type="button" onClick={()=>{setEditing(null);setReplyTo(p.id);setText('');}}>Responder</button>
   {p.author_user_id===userId&&!p.assisted&&<button type="button" className={css.textButton} onClick={()=>{setEditing(p.id);setReplyTo(null);setText(p.comment||'');}}>Editar</button>}</div>}
  {children(p.id,depth+1)}
 </div>);
 return <section className={css.activity}><h3>Foro del curso</h3>
  {error&&<ToastMessage kind="error" message={error} />}{notice&&<ToastMessage kind="success" message={notice} />}
  {loading?<p className={css.muted}>Cargando conversación…</p>:<>
   {topic&&<div className={css.statusCard}><strong>{topic.title}</strong><p>{topic.description}</p>{topic.is_closed&&<span className={css.muted}>El foro está cerrado.</span>}</div>}
   <div className={css.forumPosts}>{children(null)}</div>
   {posts.length===0&&<p className={css.muted}>Todavía no hay publicaciones. Puedes iniciar la conversación.</p>}
   {!topic?.is_closed&&<form onSubmit={send} className={css.fieldStack}>
    <strong>{editing!==null?'Editar tu mensaje':replyTo!==null?'Responder al participante':'Publicar en el foro'}</strong>
    {(replyTo!==null||editing!==null)&&<button className={css.textButton} type="button" onClick={()=>{setReplyTo(null);setEditing(null);setText('');}}>Cancelar respuesta</button>}
    <textarea className={css.textarea} rows={4} minLength={1} maxLength={10000} required value={text} onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>setText(e.target.value)} placeholder="Escribe tu mensaje…"/>
    <button className={css.primary} type="submit" disabled={busy||!text.trim()}><MessageCircle size={16}/> {busy?'Guardando…':'Publicar'}</button>
   </form>}
  </>}
 </section>;
}

export function StudentDocuments({courseId,documents,onSaved}:{courseId:number;documents:import('@/lib/student-course/domain').StudentDocument[];onSaved:()=>Promise<void>}){
 const [files,setFiles]=useState<Record<number,File|null>>({}),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState(''),[success,setSuccess]=useState('');
 async function upload(id:number){const f=files[id];if(!f||!isPdfFile(f)){setError('Selecciona un PDF válido de máximo 25 MiB.');return;}
  const doc=documents.find(d=>d.id===id);if(!doc?.available){setError('El documento aún no está disponible.');return;}
  setBusy(id);setError('');setSuccess('');try{
   // Las obligaciones MDT son Homework raíz, independientes de tareas calificables.
   const form=new FormData();form.append('files',f);form.set('comment','Documento obligatorio MDT');
   await action(courseId,['homework',id,'submission'],doc.submitted?'PUT':'POST',form);
   setFiles(v=>({...v,[id]:null}));await onSaved();setSuccess(`${doc.title}: documento guardado.`);
  }catch(e){setError(err(e));}finally{setBusy(null);}}
 return <section className={css.documents} aria-label="Documentación obligatoria MDT"><div className={css.documentsHead}><FileUp size={21}/><div><h3>Documentación obligatoria MDT</h3>
  <p>Sube cada PDF para completar tu expediente. Estos documentos no bloquean el acceso a las lecciones.</p></div></div>
  {error&&<ToastMessage kind="error" message={error} />}{success&&<ToastMessage kind="success" message={success} />}
  <div className={css.documentGrid}>{documents.map(d=><div className={css.documentCard} key={d.id}>
   <strong>{d.title}</strong><span className={d.submitted?css.good:css.warn}>{d.submitted?'Documento entregado':'Pendiente de carga'}</span>
   {d.uploaded_at&&<small>Última entrega: {shortDate(d.uploaded_at)}</small>}
   {d.available?<><input aria-label={`Seleccionar PDF: ${d.title}`} className={css.input} type="file" accept="application/pdf,.pdf" onChange={(e:ChangeEvent<HTMLInputElement>)=>setFiles(v=>({...v,[d.id]:e.target.files?.[0]||null}))}/>
    <button type="button" className={css.secondary} disabled={busy!==null||!files[d.id]} onClick={()=>void upload(d.id)}><Upload size={15}/>{busy===d.id?'Subiendo…':d.submitted?'Reemplazar PDF':'Subir PDF'}</button></>:
    <p className={css.muted}>Disponible desde {shortDate(d.date_available)}</p>}
  </div>)}</div>
 </section>;
}
