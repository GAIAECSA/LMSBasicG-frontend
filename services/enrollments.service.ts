export interface Enrollment {
    id: number;
    accepted: boolean | null;
    reference_code: string | null;
    comment: string | null;
    voucher_url: string | null;
    user: {
        id: number;
        firstname: string;
        lastname: string;
        role_id: number;
    };
    course: {
        id: number;
        name: string;
    };
    role: {
        id: number;
        name: string;
    };
}

export interface CreateEnrollmentPayload {
    accepted?: boolean | null;
    reference_code?: string | null;
    comment: string | null;
    user_id: number;
    course_id: number;
    role_id: number;
    image?: File | null;
}

export interface UpdateEnrollmentPayload {
    accepted?: boolean | null;
    reference_code?: string | null;
    comment: string | null;
    user_id?: number;
    course_id?: number;
    role_id?: number;
    image?: File | null;
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const ENROLLMENTS_ENDPOINT = `${API_BASE_URL}/api/v1/enrollments/enrollments`;

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
        if (rawSession.includes(".") && isTokenExpired(rawSession)) {
            clearAuthSession();
            return null;
        }

        return rawSession;
    }
}

function buildAuthHeaders(): HeadersInit {
    const token = getAuthToken();

    if (!token) {
        throw new Error("No se encontró un token válido. Inicia sesión nuevamente.");
    }

    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export function resolveEnrollmentVoucherUrl(value?: string | null): string | null {
    if (!value || value.trim().length === 0) return null;

    const trimmed = value.trim();

    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function normalizeEnrollmentErrorMessage(message: string): string {
    if (!message) return "Ocurrió un error en la solicitud de matrícula.";

    if (/not found/i.test(message)) {
        return "La matrícula no fue encontrada.";
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
            | { detail?: string | Array<{ msg?: string }> }
            | undefined;

        if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
            const message =
                parsed.detail
                    .map((item) => item.msg)
                    .filter(Boolean)
                    .join(", ") || "Error de validación en la solicitud.";

            throw new Error(normalizeEnrollmentErrorMessage(message));
        }

        if (typeof parsed?.detail === "string") {
            throw new Error(normalizeEnrollmentErrorMessage(parsed.detail));
        }

        throw new Error(normalizeEnrollmentErrorMessage(rawText));
    } catch (error) {
        if (error instanceof Error && error.message !== rawText) {
            throw error;
        }

        throw new Error(normalizeEnrollmentErrorMessage(rawText));
    }
}

function buildEnrollmentFormData(
    payload: CreateEnrollmentPayload | UpdateEnrollmentPayload,
): FormData {
    const formData = new FormData();

    if (payload.accepted !== undefined && payload.accepted !== null) {
        formData.append("accepted", String(payload.accepted));
    }

    if (payload.reference_code !== undefined && payload.reference_code !== null) {
        formData.append("reference_code", payload.reference_code);
    }

    if (payload.comment !== undefined && payload.comment !== null) {
        formData.append("comment", payload.comment);
    }

    if (payload.user_id !== undefined) {
        formData.append("user_id", String(payload.user_id));
    }

    if (payload.course_id !== undefined) {
        formData.append("course_id", String(payload.course_id));
    }

    if (payload.role_id !== undefined) {
        formData.append("role_id", String(payload.role_id));
    }

    if (typeof File !== "undefined" && payload.image instanceof File) {
        formData.append("image", payload.image);
    }

    return formData;
}

export async function createEnrollment(
    payload: CreateEnrollmentPayload,
): Promise<Enrollment> {
    const response = await fetch(ENROLLMENTS_ENDPOINT, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: buildEnrollmentFormData(payload),
    });

    if (!response.ok) await parseErrorResponse(response);

    return (await response.json()) as Enrollment;
}

export async function updateEnrollment(
    enrollmentId: number,
    payload: UpdateEnrollmentPayload,
): Promise<Enrollment> {
    const response = await fetch(`${ENROLLMENTS_ENDPOINT}/${enrollmentId}`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: buildEnrollmentFormData(payload),
    });

    if (!response.ok) await parseErrorResponse(response);

    return (await response.json()) as Enrollment;
}

export async function deleteEnrollment(enrollmentId: number): Promise<string> {
    const response = await fetch(`${ENROLLMENTS_ENDPOINT}/${enrollmentId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
    });

    if (!response.ok) await parseErrorResponse(response);

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return (await response.json()) as string;
    }

    return await response.text();
}

export async function getEnrollmentById(
    enrollmentId: number,
): Promise<Enrollment> {
    const response = await fetch(`${ENROLLMENTS_ENDPOINT}/${enrollmentId}`, {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    if (!response.ok) await parseErrorResponse(response);

    return (await response.json()) as Enrollment;
}

export async function getEnrollmentsByUser(
    userId: number,
): Promise<Enrollment[]> {
    const url = new URL(`${ENROLLMENTS_ENDPOINT}/by-user`);
    url.searchParams.set("user_id", String(userId));

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    if (!response.ok) await parseErrorResponse(response);

    const data = (await response.json()) as Enrollment[];

    return Array.isArray(data) ? data : [];
}

export async function getEnrollmentsByRole(
    roleId: number,
): Promise<Enrollment[]> {
    const url = new URL(`${ENROLLMENTS_ENDPOINT}/by-role`);
    url.searchParams.set("role_id", String(roleId));

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    if (!response.ok) await parseErrorResponse(response);

    const data = (await response.json()) as Enrollment[];

    return Array.isArray(data) ? data : [];
}

export async function getEnrollmentsByCourseAndRole(
    courseId: number,
    roleId: number,
): Promise<Enrollment[]> {
    const url = new URL(`${ENROLLMENTS_ENDPOINT}/by-course-role`);

    url.searchParams.set("course_id", String(courseId));
    url.searchParams.set("role_id", String(roleId));

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    if (!response.ok) await parseErrorResponse(response);

    const data = (await response.json()) as Enrollment[];

    return Array.isArray(data) ? data : [];
}

export async function getEnrollmentByUserAndCourse(
    userId: number,
    courseId: number,
): Promise<Enrollment | null> {
    if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error("No se pudo identificar al usuario.");
    }

    if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("No se pudo identificar el curso.");
    }

    const enrollments = await getEnrollmentsByUser(userId);

    return (
        enrollments.find(
            (enrollment) =>
                Number(enrollment.course?.id) === courseId &&
                enrollment.accepted === true,
        ) ?? null
    );
}