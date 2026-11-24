/** Contratos de configuración certificados MDT.
 * Los IDs de tipos se resuelven desde las reglas actuales del backend;
 * jamás se supone que MDT/INSTITUTIONAL tienen IDs estáticos.
 */
import type { ManagedCourse } from '@/lib/academic/types';

export type CertificateTypeRule = {
  id: number;
  certificate_type: { id: number; code: string; name: string };
  required: boolean;
  default_active: boolean;
};
export type MdtCertificateSettings = {
  course_id: number;
  course_type: 'MDT';
  ministerial_enabled: boolean;
  institutional_allowed: boolean;
  institutional_enabled: boolean;
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export function parseCertificateTypeRules(value: unknown, courseTypeId: number): CertificateTypeRule[] | null {
  if (!object(value) || value.id !== courseTypeId || value.code !== 'MDT' ||
      !Array.isArray(value.certificate_rules)) return null;
  const rules: CertificateTypeRule[] = [];
  for (const item of value.certificate_rules) {
    if (!object(item) || !id(item.id) || typeof item.required !== 'boolean' ||
        typeof item.default_active !== 'boolean' || !object(item.certificate_type) ||
        !id(item.certificate_type.id) || typeof item.certificate_type.code !== 'string' ||
        typeof item.certificate_type.name !== 'string') return null;
    rules.push({
      id: item.id,
      required: item.required,
      default_active: item.default_active,
      certificate_type: {
        id: item.certificate_type.id,
        code: item.certificate_type.code,
        name: item.certificate_type.name,
      },
    });
  }
  if (new Set(rules.map(rule => rule.certificate_type.id)).size !== rules.length ||
      new Set(rules.map(rule => rule.certificate_type.code)).size !== rules.length ||
      !rules.some(rule => rule.certificate_type.code === 'MDT' && rule.required)) return null;
  return rules;
}

/** Configuración efectiva derivada del curso (no de su plantilla ni del frontend). */
export function currentMdtCertificateSettings(
  course: ManagedCourse, rules: CertificateTypeRule[],
): MdtCertificateSettings {
  const active = new Set(course.certificate_types
    .filter(capability => capability.is_active)
    .map(capability => capability.certificate_type.code));
  return {
    course_id: course.id,
    course_type: 'MDT',
    ministerial_enabled: active.has('MDT'),
    institutional_allowed: rules.some(rule => rule.certificate_type.code === 'INSTITUTIONAL'),
    institutional_enabled: active.has('INSTITUTIONAL'),
  };
}

/** PUT FastAPI reemplaza el conjunto COMPLETO. Conservamos AUTOMATIC y todos los
 * otros tipos activos y requeridos; solo cambia INSTITUTIONAL. Los certificados
 * existentes no se eliminan por desactivar la capacidad.
 */
export function nextCertificateTypeIds(
  course: ManagedCourse, rules: CertificateTypeRule[], institutionalEnabled: boolean,
): number[] {
  if (course.course_type.code !== 'MDT') throw Error('Solo disponible en cursos MDT');
  const institutionalRule = rules.find(rule => rule.certificate_type.code === 'INSTITUTIONAL');
  if (!institutionalRule || institutionalRule.required) throw Error('La capacidad institucional no es opcional en este curso');
  const activeCodes = new Set(course.certificate_types
    .filter(capability => capability.is_active).map(capability => capability.certificate_type.code));
  const desired = rules.filter(rule =>
    rule.required || (rule.certificate_type.code === 'INSTITUTIONAL'
      ? institutionalEnabled : activeCodes.has(rule.certificate_type.code)));
  return desired.map(rule => rule.certificate_type.id).sort((a, b) => a - b);
}

export function parseMdtCertificateSettings(value: unknown, courseId: number): MdtCertificateSettings | null {
  if (!object(value) || value.course_id !== courseId || value.course_type !== 'MDT' ||
      typeof value.ministerial_enabled !== 'boolean' ||
      typeof value.institutional_allowed !== 'boolean' ||
      typeof value.institutional_enabled !== 'boolean') return null;
  return {
    course_id: courseId, course_type: 'MDT',
    ministerial_enabled: value.ministerial_enabled,
    institutional_allowed: value.institutional_allowed,
    institutional_enabled: value.institutional_enabled,
  };
}
