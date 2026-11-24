import type { PublicCourse } from "@/lib/courses";

/** Matrículas de GET /api/v1/enrollments/me.
 * El rol de cada curso se obtiene de Enrollment.role (scope COURSE),
 * nunca del rol de plataforma del usuario autenticado.
 *
 * Desde la fase 8, FastAPI calcula el progreso agregado de LessonBlocks activos;
 * el frontend solo lo consume, no vuelve a consultar bloques ni lo recalcula.
 */
export type AcademicRole = "STUDENT" | "TEACHER";
export type EnrollmentStatus = "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "CANCELADO";

export type VisitorEnrollment = {
  id: number;
  status: EnrollmentStatus;
  user: { id: number };
  course: { id: number; name: string; is_published: boolean; open_enrollment: boolean };
  role: { code: AcademicRole; scope: "COURSE" };
  /** Entero 0-100, o null si no aplica o no hay bloques activos. */
  progress_percent: number | null;
  /** Conteos retornados por el backend; null cuando la matrícula no es elegible. */
  completed_blocks: number | null;
  total_active_blocks: number | null;
};

export type VisitorCourse = {
  enrollmentId: number;
  role: AcademicRole;
  course: PublicCourse;
  /** Null = progreso no aplicable/sin denominador; jamás convertirlo a 0%. */
  progressPercent: number | null;
};

export type MyCoursesData = {
  status: "ok" | "unavailable";
  courses: VisitorCourse[];
  pendingCount: number;
};

type Dict = Record<string, unknown>;
const obj = (value: unknown): value is Dict =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const id = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const nonNegativeInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const validPercent = (value: unknown): value is number =>
  nonNegativeInt(value) && value <= 100;
const states = new Set<EnrollmentStatus>(["PENDIENTE", "ACEPTADO", "RECHAZADO", "CANCELADO"]);

/** Comprobar el nuevo contrato completo antes de mostrar números.
 * - No mezclar un porcentaje real con conteos ausentes.
 * - Un curso sin bloques activos devuelve conteos 0 y porcentaje null.
 * - TEACHER o matrículas no elegibles tienen los tres campos null.
 * Si la respuesta está incompleta o es incompatible, la página informa
 * que los datos no están disponibles en lugar de inventar un porcentaje.
 */
function validProgress(row: Dict): boolean {
  if (!("progress_percent" in row) || !("completed_blocks" in row) || !("total_active_blocks" in row)) {
    return false;
  }
  const percent = row.progress_percent;
  const completed = row.completed_blocks;
  const total = row.total_active_blocks;

  if (completed === null && total === null) return percent === null;
  if (!nonNegativeInt(completed) || !nonNegativeInt(total) || completed > total) return false;
  if (total === 0) return percent === null;
  return validPercent(percent);
}

export function parseVisitorEnrollments(raw: unknown, userId: number): VisitorEnrollment[] | null {
  if (!Array.isArray(raw) || !id(userId)) return null;
  const list: VisitorEnrollment[] = [];
  for (const item of raw) {
    if (!obj(item) || !id(item.id) || !states.has(item.status as EnrollmentStatus) ||
        !obj(item.user) || item.user.id !== userId || !obj(item.course) ||
        !id(item.course.id) || typeof item.course.name !== "string" ||
        typeof item.course.is_published !== "boolean" || typeof item.course.open_enrollment !== "boolean" ||
        !obj(item.role) || !["STUDENT", "TEACHER"].includes(String(item.role.code)) ||
        item.role.scope !== "COURSE" || !validProgress(item)) {
      return null;
    }

    list.push({
      id: item.id,
      status: item.status as EnrollmentStatus,
      user: { id: userId },
      course: {
        id: item.course.id,
        name: item.course.name,
        is_published: item.course.is_published,
        open_enrollment: item.course.open_enrollment,
      },
      role: { code: item.role.code as AcademicRole, scope: "COURSE" },
      progress_percent: item.progress_percent as number | null,
      completed_blocks: item.completed_blocks as number | null,
      total_active_blocks: item.total_active_blocks as number | null,
    });
  }
  return list;
}

/** Matrículas aceptadas de cursos publicados del tenant resuelto por Host.
 * La intersección con el catálogo público preserva la restricción de visibilidad.
 * open_enrollment regula NUEVAS solicitudes, no matrículas ya aceptadas.
 */
export function visibleAcceptedEnrollments(enrollments: VisitorEnrollment[], publicCourses: PublicCourse[]):
  Array<{ enrollment: VisitorEnrollment; course: PublicCourse }> {
  const publicById = new Map(publicCourses.map(course => [course.id, course]));
  const seen = new Set<number>();
  return enrollments.flatMap(enrollment => {
    const course = publicById.get(enrollment.course.id);
    if (enrollment.status !== "ACEPTADO" || !enrollment.course.is_published || !course || seen.has(enrollment.course.id)) {
      return [];
    }
    seen.add(enrollment.course.id);
    return [{ enrollment, course }];
  });
}
