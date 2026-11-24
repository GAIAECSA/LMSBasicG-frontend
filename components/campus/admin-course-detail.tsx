"use client";
/* eslint-disable @next/next/no-img-element -- Vista previa blob: de imagen seleccionada en el navegador. */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, ImagePlus, Info, RefreshCw, Save } from 'lucide-react';
import { CourseCover } from './course-cover';
import { CourseTypeTransitionCard } from './course-type-transition';
import { CourseCertificateSettings } from './course-certificate-settings';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { parseCategory, parseCourse, parseList, parseSubcategory,
  type Category,type Subcategory,type ManagedCourse,type CourseLevel,type GradeMethod } from '@/lib/academic/types';
import { courseEditorFrom,courseUpdateForm,validateEditor,
  type CourseEditor } from '@/lib/course-workspace/editor';

const money=(amount:number,currency:string)=>{
  try{return new Intl.NumberFormat('es-EC',{style:'currency',currency}).format(amount);}
  catch{return `${amount.toFixed(2)} ${currency}`;}
};

/** Configuraciones ADMIN. Formulario completo de edición general y vista previa,
 * basado en la pantalla de creación de curso de Fase 6.
 * El tipo es solo lectura dentro del PATCH general; el componente separado
 * CourseTypeTransitionCard ejecuta preview/confirmación segura de FastAPI.
 */
export function AdminCourseDetail({courseId,initialCourse}:{courseId:number;initialCourse:ManagedCourse}){
  const router=useRouter();
  const [course,setCourse]=useState(initialCourse);
  const [form,setForm]=useState<CourseEditor>(()=>courseEditorFrom(initialCourse));
  const [categories,setCategories]=useState<Category[]>([]);
  const [subcategories,setSubcategories]=useState<Subcategory[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [imagePreview,setImagePreview]=useState<string|null>(null);
  const [partialUpdate,setPartialUpdate]=useState(false);

  const reload=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError('');setNotice('');
    try {
      const [raw,rawCats,rawSubs]=await Promise.all([
        requestJson(`/api/academic/courses/${courseId}`,signal),
        requestJson('/api/academic/categories',signal),
        requestJson('/api/academic/subcategories',signal),
      ]);
      const actual=parseCourse(raw),cats=parseList(rawCats,parseCategory),subs=parseList(rawSubs,parseSubcategory);
      if(!actual||actual.id!==courseId||!cats||!subs)throw Error('Respuesta de cursos o categorías inválida');
      const sub=subs.find(s=>s.id===actual.subcategory_id);
      if(!sub||!cats.some(c=>c.id===sub.category_id))throw Error('La categoría del curso no está disponible');
      if(!signal?.aborted){setCourse(actual);setCategories(cats);setSubcategories(subs);
        setForm({...courseEditorFrom(actual),categoryId:String(sub.category_id)});setPartialUpdate(false);}
    }catch(e){if(!signal?.aborted)setError(apiErrorMessage(e));}
    finally{if(!signal?.aborted)setLoading(false);}
  },[courseId]);
  useEffect(()=>{const ctrl=new AbortController();void reload(ctrl.signal);return()=>ctrl.abort();},[reload]);
  useEffect(()=>{
    if(!form.image){setImagePreview(null);return;}
    const url=URL.createObjectURL(form.image);setImagePreview(url);
    return()=>URL.revokeObjectURL(url);
  },[form.image]);
  const update=<K extends keyof CourseEditor>(key:K,value:CourseEditor[K])=>
    setForm(previous=>({...previous,[key]:value}));
  const filteredSubs=useMemo(()=>subcategories.filter(s=>String(s.category_id)===form.categoryId),
    [subcategories,form.categoryId]);
  const selectedCategory=categories.find(cat=>String(cat.id)===form.categoryId);
  const selectedSubcategory=subcategories.find(sub=>String(sub.id)===form.subcategoryId);
  const type=course.course_type.code;
  const originalEditor=courseEditorFrom(course);
  const originalCategory=subcategories.find(sub=>sub.id===course.subcategory_id);
  // No permitir una conversión con cambios generales pendientes: son dos operaciones
  // independientes del backend que deben quedar confirmadas por separado.
  const unsaved=(Object.keys(originalEditor) as (keyof CourseEditor)[]).some(key=>
    key==='categoryId'
      ? form.categoryId!==String(originalCategory?.category_id??'')
      : form[key]!==originalEditor[key]
  );
  function onTypeChanged(updated:ManagedCourse){
    setCourse(updated);
    const category=subcategories.find(sub=>sub.id===updated.subcategory_id);
    setForm({...courseEditorFrom(updated),categoryId:String(category?.category_id??'')});
    setError('');setPartialUpdate(false);
    setNotice(`El curso pasó a ${updated.course_type.code}. Se actualizó la navegación de su aula.`);
    router.refresh();
  }
  const pricePreview=form.isFree?0:Number(form.discount||form.price)||0;

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy||loading)return;
    setError('');setNotice('');setPartialUpdate(false);
    if(!filteredSubs.some(s=>String(s.id)===form.subcategoryId))return setError('La subcategoría no corresponde a la categoría elegida.');
    const validation=validateEditor(course,form);if(validation)return setError(validation);
    setBusy(true);
    let generalSaved=false;
    try{
      const response=await requestJson(`/api/academic/courses/${courseId}`,undefined,
        {method:'PATCH',body:courseUpdateForm(form)});
      const saved=parseCourse(response);
      if(!saved||saved.id!==courseId)throw Error('FastAPI no confirmó la actualización general.');
      generalSaved=true;
      let latest=saved;
      let suffix='';
      if(form.gradeMethod!==saved.grade_calculation_method){
        // Es otra operación backend que recalcula notas: jamás se simula un PATCH conjunto.
        const result=await requestJson(`/api/academic/courses/${courseId}/grade-method`,undefined,
          {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:form.gradeMethod})});
        const data=result as {method?:unknown;enrollments_recalculated?:unknown}|null;
        if(data?.method!==form.gradeMethod||typeof data?.enrollments_recalculated!=='number')
          throw Error('FastAPI no confirmó el recálculo de calificaciones.');
        latest={...saved,grade_calculation_method:form.gradeMethod};
        suffix=` Método de calificación actualizado; ${data.enrollments_recalculated} matrícula(s) recalculada(s).`;
      }
      setCourse(latest);
      setForm({...courseEditorFrom(latest),categoryId:form.categoryId});
      setNotice(`Los datos del curso se guardaron correctamente.${suffix}`);
      router.refresh();
    }catch(e){
      if(generalSaved){
        setPartialUpdate(true);
        setError(`La edición general se guardó, pero no se confirmó el método de calificación: ${apiErrorMessage(e)}. Pulsa «Recargar» para sincronizar.`);
      }else setError(apiErrorMessage(e));
    }finally{setBusy(false);}
  }

  return <div className="lms-users-page lms-academic course-settings-page">
    <header className="lms-page-heading lms-users-heading">
      <div><p className="lms-eyebrow">CURSO #{courseId} / CONFIGURACIONES</p>
        <h1>Editar curso</h1><p>Gestiona la información, publicación, matrícula y evaluación del curso.</p></div>
      <button type="button" className="lms-outline-button" disabled={loading||busy} onClick={()=>void reload()}>
        <RefreshCw size={16}/> Recargar</button>
    </header>
    {error&&<p className="lms-error" role="alert">{error}</p>}
    {notice&&<p className="lms-users-success" role="status">{notice}</p>}
    {partialUpdate&&<p className="lms-academic-note">El curso fue modificado parcialmente: revisa el método de calificación antes de hacer nuevos cambios.</p>}
    {loading?<div className="lms-loading-card">Cargando información del curso...</div>:<form className="course-settings-form" onSubmit={e=>void save(e)}>
      <div className="lms-course-create-columns">
        <div className="lms-course-create-fields lms-editor-form">
          <label>Nombre del curso
            <input required maxLength={180} value={form.name} onChange={e=>update('name',e.target.value)} disabled={busy}/>
          </label>
          <label>Descripción
            <textarea required rows={5} maxLength={10000} value={form.description} onChange={e=>update('description',e.target.value)} disabled={busy}/>
          </label>
          <label>Imagen del curso
            <span className="lms-course-upload"><ImagePlus size={21}/>
              <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Cambiar imagen del curso"
                onChange={e=>update('image',e.target.files?.[0]??null)} disabled={busy}/>
            </span><small>Conservar la imagen actual o subir una nueva (JPG, PNG o WebP, máximo 5 MB).</small>
          </label>
          <div className="lms-form-row lms-course-create-three-fields">
            <label>Categoría<select required value={form.categoryId} onChange={e=>setForm(p=>({...p,categoryId:e.target.value,subcategoryId:''}))} disabled={busy}>
              <option value="">Seleccionar</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label>Subcategoría<select required value={form.subcategoryId} disabled={busy||!form.categoryId} onChange={e=>update('subcategoryId',e.target.value)}>
              <option value="">Seleccionar</option>{filteredSubs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>
            <label>Nivel<select value={form.level} disabled={busy} onChange={e=>update('level',e.target.value as CourseLevel)}>
              <option value="PRINCIPIANTE">Principiante</option><option value="INTERMEDIO">Intermedio</option><option value="AVANZADO">Avanzado</option>
            </select></label>
          </div>
          <div className="lms-form-row lms-course-create-three-fields">
            <label>Tipo de curso<input readOnly aria-readonly="true" value={type}/><small>Para cambiar entre MOOC y MDT utiliza el apartado inferior. <a href="#course-type-transition" className="course-settings-type-shortcut">Ir al cambio de modalidad</a></small></label>
            <label>Moneda<input required maxLength={3} value={form.currency} onChange={e=>update('currency',e.target.value.toUpperCase())} disabled={busy}/></label>
            <label>Duración (horas)<input type="number" required min="0" step="1" value={form.hours} onChange={e=>update('hours',e.target.value)} disabled={busy}/></label>
          </div>
          <div className="lms-form-row lms-course-create-three-fields">
            <label>Precio<input type="number" min="0" step="0.01" required disabled={form.isFree||busy} value={form.isFree?'0':form.price} onChange={e=>update('price',e.target.value)}/></label>
            <label>Precio con descuento<input type="number" min="0" step="0.01" disabled={form.isFree||busy} value={form.isFree?'':form.discount} onChange={e=>update('discount',e.target.value)}/></label>
            <label>Lecciones estimadas<input type="number" min="0" step="1" required disabled={busy} value={form.lessons} onChange={e=>update('lessons',e.target.value)}/></label>
          </div>
          <div className="lms-form-row">
            <label>Fecha de inicio<input type="date" disabled={busy} value={form.initDate} onChange={e=>update('initDate',e.target.value)}/></label>
            <label>Fecha de finalización<input type="date" disabled={busy} value={form.finishDate} onChange={e=>update('finishDate',e.target.value)}/></label>
          </div>
          <div className="lms-academic-flags lms-course-create-flags">
            <label className="lms-switch-label"><input type="checkbox" disabled={busy} checked={form.isFree} onChange={e=>update('isFree',e.target.checked)}/><span>Curso gratuito</span></label>
            <label className="lms-switch-label"><input type="checkbox" disabled={busy} checked={form.isPublished} onChange={e=>update('isPublished',e.target.checked)}/><span>Curso publicado</span></label>
            <label className="lms-switch-label"><input type="checkbox" disabled={busy} checked={form.openEnrollment} onChange={e=>update('openEnrollment',e.target.checked)}/><span>Permitir matrícula</span></label>
          </div>
          <label>Método de calificación<select value={form.gradeMethod} disabled={busy} onChange={e=>update('gradeMethod',e.target.value as GradeMethod)}>
            <option value="AVERAGE">Promedio (AVERAGE)</option><option value="WEIGHTED">Ponderado (WEIGHTED)</option>
          </select><small>Si cambias este método, FastAPI recalculará las calificaciones; es una operación separada de la edición general.</small></label>
          <div className="lms-course-create-hint"><Info size={18}/><span>Publicar un curso permite mostrarlo en el catálogo. Cerrar matrículas no oculta cursos publicados ni revoca matrículas aceptadas.</span></div>
        </div>
        <aside className="lms-course-create-preview" aria-label="Vista previa del curso">
          <p className="lms-course-preview-heading">VISTA PREVIA DEL CURSO</p>
          <div className="lms-course-preview-card">
            <div className="lms-course-preview-cover">
              {imagePreview?<img alt="Portada seleccionada" src={imagePreview}/>:
                <CourseCover courseId={courseId} imageUrl={course.image_url} alt={`Portada de ${course.name}`} size={46}/>}
              <div className="lms-course-preview-tags"><span>{form.level}</span><span>{type}</span>
                <span>{form.isPublished?'PUBLICADO':'BORRADOR'}</span></div>
              <h3>{form.name.trim()||'Nombre del curso'}</h3>
            </div>
            <div className="lms-course-preview-content">
              <p className="lms-course-preview-description">{form.description.trim()||'La descripción aparecerá aquí.'}</p>
              <div className="course-settings-price"><small>PRECIO</small>
                <strong>{form.isFree?'Gratis':money(pricePreview,form.currency)}</strong>
                {!form.isFree&&form.discount&&Number(form.price)>Number(form.discount)&&
                  <del>{money(Number(form.price)||0,form.currency)}</del>}
              </div>
              <div className="lms-course-preview-facts">
                <div><small>CATEGORÍA</small><strong>{selectedCategory?.name||'—'}</strong></div>
                <div><small>SUBCATEGORÍA</small><strong>{selectedSubcategory?.name||'—'}</strong></div>
                <div><small>MATRÍCULA</small><strong>{form.openEnrollment?'Abierta':'Cerrada'}</strong></div>
                <div><small>DURACIÓN</small><strong>{form.hours||'0'} h</strong></div>
              </div>
            </div>
          </div>
          <div className="course-settings-summary">
            <p><CheckCircle2 size={17}/> Estado actual en la plataforma</p>
            <span>{course.is_published?'Publicado':'Borrador'} · {course.total_students} estudiante(s)</span>
          </div>
        </aside>
      </div>
      <footer className="lms-course-create-footer">
        <div className="lms-course-create-actions">
          <button type="button" className="lms-outline-button" disabled={busy} onClick={()=>void reload()}>Descartar cambios</button>
          <button type="submit" className="button button-primary" disabled={busy||loading}>
            {busy?<RefreshCw size={17}/>:<Save size={17}/>} {busy?'Guardando...':'Guardar cambios'}</button>
        </div>
      </footer>
    </form>}
    {!loading&&course.course_type.code==='MDT'&&<CourseCertificateSettings
      key={`${courseId}-${course.course_type_id}`}
      courseId={courseId}
      disabled={busy||partialUpdate}
      unsaved={unsaved}
      onChanged={()=>router.refresh()}
    />}
    {!loading&&<CourseTypeTransitionCard
      key={course.course_type_id}
      courseId={courseId}
      course={course}
      disabled={busy||partialUpdate}
      unsaved={unsaved}
      onChanged={onTypeChanged}
    />}
  </div>;
}
