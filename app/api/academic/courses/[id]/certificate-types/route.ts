/** BFF ADMIN: configuración opcional del certificado INSTITUTIONAL en cursos MDT.
 * FastAPI recibe la lista completa de certificate_type_ids; nunca confiamos
 * en IDs enviados por el navegador ni alteramos AUTOMATIC/MDT.
 */
import { NextRequest, type NextResponse } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { authorize, error, isRecord, json, mutation, output, postJson, upstream, validIdPath } from '@/lib/academic/bff';
import { parseCourse, type ManagedCourse } from '@/lib/academic/types';
import {
  currentMdtCertificateSettings, nextCertificateTypeIds, parseCertificateTypeRules,
  type CertificateTypeRule,
} from '@/lib/course-workspace/certificate-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
type ReadResult = { course: ManagedCourse; rules: CertificateTypeRule[] } | { response: NextResponse };

async function readCurrent(id: number, token: string): Promise<ReadResult> {
  const response = await apiFetch(`/api/v1/courses/${id}`, token, { cache: 'no-store', redirect: 'error' });
  if (!response.ok) return { response: await upstream(response) };
  const course = parseCourse(await response.json());
  if (!course || course.id !== id) return { response: error(502, 'FastAPI devolvió un curso inválido') };
  if (course.course_type.code !== 'MDT') return { response: error(404, 'Configuración exclusiva de cursos MDT') };
  const typeResponse = await apiFetch(`/api/v1/course-types/${course.course_type_id}`, token, {
    cache: 'no-store', redirect: 'error',
  });
  if (!typeResponse.ok) return { response: await upstream(typeResponse) };
  const rules = parseCertificateTypeRules(await typeResponse.json(), course.course_type_id);
  if (!rules) return { response: error(502, 'Reglas de certificados MDT inválidas') };
  return { course, rules };
}

export async function GET(request: NextRequest, { params }: Context) {
  const id = validIdPath((await params).id);
  if (!id) return error(400, 'Curso inválido');
  const auth = await authorize(request);
  if ('response' in auth) return auth.response;
  try {
    const result = await readCurrent(id, auth.token);
    if ('response' in result) return result.response;
    return output(currentMdtCertificateSettings(result.course, result.rules));
  } catch {
    return error(503, 'No se pudo consultar la configuración de certificados');
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  const invalid = mutation(request);
  if (invalid) return invalid;
  const id = validIdPath((await params).id);
  if (!id) return error(400, 'Curso inválido');
  const auth = await authorize(request);
  if ('response' in auth) return auth.response;
  const input = await json(request, 1024);
  if ('response' in input) return input.response;
  if (!isRecord(input.value) || Object.keys(input.value).length !== 1 ||
      typeof input.value.institutional_enabled !== 'boolean') return error(400, 'Configuración inválida');
  try {
    const current = await readCurrent(id, auth.token);
    if ('response' in current) return current.response;
    const { course, rules } = current;
    if (!rules.some(rule => rule.certificate_type.code === 'INSTITUTIONAL' && !rule.required))
      return error(409, 'Este curso no permite configurar un certificado institucional opcional');
    const certificate_type_ids = nextCertificateTypeIds(course, rules, input.value.institutional_enabled);
    const response = await apiFetch(`/api/v1/courses/${id}/certificate-types`, auth.token, {
      method: 'PUT', ...postJson({ certificate_type_ids }), redirect: 'error',
    });
    if (!response.ok) return upstream(response);
    const updated = parseCourse(await response.json());
    if (!updated || updated.id !== id || updated.course_type.code !== 'MDT')
      return error(502, 'FastAPI no confirmó la configuración del curso');
    const settings = currentMdtCertificateSettings(updated, rules);
    if (settings.institutional_enabled !== input.value.institutional_enabled || !settings.ministerial_enabled)
      return error(502, 'La configuración guardada no coincide con la solicitada; recarga el curso');
    return output(settings);
  } catch {
    return error(503, 'No fue posible confirmar el cambio. Consulta el estado antes de reintentar');
  }
}
