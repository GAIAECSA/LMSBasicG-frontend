/**
 * Contrato de portadas públicas de Athena.
 *
 * No aceptar URLs externas, otras carpetas de uploads ni nombres de archivo
 * arbitrarios: en UPLOAD_ROOT también hay datos personales privados.
 * La comprobación definitiva de la referencia BD, tenant activo y archivo
 * existente corresponde al endpoint público de FastAPI.
 */
const COURSE_COVER_PATH = /^\/uploads\/tenant_([1-9]\d*)\/courses\/images\/([0-9a-f]{32}\.(?:jpg|jpeg|png|webp))$/;

export type CourseCoverPath = { path: string; tenantId: number };

export function parseCourseCoverPath(value: unknown): CourseCoverPath | null {
  if (typeof value !== 'string') return null;
  const match = COURSE_COVER_PATH.exec(value);
  if (!match) return null;
  const tenantId = Number(match[1]);
  if (!Number.isSafeInteger(tenantId) || tenantId <= 0) return null;
  return { path: value, tenantId };
}

/** Ruta same-origin usable por usuarios autenticados y anónimos. */
export function courseCoverSrc(courseId: number, imageUrl: string | null | undefined): string | null {
  if (!Number.isSafeInteger(courseId) || courseId <= 0) return null;
  const cover = parseCourseCoverPath(imageUrl);
  return cover
    ? `/api/academic/courses/${courseId}/image?path=${encodeURIComponent(cover.path)}`
    : null;
}
