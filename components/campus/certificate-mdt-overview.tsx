'use client';
import { ToastMessage } from '@/components/ui/notifications';
import { useCallback, useEffect, useState } from 'react';
import { Eye, FilePlus2, History, RefreshCw, Search } from 'lucide-react';
import { certificateApi, certificateRequest, parseRoster, readableError,
  type ExternalRoster, type ExternalStudent } from '@/lib/course-workspace/certificates';
import { CertificatePdfViewer } from './certificate-pdf-viewer';
import css from './course-certificates.module.css';

type CertificateKind = 'MDT' | 'INSTITUTIONAL';
type Action = 'upload' | 'history';
const title: Record<CertificateKind, string> = {
  MDT: 'Ministerio del Trabajo', INSTITUTIONAL: 'Institucional',
};

/** Resumen conjunto. No duplica operaciones: las altas/correcciones/historial
 * se abren en el gestor documental existente del tipo seleccionado.
 */
export function CertificateMdtOverview({ courseId, onManage }: {
  courseId: number;
  onManage: (kind: CertificateKind, student: ExternalStudent, action: Action) => void;
}) {
  const [rosters, setRosters] = useState<{ ministry: ExternalRoster; institution: ExternalRoster } | null>(null);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState<{ id: number; code: CertificateKind; studentName: string } | null>(null);
  const api = useCallback((path: string) => certificateApi(courseId, path), [courseId]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(previous => previous === draft.trim() ? previous : draft.trim()), 350);
    return () => clearTimeout(timer);
  }, [draft]);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const read = async (code: CertificateKind) => {
      const query = new URLSearchParams({ certificate_type: code, page: String(page), page_size: '25' });
      if (search) query.set('search', search);
      const response = await certificateRequest(api(`external/students?${query}`), { signal: controller.signal });
      return parseRoster(response, courseId, code);
    };
    void Promise.all([read('MDT'), read('INSTITUTIONAL')]).then(([ministry, institution]) => {
      if (controller.signal.aborted) return;
      const ids = new Set(institution.students.map(student => student.enrollment_id));
      if (ministry.total !== institution.total || ministry.students.some(student => !ids.has(student.enrollment_id)))
        throw Error('Los dos listados no coinciden. Actualiza la información del curso.');
      setRosters({ ministry, institution });
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(readableError(reason)); setRosters(null); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [courseId, page, search, revision, api]);

  const pages = rosters ? Math.max(1, Math.ceil(rosters.ministry.total / rosters.ministry.page_size)) : 1;
  const institutionByEnrollment = new Map(rosters?.institution.students.map(student =>
    [student.enrollment_id, student] as const) ?? []);

  const cell = (student: ExternalStudent, kind: CertificateKind) =>
    <div className={css.overviewCell}>
      <span className={`${css.status} ${student.certificate_id !== null ? css.statusOk : css.statusPending}`}>
        {student.certificate_id !== null ? 'Cargado' : 'Pendiente'}
      </span>
      <div className={css.overviewActions}>
        {student.certificate_id !== null && <button type="button" className="lms-outline-button"
          onClick={() => setViewer({ id: student.certificate_id!, code: kind, studentName: student.student_name })}>
          <Eye size={15}/> Ver PDF
        </button>}
        <button type="button" className="lms-outline-button" disabled={!student.has_identity}
          onClick={() => onManage(kind, student, 'upload')}>
          <FilePlus2 size={15}/> {student.certificate_id === null ? 'Subir PDF' : 'Corregir PDF'}
        </button>
        {student.certificate_id !== null && <button type="button" className="lms-outline-button"
          onClick={() => onManage(kind, student, 'history')}>
          <History size={15}/> Historial
        </button>}
      </div>
      {!student.has_identity && <small>Falta la cédula del estudiante</small>}
    </div>;

  return <section className="workspace-panel" aria-labelledby="mdt-overview-heading">
    <div className="workspace-panel-header">
      <h2 id="mdt-overview-heading">Certificados por estudiante</h2>
      <p>Cada estudiante puede tener dos documentos independientes: el certificado ministerial y el institucional opcional. La tabla muestra solo matrículas STUDENT aceptadas.</p>
    </div>
    <div className={css.filterBar}>
      <label className={css.search}><Search size={18}/>
        <input type="search" aria-label="Buscar estudiante" maxLength={160} placeholder="Nombre, usuario o correo"
          value={draft} onChange={event => setDraft(event.target.value)}/>
      </label>
      <button type="button" className="lms-outline-button" disabled={loading} onClick={() => setRevision(value => value + 1)}>
        <RefreshCw size={16}/> Actualizar
      </button>
    </div>
    {error && <ToastMessage kind="error" message={error} />}
    {loading ? <p className={css.empty} role="status">Consultando ambos tipos de certificados...</p> : rosters && <>
      {rosters.ministry.students.length === 0
        ? <p className={css.empty}>No se encontraron estudiantes para esta búsqueda.</p>
        : <div className={css.tableScroll}><table className={`${css.table} ${css.overviewTable}`}>
            <thead><tr><th scope="col">Estudiante</th><th scope="col">Ministerio del Trabajo</th><th scope="col">Institucional</th></tr></thead>
            <tbody>{rosters.ministry.students.map(student => {
              const institutional = institutionByEnrollment.get(student.enrollment_id);
              return <tr key={student.enrollment_id}>
                <td><strong>{student.student_name}</strong><small>{student.email || student.username}</small></td>
                <td>{cell(student, 'MDT')}</td>
                <td>{institutional && cell(institutional, 'INSTITUTIONAL')}</td>
              </tr>;
            })}</tbody>
          </table></div>}
      <div className={css.pager}>
        <button type="button" className="lms-outline-button" disabled={page <= 1}
          onClick={() => setPage(value => value - 1)}>Anterior</button>
        <span>{rosters.ministry.total} estudiantes · página {page} de {pages}</span>
        <button type="button" className="lms-outline-button" disabled={page >= pages}
          onClick={() => setPage(value => value + 1)}>Siguiente</button>
      </div>
    </>}
    {viewer && <CertificatePdfViewer title={`${title[viewer.code]} · ${viewer.studentName}`}
      previewUrl={api(`external/${viewer.id}/preview`)} downloadUrl={api(`external/${viewer.id}/download`)}
      onClose={() => setViewer(null)}/>}
  </section>;
}
