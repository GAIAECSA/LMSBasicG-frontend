"use client";
/* eslint-disable @next/next/no-img-element -- Vista previa local blob: y portada pública validada por el BFF. */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, BookOpen, Eye, ImagePlus, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import { CourseCover } from './course-cover';
import {
  parseCategory, parseCourse, parseCourseType, parseList, parseSubcategory,
  type Category, type Subcategory, type CourseType, type ManagedCourse,
  type CourseCode, type CourseLevel,
} from '@/lib/academic/types';

type FormState = {
  name: string; description: string; categoryId: string; subcategoryId: string;
  courseTypeId: string; level: CourseLevel; price: string; discount: string;
  currency: string; isFree: boolean; openEnrollment: boolean; hours: string;
  lessons: string; initDate: string; finishDate: string; image: File | null;
};
const newForm = (): FormState => ({
  name: '', description: '', categoryId: '', subcategoryId: '', courseTypeId: '',
  level: 'PRINCIPIANTE', price: '0', discount: '', currency: 'USD',
  isFree: false, openEnrollment: false, hours: '0', lessons: '0',
  initDate: '', finishDate: '', image: null,
});

/** Solo creación desde el catálogo. La edición general será interna al curso. */
function makeCourseForm(value: FormState): FormData {
  const data = new FormData();
  const fields: Record<string, string> = {
    name: value.name.trim(), description: value.description.trim(),
    subcategory_id: value.subcategoryId, course_type_id: value.courseTypeId,
    level: value.level, currency: value.currency.toUpperCase(),
    price: value.isFree ? '0' : value.price,
    duration_hours: value.hours, total_lessons: value.lessons,
    is_free: String(value.isFree), is_published: 'false',
    open_enrollment: String(value.openEnrollment),
  };
  for (const [key, val] of Object.entries(fields)) data.set(key, val);
  if (!value.isFree && value.discount.trim()) data.set('discount_price', value.discount.trim());
  if (value.initDate) data.set('init_date', value.initDate);
  if (value.finishDate) data.set('finish_date', value.finishDate);
  if (value.image) data.set('image', value.image);
  return data;
}
const money = (price: number, currency: string) => {
  try { return new Intl.NumberFormat('es-EC', { style: 'currency', currency: currency || 'USD' }).format(price); }
  catch { return `${price.toFixed(2)} USD`; }
};

export function AdminCourses() {
  const [items, setItems] = useState<ManagedCourse[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [types, setTypes] = useState<CourseType[]>([]);
  const [allowed, setAllowed] = useState<CourseCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(newForm);
  const [modalError, setModalError] = useState('');
  const [deleting, setDeleting] = useState<ManagedCourse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const [cs, ss, ts, cc] = await Promise.all([
        requestJson('/api/academic/categories', signal),
        requestJson('/api/academic/subcategories', signal),
        requestJson('/api/academic/course-types', signal),
        requestJson('/api/academic/courses', signal),
      ]);
      const categories = parseList(cs, parseCategory);
      const subcategories = parseList(ss, parseSubcategory);
      const courses = parseList(cc, parseCourse);
      const response = ts as { types?: unknown; allowed?: unknown } | null;
      const courseTypes = parseList(response?.types, parseCourseType);
      const codes = Array.isArray(response?.allowed) && response.allowed.every(code => code === 'MDT' || code === 'MOOC')
        ? response.allowed as CourseCode[] : null;
      if (!categories || !subcategories || !courses || !courseTypes || !codes)
        throw Error('El backend devolvió contratos académicos inesperados');
      if (!signal?.aborted) {
        setCats(categories); setSubs(subcategories); setItems(courses);
        setTypes(courseTypes); setAllowed(codes);
      }
    } catch (e) { if (!signal?.aborted) setError(apiErrorMessage(e)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const ctrl = new AbortController(); void load(ctrl.signal); return () => ctrl.abort(); }, [load]);
  // URL temporal y local del archivo: la vista previa no necesita esperar a FastAPI.
  useEffect(() => {
    if (!creating || !form.image) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(form.image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image, creating]);

  const filtered = useMemo(() => items.filter(c => {
    const cat = subs.find(s => s.id === c.subcategory_id)?.category_id;
    const matches = [c.name, c.description, subs.find(s => s.id === c.subcategory_id)?.name || '']
      .join(' ').toLocaleLowerCase('es-EC');
    return matches.includes(search.trim().toLocaleLowerCase('es-EC')) &&
      (filterType === 'all' || c.course_type.code === filterType) &&
      (filterStatus === 'all' || c.is_published === (filterStatus === 'published')) &&
      (filterCategory === 'all' || String(cat) === filterCategory);
  }), [items, subs, search, filterType, filterStatus, filterCategory]);
  const available = types.filter(t => allowed.includes(t.code));
  const selectedType = types.find(t => String(t.id) === form.courseTypeId);
  const selectedCategory = cats.find(c => String(c.id) === form.categoryId);
  const selectedSubcategory = subs.find(s => String(s.id) === form.subcategoryId);

  const openCreate = () => {
    setForm({ ...newForm(), courseTypeId: available[0] ? String(available[0].id) : '' });
    setModalError(''); setCreating(true);
  };
  const closeCreate = () => { if (!busy) { setCreating(false); setModalError(''); } };
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(previous => ({ ...previous, [key]: value }));

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creating || busy) return;
    setModalError('');
    if (!form.categoryId || !form.subcategoryId || !subs.some(s => String(s.id) === form.subcategoryId && String(s.category_id) === form.categoryId))
      return setModalError('Selecciona una categoría y su subcategoría.');
    if (!form.name.trim() || !form.description.trim())
      return setModalError('Nombre y descripción son obligatorios.');
    if (!available.some(t => String(t.id) === form.courseTypeId))
      return setModalError('El tipo seleccionado no está habilitado por tu plan.');
    if (!form.isFree && form.discount && Number(form.discount) > Number(form.price))
      return setModalError('El descuento no puede superar el precio.');
    if (form.finishDate && form.initDate && form.finishDate < form.initDate)
      return setModalError('La fecha de finalización no puede ser anterior al inicio.');
    if (form.image && (form.image.size > 5 * 1024 * 1024 ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(form.image.type)))
      return setModalError('La portada debe ser JPG, PNG o WebP y pesar como máximo 5 MB.');
    setBusy(true);
    try {
      const result = await requestJson('/api/academic/courses', undefined, { method: 'POST', body: makeCourseForm(form) });
      const saved = parseCourse(result);
      if (!saved || saved.is_published) throw Error('FastAPI no confirmó la creación en borrador.');
      setCreating(false); setNotice(`Curso «${saved.name}» creado como borrador. Entra a Ver curso para continuar su configuración.`);
      await load();
    } catch (e) { setModalError(apiErrorMessage(e)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true); setModalError('');
    try {
      await requestJson(`/api/academic/courses/${deleting.id}`, undefined, { method: 'DELETE' });
      setNotice('Curso eliminado lógicamente. Su historial permanece en la base de datos.');
      setDeleting(null); await load();
    } catch (e) { setModalError(apiErrorMessage(e)); }
    finally { setBusy(false); }
  }

  const published = items.filter(c => c.is_published).length;
  const displayPrice = form.isFree ? 'Gratis' : money(Number(form.price) || 0, form.currency);
  return <div className="lms-users-page lms-academic">
    <div className="lms-page-heading lms-users-heading"><div>
      <p className="lms-eyebrow">GESTIÓN ACADÉMICA</p><h1>Cursos</h1>
      <p>Desde aquí crea cursos. Para configurarlos o modificarlos, entra a «Ver curso».</p>
    </div><button className="button button-primary small-button" onClick={openCreate} disabled={loading || !available.length || !subs.length}>
      <Plus size={17}/> Crear curso
    </button></div>
    <div className="lms-users-stats">
      <div><BookOpen size={25}/><span><strong>{items.length}</strong><small>Total de cursos</small></span></div>
      <div><Eye size={25}/><span><strong>{published}</strong><small>Publicados</small></span></div>
      <div><BookOpen size={25}/><span><strong>{items.length - published}</strong><small>Borradores</small></span></div>
    </div>
    {!loading && !allowed.length && <p className="lms-academic-note" role="status">
      El tenant no tiene habilitada la creación de cursos MOOC ni MDT. Los cursos existentes siguen disponibles.
    </p>}
    {error && <p className="lms-error" role="alert">{error}<button onClick={() => void load()}>Reintentar</button></p>}
    {notice && <p className="lms-users-success" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></p>}
    <section className="lms-users-panel">
      <div className="lms-users-filters lms-academic-course-filters">
        <label className="lms-users-search"><Search size={18}/><input placeholder="Buscar curso..." aria-label="Buscar cursos" value={search} onChange={e => setSearch(e.target.value)}/></label>
        <select aria-label="Filtrar categoría" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">Todas las categorías</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Filtrar tipo" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">Todos los tipos</option>{types.map(t => <option key={t.id} value={t.code}>{t.code}</option>)}
        </select>
        <select aria-label="Filtrar publicación" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option><option value="published">Publicados</option><option value="draft">Borradores</option>
        </select>
      </div>
      <div className="lms-users-table-wrap"><table className="lms-users-table lms-academic-table lms-academic-courses-table">
        <thead><tr><th>Curso</th><th>Categoría / Subcategoría</th><th>Tipo</th><th>Nivel</th><th>Precio</th><th>Duración</th><th>Estado</th><th className="lms-users-action-col">Acciones</th></tr></thead>
        <tbody>{filtered.map(course => {
          const sub = subs.find(s => s.id === course.subcategory_id);
          const cat = cats.find(c => c.id === sub?.category_id);
          return <tr key={course.id}>
            <td><span className="lms-academic-course-name">
              <CourseCover courseId={course.id} imageUrl={course.image_url} alt={`Portada de ${course.name}`} size={20}/>
              <strong title={course.name}>{course.name}</strong>
            </span></td>
            <td><span className="lms-academic-hierarchy"><strong>{cat?.name || '—'}</strong><small>{sub?.name || '—'}</small></span></td>
            <td><span className="lms-users-role lms-users-role-admin">{course.course_type.code}</span></td>
            <td>{course.level.toLocaleLowerCase('es-EC')}</td>
            <td><strong>{course.is_free ? 'Gratis' : money(course.price, course.currency)}</strong></td>
            <td>{course.duration_hours} h</td>
            <td><span className={`lms-users-state ${course.is_published ? 'lms-users-state-on' : 'lms-users-state-off'}`}>
              {course.is_published ? 'Publicado' : 'Borrador'}</span></td>
            <td className="lms-users-action-col"><div className="lms-users-actions">
              <Link title="Ver y gestionar curso" aria-label={`Ver curso ${course.name}`} className="lms-icon-button" href={`/campus/courses/${course.id}`}><Eye size={16}/></Link>
              <button title="Eliminar curso" aria-label={`Eliminar ${course.name}`} className="lms-icon-button lms-users-danger-icon" onClick={() => { setDeleting(course); setModalError(''); }}><Trash2 size={16}/></button>
            </div></td>
          </tr>;
        })}</tbody>
      </table></div>
      {!loading && !filtered.length && <p className="lms-academic-empty">{items.length ? 'No hay cursos con esos filtros.' : 'Todavía no se han creado cursos.'}</p>}
      {loading && <p className="lms-academic-empty"><RefreshCw size={16}/> Cargando cursos...</p>}
    </section>

    {creating && <div className="lms-modal-backdrop lms-course-create-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeCreate(); }}>
      <section className="lms-course-create-dialog" role="dialog" aria-modal="true" aria-labelledby="lms-create-course-title">
        <header className="lms-course-create-header">
          <div><p className="lms-course-create-eyebrow">NUEVO CURSO</p>
            <h2 id="lms-create-course-title">Crear curso</h2>
            <p>Completa la información. A la derecha verás cómo quedará la presentación del curso.</p></div>
          <button type="button" className="lms-course-create-close" disabled={busy} onClick={closeCreate}><X size={19}/> Cerrar</button>
        </header>
        <form className="lms-course-create-form" onSubmit={e => void create(e)}>
          <div className="lms-course-create-columns">
            <div className="lms-course-create-fields lms-editor-form">
              <label>Nombre del curso
                <input required maxLength={180} placeholder="Ej. Fundamentos de energía solar" value={form.name} onChange={e => update('name', e.target.value)}/>
              </label>
              <label>Descripción
                <textarea required rows={5} maxLength={10000} placeholder="¿Qué aprenderán los estudiantes?" value={form.description} onChange={e => update('description', e.target.value)}/>
              </label>
              <label>Imagen del curso
                <span className="lms-course-upload"><ImagePlus size={21}/>
                  <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Seleccionar portada" onChange={e => update('image', e.target.files?.[0] || null)}/>
                </span>
                <small>JPG, PNG o WebP, hasta 5 MB. La portada se muestra inmediatamente en la vista previa.</small>
              </label>
              <div className="lms-form-row lms-course-create-three-fields">
                <label>Categoría<select required value={form.categoryId} onChange={e => {
                  const categoryId = e.target.value;
                  setForm(p => ({ ...p, categoryId, subcategoryId: '' }));
                }}><option value="">Seleccionar categoría</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></label>
                <label>Subcategoría<select required disabled={!form.categoryId} value={form.subcategoryId} onChange={e => update('subcategoryId', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {subs.filter(s => String(s.category_id) === form.categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></label>
                <label>Nivel<select value={form.level} onChange={e => update('level', e.target.value as CourseLevel)}>
                  <option value="PRINCIPIANTE">Principiante</option><option value="INTERMEDIO">Intermedio</option><option value="AVANZADO">Avanzado</option>
                </select></label>
              </div>
              <div className="lms-form-row lms-course-create-three-fields">
                <label>Tipo de curso<select required value={form.courseTypeId} onChange={e => update('courseTypeId', e.target.value)}>
                  {available.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
                </select><small>FastAPI agrega los bloques predeterminados para MOOC o MDT.</small></label>
                <label>Moneda<input required maxLength={3} value={form.currency} onChange={e => update('currency', e.target.value.toUpperCase())}/></label>
                <label>Duración (horas)<input type="number" min="0" step="1" required value={form.hours} onChange={e => update('hours', e.target.value)}/></label>
              </div>
              <div className="lms-form-row lms-course-create-three-fields">
                <label>Precio<input type="number" min="0" step="0.01" required disabled={form.isFree} value={form.isFree ? '0' : form.price} onChange={e => update('price', e.target.value)}/></label>
                <label>Precio descuento<input type="number" min="0" step="0.01" disabled={form.isFree} value={form.isFree ? '' : form.discount} onChange={e => update('discount', e.target.value)}/></label>
                <label>Lecciones estimadas<input type="number" min="0" step="1" required value={form.lessons} onChange={e => update('lessons', e.target.value)}/></label>
              </div>
              <div className="lms-form-row">
                <label>Fecha de inicio<input type="date" value={form.initDate} onChange={e => update('initDate', e.target.value)}/></label>
                <label>Fecha de finalización<input type="date" value={form.finishDate} onChange={e => update('finishDate', e.target.value)}/></label>
              </div>
              <div className="lms-academic-flags lms-course-create-flags">
                <label className="lms-switch-label"><input type="checkbox" checked={form.isFree} onChange={e => update('isFree', e.target.checked)}/><span>Curso gratuito</span></label>
                <label className="lms-switch-label"><input type="checkbox" checked disabled aria-label="Curso se crea como borrador"/><span>Borrador inicial</span></label>
                <label className="lms-switch-label"><input type="checkbox" checked={form.openEnrollment} onChange={e => update('openEnrollment', e.target.checked)}/><span>Matrícula abierta</span></label>
              </div>
              <p className="lms-course-create-hint"><AlertTriangle size={16}/> La publicación y el método de calificación se gestionarán desde el curso; no se publica al crear.</p>
            </div>
            <aside className="lms-course-create-preview" aria-label="Vista previa del curso">
              <p className="lms-course-preview-heading">VISTA PREVIA EN TIEMPO REAL</p>
              <div className="lms-course-preview-card">
                <div className="lms-course-preview-cover">
                  {previewUrl ? <img src={previewUrl} alt="Vista previa de la portada seleccionada"/> :
                    <div className="lms-course-preview-empty"><BookOpen size={56}/><span>Selecciona una portada</span></div>}
                  <div className="lms-course-preview-tags"><span>{form.level}</span><span>{selectedType?.code || 'TIPO'}</span><span>BORRADOR</span></div>
                  <strong className="lms-course-preview-price">{displayPrice}</strong>
                  <h3>{form.name.trim() || 'NOMBRE DEL CURSO'}</h3>
                </div>
                <div className="lms-course-preview-content">
                  <p className="lms-course-preview-description">{form.description.trim() || 'Aquí aparecerá la descripción del curso a medida que completes el formulario.'}</p>
                  <div className="lms-course-preview-facts">
                    <div><small>DURACIÓN</small><strong>{Number(form.hours) || 0} h</strong></div>
                    <div><small>CATEGORÍA</small><strong>{selectedCategory?.name || 'Sin seleccionar'}</strong></div>
                    <div><small>SUBCATEGORÍA</small><strong>{selectedSubcategory?.name || 'Sin seleccionar'}</strong></div>
                    <div><small>MATRÍCULA</small><strong>{form.openEnrollment ? 'Abierta' : 'Cerrada'}</strong></div>
                  </div>
                  <p className="lms-course-preview-help">Esta es una vista previa. El curso se guardará como borrador.</p>
                </div>
              </div>
            </aside>
          </div>
          <footer className="lms-course-create-footer">
            {modalError && <p className="lms-error" role="alert">{modalError}</p>}
            <div className="lms-course-create-actions"><button type="button" className="lms-outline-button" disabled={busy} onClick={closeCreate}>Cancelar</button>
              <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Guardando...' : 'Crear curso'}</button></div>
          </footer>
        </form>
      </section>
    </div>}

    {deleting && <div className="lms-modal-backdrop" role="presentation"><div className="lms-modal lms-users-confirm" role="alertdialog" aria-modal="true" aria-label="Confirmación de eliminación de curso">
      <span className="lms-users-alert-icon"><AlertTriangle size={23}/></span><h2>¿Eliminar el curso?</h2>
      <p>Vas a eliminar lógicamente <strong>{deleting.name}</strong>. Aunque existan matrículas, notas, asistencias o certificados, su historial permanecerá en la base de datos. El curso dejará de mostrarse en los listados activos.</p>
      {deleting.total_students > 0 && <p className="lms-academic-note"><strong>Advertencia:</strong> este curso registra {deleting.total_students} estudiantes.</p>}
      {modalError && <p className="lms-error" role="alert">{modalError}</p>}
      <div className="lms-editor-actions"><button className="lms-outline-button" disabled={busy} onClick={() => setDeleting(null)}>Cancelar</button>
        <button className="lms-users-danger-button" disabled={busy} onClick={() => void remove()}><Trash2 size={16}/>{busy ? 'Eliminando...' : 'Sí, eliminar curso'}</button></div>
    </div></div>}
  </div>;
}
