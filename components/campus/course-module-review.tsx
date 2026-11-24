'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Eye, LoaderCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { modulesUrl, sendFile, sendJson } from '@/lib/course-modules/client';
import type { ModuleBlock, Participant, SurveyDetail, SurveyQuestion } from '@/lib/course-modules/domain';
import css from './course-modules.module.css';

type Attempt={id:number;enrollment_id:number;attempt_number:number;status:string;score:string|number;assisted:boolean};
type AttemptQuestion={id:number;question:string;question_type:string;options:unknown[]|null;correct_answer?:unknown;answer?:unknown;score_awarded?:string};
type AttemptDetail={id:number;status:string;questions:AttemptQuestion[];score?:string;manual_score_override?:string|null;assisted?:boolean};
type HomeworkRow={id:number;enrollment_id:number;score:string|null;status:string;comment:string|null;teacher_feedback:string|null;assisted:boolean;
 attachments:{id:number;original_filename:string}[]};
type ForumRow={id:number;enrollment_id:number;parent_id:number|null;comment:string|null;is_hidden:boolean;assisted:boolean;assisted_by_user_id:number|null};
type SurveyResult={survey_id:number;columns:{id:number;question:string}[];rows:{submission_id:number;enrollment_id:number;participant:string;role:string;assisted:boolean;answers:Record<string,unknown>}[]};
type Audit={id:number;enrollment_id:number;operator_user_id:number;action:string;reason:string;evidence_source:string;resource_id:number;created_at:string};
const validId=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>0;
export function CourseModuleReview({courseId,block,onClose}:{courseId:number;block:ModuleBlock;onClose:()=>void}){
 const [participants,setParticipants]=useState<Participant[]>([]),[participant,setParticipant]=useState(0),[search,setSearch]=useState(''),[page,setPage]=useState(1),[total,setTotal]=useState(0);
 const [results,setResults]=useState<Attempt[]>([]),[homework,setHomework]=useState<HomeworkRow[]>([]),[posts,setPosts]=useState<ForumRow[]>([]),[survey,setSurvey]=useState<SurveyDetail|null>(null),[surveyResult,setSurveyResult]=useState<SurveyResult|null>(null);
 const [audit,setAudit]=useState<Audit[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [reason,setReason]=useState(''),[evidence,setEvidence]=useState<'PAPER'|'VERBAL'|'ADMINISTRATIVE'>('ADMINISTRATIVE');
 const [answers,setAnswers]=useState<Record<number,unknown>>({}),[attempt,setAttempt]=useState<AttemptDetail|null>(null),[reviewAttempt,setReviewAttempt]=useState<AttemptDetail|null>(null);
 const [score,setScore]=useState(''),[feedback,setFeedback]=useState(''),[comment,setComment]=useState(''),[files,setFiles]=useState<File[]>([]),[parent,setParent]=useState('');
 const [surveyConfirmed,setSurveyConfirmed]=useState(false),[filterRole,setFilterRole]=useState<'ALL'|'STUDENT'|'TEACHER'>('ALL');
 const link=useCallback((...parts:(string|number)[])=>modulesUrl(courseId,...parts),[courseId]);
 const load=useCallback(async()=>{
  setLoading(true);setError('');try{
   const params=new URLSearchParams({page:String(page)});if(search.trim())params.set('search',search.trim());
   const [matrix,teachers]=await Promise.all([requestJson(link('participants')+'?'+params),requestJson(link('participants','teachers')+(search.trim()?'?search='+encodeURIComponent(search.trim()):''))]);
   const m=matrix as {students?:{enrollment_id:number;user_id:number;firstname:string;lastname:string;username:string}[];total_students?:number};
   const people:Participant[]=[...(m.students||[]).map(s=>({...s,role:'STUDENT' as const})),...(Array.isArray(teachers)?teachers as Participant[]:[])];
   setParticipants(people.filter(p=>validId(p.enrollment_id)));setTotal(m.total_students||0);
   setAudit((await requestJson(link('assisted','events'))) as Audit[]);
   if(block.block_type==='quiz'){
    const list=await requestJson(link('quiz','blocks',block.id,'results'));setResults(Array.isArray(list)?list as Attempt[]:[]);
   }else if(block.block_type==='homework'){
    const list=await requestJson(link('homework','blocks',block.id,'submissions'));setHomework(Array.isArray(list)?list as HomeworkRow[]:[]);
   }else if(block.block_type==='forum'){
    const list=await requestJson(link('forum','blocks',block.id,'posts'));setPosts(Array.isArray(list)?list as ForumRow[]:[]);
   }else if(block.block_type==='survey'){
    const list=await requestJson(link('survey','course'));const match=Array.isArray(list)?list.find(x=>x.lesson_block_id===block.id):null;
    if(match){setSurvey(await requestJson(link('survey','surveys',match.id)) as SurveyDetail);
     setSurveyResult(await requestJson(link('survey','surveys',match.id,'results')) as SurveyResult);
    }
   }
  }catch(e){setError(apiErrorMessage(e));}finally{setLoading(false);}
 },[link,block.block_type,block.id,page,search]);
 useEffect(()=>{void load();},[load]);
 const selected=participants.find(p=>p.enrollment_id===participant);
 const existing=useMemo(()=>{
  if(block.block_type==='quiz')return results.filter(r=>r.enrollment_id===participant);
  if(block.block_type==='homework')return homework.filter(r=>r.enrollment_id===participant);
  if(block.block_type==='survey')return surveyResult?.rows.filter(r=>r.enrollment_id===participant)||[];
  return posts.filter(r=>r.enrollment_id===participant);
 },[participant,block.block_type,results,homework,surveyResult,posts]);
 const activeAudit=audit.filter(a=>a.resource_id===block.id||a.enrollment_id===participant).slice(0,30);
 const operation=async(fn:()=>Promise<unknown>,message:string)=>{
  setBusy(true);setError('');setNotice('');try{const value=await fn();setNotice(message);await load();return value;}
  catch(e){setError(`${apiErrorMessage(e)}. Comprueba el resultado antes de repetir la operación.`);return null;}
  finally{setBusy(false);}
 };
 function validateAssisted(requireSurvey=false){
  if(!selected)throw Error('Selecciona una matrícula aceptada del curso.');
  if(!reason.trim()||reason.trim().length<10)throw Error('Indica un motivo de al menos 10 caracteres.');
  if(requireSurvey&&(!['PAPER','VERBAL'].includes(evidence)||!surveyConfirmed))throw Error('La encuesta asistida requiere respuestas reales confirmadas en papel o verbalmente.');
 }
 async function beginQuiz(){try{validateAssisted();
  if(!confirm(`¿Iniciar un Quiz asistido para ${selected?.firstname} ${selected?.lastname}? Se registrará el operador.`))return;
  const res=await operation(()=>sendJson(link('assisted','quiz','blocks',block.id,'enrollments',participant,'start'),'POST',{reason:reason.trim(),evidence_source:evidence}),'Intento asistido creado. Registra ahora las respuestas.');
  if(res&&typeof res==='object'&&'attempt_id'in res){const obj=res as {attempt_id:number;questions:AttemptQuestion[]};setAttempt({id:obj.attempt_id,status:'EN_PROGRESO',questions:obj.questions,assisted:true});setAnswers({});}
 }catch(e){setError(apiErrorMessage(e));}}
 async function resumeQuiz(id:number){setError('');try{const res=await requestJson(link('quiz','attempts',id)) as AttemptDetail;
   if(!res.assisted||res.status!=='EN_PROGRESO')throw Error('Este intento no es un registro asistido abierto.');
   setAttempt(res);setAnswers({});
 }catch(e){setError(apiErrorMessage(e));}}
 async function sendQuiz(){if(!attempt)return;try{validateAssisted();
  if(!confirm('¿Entregar este intento? La nota se asignará a la matrícula seleccionada y se auditará.'))return;
  const response=await operation(()=>sendJson(link('assisted','quiz','attempts',attempt.id,'submit'),'POST',{
   answers,reason:reason.trim(),evidence_source:evidence}),'Intento entregado y calificado automáticamente.');
  if(response)setAttempt(null);
 }catch(e){setError(apiErrorMessage(e));}}
 async function readQuizReview(id:number){try{setReviewAttempt(await requestJson(link('quiz','attempts',id,'review')) as AttemptDetail);}catch(e){setError(apiErrorMessage(e));}}
 async function overrideQuiz(){if(!reviewAttempt)return;try{validateAssisted();
  if(!score.trim()&&!confirm('Se quitará la nota manual para restaurar la calculada. ¿Continuar?'))return;
  if(!confirm('Se cambiará la nota oficial y se recalculará el promedio. El cambio tendrá auditoría.'))return;
  const number=score.trim()?Number(score):null;
  if(number!==null&&(!Number.isFinite(number)||number<0||number>10))throw Error('Nota entre 0 y 10');
  const response=await operation(()=>sendJson(link('assisted','quiz','attempts',reviewAttempt.id,'override'),'PATCH',{score:number,reason:reason.trim(),evidence_source:evidence}),'La nota oficial fue corregida con auditoría.');
  if(response)setReviewAttempt(null);
 }catch(e){setError(apiErrorMessage(e));}}
 async function submitHomework(){try{validateAssisted();
   if(!selected||selected.role!=='STUDENT')throw Error('Homework solo permite registro asistido para estudiantes.');
   if(!comment.trim()&&!files.length)throw Error('Registra la entrega real de texto o archivo.');
   if(files.length>5||files.some(f=>f.size>20*1024*1024)||files.reduce((n,f)=>n+f.size,0)>25*1024*1024)throw Error('Máximo 5 archivos; 20 MiB por archivo y 25 MiB total.');
   const n=score.trim()?Number(score):null;if(n!==null&&(!Number.isFinite(n)||n<0||n>10))throw Error('Nota entre 0 y 10');
   if(!confirm(`¿Registrar esta entrega para ${selected.firstname} ${selected.lastname}? El operador quedará auditado.`))return;
   const form=new FormData();form.set('reason',reason.trim());form.set('evidence_source',evidence);if(comment.trim())form.set('comment',comment.trim());
   for(const file of files)form.append('files',file);if(n!==null)form.set('score',String(n));if(feedback.trim())form.set('feedback',feedback.trim());
   const result=await operation(()=>sendFile(link('assisted','homework','blocks',block.id,'enrollments',participant),form),'Entrega asistida registrada.');
   if(result){setComment('');setScore('');setFiles([]);}
  }catch(e){setError(apiErrorMessage(e));}}
 async function gradeHomework(row:HomeworkRow){try{
  const n=Number(score);if(!score.trim()||!Number.isFinite(n)||n<0||n>10)throw Error('Nota entre 0 y 10.');
  if(!confirm('¿Guardar esta calificación para la entrega existente?'))return;
  await operation(()=>sendJson(link('homework','submissions',row.id,'grade'),'PUT',{score:n,feedback:feedback.trim()||null}),'Tarea calificada.');
 }catch(e){setError(apiErrorMessage(e));}}
 async function transcribeSurvey(){try{validateAssisted(true);if(!survey)return;
  const payload:Record<string,unknown>={};for(const q of survey.questions){const v=answers[q.id];
   if(q.required&&(v===undefined||v===null||v===''))throw Error(`Falta respuesta: ${q.question}`);
   if(v!==undefined&&v!==null&&v!=='')payload[String(q.id)]=v;
  }
  if(!confirm(`¿Transcribir estas respuestas reales de ${selected?.firstname} ${selected?.lastname}? Se permite una única respuesta.`))return;
  const res=await operation(()=>sendJson(link('assisted','surveys',survey.id,'enrollments',participant),'POST',{
    reason:reason.trim(),evidence_source:evidence,answers:payload}),'Encuesta transcrita, identificada y auditada.');
  if(res){setAnswers({});setSurveyConfirmed(false);}
 }catch(e){setError(apiErrorMessage(e));}}
 async function publishForum(){try{validateAssisted();if(!selected||selected.role!=='STUDENT')throw Error('El foro asistido solo permite estudiantes.');
  if(!comment.trim())throw Error('Escribe el mensaje proporcionado.');
  if(!confirm('El mensaje se asociará al estudiante, identificado como registro asistido. ¿Publicar?'))return;
  const res=await operation(()=>sendJson(link('assisted','forum','blocks',block.id,'enrollments',participant,'posts'),'POST',{
    comment:comment.trim(),parent_id:parent?Number(parent):null,reason:reason.trim(),evidence_source:evidence}),'Publicación asistida registrada.');
  if(res){setComment('');setParent('');}
 }catch(e){setError(apiErrorMessage(e));}}
 async function moderate(row:ForumRow){if(!confirm(row.is_hidden?'¿Restaurar este mensaje?':'¿Ocultar mensaje inapropiado?'))return;
  await operation(()=>sendJson(link('forum','posts',row.id,'moderation'),'PATCH',{hidden:!row.is_hidden}),'Moderación guardada.');
 }
 return <div className={css.backdrop}><section className={`${css.modal} ${css.wide}`} aria-modal="true" role="dialog" aria-label={`Revisar ${block.title}`}>
  <div className={css.modalTop}><div><h2><ClipboardCheck size={19} style={{display:'inline'}}/> Revisar: {block.title}</h2><span style={{fontSize:12,color:'#708096'}}>Consulta de resultados y operaciones asistidas auditables.</span></div>
   <button aria-label="Cerrar revisión" onClick={onClose}><X size={20}/></button></div>
  {error&&<div role="alert" className={css.error}>{error}</div>}{notice&&<div role="status" className={css.success}>{notice}</div>}
  {loading?<p className={css.placeholder}><LoaderCircle className={css.spin}/> Consultando actividad…</p>:<div className={css.stack}>
   <div className={css.twoColumns}><div className={css.panel}><h3>Elegir participante</h3>
    <label className={css.field}>Buscar estudiante<input placeholder="Nombre, usuario…" value={search} onChange={e=>{setPage(1);setSearch(e.target.value);}}/></label>
    <label className={css.field}>Matrícula<select value={participant} onChange={e=>{setParticipant(Number(e.target.value));setAnswers({});setAttempt(null);setReviewAttempt(null);}}><option value={0}>Selecciona una persona</option>
     {participants.filter(p=>block.block_type==='survey'||p.role==='STUDENT').map(p=><option key={p.enrollment_id} value={p.enrollment_id}>{p.firstname} {p.lastname} · {p.role} · @{p.username}</option>)}
    </select></label><div className={css.inline}><button className={css.smallButton} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span style={{fontSize:12}}>Página {page} · {total} estudiantes</span><button className={css.smallButton} disabled={page*100>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div>
   </div><div className={css.panel}><h3><ShieldCheck size={18} style={{display:'inline'}}/> Registro asistido</h3>
     <label className={css.field}>Motivo de intervención (mín. 10 caracteres)<textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Justifica por qué se transcribe o registra esta actividad…"/></label>
     <label className={css.field}>Origen de la evidencia<select value={evidence} onChange={e=>setEvidence(e.target.value as typeof evidence)}>
      {block.block_type!=='survey'&&<option value="ADMINISTRATIVE">Intervención administrativa</option>}
      <option value="PAPER">Documento en papel</option><option value="VERBAL">Respuesta verbal verificada</option></select></label>
     <p>El registro conserva al participante, operador real, motivo, fecha y origen. Una actividad asistida no prueba por sí sola la participación personal del estudiante.</p>
   </div></div>
   {block.block_type==='quiz'&&<div className={css.stack}><div className={css.panel}><h3>Intentos ({results.length})</h3>
    {!results.length?<p>Sin intentos registrados todavía.</p>:<div className={css.tableScroll}><table className={css.table}><thead><tr><th>Matrícula</th><th>Intento</th><th>Estado</th><th>Nota</th><th>Acciones</th></tr></thead><tbody>
     {results.filter(x=>!participant||x.enrollment_id===participant).map(row=><tr key={row.id}><td>#{row.enrollment_id}</td><td>{row.attempt_number}{row.assisted?' · Asistido':''}</td>
      <td>{row.status}</td><td>{row.status==='CALIFICADO'?`${row.score}/10`:'Pendiente = 0'}</td><td>
       <button className={css.smallButton} onClick={()=>void readQuizReview(row.id)}><Eye size={14}/> Revisar</button>
       {row.assisted&&row.status==='EN_PROGRESO'&&<button className={css.smallButton} onClick={()=>void resumeQuiz(row.id)}>Continuar asistido</button>}</td></tr>)}</tbody></table></div>}
    </div>
    {reviewAttempt&&<div className={css.panel}><h3>Intento #{reviewAttempt.id} · {reviewAttempt.score}/10</h3>
     {reviewAttempt.questions.map(q=><p key={q.id}><strong>{q.question}</strong> · Respuesta: {JSON.stringify(q.answer)} · Correcta: {JSON.stringify(q.correct_answer)} · Puntos: {q.score_awarded}</p>)}
     <label className={css.field}>Nueva nota oficial / 10 (dejar vacío para quitar override)<input type="number" step="0.01" min="0" max="10" value={score} onChange={e=>setScore(e.target.value)}/></label>
     <button className="button-primary" disabled={busy||!reason.trim()} onClick={()=>void overrideQuiz()}>Corregir nota con auditoría</button></div>}
    {selected&&selected.role==='STUDENT'&&!attempt&&<div className={css.panel}><h3>Registro asistido de Quiz</h3><p>Responderás únicamente las preguntas seleccionadas para el intento. FastAPI calculará la nota de 0 a 10.</p>
     <button className="button-primary" disabled={busy||reason.trim().length<10} onClick={()=>void beginQuiz()}>Iniciar intento asistido</button></div>}
    {attempt&&<div className={css.panel}><h3>Completar intento asistido #{attempt.id}</h3>{attempt.questions.map(q=><fieldset key={q.id} className={css.question}>
     <legend>{q.question}</legend><AnswerField question={q} current={answers[q.id]} onValue={v=>setAnswers(s=>({...s,[q.id]:v}))}/></fieldset>)}
     <button className="button-primary" disabled={busy||reason.trim().length<10} onClick={()=>void sendQuiz()}>Enviar y calificar automáticamente</button></div>}
   </div>}
   {block.block_type==='homework'&&<div className={css.stack}><div className={css.panel}><h3>Entregas existentes ({homework.length})</h3>{homework.filter(x=>!participant||x.enrollment_id===participant).map(row=><div key={row.id} className={css.question}>
     <strong>Matrícula #{row.enrollment_id} · {row.status} {row.assisted?'· Asistida':''} · Nota {row.score===null?'pendiente':row.score+'/10'}</strong>
     <p>{row.comment||'Sin comentario'}</p>{row.attachments?.map(a=><a key={a.id} target="_blank" rel="noreferrer" href={link('homework','attachments',a.id,'download')}>
       {a.original_filename}</a>)}
     <div className={css.inline}><label className={css.field}>Nota 0–10<input type="number" min="0" max="10" step="0.01" value={score} onChange={e=>setScore(e.target.value)}/></label>
     <label className={css.field}>Retroalimentación<input value={feedback} onChange={e=>setFeedback(e.target.value)}/></label>
     <button className={css.smallButton} disabled={busy} onClick={()=>void gradeHomework(row)}>Guardar nota</button></div></div>)}
     {!homework.length&&<p>No hay entregas.</p>}</div>
     {selected&&selected.role==='STUDENT'&&existing.length===0&&<div className={css.panel}><h3>Registrar entrega asistida</h3>
      <label className={css.field}>Texto de la entrega<textarea value={comment} onChange={e=>setComment(e.target.value)}/></label>
      <label className={css.field}>Adjuntos de la entrega (opcionales, hasta 5)<input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))}/></label>
      <div className={css.twoColumns}><label className={css.field}>Nota 0–10 (opcional)<input type="number" step="0.01" min="0" max="10" value={score} onChange={e=>setScore(e.target.value)}/></label>
       <label className={css.field}>Retroalimentación<input value={feedback} onChange={e=>setFeedback(e.target.value)}/></label></div>
      <button className="button-primary" disabled={busy||reason.trim().length<10} onClick={()=>void submitHomework()}>Guardar entrega asistida</button></div>}
   </div>}
   {block.block_type==='survey'&&<div className={css.stack}><div className={css.panel}><h3>Respuestas ({surveyResult?.rows.length||0})</h3>
    <label className={css.field}>Filtrar rol<select value={filterRole} onChange={e=>setFilterRole(e.target.value as typeof filterRole)}><option value="ALL">Ambos</option><option value="STUDENT">Estudiantes</option><option value="TEACHER">Docentes</option></select></label>
    <div className={css.tableScroll}><table className={css.table}><thead><tr><th>Participante</th><th>Rol</th><th>Registro</th>{surveyResult?.columns.map(q=><th key={q.id}>{q.question}</th>)}</tr></thead><tbody>
     {surveyResult?.rows.filter(r=>(filterRole==='ALL'||r.role===filterRole)&&(!participant||r.enrollment_id===participant)).map(row=><tr key={row.submission_id}>
      <td>{row.participant||`#${row.enrollment_id}`}</td><td>{row.role}</td><td>{row.assisted?'Asistido':'Personal'}</td>{surveyResult.columns.map(q=><td key={q.id}>{String(row.answers[String(q.id)]??'—')}</td>)}</tr>)}
    </tbody></table></div></div>
    {!survey?<p className={css.info}>Primero configura la encuesta y sus preguntas.</p>:selected&&existing.length===0&&<div className={css.panel}><h3>Transcribir respuestas reales de {selected.firstname} {selected.lastname}</h3>
     <p>Solo se permiten encuestas realmente contestadas en papel o verbalmente, una vez por matrícula y según su audiencia.</p>
     {survey.questions.map(q=><fieldset className={css.question} key={q.id}><legend>{q.question}{q.required?' *':''}</legend>
      {q.question_type==='scale'?<div className={css.inline}>{[1,2,3,4,5].map((n)=><label key={n}><input type="radio" name={`survey-assisted-${q.id}`} checked={answers[q.id]===n} onChange={()=>setAnswers(s=>({...s,[q.id]:n}))}/>
       {['😞','😕','😐','🙂','😄'][n-1]} {n}</label>)}</div>:<textarea value={String(answers[q.id]||'')} onChange={e=>setAnswers(s=>({...s,[q.id]:e.target.value}))}/>}</fieldset>)}
     <label className={css.check}><input type="checkbox" checked={surveyConfirmed} onChange={e=>setSurveyConfirmed(e.target.checked)}/> Confirmo que las respuestas fueron proporcionadas realmente por el participante.</label>
     <button className="button-primary" disabled={busy||!surveyConfirmed||reason.trim().length<10||evidence==='ADMINISTRATIVE'} onClick={()=>void transcribeSurvey()}>Guardar transcripción auditada</button>
    </div>}
   </div>}
   {block.block_type==='forum'&&<div className={css.stack}><div className={css.panel}><h3>Conversación ({posts.length} mensajes)</h3>
     {posts.length===0?<p>Sin publicaciones todavía.</p>:posts.map(row=><div className={css.question} key={row.id} style={{marginLeft:row.parent_id?14:0,opacity:row.is_hidden?0.6:1}}>
      <strong>Mensaje #{row.id} · Matrícula #{row.enrollment_id}{row.assisted?' · Asistido':''}{row.is_hidden?' · Oculto':''}</strong>
      <p>{row.comment||'—'}</p><button className={css.smallButton} onClick={()=>void moderate(row)}>{row.is_hidden?'Restaurar':'Ocultar'}</button></div>)}
    </div>{selected&&selected.role==='STUDENT'&&<div className={css.panel}><h3>Publicación asistida</h3>
     <label className={css.field}>Mensaje proporcionado por el estudiante<textarea value={comment} onChange={e=>setComment(e.target.value)}/></label>
     <label className={css.field}>Responder a (opcional)<select value={parent} onChange={e=>setParent(e.target.value)}><option value="">Nueva publicación</option>
      {posts.filter(p=>!p.is_hidden).map(p=><option key={p.id} value={p.id}>Mensaje #{p.id} · {p.comment?.slice(0,60)}</option>)}</select></label>
     <button className="button-primary" disabled={busy||reason.trim().length<10} onClick={()=>void publishForum()}>Registrar publicación asistida</button></div>}
   </div>}
   <div className={css.panel}><h3>Últimas operaciones auditadas</h3><p>La auditoría conserva operador, matrícula objetivo, fecha, acción y motivo.</p>
     {!activeAudit.length?<p>Sin registros asistidos en esta selección.</p>:<div className={css.tableScroll}><table className={css.table}><thead><tr><th>Fecha</th><th>Matrícula</th><th>Operador</th><th>Acción</th><th>Motivo</th></tr></thead><tbody>
      {activeAudit.map(a=><tr key={a.id}><td>{new Date(a.created_at).toLocaleString('es-EC')}</td><td>#{a.enrollment_id}</td><td>#{a.operator_user_id}</td><td>{a.action}</td><td>{a.reason}</td></tr>)}</tbody></table></div>}</div>
  </div>}
  <div className={css.formActions}><button className="lms-outline-button" disabled={busy} onClick={()=>void load()}><RefreshCw size={15}/> Actualizar</button><button className="button-primary" onClick={onClose}>Cerrar revisión</button></div>
 </section></div>;
}
function AnswerField({question,current,onValue}:{question:AttemptQuestion;current:unknown;onValue:(value:unknown)=>void}){
 if(question.question_type==='TRUE_FALSE')return <div className={css.inline}>{[true,false].map(v=><label key={String(v)} className={css.check}><input type="radio" checked={current===v} name={`quiz-assist-${question.id}`} onChange={()=>onValue(v)}/>{v?'Verdadero':'Falso'}</label>)}</div>;
 return <div className={css.options}>{(question.options||[]).map((opt,i)=>{
  const option=String(opt);const multiple=question.question_type==='MULTIPLE';const list=Array.isArray(current)?current as string[]:[];
  return <label key={i} className={css.check}><input type={multiple?'checkbox':'radio'} checked={multiple?list.includes(option):current===option} name={`quiz-assist-${question.id}`}
    onChange={e=>onValue(multiple?e.target.checked?[...list,option]:list.filter(x=>x!==option):option)}/>{option}</label>;
 })}</div>;
}
