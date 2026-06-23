const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://213.165.74.184:9000";

const API_URL = RAW_API_URL
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/i, "");

const PROGRESS_URL =
    `${API_URL}/api/v1/blocks-progress/progress`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

export type BlockProgress = {
    id: number;
    enrollment_id: number;
    lesson_block_id: number;
    is_completed: boolean;
    attempts?: number;
    started_at?: string | null;
    completed_at?: string | null;
};

export type UpdateBlockProgressPayload = {
    is_completed?: boolean;
    attempts?: number;
    started_at?: string | Date | null;
    completed_at?: string | Date | null;
};

function clearAuthSession() {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function cleanToken(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const token = value
        .trim()
        .replace(/^Bearer\s+/i, "");

    return token || null;
}

function getAuthToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    const rawSession =
        localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        const session = JSON.parse(rawSession) as {
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

        return cleanToken(
            session.accessToken ??
            session.token ??
            session.access_token ??
            session.data?.accessToken ??
            session.data?.token ??
            session.data?.access_token ??
            session.session?.accessToken ??
            session.session?.token ??
            session.session?.access_token,
        );
    } catch {
        return cleanToken(rawSession);
    }
}

function getHeaders(): HeadersInit {
    const token = getAuthToken();

    if (!token) {
        throw new Error(
            "No se encontró un token válido. Inicia sesión nuevamente.",
        );
    }

    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function parseResponse<T>(
    response: Response,
): Promise<T> {
    const text =
        await response.text();

    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();

            throw new Error(
                "Tu sesión expiró. Inicia sesión nuevamente.",
            );
        }

        if (!text) {
            throw new Error(
                `Error ${response.status}: ${response.statusText}`,
            );
        }

        try {
            const data = JSON.parse(text) as {
                detail?: string | Array<{
                    msg?: string;
                    loc?: unknown[];
                }>;
                message?: string;
            };

            if (typeof data.detail === "string") {
                throw new Error(data.detail);
            }

            if (Array.isArray(data.detail)) {
                throw new Error(
                    data.detail
                        .map((item) => item.msg)
                        .filter(Boolean)
                        .join(", ") ||
                    "Error de validación.",
                );
            }

            if (data.message) {
                throw new Error(data.message);
            }

            throw new Error(text);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }

            throw new Error(text);
        }
    }

    if (!text) {
        return undefined as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return text as T;
    }
}

function validateId(
    value: number,
    label: string,
): number {
    const numericValue =
        Number(value);

    if (
        !Number.isInteger(numericValue) ||
        numericValue <= 0
    ) {
        throw new Error(
            `${label} no válido.`,
        );
    }

    return numericValue;
}

function normalizeBlockProgress(
    value: unknown,
): BlockProgress {
    const item =
        value as Partial<BlockProgress>;

    return {
        id: Number(item.id),
        enrollment_id: Number(item.enrollment_id),
        lesson_block_id: Number(item.lesson_block_id),
        is_completed: Boolean(item.is_completed),
        attempts:
            item.attempts === undefined
                ? undefined
                : Number(item.attempts),
        started_at:
            item.started_at ?? null,
        completed_at:
            item.completed_at ?? null,
    };
}

export async function getBlockProgress(
    progressId: number,
): Promise<BlockProgress> {
    const validProgressId =
        validateId(
            progressId,
            "ID del progreso",
        );

    const response =
        await fetch(
            `${PROGRESS_URL}/${validProgressId}`,
            {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store",
            },
        );

    const data =
        await parseResponse<unknown>(
            response,
        );

    return normalizeBlockProgress(data);
}

export async function getProgressByEnrollment(
    enrollmentId: number,
): Promise<BlockProgress[]> {
    const validEnrollmentId =
        validateId(
            enrollmentId,
            "ID de matrícula",
        );

    const response =
        await fetch(
            `${PROGRESS_URL}/enrollment/${validEnrollmentId}`,
            {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store",
            },
        );

    const data =
        await parseResponse<unknown[]>(
            response,
        );

    return Array.isArray(data)
        ? data.map(normalizeBlockProgress)
        : [];
}

export async function completeBlockProgress(
    enrollmentId: number,
    lessonBlockId: number,
): Promise<unknown> {
    const validEnrollmentId =
        validateId(
            enrollmentId,
            "ID de matrícula",
        );

    const validLessonBlockId =
        validateId(
            lessonBlockId,
            "ID del bloque",
        );

    const params =
        new URLSearchParams({
            enrollment_id:
                String(validEnrollmentId),
            lesson_block_id:
                String(validLessonBlockId),
        });

    const response =
        await fetch(
            `${PROGRESS_URL}/complete?${params.toString()}`,
            {
                method: "POST",
                headers: getHeaders(),
                cache: "no-store",
            },
        );

    return parseResponse<unknown>(
        response,
    );
}

export async function markBlockAsCompleted(
    enrollmentId: number,
    lessonBlockId: number,
): Promise<BlockProgress> {
    const validEnrollmentId =
        validateId(
            enrollmentId,
            "ID de matrícula",
        );

    const validLessonBlockId =
        validateId(
            lessonBlockId,
            "ID del bloque",
        );

    const result =
        await completeBlockProgress(
            validEnrollmentId,
            validLessonBlockId,
        );

    if (
        typeof result === "object" &&
        result !== null &&
        "id" in result &&
        "enrollment_id" in result &&
        "lesson_block_id" in result
    ) {
        return normalizeBlockProgress(result);
    }

    const progressList =
        await getProgressByEnrollment(
            validEnrollmentId,
        );

    const progress =
        progressList.find(
            (item) =>
                Number(item.lesson_block_id) ===
                validLessonBlockId,
        );

    if (progress) {
        return progress;
    }

    return {
        id: 0,
        enrollment_id: validEnrollmentId,
        lesson_block_id: validLessonBlockId,
        is_completed: true,
        completed_at:
            new Date().toISOString(),
    };
}

/**
 * Compatibilidad con código anterior.
 * Antes se intentaba usar:
 * PUT /api/v1/blocks-progress/progress/{progress_id}
 *
 * Pero tu backend actual usa:
 * POST /api/v1/blocks-progress/progress/complete?enrollment_id=...&lesson_block_id=...
 */
export async function updateBlockProgress(
    progressId: number,
    payload: UpdateBlockProgressPayload,
): Promise<BlockProgress> {
    const validProgressId =
        validateId(
            progressId,
            "ID del progreso",
        );

    if (payload.is_completed === false) {
        throw new Error(
            "El backend actual no permite desmarcar un bloque como incompleto.",
        );
    }

    const currentProgress =
        await getBlockProgress(
            validProgressId,
        );

    if (payload.is_completed !== true) {
        return currentProgress;
    }

    return markBlockAsCompleted(
        currentProgress.enrollment_id,
        currentProgress.lesson_block_id,
    );
}