const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000"
).replace(/\/+$/, "");

const BLOCKS_PROGRESS_ENDPOINT = `${API_URL}/api/v1/blocks-progress/progress`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

export type CreateBlockProgressPayload = {
    enrollment_id: number;
    lesson_block_id: number;
    is_completed?: boolean;
    started_at?: string | Date | null;
    completed_at?: string | Date | null;
};

export type UpdateBlockProgressPayload = {
    is_completed?: boolean;
    attempts?: number;
    started_at?: string | Date | null;
    completed_at?: string | Date | null;
};

export type BlockProgress = {
    id: number;
    enrollment_id: number;
    lesson_block_id: number;
    is_completed: boolean;
    attempts?: number;
    started_at?: string | null;
    completed_at?: string | null;
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

    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function handleResponse<T>(response: Response): Promise<T> {
    const rawText = await response.text();

    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();

            throw new Error("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
        }

        let errorMessage = `Error ${response.status}: ${response.statusText}`;

        if (rawText) {
            try {
                const errorData = JSON.parse(rawText) as BackendValidationError;

                if (typeof errorData.detail === "string") {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData.detail)) {
                    errorMessage =
                        errorData.detail
                            .map((item) => {
                                const field = Array.isArray(item.loc)
                                    ? item.loc.join(".")
                                    : "";

                                return field ? `${field}: ${item.msg}` : item.msg;
                            })
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
        }

        throw new Error(errorMessage);
    }

    if (!rawText) {
        return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return JSON.parse(rawText) as T;
    }

    return rawText as T;
}

function validateId(value: number, label: string): number {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw new Error(`${label} no válido.`);
    }

    return numericValue;
}

function formatDateValue(value: string | Date | null | undefined) {
    if (!value) return null;

    if (value instanceof Date) {
        return value.toISOString();
    }

    return value;
}

function buildCreateProgressPayload(payload: CreateBlockProgressPayload) {
    return {
        enrollment_id: payload.enrollment_id,
        lesson_block_id: payload.lesson_block_id,
        is_completed: payload.is_completed ?? false,
        started_at: formatDateValue(payload.started_at),
        completed_at: formatDateValue(payload.completed_at),
    };
}

function buildUpdateProgressPayload(payload: UpdateBlockProgressPayload) {
    return {
        is_completed: payload.is_completed,
        attempts: payload.attempts,
        started_at: formatDateValue(payload.started_at),
        completed_at: formatDateValue(payload.completed_at),
    };
}

export async function createBlockProgress(
    payload: CreateBlockProgressPayload,
): Promise<BlockProgress> {
    validateId(payload.enrollment_id, "ID de matrícula");
    validateId(payload.lesson_block_id, "ID del bloque");

    const response = await fetch(BLOCKS_PROGRESS_ENDPOINT, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(buildCreateProgressPayload(payload)),
    });

    return handleResponse<BlockProgress>(response);
}

export async function updateBlockProgress(
    progressId: number,
    payload: UpdateBlockProgressPayload,
): Promise<BlockProgress> {
    const validProgressId = validateId(progressId, "ID del progreso");

    const response = await fetch(`${BLOCKS_PROGRESS_ENDPOINT}/${validProgressId}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify(buildUpdateProgressPayload(payload)),
    });

    return handleResponse<BlockProgress>(response);
}

export async function getBlockProgress(
    progressId: number,
): Promise<BlockProgress> {
    const validProgressId = validateId(progressId, "ID del progreso");

    const response = await fetch(`${BLOCKS_PROGRESS_ENDPOINT}/${validProgressId}`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    return handleResponse<BlockProgress>(response);
}

export async function deleteBlockProgress(progressId: number): Promise<string> {
    const validProgressId = validateId(progressId, "ID del progreso");

    const response = await fetch(`${BLOCKS_PROGRESS_ENDPOINT}/${validProgressId}`, {
        method: "DELETE",
        headers: getJsonHeaders(),
    });

    return handleResponse<string>(response);
}

export async function getProgressByEnrollment(
    enrollmentId: number,
): Promise<BlockProgress[]> {
    const validEnrollmentId = validateId(enrollmentId, "ID de matrícula");

    const response = await fetch(
        `${BLOCKS_PROGRESS_ENDPOINT}/enrollment/${validEnrollmentId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleResponse<BlockProgress[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function completeBlockProgress(
    enrollmentId: number,
    lessonBlockId: number,
): Promise<string> {
    const validEnrollmentId = validateId(enrollmentId, "ID de matrícula");
    const validLessonBlockId = validateId(lessonBlockId, "ID del bloque");

    const query = new URLSearchParams({
        enrollment_id: String(validEnrollmentId),
        lesson_block_id: String(validLessonBlockId),
    });

    const response = await fetch(
        `${BLOCKS_PROGRESS_ENDPOINT}/complete?${query.toString()}`,
        {
            method: "POST",
            headers: getJsonHeaders(),
        },
    );

    return handleResponse<string>(response);
}

export async function markBlockAsStarted(params: {
    enrollment_id: number;
    lesson_block_id: number;
}): Promise<BlockProgress> {
    return createBlockProgress({
        enrollment_id: params.enrollment_id,
        lesson_block_id: params.lesson_block_id,
        is_completed: false,
        started_at: new Date(),
        completed_at: null,
    });
}

export async function markBlockAsCompleted(params: {
    enrollment_id: number;
    lesson_block_id: number;
}): Promise<string> {
    return completeBlockProgress(params.enrollment_id, params.lesson_block_id);
}

export function findProgressByBlock(
    progresses: BlockProgress[],
    lessonBlockId: number,
): BlockProgress | null {
    return (
        progresses.find(
            (progress) => Number(progress.lesson_block_id) === Number(lessonBlockId),
        ) ?? null
    );
}