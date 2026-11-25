"use client";
import { ToastMessage } from '@/components/ui/notifications';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { FolderOpen, FolderTree, Pencil, Plus, RefreshCw, Search, Trash2, X, AlertTriangle } from 'lucide-react';
import type { Category,Subcategory } from '@/lib/academic/types';
import { parseCategory,parseSubcategory,parseList } from '@/lib/academic/types';
import { apiErrorMessage,requestJson } from '@/lib/academic/client';

export function AdminTaxonomy({mode}:{mode:'categories'|'subcategories'}){
 const isCategory=mode==='categories';const label=isCategory?'categoría':'subcategoría';
 const [categories,setCategories]=useState<Category[]>([]),[items,setItems]=useState<(Category|Subcategory)[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('all');
 const [editing,setEditing]=useState<Category|Subcategory|'new'|null>(null),[name,setName]=useState(''),[categoryId,setCategoryId]=useState('');
 const [modalError,setModalError]=useState(''),[deleting,setDeleting]=useState<Category|Subcategory|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);setError('');
  try{
   const [catResult,listResult]=await Promise.all([
    requestJson('/api/academic/categories',signal),
    isCategory?Promise.resolve(null):requestJson('/api/academic/subcategories',signal)
   ]);
   const cat=parseList(catResult,parseCategory);
   const list=isCategory?cat:parseList(listResult,parseSubcategory);
   if(!cat||!list)throw Error('FastAPI devolvió una lista incompatible');
   if(!signal?.aborted){setCategories(cat);setItems(list);}
  }catch(e){if(!signal?.aborted)setError(apiErrorMessage(e));}
  finally{if(!signal?.aborted)setLoading(false);}
 },[isCategory]);
 useEffect(()=>{const ctrl=new AbortController();void load(ctrl.signal);return()=>ctrl.abort()},[load]);
 const filtered=useMemo(()=>items.filter(item=>item.name.toLocaleLowerCase('es-EC').includes(search.trim().toLocaleLowerCase('es-EC'))&&
  (isCategory||filter==='all'||('category_id'in item&&String(item.category_id)===filter))),[items,search,filter,isCategory]);
 const start=(item:Category|Subcategory|'new')=>{setEditing(item);setModalError('');setName(item==='new'?'':item.name);
  setCategoryId(item==='new'?(categories[0]?String(categories[0].id):''):('category_id'in item?String(item.category_id):''));};
 async function save(e:FormEvent){e.preventDefault();if(busy||!editing)return;
  setModalError('');if(!name.trim())return setModalError('Escribe un nombre');
  if(!isCategory&&!categoryId)return setModalError('Selecciona una categoría');
  const isNew=editing==='new',path=`/api/academic/${mode}${isNew?'':`/${editing.id}`}`;
  const payload=isCategory?{name:name.trim()}:{name:name.trim(),category_id:Number(categoryId)};
  setBusy(true);
  try{await requestJson(path,undefined,{method:isNew?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   setEditing(null);setNotice(`${isCategory?'Categoría':'Subcategoría'} ${isNew?'creada':'actualizada'} correctamente`);await load();
  }catch(e){setModalError(apiErrorMessage(e));}finally{setBusy(false);}
 }
 async function remove(){if(!deleting||busy)return;setBusy(true);setModalError('');
  try{await requestJson(`/api/academic/${mode}/${deleting.id}`,undefined,{method:'DELETE'});
   setNotice(`${isCategory?'Categoría':'Subcategoría'} eliminada`);setDeleting(null);await load();
  }catch(e){setModalError(apiErrorMessage(e));}finally{setBusy(false);}
 }
 return <div className="lms-users-page lms-academic">
  <div className="lms-page-heading lms-users-heading"><div><p className="lms-eyebrow">GESTIÓN ACADÉMICA / CURSOS</p>
   <h1>{isCategory?'Categorías':'Subcategorías'}</h1><p>{isCategory?'Organiza las áreas de formación de la academia.':'Agrupa los cursos dentro de las categorías existentes.'}</p></div>
   <button className="button button-primary small-button" onClick={()=>start('new')} disabled={!isCategory&&!categories.length}><Plus size={17}/> Nueva {label}</button>
  </div>
  <section className="lms-users-panel" aria-label={`Listado de ${label}s`}>
   <div className="lms-users-panel-header"><div><h2>{isCategory?'Catálogo de categorías':'Catálogo de subcategorías'}</h2>
    <p>{items.length} registros activos en esta academia</p></div>
    <button className="lms-outline-button" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/> Actualizar</button></div>
   {notice&&<ToastMessage kind="success" message={notice} />}
   {error&&<ToastMessage kind="error" message={error} />}
   <div className="lms-users-filters lms-academic-filters"><label className="lms-users-search"><Search size={18}/>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Buscar ${label}...`} aria-label="Buscar"/></label>
    {!isCategory&&<select aria-label="Filtrar por categoría" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas las categorías</option>
      {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
   </div>
   <div className="lms-users-table-wrap"><table className="lms-users-table lms-academic-table"><thead><tr><th>Nombre</th>
    {!isCategory&&<th>Categoría</th>}<th className="lms-users-action-col">Acciones</th></tr></thead>
    <tbody>{filtered.map(item=><tr key={item.id}><td><span className="lms-academic-name"><span className="lms-academic-icon">{isCategory?<FolderOpen size={18}/>:<FolderTree size={18}/>}</span><strong>{item.name}</strong></span></td>
     {!isCategory&&<td>{categories.find(c=>c.id===('category_id'in item?item.category_id:0))?.name||'—'}</td>}
     <td className="lms-users-action-col"><div className="lms-users-actions"><button className="lms-icon-button" title="Editar" aria-label={`Editar ${item.name}`} onClick={()=>start(item)}><Pencil size={16}/></button>
       <button className="lms-icon-button lms-users-danger-icon" title="Eliminar" aria-label={`Eliminar ${item.name}`} onClick={()=>{setModalError('');setDeleting(item)}}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
   {!loading&&!filtered.length&&<p className="lms-academic-empty">{items.length?'No hay coincidencias.':`Todavía no hay ${label}s.`}</p>}
   {loading&&<p className="lms-academic-empty">Cargando registros...</p>}
  </section>
  {editing&&<div className="lms-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditing(null)}}>
   <div className="lms-modal lms-users-confirm" role="dialog" aria-modal="true" aria-label={editing==='new'?`Crear ${label}`:`Editar ${label}`}>
    <div className="lms-modal-titlebar"><div className="lms-modal-heading"><strong>{editing==='new'?'Nueva':'Editar'} {label}</strong>
     <small>Los nombres deben ser únicos dentro de su categoría o academia.</small></div>
     <button className="lms-icon-button" aria-label="Cerrar" onClick={()=>setEditing(null)} disabled={busy}><X size={18}/></button></div>
    <form className="lms-editor-form" onSubmit={save}>
     <label>Nombre<input autoFocus required maxLength={150} value={name} onChange={e=>setName(e.target.value)}/></label>
     {!isCategory&&<label>Categoría<select required value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
      {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>}
     {modalError&&<ToastMessage kind="error" message={modalError} />}
     <div className="lms-editor-actions"><button className="lms-outline-button" type="button" onClick={()=>setEditing(null)} disabled={busy}>Cancelar</button>
      <button className="button button-primary small-button" disabled={busy}>{busy?'Guardando...':'Guardar'}</button></div>
    </form></div></div>}
  {deleting&&<div className="lms-modal-backdrop" role="presentation"><div className="lms-modal lms-users-confirm" role="alertdialog" aria-modal="true" aria-label="Confirmar eliminación">
   <span className="lms-users-alert-icon"><AlertTriangle size={23}/></span><h2>¿Eliminar {label}?</h2>
   <p>Se eliminará lógicamente <strong>{deleting.name}</strong>. No se podrá eliminar si tiene {isCategory?'subcategorías activas':'cursos activos'}.</p>
   {modalError&&<ToastMessage kind="error" message={modalError} />}
   <div className="lms-editor-actions"><button className="lms-outline-button" disabled={busy} onClick={()=>setDeleting(null)}>Cancelar</button>
    <button className="lms-users-danger-button" disabled={busy} onClick={()=>void remove()}><Trash2 size={16}/> {busy?'Eliminando...':'Confirmar eliminación'}</button></div>
  </div></div>}
 </div>;
}
