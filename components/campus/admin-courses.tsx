"use client";
/* eslint-disable @next/next/no-img-element -- Las imágenes son servidas por proxy propio autenticado y restringido. */

import Link from 'next/link';
import { useCallback,useEffect,useMemo,useState,type FormEvent } from 'react';
import { AlertTriangle, BookOpen, Eye, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { apiErrorMessage,requestJson } from '@/lib/academic/client';
import { parseCategory,parseCourse,parseCourseType,parseList,parseSubcategory,
 type Category,type Subcategory,type CourseType,type ManagedCourse,type CourseCode,type CourseLevel } from '@/lib/academic/types';

type FormState={name:string;description:string;categoryId:string;subcategoryId:string;courseTypeId:string;
 level:CourseLevel;price:string;discount:string;currency:string;isFree:boolean;isPublished:boolean;
 openEnrollment:boolean;hours:string;lessons:string;initDate:string;finishDate:string;image:File|null};
const emptyForm=():FormState=>({name:'',description:'',categoryId:'',subcategoryId:'',courseTypeId:'',level:'PRINCIPIANTE',
 price:'0',discount:'',currency:'USD',isFree:false,isPublished:false,openEnrollment:false,hours:'0',lessons:'0',
 initDate:'',finishDate:'',image:null});
function fromCourse(course:ManagedCourse,subcategories:Subcategory[]):FormState{
 const sub=subcategories.find(x=>x.id===course.subcategory_id);
 return {name:course.name,description:course.description,categoryId:String(sub?.category_id||''),
  subcategoryId:String(course.subcategory_id),courseTypeId:'',level:course.level,price:String(course.price),
  discount:course.discount_price===null?'':String(course.discount_price),currency:course.currency,
  isFree:course.is_free,isPublished:course.is_published,openEnrollment:course.open_enrollment,
  hours:String(course.duration_hours),lessons:String(course.total_lessons),
  initDate:course.init_date||'',finishDate:course.finish_date||'',image:null};
}
function courseForm(value:FormState,creating:boolean):FormData{
 const form=new FormData();const text:{[key:string]:string}={name:value.name.trim(),description:value.description.trim(),
 level:value.level,currency:value.currency.toUpperCase(),price:value.isFree?'0':value.price,
 duration_hours:value.hours,total_lessons:value.lessons,subcategory_id:value.subcategoryId};
 if(creating)text.course_type_id=value.courseTypeId;
 for(const [key,val] of Object.entries(text))form.set(key,val);
 form.set('is_free',String(value.isFree));form.set('is_published',String(creating?false:value.isPublished));
 form.set('open_enrollment',String(value.openEnrollment));
 // CourseUpdate.as_form de FastAPI no acepta limpiar campos enviando vacío.
 // Por ello no incluimos fecha o descuento vacío en una actualización existente.
 if(!value.isFree&&value.discount.trim())form.set('discount_price',value.discount.trim());
 if(value.initDate)form.set('init_date',value.initDate);
 if(value.finishDate)form.set('finish_date',value.finishDate);
 if(value.image)form.set('image',value.image);
 return form;
}
const fmt=(price:number,currency:string)=>new Intl.NumberFormat('es-EC',{style:'currency',currency:currency||'USD'}).format(price);

export function AdminCourses(){
 const [items,setItems]=useState<ManagedCourse[]>([]),[cats,setCats]=useState<Category[]>([]),[subs,setSubs]=useState<Subcategory[]>([]);
 const [types,setTypes]=useState<CourseType[]>([]),[allowed,setAllowed]=useState<CourseCode[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [search,setSearch]=useState(''),[filterType,setFilterType]=useState('all'),[filterStatus,setFilterStatus]=useState('all');
 const [filterCategory,setFilterCategory]=useState('all');
 const [editing,setEditing]=useState<ManagedCourse|'new'|null>(null),[form,setForm]=useState<FormState>(emptyForm());
 const [modalError,setModalError]=useState(''),[deleting,setDeleting]=useState<ManagedCourse|null>(null);
 const [previewUrl,setPreviewUrl]=useState<string|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);setError('');
  try{
   const [cs,ss,ts,cc]=await Promise.all([
    requestJson('/api/academic/categories',signal),requestJson('/api/academic/subcategories',signal),
    requestJson('/api/academic/course-types',signal),requestJson('/api/academic/courses',signal)
   ]);
   const cats=parseList(cs,parseCategory),subs=parseList(ss,parseSubcategory),courses=parseList(cc,parseCourse);
   const response=ts as {types?:unknown;allowed?:unknown}|null;
   const types=parseList(response?.types,parseCourseType);
   const allowed=Array.isArray(response?.allowed)&&response.allowed.every(code=>code==='MDT'||code==='MOOC')?
    response.allowed as CourseCode[]:null;
   if(!cats||!subs||!courses||!types||!allowed)throw Error('El backend devolvió contratos académicos inesperados');
   if(!signal?.aborted){setCats(cats);setSubs(subs);setItems(courses);setTypes(types);setAllowed(allowed);}
  }catch(e){if(!signal?.aborted)setError(apiErrorMessage(e));}
  finally{if(!signal?.aborted)setLoading(false);}
 },[]);
 useEffect(()=>{const ctrl=new AbortController();void load(ctrl.signal);return()=>ctrl.abort()},[load]);
 useEffect(()=>{if(!form.image){setPreviewUrl(null);return;}
  const url=URL.createObjectURL(form.image);setPreviewUrl(url);return()=>URL.revokeObjectURL(url);
 },[form.image]);
 const filtered=useMemo(()=>items.filter(c=>{
  const cat=subs.find(s=>s.id===c.subcategory_id)?.category_id;
  const matches=[c.name,c.description,subs.find(s=>s.id===c.subcategory_id)?.name||''].join(' ').toLocaleLowerCase('es-EC');
  return matches.includes(search.trim().toLocaleLowerCase('es-EC'))&&
   (filterType==='all'||c.course_type.code===filterType)&&
   (filterStatus==='all'||c.is_published===(filterStatus==='published'))&&
   (filterCategory==='all'||String(cat)===filterCategory);
 }),[items,subs,search,filterType,filterStatus,filterCategory]);
 const available=types.filter(t=>allowed.includes(t.code));
 const openCreate=()=>{const first=cats[0];const sub=subs.find(s=>s.category_id===first?.id);const type=available[0];
  setForm({...emptyForm(),categoryId:first?String(first.id):'',subcategoryId:sub?String(sub.id):'',courseTypeId:type?String(type.id):''});
  setEditing('new');setModalError('');};
 const openEdit=(course:ManagedCourse)=>{setForm(fromCourse(course,subs));setEditing(course);setModalError('');};
 const update=<K extends keyof FormState>(key:K,value:FormState[K])=>setForm(p=>({...p,[key]:value}));
 async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!editing||busy)return;
  setModalError('');const creating=editing==='new';
  if(!form.subcategoryId||creating&&!form.courseTypeId)return setModalError('Debes elegir subcategoría y tipo de curso');
  if(!form.name.trim()||!form.description.trim())return setModalError('El nombre y descripción son obligatorios');
  if(!form.isFree&&form.discount&&Number(form.discount)>Number(form.price))return setModalError('El descuento supera el precio');
  if(form.finishDate&&form.initDate&&form.finishDate<form.initDate)return setModalError('La fecha final es anterior a la inicial');
  if(form.image&&(form.image.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(form.image.type)))
   return setModalError('La imagen debe ser JPG, PNG o WebP y no superar 5 MB');
  if(creating&&!available.some(t=>String(t.id)===form.courseTypeId))return setModalError('Tipo no autorizado por tu plan');
  setBusy(true);
  try{const result=await requestJson(creating?'/api/academic/courses':`/api/academic/courses/${editing.id}`,undefined,
    {method:creating?'POST':'PATCH',body:courseForm(form,creating)});
   if(!parseCourse(result))throw Error('FastAPI devolvió un curso inválido');
   setEditing(null);setNotice(creating?'Curso creado como borrador':'Curso actualizado correctamente');await load();
  }catch(e){setModalError(apiErrorMessage(e));}finally{setBusy(false);}
 }
 async function remove(){if(!deleting||busy)return;setBusy(true);setModalError('');
  try{await requestJson(`/api/academic/courses/${deleting.id}`,undefined,{method:'DELETE'});
   setNotice('Curso eliminado lógicamente. Su historial permanece en la base de datos.');setDeleting(null);await load();
  }catch(e){setModalError(apiErrorMessage(e));}finally{setBusy(false);}
 }
 const published=items.filter(c=>c.is_published).length;
 return <div className="lms-users-page lms-academic">
  <div className="lms-page-heading lms-users-heading"><div><p className="lms-eyebrow">GESTIÓN ACADÉMICA</p><h1>Cursos</h1>
   <p>Administra el catálogo y entra a cada curso para configurar sus actividades y calificaciones.</p></div>
   <button className="button button-primary small-button" onClick={openCreate} disabled={!available.length||!subs.length}><Plus size={17}/> Crear curso</button></div>
  <div className="lms-users-stats"><div><BookOpen size={25}/><span><strong>{items.length}</strong><small>Total de cursos</small></span></div>
   <div><Eye size={25}/><span><strong>{published}</strong><small>Publicados</small></span></div>
   <div><Pencil size={25}/><span><strong>{items.length-published}</strong><small>Borradores</small></span></div></div>
  {!loading&&!allowed.length&&<p className="lms-academic-note" role="status">Tu configuración LMS no devuelve las capacidades exactas <strong>MOOC</strong> o <strong>MDT</strong>. La creación y transición de tipos quedan bloqueadas hasta que se homologuen los códigos en FastAPI/lms_configs. Los cursos existentes se pueden administrar.</p>}
  {!loading&&!subs.length&&<p className="lms-academic-note">Crea primero una categoría y una subcategoría para registrar cursos.</p>}
  <section className="lms-users-panel"><div className="lms-users-panel-header"><div><h2>Listado de cursos</h2>
   <p>{filtered.length} resultados • Selecciona «Ver curso» para abrir su administración.</p></div>
   <button className="lms-outline-button" disabled={loading} onClick={()=>void load()}><RefreshCw size={16}/> Actualizar</button></div>
   {error&&<p className="lms-error" role="alert">{error}</p>}
   {notice&&<p className="lms-users-success" role="status">{notice}<button aria-label="Cerrar" onClick={()=>setNotice('')}>×</button></p>}
   <div className="lms-users-filters lms-academic-course-filters"><label className="lms-users-search"><Search size={18}/>
    <input placeholder="Buscar curso..." aria-label="Buscar cursos" value={search} onChange={e=>setSearch(e.target.value)}/></label>
    <select aria-label="Filtrar categoría" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
     <option value="all">Todas las categorías</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <select aria-label="Filtrar tipo" value={filterType} onChange={e=>setFilterType(e.target.value)}>
     <option value="all">Todos los tipos</option>{types.map(t=><option key={t.id} value={t.code}>{t.code}</option>)}</select>
    <select aria-label="Filtrar publicación" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
     <option value="all">Todos los estados</option><option value="published">Publicados</option><option value="draft">Borradores</option></select>
   </div>
   <div className="lms-users-table-wrap"><table className="lms-users-table lms-academic-table lms-academic-courses-table"><thead><tr>
    <th>Curso</th><th>Categoría / Subcategoría</th><th>Tipo</th><th>Nivel</th><th>Precio</th><th>Duración</th><th>Estado</th><th className="lms-users-action-col">Acciones</th>
   </tr></thead><tbody>{filtered.map(course=>{
    const sub=subs.find(s=>s.id===course.subcategory_id),cat=cats.find(c=>c.id===sub?.category_id);
    return <tr key={course.id}><td><span className="lms-academic-course-name">
     {course.is_published&&course.image_url?<img src={`/api/academic/courses/${course.id}/image`} alt=""/>:<span className="lms-academic-course-placeholder"><BookOpen size={20}/></span>}
     <strong title={course.name}>{course.name}</strong></span></td>
     <td><span className="lms-academic-hierarchy"><strong>{cat?.name||'—'}</strong><small>{sub?.name||'—'}</small></span></td>
     <td><span className="lms-users-role lms-users-role-admin">{course.course_type.code}</span></td>
     <td>{course.level.toLocaleLowerCase('es-EC')}</td><td><strong>{course.is_free?'Gratis':fmt(course.price,course.currency)}</strong></td>
     <td>{course.duration_hours} h</td><td><span className={`lms-users-state ${course.is_published?'lms-users-state-on':'lms-users-state-off'}`}>{course.is_published?'Publicado':'Borrador'}</span></td>
     <td className="lms-users-action-col"><div className="lms-users-actions">
      <button title="Editar curso" aria-label={`Editar ${course.name}`} className="lms-icon-button" onClick={()=>openEdit(course)}><Pencil size={16}/></button>
      <Link title="Ver curso" aria-label={`Ver curso ${course.name}`} className="lms-icon-button" href={`/campus/courses/${course.id}`}><Eye size={16}/></Link>
      <button title="Eliminar curso" aria-label={`Eliminar ${course.name}`} className="lms-icon-button lms-users-danger-icon" onClick={()=>{setDeleting(course);setModalError('')}}><Trash2 size={16}/></button></div></td>
    </tr>})}</tbody></table></div>
   {!loading&&!filtered.length&&<p className="lms-academic-empty">{items.length?'No hay cursos con esos filtros.':'Todavía no se han creado cursos.'}</p>}
   {loading&&<p className="lms-academic-empty">Cargando cursos...</p>}
  </section>
  {editing&&<div className="lms-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditing(null)}}>
   <div className="lms-modal lms-modal-large lms-academic-course-modal" role="dialog" aria-modal="true" aria-label={editing==='new'?'Nuevo curso':'Editar curso'}>
    <div className="lms-modal-titlebar"><span className="lms-doc-icon"><BookOpen size={20}/></span><div className="lms-modal-heading">
     <strong>{editing==='new'?'Crear curso':'Actualizar curso'}</strong><small>{editing==='new'?'El nuevo curso se guardará como borrador.':'El cambio de tipo se realiza desde «Ver curso».'}</small></div>
     <button className="lms-icon-button" aria-label="Cerrar" onClick={()=>setEditing(null)} disabled={busy}><X size={18}/></button></div>
    <form className="lms-editor-form" onSubmit={save}>
     <label>Nombre del curso<input required maxLength={180} value={form.name} onChange={e=>update('name',e.target.value)}/></label>
     <label>Descripción<textarea rows={4} required maxLength={10000} value={form.description} onChange={e=>update('description',e.target.value)}/></label>
     <div className="lms-form-row"><label>Categoría<select required value={form.categoryId} onChange={e=>{
      const categoryId=e.target.value;setForm(p=>({...p,categoryId,subcategoryId:String(subs.find(s=>String(s.category_id)===categoryId)?.id||'')}));}}>
      <option value="">Seleccionar</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Subcategoría<select required value={form.subcategoryId} onChange={e=>update('subcategoryId',e.target.value)}>
       <option value="">Seleccionar</option>{subs.filter(s=>String(s.category_id)===form.categoryId).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
     <div className="lms-form-row"><label>Tipo de curso
      {editing==='new'?<select required value={form.courseTypeId} onChange={e=>update('courseTypeId',e.target.value)}>
       {available.map(t=><option key={t.id} value={t.id}>{t.code}</option>)}</select>:
       <input disabled value={editing.course_type.code} title="Se cambia mediante el flujo de transición dentro del curso"/>}
      <small>Los bloques predeterminados los crea FastAPI según el tipo.</small></label>
      <label>Nivel<select value={form.level} onChange={e=>update('level',e.target.value as CourseLevel)}>
       <option value="PRINCIPIANTE">Principiante</option><option value="INTERMEDIO">Intermedio</option><option value="AVANZADO">Avanzado</option></select></label></div>
     <div className="lms-academic-four-fields"><label>Moneda<input required maxLength={3} value={form.currency} onChange={e=>update('currency',e.target.value.toUpperCase())}/></label>
      <label>Precio<input required min="0" step="0.01" type="number" disabled={form.isFree} value={form.isFree?'0':form.price} onChange={e=>update('price',e.target.value)}/></label>
      <label>Descuento<input min="0" step="0.01" type="number" disabled={form.isFree} value={form.isFree?'':form.discount} onChange={e=>update('discount',e.target.value)}/></label>
      <label>Duración (h)<input type="number" required min="0" step="1" value={form.hours} onChange={e=>update('hours',e.target.value)}/></label></div>
     <div className="lms-form-row"><label>Lecciones estimadas<input type="number" required min="0" step="1" value={form.lessons} onChange={e=>update('lessons',e.target.value)}/></label>
      <label>Imagen de portada<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>update('image',e.target.files?.[0]||null)}/><small>PNG, JPG o WebP, hasta 5 MB. Si no seleccionas, se conserva la imagen existente.</small></label></div>
     {previewUrl&&<img className="lms-academic-image-preview" src={previewUrl} alt="Vista previa de la portada"/>}
     <div className="lms-form-row"><label>Fecha de inicio<input type="date" value={form.initDate} onChange={e=>update('initDate',e.target.value)}/></label>
      <label>Fecha de finalización<input type="date" value={form.finishDate} onChange={e=>update('finishDate',e.target.value)}/></label></div>
     <div className="lms-academic-flags"><label className="lms-switch-label"><input type="checkbox" checked={form.isFree} onChange={e=>update('isFree',e.target.checked)}/><span>Curso gratuito</span></label>
      <label className="lms-switch-label"><input type="checkbox" checked={editing==='new'?false:form.isPublished} disabled={editing==='new'} onChange={e=>update('isPublished',e.target.checked)}/><span>Publicado {editing==='new'?'(se inicia como borrador)':''}</span></label>
      <label className="lms-switch-label"><input type="checkbox" checked={form.openEnrollment} onChange={e=>update('openEnrollment',e.target.checked)}/><span>Matrícula abierta</span></label></div>
     {editing!=='new'&&<p className="lms-academic-note">El backend actual no permite limpiar un descuento o fecha opcional enviando un campo vacío. Para quitar un descuento puedes marcar «Curso gratuito»; para limpiar fechas en cursos de pago será necesario el ajuste backend documentado.</p>}
     {modalError&&<p className="lms-error" role="alert">{modalError}</p>}
     <div className="lms-editor-actions"><button type="button" className="lms-outline-button" disabled={busy} onClick={()=>setEditing(null)}>Cancelar</button>
      <button className="button button-primary small-button" disabled={busy}>{busy?'Guardando...':editing==='new'?'Crear borrador':'Actualizar curso'}</button></div>
    </form>
   </div></div>}
  {deleting&&<div className="lms-modal-backdrop" role="presentation"><div className="lms-modal lms-users-confirm" role="alertdialog" aria-modal="true" aria-label="Confirmación de eliminación de curso">
   <span className="lms-users-alert-icon"><AlertTriangle size={23}/></span><h2>¿Eliminar el curso?</h2>
   <p>Vas a eliminar lógicamente <strong>{deleting.name}</strong>. Aunque existan matrículas, notas, asistencias o certificados, su historial no se borra de la base de datos; sin embargo, el curso dejará de estar disponible en los listados activos.</p>
   {deleting.total_students>0&&<p className="lms-academic-note"><strong>Advertencia:</strong> este curso registra {deleting.total_students} estudiantes.</p>}
   {modalError&&<p className="lms-error" role="alert">{modalError}</p>}
   <div className="lms-editor-actions"><button className="lms-outline-button" disabled={busy} onClick={()=>setDeleting(null)}>Cancelar</button>
    <button className="lms-users-danger-button" disabled={busy} onClick={()=>void remove()}><Trash2 size={16}/>{busy?'Eliminando...':'Sí, eliminar curso'}</button></div>
  </div></div>}
 </div>;
}
