'use client';
import { useCallback, useEffect, useMemo, useState, type FormEvent, type Dispatch, type SetStateAction } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, ClipboardList, FileText, LoaderCircle, Plus, Save, Upload, X } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { modulesUrl, sendFile, sendJson } from '@/lib/course-modules/client';
import { youtubeId, type BlockDetail, type ModuleBlock, type QuizQuestion, type SurveyDetail, type SurveyQuestion } from '@/lib/course-modules/domain';
import { safeAcademicHtml,plainText } from '@/lib/course-modules/html';
import { CourseModuleHtmlEditor } from './course-module-html-editor';
import css from './course-modules.module.css';

type Config={max_attempts:number;passing_score:number;question_limit:number;shuffle_questions:boolean;shuffle_options:boolean;score_mode:'AUTO'|'MANUAL'};
type Topic={id:number;title:string;description:string;is_closed:boolean};
const defaultQuiz:Config={max_attempts:1,passing_score:7,question_limit:0,shuffle_questions:false,shuffle_options:false,score_mode:'AUTO'};
type QuestionDraft={question_type:'SINGLE'|'MULTIPLE'|'TRUE_FALSE';question:string;options:string[];correct:string[];trueFalse:boolean;value:number};
const blankQuestion=():QuestionDraft=>({question_type:'SINGLE',question:'',options:['',''],correct:[],trueFalse:true,value:1});
const value=(v:unknown,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?v:typeof v==='string'&&v.trim()&&Number.isFinite(Number(v))?Number(v):fallback;
const no=(v:unknown)=>v===true;
const asMap=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const validFile=(file:File,kind:ModuleBlock['block_type'])=>{
 if(kind==='pdf'&&(!/\.pdf$/i.test(file.name)||file.size>25*1024*1024))throw Error('Solo PDF, máximo 25 MiB.');
 if(kind==='image'&&(!/\.(png|jpe?g|webp)$/i.test(file.name)||file.size>10*1024*1024))throw Error('Solo JPG, PNG o WebP, máximo 10 MiB.');
 if(kind==='homework'&&(!/\.(pdf|zip|png|jpe?g|webp)$/i.test(file.name)||file.size>25*1024*1024))throw Error('Archivo PDF, ZIP o imagen, máximo 25 MiB.');
};
const icon=' · ';
export function CourseModuleBlockEditor({courseId,block,role,initialTab='config',onClose,onSaved}:{courseId:number;block:ModuleBlock;role:'ADMIN'|'TEACHER';initialTab?:'config'|'respond';onClose:()=>void;onSaved:()=>void}){
 const [detail,setDetail]=useState<BlockDetail|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 // El contenido remoto es Record<string, unknown>; esta bandera booleana evita ReactNode=unknown.
 const hasUploadedFile=detail!==null&&typeof detail.content.file_url==='string'&&detail.content.file_url.trim().length>0;
 const [html,setHtml]=useState(''),[instructions,setInstructions]=useState(''),[file,setFile]=useState<File|null>(null),[url,setUrl]=useState('');
 const [config,setConfig]=useState<Config>(defaultQuiz),[quizQuestions,setQuizQuestions]=useState<QuizQuestion[]>([]),[attemptCount,setAttemptCount]=useState(0);
 const [survey,setSurvey]=useState<SurveyDetail|null>(null),[audience,setAudience]=useState<'BOTH'|'STUDENT'|'TEACHER'>('BOTH');
 const [topic,setTopic]=useState<Topic|null>(null),[closed,setClosed]=useState(false),[due,setDue]=useState('');
 const [tab,setTab]=useState<'config'|'questions'|'import'|'respond'>(initialTab);
 const [gift,setGift]=useState(''),[csv,setCsv]=useState(''),[importPreview,setImportPreview]=useState<unknown[]>([]);
 const [newQuiz,setNewQuiz]=useState<QuestionDraft>(blankQuestion),[editingQuestion,setEditingQuestion]=useState<number|null>(null);
 const [answerId,setAnswerId]=useState<number|null>(null),[correctReason,setCorrectReason]=useState('');
 const [surveyQuestion,setSurveyQuestion]=useState<{question:string;question_type:'scale'|'text';required:boolean}>({question:'',question_type:'scale',required:true});
 const [surveyEdit,setSurveyEdit]=useState<number|null>(null),[surveyReason,setSurveyReason]=useState('');
 const [myResponse,setMyResponse]=useState<{submitted:boolean}|null>(null),[myAnswers,setMyAnswers]=useState<Record<number,string|number>>({});
 const link=useCallback((...parts:(string|number)[])=>modulesUrl(courseId,...parts),[courseId]);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const row=await requestJson(link('blocks',block.id)) as BlockDetail;
   if(!row||row.id!==block.id||row.lesson_id===null)throw Error('El recurso no pertenece a una lección');
   setDetail(row);const c=asMap(row.content);
   setHtml(plainText(c.html||c.text));setInstructions(plainText(c.instructions||c.description));setUrl(plainText(c.url||c.video_url));
   setConfig({max_attempts:value(c.max_attempts,1),passing_score:value(c.passing_score,7),question_limit:value(c.question_limit),
     shuffle_questions:no(c.shuffle_questions),shuffle_options:no(c.shuffle_options),score_mode:c.score_mode==='MANUAL'?'MANUAL':'AUTO'});
   if(block.block_type==='quiz'){
    const [qs,res]=await Promise.all([requestJson(link('quiz','blocks',block.id,'questions')),requestJson(link('quiz','blocks',block.id,'results'))]);
    setQuizQuestions(Array.isArray(qs)?qs as QuizQuestion[]:[]);setAttemptCount(Array.isArray(res)?res.length:0);
   }
   if(block.block_type==='survey'){
    const rows=await requestJson(link('survey','course'));
    const reference=Array.isArray(rows)?rows.find(s=>s.lesson_block_id===block.id):null;
    if(reference){const data=await requestJson(link('survey','surveys',reference.id)) as SurveyDetail;
     setSurvey(data);setAudience(data.audience);setInstructions(data.description||'');
     if(role==='TEACHER')try{setMyResponse(await requestJson(link('survey','surveys',data.id,'my-response')) as {submitted:boolean});}catch{setMyResponse(null);}
    }else setSurvey(null);
   }
   if(block.block_type==='forum'){
    try{const data=await requestJson(link('forum','blocks',block.id,'topic')) as Topic;
     setTopic(data);setInstructions(data.description);setClosed(data.is_closed);
    }catch(e){if(!String(apiErrorMessage(e)).includes('no encontrado')&&!String(apiErrorMessage(e)).includes('404'))throw e;setTopic(null);}
   }
   if(block.block_type==='homework')try{const d=await requestJson(link('homework','blocks',block.id,'settings')) as {due_at:string|null};
     setDue(d.due_at?new Date(d.due_at).toISOString().slice(0,16):'');}catch{/* Sin fecha de entrega configurada */}
  }catch(e){setError(apiErrorMessage(e));}finally{setLoading(false);}
 },[link,block.id,block.block_type,role]);
 useEffect(()=>{void load();},[load]);
 const shown=useMemo(()=>config.question_limit>0?Math.min(config.question_limit,quizQuestions.length):quizQuestions.length,[config.question_limit,quizQuestions.length]);
 const pointValue=shown?10/shown:0;
 const execute=async(action:()=>Promise<unknown>,message:string,reload=true)=>{
  setBusy(true);setError('');setNotice('');try{const result=await action();setNotice(message);if(reload)await load();onSaved();return result;}
  catch(e){setError(`${apiErrorMessage(e)}. Verifica el resultado antes de reintentar.`);return null;}
  finally{setBusy(false);}
 };
 async function saveBlock(event:FormEvent){event.preventDefault();if(!detail)return;
  if(block.block_type==='video'&&!youtubeId(url)){setError('Solo se admiten enlaces HTTPS válidos de YouTube.');return;}
  if(block.block_type==='pdf'&&!file&&!hasUploadedFile){setError('Sube el PDF del recurso.');return;}
  if(block.block_type==='image'&&!file&&!hasUploadedFile){setError('Sube la imagen principal.');return;}
  try{if(file)validFile(file,block.block_type);}catch(e){setError(apiErrorMessage(e));return;}
  const content:Record<string,unknown>={title:block.title};
  if(['text','image'].includes(block.block_type))content.html=safeAcademicHtml(html);
  if(['homework','quiz','survey','forum'].includes(block.block_type))content.instructions= safeAcademicHtml(instructions);
  if(block.block_type==='homework')content.description=safeAcademicHtml(instructions);
  if(block.block_type==='video')content.url=url;
  const form=new FormData();form.set('content',JSON.stringify(content));if(file)form.set('file',file);
  const result=await execute(async()=>{
   await sendFile(link('blocks',block.id),form,'PUT');
   if(block.block_type==='quiz')await sendJson(link('quiz','blocks',block.id,'config'),'PATCH',config);
   if(block.block_type==='survey'){
    if(!survey){await sendJson(link('survey','surveys'),'POST', {lesson_block_id:block.id,title:block.title,description:instructions,audience,questions:[]});}
    else await sendJson(link('survey','surveys',survey.id),'PATCH',{title:block.title,description:instructions,audience});
   }
   if(block.block_type==='forum'){
    if(!instructions.trim())throw Error('Escribe las instrucciones del foro.');
    if(!topic)await sendJson(link('forum','blocks',block.id,'topic'),'POST',{title:block.title,description:instructions});
    else await sendJson(link('forum','blocks',block.id,'topic'),'PATCH',{title:block.title,description:instructions,is_closed:closed});
   }
   if(block.block_type==='homework'&&due)await sendJson(link('homework','blocks',block.id,'settings'),'PUT',{due_at:new Date(due).toISOString()});
  },'Configuración guardada.',true);
  if(result!==null)setFile(null);
 }
 const quizPayload=()=>{
  const opts=newQuiz.question_type==='TRUE_FALSE'?null:newQuiz.options.map(x=>x.trim());
  if(opts !== null && (opts.some(x=>x.length === 0) || new Set(opts).size !== opts.length)) {
   throw Error('Opciones no vacías y distintas.');
  }
  let correct:unknown=newQuiz.trueFalse;
  if(newQuiz.question_type==='SINGLE'){correct=newQuiz.correct[0];if(!opts?.includes(String(correct)))throw Error('Selecciona la respuesta correcta.');}
  else if(newQuiz.question_type==='MULTIPLE'){correct=newQuiz.correct.filter(x=>opts?.includes(x));if((correct as string[]).length<2)throw Error('Selecciona al menos dos respuestas correctas.');}
  if(!newQuiz.question.trim())throw Error('Escribe el enunciado.');
  return {question_type:newQuiz.question_type,question:newQuiz.question.trim(),options:opts,correct_answer:correct,
   value:config.score_mode==='MANUAL'?newQuiz.value:1,order:quizQuestions.length};
 };
 async function saveQuestion(e:FormEvent){e.preventDefault();try{
   const payload=quizPayload();
   if(editingQuestion){await execute(async()=>{
     await sendJson(link('quiz','questions',editingQuestion),'PATCH',{question:payload.question,options:payload.options,value:payload.value});
   },'Pregunta actualizada. La clave se corrige por separado.');}
   else await execute(()=>sendJson(link('quiz','blocks',block.id,'questions'),'POST',payload),'Pregunta añadida.');
   setNewQuiz(blankQuestion());setEditingQuestion(null);
  }catch(e){setError(apiErrorMessage(e));}}
 async function fixAnswer(){if(answerId===null)return;const q=quizQuestions.find(x=>x.id===answerId);
  if(!q||correctReason.trim().length<5){setError('Escribe un motivo de al menos 5 caracteres.');return;}
  let correction:unknown=q.question_type==='TRUE_FALSE'?newQuiz.trueFalse:q.question_type==='MULTIPLE'?newQuiz.correct:newQuiz.correct[0];
  if(!confirm('La corrección de clave recalculará TODAS las notas históricas de esta pregunta. ¿Continuar?'))return;
  const ok=await execute(()=>sendJson(link('quiz','questions',answerId,'correct-answer'),'PATCH',{correct_answer:correction,reason:correctReason.trim()}),'Clave corregida y notas recalculadas.');
  if(ok!==null){setAnswerId(null);setCorrectReason('');}
 }
 async function importText(kind:'gift'|'csv',doImport:boolean){const text=kind==='gift'?gift:csv;
  const path=kind==='gift'?link('quiz','blocks',block.id,'questions','gift',doImport?'import':'preview'):
   link('survey','surveys',survey?.id||0,'questions','csv',doImport?'import':'preview');
  const response=await execute(()=>sendJson(path,'POST',kind==='gift'?{text}:{csv_text:text}),doImport?'Importación completada.':'Vista previa validada.',doImport);
  if(!doImport&&response&&typeof response==='object'&&'questions'in response&&Array.isArray(response.questions))setImportPreview(response.questions);
  if(doImport)setImportPreview([]);
 }
 async function saveSurveyQuestion(event:FormEvent){event.preventDefault();if(!survey)return;
  const draft={question:surveyQuestion.question.trim(),question_type:surveyQuestion.question_type,
   required:surveyQuestion.required,options:surveyQuestion.question_type==='scale'?[1,2,3,4,5]:null};
  if(!draft.question){setError('Escribe una pregunta.');return;}
  if(surveyEdit){const ok=await execute(()=>sendJson(link('survey','questions',surveyEdit),'PATCH',{
    ...draft,non_substantive:!!surveyReason.trim(),reason:surveyReason||undefined
   }),'Pregunta actualizada.');if(ok!==null){setSurveyEdit(null);setSurveyReason('');}}
  else await execute(()=>sendJson(link('survey','surveys',survey.id,'questions'),'POST',{...draft,order:survey.questions.length}),'Pregunta añadida.');
  setSurveyQuestion({question:'',question_type:'scale',required:true});
 }
 async function submitOwnSurvey(){if(!survey||role!=='TEACHER'||myResponse?.submitted)return;
  if(!confirm('¿Enviar tus respuestas de forma definitiva? Solo puedes responder esta encuesta una vez.'))return;
  const answers:Record<string,string|number>={};for(const q of survey.questions){const a=myAnswers[q.id];if(q.required&&(a===undefined||a==='')){setError(`Responde la pregunta «${q.question}».`);return;}
   if(a!==undefined&&a!=='')answers[String(q.id)]=a;}
  await execute(()=>sendJson(link('survey','surveys',survey.id,'submit'),'POST',{answers}),'Tu respuesta quedó registrada.');
 }
 return <div className={css.backdrop}><section className={`${css.modal} ${css.wide}`} role="dialog" aria-modal="true" aria-label={`Configurar ${block.title}`}>
  <div className={css.modalTop}><div><h2>Configurar: {block.title}</h2><span style={{fontSize:12,color:'#66788d'}}>{block.block_type.toUpperCase()} {icon} Recurso #{block.id}</span></div><button onClick={onClose} aria-label="Cerrar configuración"><X size={20}/></button></div>
  {error&&<div className={css.error} role="alert">{error}</div>}{notice&&<div className={css.success} role="status">{notice}</div>}
  {loading?<p className={css.placeholder}><LoaderCircle className={css.spin}/> Cargando recurso…</p>:!detail?<div className={css.emptySmall}>No se pudo cargar el recurso.</div>:<>
   {['quiz','survey'].includes(block.block_type)&&<div className={css.tabs}>
    <button className={tab==='config'?css.selected:''} onClick={()=>setTab('config')}>Configuración</button>
    <button className={tab==='questions'?css.selected:''} onClick={()=>setTab('questions')}>Preguntas</button>
    <button className={tab==='import'?css.selected:''} onClick={()=>{setTab('import');setImportPreview([]);}}>Importar</button>
    {block.block_type==='survey'&&role==='TEACHER'&&survey&&<button className={tab==='respond'?css.selected:''} onClick={()=>setTab('respond')}>Responder</button>}
   </div>}
   {tab==='config'&&<form onSubmit={saveBlock} className={css.form}>
    {block.block_type==='text'&&<><p className={css.info}>Editor Visual ↔ HTML. El contenido será de solo lectura para el estudiante.</p><CourseModuleHtmlEditor value={html} onChange={setHtml}/></>}
    {block.block_type==='image'&&<><CourseModuleHtmlEditor value={html} onChange={setHtml}/><label>Imagen principal (JPG, PNG o WebP, hasta 10 MiB)
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
     {hasUploadedFile&&<img loading="lazy" alt={`Imagen de ${block.title}`} style={{maxWidth:'100%',maxHeight:250,objectFit:'contain'}} src={link('blocks',block.id,'file')}/>}</>}
    {block.block_type==='pdf'&&<><label>Archivo PDF (uno solo, hasta 25 MiB)<input type="file" accept="application/pdf,.pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
     {hasUploadedFile&&<div className={css.panel}><strong>PDF actual: {String(asMap(detail.content).filename||'documento.pdf')}</strong>
      <iframe title={`PDF ${block.title}`} src={link('blocks',block.id,'file')} style={{width:'100%',height:360,border:'1px solid #d6e1ec'}}/></div>}</>}
    {block.block_type==='video'&&<><label>URL de YouTube HTTPS<input type="url" required placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e=>setUrl(e.target.value)}/></label>
     {youtubeId(url)&&<div className={css.panel}><h3>Previsualización</h3><iframe title={`Video ${block.title}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
       style={{width:'100%',aspectRatio:'16/9',border:0}} src={`https://www.youtube-nocookie.com/embed/${youtubeId(url)}`}/></div>}</>}
    {['quiz','homework','survey','forum'].includes(block.block_type)&&<label>Instrucciones / Descripción<textarea rows={5} value={instructions} onChange={e=>setInstructions(e.target.value)}/></label>}
    {block.block_type==='quiz'&&<div className={css.panel}><h3>Intentos y puntuación</h3>
      <div className={css.twoColumns}><label>Intentos permitidos<input type="number" min={1} max={100} value={config.max_attempts} onChange={e=>setConfig(s=>({...s,max_attempts:Number(e.target.value)}))}/></label>
       <label>Nota mínima (0–10)<input type="number" min={0} max={10} step="0.01" value={config.passing_score} onChange={e=>setConfig(s=>({...s,passing_score:Number(e.target.value)}))}/></label>
       <label>Preguntas por intento (0 = todas)<input type="number" min={0} max={500} value={config.question_limit} onChange={e=>setConfig(s=>({...s,question_limit:Number(e.target.value)}))}/></label>
       <label>Calificación<select value={config.score_mode} onChange={e=>setConfig(s=>({...s,score_mode:e.target.value as 'AUTO'|'MANUAL'}))}><option value="AUTO">Automática / distribuir 10 puntos</option><option value="MANUAL">Valor individual, normalizado a 10</option></select></label></div>
      <label className={css.check}><input type="checkbox" checked={config.shuffle_questions} onChange={e=>setConfig(s=>({...s,shuffle_questions:e.target.checked}))}/> Orden aleatorio de preguntas</label>
      <label className={css.check}><input type="checkbox" checked={config.shuffle_options} onChange={e=>setConfig(s=>({...s,shuffle_options:e.target.checked}))}/> Orden aleatorio de opciones</label>
      {attemptCount>0&&<p className={css.info}>Ya existen {attemptCount} intentos. FastAPI bloqueará cambios de selección, orden y puntuación que alteren su historial.</p>}</div>}
    {block.block_type==='homework'&&<><label>Archivo de instrucciones (un PDF, ZIP o imagen)<input type="file" accept=".pdf,.zip,.jpg,.jpeg,.png,.webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
     {hasUploadedFile&&<a href={link('blocks',block.id,'file')+'?download=true'} target="_blank" rel="noreferrer">Archivo actual: {String(asMap(detail.content).filename||'archivo')}</a>}
     <label>Fecha límite de entrega (opcional)<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label></>}
    {block.block_type==='survey'&&<label>Quién responde<select value={audience} onChange={e=>setAudience(e.target.value as typeof audience)}><option value="BOTH">Estudiantes y docentes, misma encuesta</option><option value="STUDENT">Solo estudiantes</option><option value="TEACHER">Solo docentes</option></select></label>}
    {block.block_type==='forum'&&topic&&<label className={css.check}><input type="checkbox" checked={closed} onChange={e=>setClosed(e.target.checked)}/> Cerrar la conversación a nuevas publicaciones</label>}
    <div className={css.formActions}><button type="button" className="lms-outline-button" onClick={onClose}>Cerrar</button>
      <button type="submit" className="button-primary" disabled={busy}><Save size={16}/> {busy?'Guardando…':'Guardar configuración'}</button></div>
    {['quiz','survey','forum'].includes(block.block_type)&&<p className={css.info}>La configuración del contenido y la del recurso específico usan contratos distintos. Si alguna operación falla, la pantalla mostrará el error y podrás verificar el estado al recargar.</p>}
   </form>}
   {tab==='questions'&&block.block_type==='quiz'&&<div className={css.stack}>
     <p className={css.info}>{quizQuestions.length} preguntas cargadas · {shown||'Todas'} por intento · {config.score_mode==='AUTO'?`≈ ${pointValue.toFixed(2)} puntos por pregunta mostrada`:'Valores manuales normalizados sobre 10'}.
       {attemptCount>0?' Existen intentos: solo puedes corregir claves mediante auditoría.':''}</p>
     <div className={css.list}>{quizQuestions.map((q,i)=><div key={q.id} className={css.question}>
      <div className={css.questionHeader}><strong>{i+1}. {q.question}</strong><small>{q.question_type} · valor {q.value}</small></div>
      <div className={css.inline}><span style={{fontSize:12}}>Correcta: {JSON.stringify(q.correct_answer)}</span>
       {!attemptCount&&<button type="button" className={css.smallButton} onClick={()=>{setEditingQuestion(q.id);setNewQuiz({question_type:q.question_type,question:q.question,options:Array.isArray(q.options)?q.options.map(String):['',''],correct:Array.isArray(q.correct_answer)?q.correct_answer.map(String):[String(q.correct_answer)],trueFalse:q.correct_answer===true,value:Number(q.value)});}}>Editar pregunta</button>}
       <button type="button" className={css.smallButton} onClick={()=>{setAnswerId(q.id);setCorrectReason('');setNewQuiz({question_type:q.question_type,question:q.question,options:Array.isArray(q.options)?q.options.map(String):['',''],correct:Array.isArray(q.correct_answer)?q.correct_answer.map(String):[String(q.correct_answer)],trueFalse:q.correct_answer===true,value:Number(q.value)});}}>Corregir clave</button></div>
      {answerId===q.id&&<div className={css.panel}><p>Advertencia: esta operación recalcula todos los intentos históricos.</p>
       <QuestionCorrect draft={newQuiz} setDraft={setNewQuiz}/>
       <label className={css.field}>Motivo obligatorio<input value={correctReason} onChange={e=>setCorrectReason(e.target.value)} minLength={5}/></label>
       <button className={css.smallButton} disabled={busy} onClick={()=>void fixAnswer()}>Confirmar nueva clave</button></div>}
     </div>)}</div>
     {!attemptCount&&<form className={css.panel} onSubmit={saveQuestion}>
       <h3>{editingQuestion?'Editar pregunta':'Añadir pregunta'}</h3>
       <label className={css.field}>Tipo<select value={newQuiz.question_type} disabled={!!editingQuestion} onChange={e=>setNewQuiz(s=>({...s,question_type:e.target.value as QuestionDraft['question_type'],correct:[]}))}>
        <option value="SINGLE">Selección simple</option><option value="MULTIPLE">Selección múltiple</option><option value="TRUE_FALSE">Verdadero o falso</option></select></label>
       <label className={css.field}>Enunciado<textarea required value={newQuiz.question} onChange={e=>setNewQuiz(s=>({...s,question:e.target.value}))}/></label>
       <QuestionCorrect draft={newQuiz} setDraft={setNewQuiz}/>
       {config.score_mode==='MANUAL'&&<label className={css.field}>Valor de la pregunta<input type="number" step="0.01" min="0.01" value={newQuiz.value} onChange={e=>setNewQuiz(s=>({...s,value:Number(e.target.value)}))}/></label>}
       <div className={css.inline}><button type="submit" disabled={busy} className="button-primary"><Plus size={15}/> {editingQuestion?'Guardar cambios':'Añadir pregunta'}</button>
        {editingQuestion&&<button type="button" className={css.smallButton} onClick={()=>{setEditingQuestion(null);setNewQuiz(blankQuestion());}}>Cancelar edición</button>}</div>
      </form>}
     <p className={css.info}>No hay eliminación de preguntas Quiz en el contrato actual. Tras el primer intento, la única modificación permitida es corregir la clave con motivo y recálculo.</p>
    </div>}
   {tab==='questions'&&block.block_type==='survey'&&<div className={css.stack}>{!survey?<div className={css.info}>Guarda primero la configuración para crear la encuesta.</div>:<>
    <div className={css.list}>{survey.questions.map((q,i)=><div className={css.question} key={q.id}><div className={css.questionHeader}>
     <strong>{i+1}. {q.question}</strong><small>{q.question_type==='scale'?'Likert 1–5':'Abierta'} · {q.required?'Obligatoria':'Opcional'}</small></div>
     <div className={css.inline}><button className={css.smallButton} onClick={()=>{setSurveyEdit(q.id);setSurveyQuestion({question:q.question,question_type:q.question_type,required:q.required});}}>Editar</button>
      <button className={css.smallButton} disabled={busy} onClick={()=>{if(confirm('¿Eliminar esta pregunta? FastAPI impedirá eliminarla si existen respuestas.'))void execute(()=>sendJson(link('survey','questions',q.id),'DELETE'),'Pregunta archivada.');}}>Eliminar</button></div></div>)}</div>
    <form className={css.panel} onSubmit={saveSurveyQuestion}><h3>{surveyEdit?'Editar':'Nueva'} pregunta</h3>
     <label className={css.field}>Pregunta<textarea value={surveyQuestion.question} onChange={e=>setSurveyQuestion(s=>({...s,question:e.target.value}))}/></label>
     <label className={css.field}>Tipo<select value={surveyQuestion.question_type} onChange={e=>setSurveyQuestion(s=>({...s,question_type:e.target.value as 'scale'|'text'}))}>
      <option value="scale">Likert 5 (caritas / 1 a 5)</option><option value="text">Respuesta abierta</option></select></label>
     <label className={css.check}><input type="checkbox" checked={surveyQuestion.required} onChange={e=>setSurveyQuestion(s=>({...s,required:e.target.checked}))}/> Respuesta obligatoria</label>
     {surveyEdit&&<label className={css.field}>Motivo si ya hay respuestas (solo corrección no sustancial)<input value={surveyReason} onChange={e=>setSurveyReason(e.target.value)}/></label>}
     <div className={css.inline}><button className="button-primary" disabled={busy}>Guardar pregunta</button>{surveyEdit&&<button type="button" className={css.smallButton} onClick={()=>{setSurveyEdit(null);setSurveyQuestion({question:'',question_type:'scale',required:true});}}>Cancelar</button>}</div>
    </form></>}</div>}
   {tab==='import'&&['quiz','survey'].includes(block.block_type)&&<div className={css.stack}>
     <p className={css.info}>{block.block_type==='quiz'?'GIFT: selección simple, múltiple y verdadero/falso. Se rechazan variantes no soportadas.':'CSV: columnas order,type,question,required; type=scale o text.'} La previsualización no escribe en la base.</p>
     {block.block_type==='survey'&&<button className={css.smallButton} onClick={()=>{const csv='order,type,question,required\n0,scale,¿Cómo califica la capacitación?,true\n1,text,¿Qué mejorarías?,false\n';
       const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='encuesta_athena.csv';a.click();URL.revokeObjectURL(a.href);}}>Descargar plantilla CSV</button>}
     <label className={css.field}>Archivo {block.block_type==='quiz'?'.gift / .txt':'.csv'}<input type="file" accept={block.block_type==='quiz'?'.gift,.txt':'.csv,text/csv'} onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>500000){setError('Archivo máximo 500 KB');return;}const t=await f.text();if(block.block_type==='quiz')setGift(t);else setCsv(t);setImportPreview([]);}}/></label>
     <label className={css.field}>Contenido<textarea rows={10} value={block.block_type==='quiz'?gift:csv} onChange={e=>{block.block_type==='quiz'?setGift(e.target.value):setCsv(e.target.value);setImportPreview([]);}}/></label>
     <div className={css.inline}><button className={css.smallButton} disabled={busy||!(block.block_type==='quiz'?gift:csv).trim()||(block.block_type==='quiz'&&attemptCount>0)||(block.block_type==='survey'&&!survey)} onClick={()=>void importText(block.block_type==='quiz'?'gift':'csv',false)}>Validar y previsualizar</button>
      <button className="button-primary" disabled={busy||!importPreview.length||(block.block_type==='quiz'&&attemptCount>0)||block.block_type==='survey'&&!survey} onClick={()=>{
       if(confirm(`¿Importar ${importPreview.length} preguntas de forma atómica?`))void importText(block.block_type==='quiz'?'gift':'csv',true);}}>Importar {importPreview.length||''} preguntas</button></div>
     {importPreview.length>0&&<div className={css.panel}><h3>Previsualización ({importPreview.length})</h3>{importPreview.slice(0,35).map((q,i)=><p key={i}>{i+1}. {String(asMap(q).question||'')} · {String(asMap(q).question_type||asMap(q).type||'')}</p>)}
       {importPreview.length>35&&<p>… y {importPreview.length-35} preguntas más.</p>}</div>}
   </div>}
   {tab==='respond'&&block.block_type==='survey'&&!survey&&<p className={css.info}>Primero guarda la configuración y crea una encuesta para poder responder.</p>}
   {tab==='respond'&&block.block_type==='survey'&&survey&&role==='TEACHER'&&<div className={css.stack}>
     {survey.audience==='STUDENT'?<p className={css.info}>Esta encuesta está destinada exclusivamente a estudiantes; como docente no puedes responderla personalmente.</p>:
     myResponse?.submitted?<div className={css.success}>Ya respondiste esta encuesta. No puedes enviarla nuevamente.</div>:
      <div className={css.form}><p className={css.info}>Responde con tu propia matrícula de TEACHER. Esta acción sí crea una respuesta real y no forma parte de la vista previa.</p>
       {survey.questions.map((q,i)=><label key={q.id}>{i+1}. {q.question} {q.required?'*':''}{q.question_type==='scale'?<select value={myAnswers[q.id]??''} onChange={e=>setMyAnswers(s=>({...s,[q.id]:Number(e.target.value)}))}>
        <option value="">Selecciona</option>{[1,2,3,4,5].map(n=><option value={n} key={n}>{['😞','😕','😐','🙂','😄'][n-1]} {n} / 5</option>)}</select>:
        <textarea value={String(myAnswers[q.id]??'')} onChange={e=>setMyAnswers(s=>({...s,[q.id]:e.target.value}))}/>}</label>)}
       <button className="button-primary" disabled={busy} onClick={()=>void submitOwnSurvey()}>Enviar respuesta única</button></div>}
   </div>}
  </>}
 </section></div>;
}
function QuestionCorrect({draft,setDraft}:{draft:QuestionDraft;setDraft:Dispatch<SetStateAction<QuestionDraft>>}){
 if(draft.question_type==='TRUE_FALSE')return <label className={css.field}>Respuesta correcta<select value={String(draft.trueFalse)} onChange={e=>setDraft(s=>({...s,trueFalse:e.target.value==='true'}))}><option value="true">Verdadero</option><option value="false">Falso</option></select></label>;
 return <div className={css.panel}><strong>Opciones y respuestas correctas</strong><div className={css.options}>{draft.options.map((opt,i)=><div className={css.inline} key={i}>
   <input aria-label={`Opción ${i+1}`} style={{flex:'1 1 140px',minHeight:38}} value={opt} onChange={e=>setDraft(s=>{
     const options=[...s.options];const previous=options[i];options[i]=e.target.value;
     return {...s,options,correct:s.correct.map(x=>x===previous?e.target.value:x)};})}/>
   <label className={css.check}><input type={draft.question_type==='SINGLE'?'radio':'checkbox'} name={draft.question_type==='SINGLE'?'quiz-option-correct':undefined} checked={draft.correct.includes(opt)&&!!opt}
    onChange={e=>setDraft(s=>({...s,correct:s.question_type==='SINGLE'?[opt]:e.target.checked?[...s.correct,opt]:s.correct.filter(x=>x!==opt)}))}/> Correcta</label></div>)}</div>
   <button type="button" className={css.smallButton} onClick={()=>setDraft(s=>({...s,options:[...s.options,'']}))}>+ Opción</button>
   <small>Selección múltiple requiere al menos dos respuestas correctas.</small>
 </div>;
}
