'use client';
import { confirmAction, ToastMessage } from '@/components/ui/notifications';
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type MouseEvent } from 'react';
import { AlignLeft, ArrowDown, ArrowUp, BookOpen, ClipboardCheck, ClipboardList, Eye, FileText,
  GripVertical, ImageIcon, Layers3, LoaderCircle, LockKeyhole, MessageSquare, PenLine, Plus,
  RefreshCw, Settings2, Trash2, Video, X } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { modulesUrl, sendFile, sendJson, displayDate } from '@/lib/course-modules/client';
import { BLOCK_KINDS, BLOCK_NAMES, GRADED_KINDS, isFuture, moveInTree, parseStructure, snapshotOrder,
  type BlockKind, type BlockTypeOption, type CourseStructure, type ModuleBlock } from '@/lib/course-modules/domain';
import { CourseModuleBlockEditor } from './course-module-block-editor';
import { CourseModulePreview } from './course-module-preview';
import { CourseModulePlan } from './course-module-plan';
import { CourseModuleReview } from './course-module-review';
import css from './course-modules.module.css';

type DragTarget={kind:'module'|'lesson'|'block';id:number};
type Rename={kind:'module'|'lesson';id:number;name:string}|null;
type Create={kind:'module'|'lesson'|'block';parentId:number|null}|null;
const ICONS={text:AlignLeft,image:ImageIcon,pdf:FileText,video:Video,quiz:ClipboardCheck,
  homework:ClipboardList,survey:BookOpen,forum:MessageSquare} satisfies Record<BlockKind,typeof AlignLeft>;
const code=(key:string)=>BLOCK_KINDS.includes(key as BlockKind);
function defaultCompletion(kind:BlockKind){return kind==='homework'?'SUBIR':['quiz','survey','forum'].includes(kind)?'RESPONDER':'VER';}
function toLocal(iso:string|null){if(!iso)return '';const date=new Date(iso);if(!Number.isFinite(date.getTime()))return '';return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function dialogClose(e:MouseEvent<HTMLElement>,close:()=>void){if(e.target===e.currentTarget)close();}

export function CourseModules({courseId,courseName,role}:{courseId:number;courseName:string;role:'ADMIN'|'TEACHER'}){
 const [tree,setTree]=useState<CourseStructure|null>(null),[types,setTypes]=useState<BlockTypeOption[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [expanded,setExpanded]=useState<Record<number,boolean>>({}),[lessonsOpen,setLessonsOpen]=useState<Record<number,boolean>>({});
 const [rename,setRename]=useState<Rename>(null),[create,setCreate]=useState<Create>(null),[blockEdit,setBlockEdit]=useState<ModuleBlock|null>(null);
 const [respond,setRespond]=useState(false);
 const [generalEdit,setGeneralEdit]=useState<ModuleBlock|null>(null),[review,setReview]=useState<ModuleBlock|null>(null),[preview,setPreview]=useState(false),[plan,setPlan]=useState(false);
 const [name,setName]=useState(''),[kind,setKind]=useState<BlockKind>('text'),[date,setDate]=useState(''),[counts,setCounts]=useState(false);
 const dragging=useRef<DragTarget|null>(null);
 const url=useCallback((...p:(string|number)[])=>modulesUrl(courseId,...p),[courseId]);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{const [structure,catalog]=await Promise.all([requestJson(url('structure')),requestJson(url('block-types'))]);
   setTree(parseStructure(structure,courseId));
   if(!Array.isArray(catalog))throw Error('Catálogo de recursos inválido');
   setTypes(catalog.filter((r):r is BlockTypeOption=>!!r&&typeof r==='object'&&
      typeof r.id==='number'&&code(String(r.code||r.key))&&r.is_active===true));
  }catch(e){setError(apiErrorMessage(e));}finally{setLoading(false);}
 },[url,courseId]);
 useEffect(()=>{void load();},[load]);
 const evaluated=useMemo(()=>tree?.modules.flatMap(m=>m.lessons.flatMap(l=>l.blocks.filter(b=>GRADED_KINDS.has(b.block_type))))||[],[tree]);
 const run=useCallback(async(task:()=>Promise<unknown>,success:string)=>{
  setBusy(true);setError('');setNotice('');
  try{await task();setNotice(success);await load();return true;}
  catch(e){setError(`${apiErrorMessage(e)}. Si se perdió la conexión, verifica el estado antes de reintentar.`);return false;}
  finally{setBusy(false);}
 },[load]);
 const openCreate=(next:Create)=>{setCreate(next);setRename(null);setName('');setKind('text');setDate('');setCounts(false);};
 const openEditGeneral=(block:ModuleBlock)=>{setGeneralEdit(block);setName(block.title);setDate(toLocal(block.date_available));setCounts(block.counts_toward_grade);};
 async function saveCreate(event:FormEvent){event.preventDefault();if(!create||!tree||busy||!name.trim())return;
  const parent=create.parentId;
  if(create.kind==='module'){
   const ok=await run(()=>sendJson(url('modules'),'POST',{name:name.trim(),order:tree.modules.length,course_id:courseId}),'Módulo creado.');if(ok)setCreate(null);
  }else if(create.kind==='lesson'){
   const m=tree.modules.find(x=>x.id===parent);if(!m)return;
   const ok=await run(()=>sendJson(url('lessons'),'POST',{name:name.trim(),order:m.lessons.length,module_id:m.id}),'Lección creada.');if(ok){setCreate(null);setExpanded(s=>({...s,[m.id]:true}));}
  }else{
   const lesson=tree.modules.flatMap(m=>m.lessons).find(x=>x.id===parent);
   const id=types.find(t=>(t.code||t.key)===kind)?.id;
   if(!lesson||!id){setError('El tipo de recurso no está disponible en el catálogo del backend');return;}
   const form=new FormData();form.set('lesson_id',String(lesson.id));form.set('block_type_id',String(id));
   form.set('order',String(lesson.blocks.length));form.set('content',JSON.stringify({title:name.trim()}));
   form.set('completion_type',defaultCompletion(kind));form.set('counts_toward_grade',String(GRADED_KINDS.has(kind)&&counts));
   if(date)form.set('date_available',new Date(date).toISOString());
   const ok=await run(()=>sendFile(url('blocks'),form),'Recurso creado. Configura ahora su contenido.');
   if(ok){setCreate(null);setLessonsOpen(s=>({...s,[lesson.id]:true}));}
  }
 }
 async function saveRename(event:FormEvent){event.preventDefault();if(!rename||!name.trim())return;
  const ok=await run(()=>sendJson(url(rename.kind==='module'?'modules':'lessons',rename.id),'PUT',{name:name.trim()}),'Nombre actualizado.');if(ok)setRename(null);
 }
 async function saveGeneral(event:FormEvent){event.preventDefault();if(!generalEdit||!name.trim())return;
  const payload=new FormData();payload.set('content',JSON.stringify({title:name.trim()}));
  if(date)payload.set('date_available',new Date(date).toISOString());else payload.set('clear_date_available','true');
  if(GRADED_KINDS.has(generalEdit.block_type))payload.set('counts_toward_grade',String(counts));
  const ok=await run(()=>sendFile(url('blocks',generalEdit.id),payload,'PUT'),'Propiedades guardadas.');if(ok)setGeneralEdit(null);
 }
 async function remove(kind:'module'|'lesson'|'block',id:number,title:string){
  if(busy||!(await confirmAction(`¿Archivar «${title}»? Se preserva el historial académico. Si afecta al plan ponderado, ajusta el plan antes de archivar.`)))return;
  await run(()=>sendJson(url(kind==='module'?'modules':kind==='lesson'?'lessons':'blocks',id),'DELETE'),'Elemento archivado.');
 }
 async function persistMove(next:CourseStructure){
  if(!tree||busy||JSON.stringify(snapshotOrder(next))===JSON.stringify(snapshotOrder(tree)))return;
  const previous=tree;setTree(next);setBusy(true);setError('');setNotice('');
  try{await sendJson(url('order'),'PUT',snapshotOrder(next));setNotice('Nuevo orden guardado.');}
  catch(e){setTree(previous);setError(`No se guardó el orden: ${apiErrorMessage(e)}. Actualiza para revisar cambios simultáneos.`);}
  finally{setBusy(false);}
 }
 function relocate(kind:DragTarget['kind'],id:number,parent:number|null,index:number){if(!tree)return;
  // index del destino se refiere a la lista previa: al retirar un elemento de la misma lista se ajusta.
  let from=-1;let same=false;
  if(kind==='module'){from=tree.modules.findIndex(m=>m.id===id);same=true;}
  else if(kind==='lesson')for(const m of tree.modules){const i=m.lessons.findIndex(l=>l.id===id);if(i>=0){from=i;same=m.id===parent;break;}}
  else for(const m of tree.modules)for(const l of m.lessons){const i=l.blocks.findIndex(b=>b.id===id);if(i>=0){from=i;same=l.id===parent;break;}}
  const fixed=same&&from<index?index-1:index;
  void persistMove(moveInTree(tree,kind,id,parent,fixed));
 }
 function drop(event:DragEvent,kind:DragTarget['kind'],parent:number|null,index:number){event.preventDefault();event.stopPropagation();
  const source=dragging.current;dragging.current=null;
  if(source?.kind===kind)relocate(source.kind,source.id,parent,index);
 }
 function moveArrow(kind:DragTarget['kind'],id:number,parent:number|null,index:number,delta:number){
  if(!tree)return;void persistMove(moveInTree(tree,kind,id,parent,index+delta));
 }
 function openRename(kind:'module'|'lesson',id:number,current:string){setRename({kind,id,name:current});setName(current);}
 const closeForms=()=>{if(!busy){setCreate(null);setRename(null);setGeneralEdit(null);}};
 return <section className={css.page} aria-label="Gestión de módulos académicos">
  <div className="workspace-heading"><div><span className="lms-eyebrow">ESTRUCTURA ACADÉMICA</span><h1>Módulos y lecciones</h1>
   <p>Organiza el contenido de {courseName}. Los ocho recursos están disponibles en MOOC y MDT.</p></div>
   <div className={css.toolbar}><button className="lms-outline-button" onClick={()=>void load()} disabled={busy}><RefreshCw size={16}/> Actualizar</button>
   <button className="lms-outline-button" onClick={()=>setPreview(true)} disabled={!tree}><Eye size={16}/> Vista previa</button>
   <button className="lms-outline-button" onClick={()=>setPlan(true)} disabled={!tree}><ClipboardCheck size={16}/> Plan de calificación</button>
   <button className="button button-primary" onClick={()=>openCreate({kind:'module',parentId:null})} disabled={busy||loading}><Plus size={16}/> Nuevo módulo</button></div></div>
  {error&&<ToastMessage kind="error" message={error} />}{notice&&<ToastMessage kind="success" message={notice} />}
  <p className={css.hint}><GripVertical size={15}/> Arrastra módulos, lecciones y recursos, incluso entre módulos/lecciones del mismo curso. Usa las flechas para ordenar con teclado.</p>
  {loading?<p className={css.placeholder}><LoaderCircle className={css.spin}/> Cargando estructura académica…</p>:!tree?<p className={css.placeholder}>No fue posible cargar el curso. Usa Actualizar.</p>:
   tree.modules.length===0?<div className={css.empty}><Layers3 size={35}/><h2>Tu curso aún no tiene módulos</h2><p>Crea el primer módulo para incorporar lecciones y recursos.</p><button className="button button-primary" onClick={()=>openCreate({kind:'module',parentId:null})}><Plus size={16}/> Crear primer módulo</button></div>:
   <div className={css.moduleList}>{tree.modules.map((m,mi)=><article key={m.id} className={css.module}>
    <div className={css.moduleHead} onDragOver={e=>{if(dragging.current?.kind==='module')e.preventDefault();}} onDrop={e=>drop(e,'module',null,mi)}>
      <button title="Arrastrar módulo" aria-label={`Arrastrar módulo ${m.name}`} className={css.grip} draggable={!busy}
       onDragStart={e=>{dragging.current={kind:'module',id:m.id};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(m.id));}}><GripVertical size={20}/></button>
      <button className={css.toggle} onClick={()=>setExpanded(s=>({...s,[m.id]:s[m.id]===false?true:false}))} aria-expanded={expanded[m.id]!==false}>
       <Layers3 size={18}/><strong>{mi+1}. {m.name}</strong><span>{m.lessons.length} lecciones</span></button>
      <div className={css.actions}>
       <button title="Subir módulo" aria-label="Subir módulo" disabled={busy||mi===0} onClick={()=>moveArrow('module',m.id,null,mi,-1)}><ArrowUp size={16}/></button>
       <button title="Bajar módulo" aria-label="Bajar módulo" disabled={busy||mi===tree.modules.length-1} onClick={()=>moveArrow('module',m.id,null,mi,1)}><ArrowDown size={16}/></button>
       <button title="Cambiar nombre" aria-label="Editar módulo" onClick={()=>openRename('module',m.id,m.name)}><PenLine size={16}/></button>
       <button title="Archivar módulo" aria-label="Archivar módulo" onClick={()=>void remove('module',m.id,m.name)}><Trash2 size={16}/></button></div>
    </div>
    {expanded[m.id]!==false&&<div className={css.moduleBody}>
     {m.lessons.map((l,li)=><div key={l.id} className={css.lesson} onDragOver={e=>{if(dragging.current?.kind==='lesson')e.preventDefault();}} onDrop={e=>drop(e,'lesson',m.id,li)}>
      <div className={css.lessonHead}>
       <button title="Arrastrar lección" className={css.grip} draggable={!busy} onDragStart={e=>{e.stopPropagation();dragging.current={kind:'lesson',id:l.id};e.dataTransfer.setData('text/plain',String(l.id));}}><GripVertical size={18}/></button>
       <button className={css.toggle} aria-expanded={lessonsOpen[l.id]!==false} onClick={()=>setLessonsOpen(s=>({...s,[l.id]:s[l.id]===false?true:false}))}>
        <BookOpen size={17}/><strong>{li+1}. {l.name}</strong><span>{l.blocks.length} recursos</span></button>
       <div className={css.actions}>
        <button title="Subir lección" disabled={busy||li===0} onClick={()=>moveArrow('lesson',l.id,m.id,li,-1)}><ArrowUp size={15}/></button>
        <button title="Bajar lección" disabled={busy||li===m.lessons.length-1} onClick={()=>moveArrow('lesson',l.id,m.id,li,1)}><ArrowDown size={15}/></button>
        <button title="Editar lección" onClick={()=>openRename('lesson',l.id,l.name)}><PenLine size={15}/></button>
        <button title="Archivar lección" onClick={()=>void remove('lesson',l.id,l.name)}><Trash2 size={15}/></button></div>
      </div>
      {lessonsOpen[l.id]!==false&&<div className={css.lessonBody}>
       {l.blocks.map((b,bi)=>{const Icon=ICONS[b.block_type];return <div className={css.block} key={b.id}
        onDragOver={e=>{if(dragging.current?.kind==='block')e.preventDefault();}}
        onDrop={e=>drop(e,'block',l.id,bi)}>
        <button title="Arrastrar recurso" className={css.grip} draggable={!busy} onDragStart={e=>{e.stopPropagation();dragging.current={kind:'block',id:b.id};e.dataTransfer.setData('text/plain',String(b.id));}}><GripVertical size={16}/></button>
        <div className={css.resourceIcon}><Icon size={18}/></div><div className={css.resourceInfo}><strong>{b.title||BLOCK_NAMES[b.block_type]}</strong>
          <span>{BLOCK_NAMES[b.block_type]} · {displayDate(b.date_available)}{isFuture(b.date_available)?' · Programado':''}{b.counts_toward_grade?' · Cuenta para nota':''}</span></div>
        {isFuture(b.date_available)&&<LockKeyhole size={14} aria-label="Fecha futura"/>}
        <div className={css.actions}>
         <button title="Subir recurso" disabled={busy||bi===0} onClick={()=>moveArrow('block',b.id,l.id,bi,-1)}><ArrowUp size={15}/></button>
         <button title="Bajar recurso" disabled={busy||bi===l.blocks.length-1} onClick={()=>moveArrow('block',b.id,l.id,bi,1)}><ArrowDown size={15}/></button>
         <button className={css.actionPrimary} title="Configurar contenido" onClick={()=>{setRespond(false);setBlockEdit(b);}}><Settings2 size={16}/> <span>Configurar</span></button>
         {b.block_type==='survey'&&role==='TEACHER'&&<button title="Responder encuesta personalmente" onClick={()=>{setRespond(true);setBlockEdit(b);}}><PenLine size={15}/> Responder</button>}
         <button title="Editar propiedades" aria-label={`Editar ${b.title}`} onClick={()=>openEditGeneral(b)}><PenLine size={16}/></button>
         {['quiz','homework','survey','forum'].includes(b.block_type)&&<button title="Revisar" aria-label={`Revisar ${b.title}`} onClick={()=>setReview(b)}><ClipboardCheck size={16}/></button>}
         <button title="Archivar recurso" aria-label={`Archivar ${b.title}`} onClick={()=>void remove('block',b.id,b.title)}><Trash2 size={16}/></button>
        </div></div>;})}
       <div className={css.dropZone} onDragOver={e=>{if(dragging.current?.kind==='block')e.preventDefault();}} onDrop={e=>drop(e,'block',l.id,l.blocks.length)}>
        <button className={css.addText} onClick={()=>openCreate({kind:'block',parentId:l.id})}><Plus size={15}/> Añadir recurso</button>
        <span>Arrastra aquí un recurso de otra lección</span></div>
      </div>}
     </div>)}
     <div className={css.dropZone} onDragOver={e=>{if(dragging.current?.kind==='lesson')e.preventDefault();}} onDrop={e=>drop(e,'lesson',m.id,m.lessons.length)}>
      <button className={css.addText} onClick={()=>openCreate({kind:'lesson',parentId:m.id})}><Plus size={16}/> Añadir lección</button>
      <span>También puedes mover aquí una lección de otro módulo</span></div>
    </div>}
   </article>)}</div>}
  {(create||rename||generalEdit)&&<div className={css.backdrop} onMouseDown={e=>dialogClose(e,closeForms)}><section className={css.modal} role="dialog" aria-modal="true" aria-label="Propiedades" onKeyDown={e=>{if(e.key==='Escape')closeForms();}}>
    <div className={css.modalTop}><h2>{create?`Crear ${create.kind==='module'?'módulo':create.kind==='lesson'?'lección':'recurso'}`:generalEdit?'Editar propiedades':'Cambiar nombre'}</h2><button onClick={closeForms} aria-label="Cerrar"><X size={20}/></button></div>
    <form onSubmit={create?saveCreate:rename?saveRename:saveGeneral} className={css.form}>
     {create?.kind==='block'&&<label>Tipo de recurso<select value={kind} onChange={e=>{setKind(e.target.value as BlockKind);setCounts(false);}}>
      {BLOCK_KINDS.filter(k=>types.some(t=>(t.code||t.key)===k)).map(k=><option key={k} value={k}>{BLOCK_NAMES[k]}</option>)}
     </select></label>}
     <label>Nombre<input required maxLength={255} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del elemento"/></label>
     {(generalEdit||create?.kind==='block')&&<label>Disponible desde (opcional)<input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/><small>La actividad seguirá visible, pero quedará bloqueada para estudiantes hasta esa fecha.</small></label>}
     {(generalEdit?GRADED_KINDS.has(generalEdit.block_type):create?.kind==='block'&&GRADED_KINDS.has(kind))&&<label className={css.check}><input type="checkbox" checked={counts} onChange={e=>setCounts(e.target.checked)}/> Cuenta para la nota final <small>Si el curso es WEIGHTED, incluye el recurso desde Plan de calificación.</small></label>}
     <div className={css.formActions}><button type="button" className="lms-outline-button" onClick={closeForms}>Cancelar</button><button className="button button-primary" disabled={busy||!name.trim()}>{busy?'Guardando…':'Guardar'}</button></div>
    </form>
  </section></div>}
  {blockEdit&&<CourseModuleBlockEditor courseId={courseId} role={role} block={blockEdit} initialTab={respond?'respond':'config'} onClose={()=>setBlockEdit(null)} onSaved={()=>void load()}/>}
  {review&&<CourseModuleReview courseId={courseId} block={review} onClose={()=>setReview(null)}/>}
  {plan&&<CourseModulePlan courseId={courseId} count={evaluated.length} onClose={()=>setPlan(false)} onSaved={()=>void load()}/>}
  {preview&&tree&&<CourseModulePreview courseId={courseId} tree={tree} onClose={()=>setPreview(false)}/>}
 </section>;
}
