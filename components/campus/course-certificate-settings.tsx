'use client';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FileBadge2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { apiErrorMessage, requestJson } from '@/lib/academic/client';
import {
  parseMdtCertificateSettings, type MdtCertificateSettings,
} from '@/lib/course-workspace/certificate-settings';
import css from './course-certificate-settings.module.css';

/** Configuración independiente del formulario general de curso. Solo ADMIN MDT.
 * Nunca se modifican AUTOMATIC ni MDT al alternar INSTITUTIONAL.
 */
export function CourseCertificateSettings({ courseId, disabled, unsaved, onChanged }: {
  courseId: number;
  disabled: boolean;
  unsaved: boolean;
  onChanged: () => void;
}) {
  const [current, setCurrent] = useState<MdtCertificateSettings | null>(null);
  const [selected, setSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const url = `/api/academic/courses/${courseId}/certificate-types`;
  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setCurrent(null); // Fallar cerrado: no permitir cambios con capacidades obsoletas.
    setError('');
    try {
      const parsed = parseMdtCertificateSettings(await requestJson(url, signal), courseId);
      if (!parsed) throw Error('El servidor devolvió una configuración inválida');
      if (!signal?.aborted) {
        setCurrent(parsed);
        setSelected(parsed.institutional_enabled);
      }
    } catch (failure) {
      if (!signal?.aborted) setError(apiErrorMessage(failure));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [url, courseId]);
  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload]);
  const locked = loading || saving || disabled || unsaved;
  const changed = current !== null && selected !== current.institutional_enabled;

  async function save() {
    if (locked || !changed || !current?.institutional_allowed) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = parseMdtCertificateSettings(await requestJson(url, undefined, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutional_enabled: selected }),
      }), courseId);
      if (!updated || updated.institutional_enabled !== selected || !updated.ministerial_enabled)
        throw Error('El servidor no confirmó la configuración. Recarga para verificar el estado.');
      setCurrent(updated);
      setSelected(updated.institutional_enabled);
      setNotice(updated.institutional_enabled
        ? 'Certificado institucional habilitado para este curso.'
        : 'Certificado institucional deshabilitado. No se han eliminado documentos anteriores.');
      onChanged();
    } catch (failure) {
      setError(apiErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  return <section className={css.panel} aria-labelledby="course-certificates-settings-title">
    <header className={css.heading}>
      <div><p className="lms-eyebrow">CERTIFICADOS / CURSO MDT</p>
        <h2 id="course-certificates-settings-title">Certificados del curso</h2>
        <p>El ministerial es obligatorio. Puedes habilitar un segundo PDF institucional independiente por estudiante.</p>
      </div>
      <button type="button" className="lms-outline-button" onClick={() => { setNotice(''); void reload(); }}
        disabled={saving || loading} aria-label="Actualizar configuración de certificados">
        <RefreshCw size={16}/> Actualizar
      </button>
    </header>
    <div className={css.option}>
      <ShieldCheck size={21} aria-hidden="true"/>
      <div className={css.description}><strong>Certificado del Ministerio del Trabajo</strong>
        <span>Obligatorio. Se carga un PDF por estudiante y permanece independiente del institucional.</span>
      </div>
      <span className={css.required}><CheckCircle2 size={15}/> Siempre activo</span>
    </div>
    <label className={css.option}>
      <FileBadge2 size={21} aria-hidden="true"/>
      <span className={css.description}><strong>Certificado institucional adicional</strong>
        <span>Opcional. Permite importar o subir otro PDF por estudiante, sin sustituir el ministerial.</span>
      </span>
      <input aria-label="Habilitar certificado institucional" type="checkbox" checked={selected}
        disabled={locked || !current?.institutional_allowed}
        onChange={event => { setSelected(event.target.checked); setNotice(''); setError(''); }}/>
    </label>
    {loading && <p className={css.hint} role="status">Consultando capacidades del curso...</p>}
    {!loading && current && !current.institutional_allowed &&
      <p className={css.hint}>Este tipo de curso no dispone de la capacidad institucional opcional.</p>}
    {unsaved && <p className={css.hint}>Guarda o descarta primero los cambios generales del curso.</p>}
    {error && <p className="lms-error" role="alert">{error}</p>}
    {notice && <p className="lms-users-success" role="status">{notice}</p>}
    <footer className={css.footer}>
      <p>Deshabilitar el institucional no elimina certificados previamente almacenados. El certificado ministerial continúa habilitado.</p>
      <button type="button" className="button button-primary" disabled={locked || !changed || !current?.institutional_allowed}
        onClick={() => void save()}>
        {saving ? <RefreshCw size={16}/> : <Save size={16}/>} {saving ? 'Guardando...' : 'Guardar certificados'}
      </button>
    </footer>
  </section>;
}
