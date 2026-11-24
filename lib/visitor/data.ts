import { cookies } from "next/headers";
import { apiFetch } from "@/lib/auth/backend";
import { SESSION_COOKIE } from "@/lib/auth/server";
import { getTenantPublicCourses } from "@/lib/courses";
import { parseVisitorEnrollments, visibleAcceptedEnrollments, type MyCoursesData } from "./types";

/** Solo SSR, después de authState() y el gate de políticas en la página.
 * El JWT permanece en cookie HttpOnly del Host y no se expone al navegador.
 *
 * Desde backend fase 8, GET /enrollments/me incluye progress_percent:
 * no recorrer cursos, módulos, lecciones ni LessonBlocks por cada matrícula.
 * Una única respuesta del backend entrega todos los porcentajes calculados.
 */
export async function loadMyCourses(domain: string, userId: number): Promise<MyCoursesData> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { status: "unavailable", courses: [], pendingCount: 0 };

  try {
    // Ambas fuentes se consultan una sola vez: catálogo público del tenant
    // para datos visuales y visibilidad, matrículas autenticadas para rol/progreso.
    const [catalog, response] = await Promise.all([
      getTenantPublicCourses(domain),
      apiFetch("/api/v1/enrollments/me", token),
    ]);
    if (catalog.status !== "ok") throw new Error("Catálogo inaccesible");
    if (!response.ok) throw new Error(`No se pudieron consultar matrículas: ${response.status}`);

    const enrollments = parseVisitorEnrollments(await response.json(), userId);
    if (!enrollments) throw new Error("Matrículas inválidas o contrato de progreso desactualizado");

    const selected = visibleAcceptedEnrollments(enrollments, catalog.courses);
    const publishedIds = new Set(catalog.courses.map(course => course.id));
    const pendingCount = enrollments.filter(enrollment =>
      enrollment.status === "PENDIENTE" &&
      enrollment.course.is_published &&
      publishedIds.has(enrollment.course.id)
    ).length;

    return {
      status: "ok",
      pendingCount,
      courses: selected.map(({ enrollment, course }) => ({
        enrollmentId: enrollment.id,
        role: enrollment.role.code,
        course,
        // Para TEACHER no existe BlockProgress académico. Backend retorna null;
        // se conserva la condición explícita para no mostrar avance docente.
        progressPercent: enrollment.role.code === "STUDENT" ? enrollment.progress_percent : null,
      })),
    };
  } catch {
    // No disfrazar un backend caído o un contrato incompatible como 0% de avance.
    return { status: "unavailable", courses: [], pendingCount: 0 };
  }
}
