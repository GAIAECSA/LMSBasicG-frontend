import { backendBaseUrl } from "./backend/config";

export interface PublicCourse {
  id: number;
  name: string;
  description: string;
  price: number | string;
  discount_price: number | string | null;
  currency: string;
  level: string;
  duration_hours: number;
  image_url: string | null;
  is_free: boolean;
}

export type CourseResult =
  | { status: "ok"; courses: PublicCourse[] }
  | { status: "unavailable"; courses: [] };

export async function getTenantPublicCourses(domain: string): Promise<CourseResult> {
  try {
    // Es el endpoint real del backend refactorizado. La versión anterior usaba
    // /courses/landing/{domain}, que ya no existe.
    const response = await fetch(
      `${backendBaseUrl()}/api/v1/courses/public/landing?domain=${encodeURIComponent(domain)}`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) return { status: "unavailable", courses: [] };
    const courses: unknown = await response.json();
    if (!Array.isArray(courses)) return { status: "unavailable", courses: [] };
    // Solo los cursos públicos filtrados en FastAPI (nunca globales /courses).
    return { status: "ok", courses: courses.filter((item) =>
      typeof item === "object" && item !== null &&
      Number.isInteger(item.id) && typeof item.name === "string",
    ) as PublicCourse[] };
  } catch {
    return { status: "unavailable", courses: [] };
  }
}
