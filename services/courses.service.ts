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
    is_mdt: boolean;
    image_url: string | null;
    course_image_url?: string | null;
    image?: string | null;
    thumbnail?: string | null;
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
    is_mdt: boolean;
    image?: File | null;
    discount_price?: number | null;
}

class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const COURSES_ENDPOINT = `${API_BASE_URL}/api/v1/courses`;
const AUTH_STORAGE_KEY = "lmsbasicg_auth";

const courseEndpoint = (courseId: number) =>
    `${COURSES_ENDPOINT}/${courseId}`;

const coursesBySubcategoryEndpoint = (subcategoryId: number) =>
    `${COURSES_ENDPOINT}/subcategory/${subcategoryId}`;

function clearAuthSession() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function cleanToken(value: unknown): string {
    if (typeof value !== "string") return "";

    return value.trim().replace(/^Bearer\s+/i, "");
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

        const token = cleanToken(
            parsed?.accessToken ??
            parsed?.token ??
            parsed?.access_token ??
            parsed?.data?.accessToken ??
            parsed?.data?.token ??
            parsed?.data?.access_token ??
            parsed?.session?.accessToken ??
            parsed?.session?.token ??
            parsed?.session?.access_token,
        );

        if (!token) {
            clearAuthSession();
            return null;
        }

        if (isTokenExpired(token)) {
            clearAuthSession();
            return null;
        }

        return token;
    } catch {
        const token = cleanToken(rawSession);

        if (!token) {
            clearAuthSession();
            return null;
        }

        if (isTokenExpired(token)) {
            clearAuthSession();
            return null;
        }

        return token;
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

function toBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    if (typeof value === "number") {
        return value === 1;
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

function getStringValue(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const cleanValue = value.trim();

    return cleanValue.length > 0 ? cleanValue : null;
}

function normalizeCourse(item: Record<string, unknown>): Course {
    return {
        id: toNumber(item.id),
        name: typeof item.name === "string" ? item.name : "",
        description:
            typeof item.description === "string" ? item.description : "",
        price: toNumber(item.price),
        is_free: toBoolean(item.is_free),
        level: normalizeCourseLevel(item.level),
        is_published: toBoolean(item.is_published),
        open_enrollment: toBoolean(item.open_enrollment, true),
        duration_hours: toNumber(item.duration_hours),
        total_lessons: toNumber(item.total_lessons),
        subcategory_id: toNumber(item.subcategory_id),
        is_mdt: toBoolean(item.is_mdt),
        image_url:
            getStringValue(item.image_url) ||
            getStringValue(item.course_image_url) ||
            getStringValue(item.image) ||
            getStringValue(item.thumbnail) ||
            null,
        course_image_url: getStringValue(item.course_image_url),
        image: getStringValue(item.image),
        thumbnail: getStringValue(item.thumbnail),
        discount_price: toNumber(item.discount_price),
        currency:
            typeof item.currency === "string" && item.currency.trim().length > 0
                ? item.currency
                : "USD",
        rating: toNumber(item.rating, 0),
        total_students: toNumber(item.total_students),
    };
}

function appendFormDataValue(
    formData: FormData,
    key: string,
    value: string | number | boolean | null | undefined,
) {
    if (value === undefined || value === null) return;

    formData.append(key, String(value));
}

function buildCourseFormData(
    payload: CoursePayload | Partial<CoursePayload>,
): FormData {
    const formData = new FormData();

    appendFormDataValue(formData, "name", payload.name);
    appendFormDataValue(formData, "description", payload.description);
    appendFormDataValue(formData, "price", payload.price);
    appendFormDataValue(formData, "is_free", payload.is_free);
    appendFormDataValue(formData, "level", payload.level);
    appendFormDataValue(formData, "is_published", payload.is_published);
    appendFormDataValue(formData, "open_enrollment", payload.open_enrollment);
    appendFormDataValue(formData, "duration_hours", payload.duration_hours);
    appendFormDataValue(formData, "total_lessons", payload.total_lessons);
    appendFormDataValue(formData, "subcategory_id", payload.subcategory_id);
    appendFormDataValue(formData, "is_mdt", payload.is_mdt);
    appendFormDataValue(formData, "discount_price", payload.discount_price);

    if (
        typeof File !== "undefined" &&
        payload.image instanceof File
    ) {
        formData.append("image", payload.image);
    }

    return formData;
}

function normalizeCourseErrorMessage(message: string): string {
    if (!message) return "Ocurrió un error al procesar la solicitud.";

    if (/duplicate key|already exists|unique constraint|ix_/i.test(message)) {
        return "Ya existe un curso con esos datos.";
    }

    if (/not found|no encontrado|does not exist/i.test(message)) {
        return "No se encontró el curso solicitado.";
    }

    if (/subcategory_id|foreign key|violates foreign key/i.test(message)) {
        return "La subcategoría seleccionada no existe o no es válida.";
    }

    if (/is_mdt/i.test(message)) {
        return "Debes indicar si el curso pertenece a MDT.";
    }

    return message;
}

async function parseErrorResponse(response: Response): Promise<never> {
    let rawText = "";

    try {
        rawText = await response.text();
    } catch {
        throw new ApiError(
            "No se pudo leer la respuesta del servidor.",
            response.status,
        );
    }

    if (response.status === 401) {
        clearAuthSession();

        throw new ApiError(
            "Tu sesión expiró o no es válida. Inicia sesión nuevamente.",
            response.status,
        );
    }

    if (!rawText) {
        throw new ApiError(
            "Ocurrió un error inesperado en la solicitud.",
            response.status,
        );
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
                error?: string;
            }
            | undefined;

        if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
            const message =
                parsed.detail
                    .map((item) => item.msg)
                    .filter(Boolean)
                    .join(", ") || "Error de validación en la solicitud.";

            throw new ApiError(
                normalizeCourseErrorMessage(message),
                response.status,
            );
        }

        if (typeof parsed?.detail === "string") {
            throw new ApiError(
                normalizeCourseErrorMessage(parsed.detail),
                response.status,
            );
        }

        if (typeof parsed?.message === "string") {
            throw new ApiError(
                normalizeCourseErrorMessage(parsed.message),
                response.status,
            );
        }

        if (typeof parsed?.error === "string") {
            throw new ApiError(
                normalizeCourseErrorMessage(parsed.error),
                response.status,
            );
        }

        throw new ApiError(
            normalizeCourseErrorMessage(rawText),
            response.status,
        );
    } catch (error) {
        if (error instanceof ApiError) throw error;

        throw new ApiError(
            normalizeCourseErrorMessage(rawText),
            response.status,
        );
    }
}

async function readResponse<T>(response: Response): Promise<T> {
    const rawText = await response.text();

    if (!rawText) {
        return undefined as T;
    }

    try {
        return JSON.parse(rawText) as T;
    } catch {
        return rawText as T;
    }
}

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            ...buildAuthHeaders(),
            ...(options.headers || {}),
        },
        cache: "no-store",
    });

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    return readResponse<T>(response);
}

export async function getAllCourses(): Promise<Course[]> {
    const data = await apiRequest<unknown>(`${COURSES_ENDPOINT}/`, {
        method: "GET",
    });

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((item) => normalizeCourse(item as Record<string, unknown>));
}

export async function getCourses(): Promise<Course[]> {
    return getAllCourses();
}

export async function getCourseById(courseId: number): Promise<Course> {
    const data = await apiRequest<Record<string, unknown>>(
        courseEndpoint(courseId),
        {
            method: "GET",
        },
    );

    return normalizeCourse(data);
}

export async function createCourse(payload: CoursePayload): Promise<Course> {
    const data = await apiRequest<Record<string, unknown>>(
        `${COURSES_ENDPOINT}/`,
        {
            method: "POST",
            body: buildCourseFormData(payload),
        },
    );

    return normalizeCourse(data);
}

export async function updateCourse(
    courseId: number,
    payload: Partial<CoursePayload>,
): Promise<Course> {
    const data = await apiRequest<Record<string, unknown>>(
        courseEndpoint(courseId),
        {
            method: "PUT",
            body: buildCourseFormData(payload),
        },
    );

    return normalizeCourse(data);
}

export async function deleteCourse(courseId: number): Promise<string> {
    const data = await apiRequest<string | unknown>(courseEndpoint(courseId), {
        method: "DELETE",
    });

    return typeof data === "string" ? data : "Curso eliminado correctamente.";
}

export async function getCoursesBySubcategory(
    subcategoryId: number,
): Promise<Course[]> {
    const data = await apiRequest<unknown>(
        coursesBySubcategoryEndpoint(subcategoryId),
        {
            method: "GET",
        },
    );

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((item) => normalizeCourse(item as Record<string, unknown>));
}

import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const ENROLLMENTS_ENDPOINT = `${API_URL}/api/v1/enrollments`;

export type EstudianteCurso = {
    id: number;
    userId: number;
    enrollmentId: number;
    firstname: string;
    lastname: string;
    email: string;
    idnumber: string;
};

type EnrollmentApi = {
    id?: number;
    user_id?: number;
    student_id?: number;
    user?: {
        id?: number;
        firstname?: string;
        lastname?: string;
        email?: string;
        idnumber?: string;
        id_number?: string;
    };
    student?: {
        id?: number;
        firstname?: string;
        lastname?: string;
        email?: string;
        idnumber?: string;
        id_number?: string;
    };
};

function adaptarEstudianteCurso(item: EnrollmentApi): EstudianteCurso {
    const usuario = item.user ?? item.student ?? {};

    return {
        id: Number(usuario.id ?? item.user_id ?? item.student_id ?? item.id ?? 0),
        userId: Number(usuario.id ?? item.user_id ?? item.student_id ?? 0),
        enrollmentId: Number(item.id ?? 0),
        firstname: usuario.firstname ?? "",
        lastname: usuario.lastname ?? "",
        email: usuario.email ?? "",
        idnumber: usuario.idnumber ?? usuario.id_number ?? "",
    };
}

export async function obtenerEstudiantesPorCurso(
    cursoId: number,
): Promise<EstudianteCurso[]> {
    const cursoIdValido = validateId(cursoId, "ID de curso");

    const response = await fetch(
        `${ENROLLMENTS_ENDPOINT}/course/${cursoIdValido}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<EnrollmentApi[]>(response);

    return Array.isArray(data) ? data.map(adaptarEstudianteCurso) : [];
}