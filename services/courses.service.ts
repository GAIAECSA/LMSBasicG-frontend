export type CourseLevel =
    | "PRINCIPIANTE"
    | "INTERMEDIO"
    | "AVANZADO";

export const COURSE_LEVEL_OPTIONS: Array<{
    label: string;
    value: CourseLevel;
}> = [
        { label: "Principiante", value: "PRINCIPIANTE" },
        { label: "Intermedio", value: "INTERMEDIO" },
        { label: "Avanzado", value: "AVANZADO" },
    ];

export interface Course {
    id: number;
    name: string;
    description: string;
    price: number;
    is_free: boolean;
    level: CourseLevel;
    is_published: boolean;
    open_enrollment: boolean;
    duration_hours: number;
    total_lessons: number;
    subcategory_id: number;
    image_url: string | null;
    discount_price: number;
    currency: string;
    rating: number;
    total_students: number;
}

export interface CoursePayload {
    name: string;
    description: string;
    price: number;
    is_free: boolean;
    level: CourseLevel;
    is_published: boolean;
    open_enrollment: boolean;
    duration_hours: number;
    total_lessons: number;
    subcategory_id: number;
    image?: File;
    discount_price?: number;
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const COURSES_ENDPOINT = `${API_BASE_URL}/api/v1/courses`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

function clearAuthSession() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function decodeJwtPayload(token: string): { exp?: number } | null {
    try {
        const payload = token.split(".")[1];

        if (!payload) return null;

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(
            normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
            "=",
        );

        return JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);

    if (!payload?.exp) return false;

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    return payload.exp <= currentTimeInSeconds;
}

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) return null;

    try {
        const parsed = JSON.parse(rawSession);

        const token =
            parsed?.accessToken ??
            parsed?.token ??
            parsed?.access_token ??
            parsed?.data?.accessToken ??
            parsed?.data?.token ??
            parsed?.data?.access_token ??
            parsed?.session?.accessToken ??
            parsed?.session?.token ??
            parsed?.session?.access_token;

        if (typeof token !== "string" || !token.trim()) {
            clearAuthSession();
            return null;
        }

        if (isTokenExpired(token)) {
            clearAuthSession();
            return null;
        }

        return token;
    } catch {
        if (isTokenExpired(rawSession)) {
            clearAuthSession();
            return null;
        }

        return rawSession;
    }
}

function buildAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    const token = getAuthToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function toNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string") {
        const normalized = value.trim().replace(",", ".");
        if (!normalized) return fallback;

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
}

function normalizeCourseLevel(value: unknown): CourseLevel {
    if (
        value === "PRINCIPIANTE" ||
        value === "INTERMEDIO" ||
        value === "AVANZADO"
    ) {
        return value;
    }

    return "PRINCIPIANTE";
}

function normalizeCourse(item: Record<string, unknown>): Course {
    return {
        id: toNumber(item.id),
        name: typeof item.name === "string" ? item.name : "",
        description:
            typeof item.description === "string" ? item.description : "",
        price: toNumber(item.price),
        is_free: Boolean(item.is_free),
        level: normalizeCourseLevel(item.level),
        is_published: Boolean(item.is_published),
        open_enrollment:
            typeof item.open_enrollment === "boolean"
                ? item.open_enrollment
                : true,
        duration_hours: toNumber(item.duration_hours),
        total_lessons: toNumber(item.total_lessons),
        subcategory_id: toNumber(item.subcategory_id),
        image_url:
            typeof item.image_url === "string" && item.image_url.trim().length > 0
                ? item.image_url
                : null,
        discount_price: toNumber(item.discount_price),
        currency:
            typeof item.currency === "string" && item.currency.trim().length > 0
                ? item.currency
                : "USD",
        rating: toNumber(item.rating, 5),
        total_students: toNumber(item.total_students),
    };
}

function buildCourseFormData(payload: CoursePayload | Partial<CoursePayload>): FormData {
    const formData = new FormData();

    if (payload.name !== undefined) {
        formData.append("name", payload.name);
    }

    if (payload.description !== undefined) {
        formData.append("description", payload.description);
    }

    if (payload.price !== undefined) {
        formData.append("price", String(payload.price));
    }

    if (payload.is_free !== undefined) {
        formData.append("is_free", String(payload.is_free));
    }

    if (payload.level !== undefined) {
        formData.append("level", payload.level);
    }

    if (payload.is_published !== undefined) {
        formData.append("is_published", String(payload.is_published));
    }

    if (payload.open_enrollment !== undefined) {
        formData.append("open_enrollment", String(payload.open_enrollment));
    }

    if (payload.duration_hours !== undefined) {
        formData.append("duration_hours", String(payload.duration_hours));
    }

    if (payload.total_lessons !== undefined) {
        formData.append("total_lessons", String(payload.total_lessons));
    }

    if (payload.subcategory_id !== undefined) {
        formData.append("subcategory_id", String(payload.subcategory_id));
    }

    if (payload.image instanceof File) {
        formData.append("image", payload.image);
    }

    if (payload.discount_price !== undefined) {
        formData.append("discount_price", String(payload.discount_price));
    }

    return formData;
}

function normalizeCourseErrorMessage(message: string): string {
    if (!message) return "Ocurrió un error al procesar la solicitud.";

    if (
        /duplicate key|already exists|unique constraint|ix_/i.test(message)
    ) {
        return "Ya existe un curso con esos datos.";
    }

    if (/not found|no encontrado/i.test(message)) {
        return "No se encontró el curso solicitado.";
    }

    return message;
}

async function parseErrorResponse(response: Response): Promise<never> {
    if (response.status === 401) {
        clearAuthSession();

        throw new Error("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
    }

    let rawText = "";

    try {
        rawText = await response.text();
    } catch {
        throw new Error("No se pudo leer la respuesta del servidor.");
    }

    if (!rawText) {
        throw new Error("Ocurrió un error inesperado en la solicitud.");
    }

    try {
        const parsed = JSON.parse(rawText) as
            | {
                detail?:
                | string
                | Array<{
                    msg?: string;
                }>;
                message?: string;
            }
            | undefined;

        if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
            const message =
                parsed.detail
                    .map((item) => item.msg)
                    .filter(Boolean)
                    .join(", ") || "Error de validación en la solicitud.";

            throw new Error(normalizeCourseErrorMessage(message));
        }

        if (typeof parsed?.detail === "string") {
            throw new Error(normalizeCourseErrorMessage(parsed.detail));
        }

        if (typeof parsed?.message === "string") {
            throw new Error(normalizeCourseErrorMessage(parsed.message));
        }

        throw new Error(normalizeCourseErrorMessage(rawText));
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }

        throw new Error(normalizeCourseErrorMessage(rawText));
    }
}

export async function getAllCourses(): Promise<Course[]> {
    const response = await fetch(`${COURSES_ENDPOINT}/`, {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    const data = (await response.json()) as unknown;

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((item) => normalizeCourse(item as Record<string, unknown>));
}

export async function getCourseById(courseId: number): Promise<Course> {
    const response = await fetch(`${COURSES_ENDPOINT}/${courseId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return normalizeCourse(data);
}

export async function createCourse(payload: CoursePayload): Promise<Course> {
    const response = await fetch(`${COURSES_ENDPOINT}/`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: buildCourseFormData(payload),
    });

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return normalizeCourse(data);
}

export async function updateCourse(
    courseId: number,
    payload: Partial<CoursePayload>,
): Promise<Course> {
    const response = await fetch(`${COURSES_ENDPOINT}/${courseId}`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: buildCourseFormData(payload),
    });

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return normalizeCourse(data);
}

export async function deleteCourse(courseId: number): Promise<string> {
    const response = await fetch(`${COURSES_ENDPOINT}/${courseId}`, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    const data = await response.json().catch(() => "");
    return typeof data === "string" ? data : "Curso eliminado correctamente";
}

export async function getCoursesBySubcategory(
    subcategoryId: number,
): Promise<Course[]> {
    const response = await fetch(
        `${COURSES_ENDPOINT}/subcategory/${subcategoryId}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
        },
    );

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    const data = (await response.json()) as unknown;

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((item) => normalizeCourse(item as Record<string, unknown>));
}