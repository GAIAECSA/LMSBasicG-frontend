const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000"
).replace(/\/+$/, "");

const LESSONS_ENDPOINT = `${API_URL}/api/v1/lessons`;
const LESSON_BLOCKS_ENDPOINT = `${API_URL}/api/v1/lesson-blocks`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

export type LessonPayload = {
    name: string;
    order: number;
    module_id: number;
};

export type UpdateLessonPayload = {
    name: string;
    order: number;
};

export type Lesson = {
    id: number;
    name: string;
    order: number;
    module_id: number;
};

export type LessonCompletionType = "VER" | "RESPONDER" | "SUBIR" | "VIDEO";

export type LessonBlockContent = Record<string, unknown>;

export type LessonBlockPayload = {
    lesson_id: number;
    block_type_id: number;
    completion_type: LessonCompletionType;
    order: number;
    is_required: boolean;
    is_active: boolean;
    content: LessonBlockContent;

    completion_value?: number;
    deleted?: boolean;
    file?: File | null;
};

export type LessonBlockTypeResume = {
    id: number;
    key: string;
};

export type LessonBlock = {
    id: number;
    content: LessonBlockContent;
    is_required: boolean;
    completion_type: LessonCompletionType;
    completion_value: number;
    order: number;
    lesson_id: number;
    block_type_id?: number;
    is_active: boolean;
    deleted?: boolean;
    lesson_block_type?: LessonBlockTypeResume;
    created_at?: string;
    updated_at?: string | null;
};

type BackendValidationError = {
    detail?: string | Array<{ loc?: unknown[]; msg?: string; type?: string }>;
    message?: string;
};

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

function cleanToken(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const token = value.trim().replace(/^Bearer\s+/i, "");

    return token || null;
}

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) return null;

    try {
        const parsedSession = JSON.parse(rawSession) as {
            accessToken?: string;
            token?: string;
            access_token?: string;
            data?: {
                accessToken?: string;
                token?: string;
                access_token?: string;
            };
            session?: {
                accessToken?: string;
                token?: string;
                access_token?: string;
            };
        };

        const token = cleanToken(
            parsedSession.accessToken ??
            parsedSession.token ??
            parsedSession.access_token ??
            parsedSession.data?.accessToken ??
            parsedSession.data?.token ??
            parsedSession.data?.access_token ??
            parsedSession.session?.accessToken ??
            parsedSession.session?.token ??
            parsedSession.session?.access_token,
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

function getJsonHeaders(): HeadersInit {
    const token = getAuthToken();

    if (!token) {
        throw new Error("No se encontró un token válido. Inicia sesión nuevamente.");
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };

    return headers;
}

function getFormDataHeaders(): HeadersInit {
    const token = getAuthToken();

    if (!token) {
        throw new Error("No se encontró un token válido. Inicia sesión nuevamente.");
    }

    const headers: Record<string, string> = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };

    return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();

            throw new Error("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
        }

        let errorMessage = "Ocurrió un error al procesar la solicitud.";

        try {
            const rawText = await response.text();

            if (!rawText) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            try {
                const errorData = JSON.parse(rawText) as BackendValidationError;

                if (typeof errorData.detail === "string") {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData.detail)) {
                    errorMessage =
                        errorData.detail
                            .map((item) => item.msg)
                            .filter(Boolean)
                            .join(", ") || "Error de validación en la solicitud.";
                } else if (typeof errorData.message === "string") {
                    errorMessage = errorData.message;
                } else {
                    errorMessage = rawText;
                }
            } catch {
                errorMessage = rawText;
            }
        } catch {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
}

function buildLessonBlockFormData(payload: LessonBlockPayload): FormData {
    const data = new FormData();

    data.append("lesson_id", String(payload.lesson_id));
    data.append("block_type_id", String(payload.block_type_id));
    data.append("completion_type", payload.completion_type);
    data.append("order", String(payload.order));
    data.append("is_required", String(payload.is_required));
    data.append("is_active", String(payload.is_active));

    if (
        payload.completion_value !== undefined &&
        payload.completion_value !== null
    ) {
        data.append("completion_value", String(payload.completion_value));
    }

    if (payload.deleted !== undefined) {
        data.append("deleted", String(payload.deleted));
    }

    if (payload.content !== undefined) {
        data.append("content", JSON.stringify(payload.content));
    }

    if (typeof File !== "undefined" && payload.file instanceof File) {
        data.append("file", payload.file);
    }

    return data;
}

/* ======================================================
   LESSONS
   ====================================================== */

export async function createLesson(payload: LessonPayload): Promise<Lesson> {
    const response = await fetch(`${LESSONS_ENDPOINT}/lessons`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse<Lesson>(response);
}

export async function updateLesson(
    lessonId: number,
    payload: UpdateLessonPayload,
): Promise<Lesson> {
    const response = await fetch(`${LESSONS_ENDPOINT}/lessons/${lessonId}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse<Lesson>(response);
}

export async function deleteLesson(lessonId: number): Promise<string> {
    const response = await fetch(`${LESSONS_ENDPOINT}/lessons/${lessonId}`, {
        method: "DELETE",
        headers: getJsonHeaders(),
    });

    return handleResponse<string>(response);
}

export async function getLesson(lessonId: number): Promise<Lesson> {
    const response = await fetch(`${LESSONS_ENDPOINT}/lessons/${lessonId}`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    return handleResponse<Lesson>(response);
}

export async function getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    const response = await fetch(`${LESSONS_ENDPOINT}/modules/${moduleId}/lessons`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    const data = await handleResponse<Lesson[]>(response);

    return Array.isArray(data) ? data : [];
}

/* ======================================================
   LESSON BLOCKS
   ====================================================== */

export async function createLessonBlock(
    payload: LessonBlockPayload,
): Promise<LessonBlock> {
    const response = await fetch(`${LESSON_BLOCKS_ENDPOINT}/lesson-blocks`, {
        method: "POST",
        headers: getFormDataHeaders(),
        body: buildLessonBlockFormData(payload),
    });

    return handleResponse<LessonBlock>(response);
}

export async function updateLessonBlock(
    lessonBlockId: number,
    payload: LessonBlockPayload,
): Promise<LessonBlock> {
    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/lesson-blocks/${lessonBlockId}`,
        {
            method: "PUT",
            headers: getFormDataHeaders(),
            body: buildLessonBlockFormData(payload),
        },
    );

    return handleResponse<LessonBlock>(response);
}

export async function deleteLessonBlock(lessonBlockId: number): Promise<string> {
    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/lesson-blocks/${lessonBlockId}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
        },
    );

    return handleResponse<string>(response);
}

export async function getLessonBlock(
    lessonBlockId: number,
): Promise<LessonBlock> {
    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/lesson-blocks/${lessonBlockId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleResponse<LessonBlock>(response);
}

export async function getLessonBlocksByLesson(
    lessonId: number,
): Promise<LessonBlock[]> {
    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/lesson/${lessonId}/lesson-blocks`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleResponse<LessonBlock[]>(response);

    return Array.isArray(data) ? data : [];
}