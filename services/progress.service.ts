const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const BLOCKS_PROGRESS_ENDPOINT = `${API_BASE_URL}/api/v1/blocks-progress/progress`;

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

export type CreateBlockProgressPayload = {
    enrollment_id: number;
    lesson_block_id: number;
    is_completed: boolean;
    started_at?: string | null;
    completed_at?: string | null;
};

export type UpdateBlockProgressPayload = {
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
    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();

            throw new Error("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
        }

        let message = "Ocurrió un error al procesar el progreso.";

        try {
            const rawText = await response.text();

            if (!rawText) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            try {
                const errorData = JSON.parse(rawText) as BackendValidationError;

                if (typeof errorData.detail === "string") {
                    message = errorData.detail;
                } else if (Array.isArray(errorData.detail)) {
                    message =
                        errorData.detail
                            .map((item) => item.msg)
                            .filter(Boolean)
                            .join(", ") || message;
                } else if (typeof errorData.message === "string") {
                    message = errorData.message;
                } else {
                    message = rawText;
                }
            } catch {
                message = rawText;
            }
        } catch {
            message = `Error ${response.status}: ${response.statusText}`;
        }

        throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
}

export async function createBlockProgress(
    payload: CreateBlockProgressPayload,
): Promise<BlockProgress> {
    const response = await fetch(BLOCKS_PROGRESS_ENDPOINT, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse<BlockProgress>(response);
}

export async function updateBlockProgress(
    progressId: number,
    payload: UpdateBlockProgressPayload,
): Promise<BlockProgress> {
    if (!Number.isFinite(progressId) || progressId <= 0) {
        throw new Error("No se pudo identificar el progreso del bloque.");
    }

    const response = await fetch(`${BLOCKS_PROGRESS_ENDPOINT}/${progressId}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse<BlockProgress>(response);
}

export async function getBlockProgress(
    progressId: number,
): Promise<BlockProgress> {
    if (!Number.isFinite(progressId) || progressId <= 0) {
        throw new Error("No se pudo identificar el progreso del bloque.");
    }

    const response = await fetch(`${BLOCKS_PROGRESS_ENDPOINT}/${progressId}`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    return handleResponse<BlockProgress>(response);
}

export async function deleteBlockProgress(progressId: number): Promise<string> {
    if (!Number.isFinite(progressId) || progressId <= 0) {
        throw new Error("No se pudo identificar el progreso del bloque.");
    }

    const response = await fetch(`${BLOCKS_PROGRESS_ENDPOINT}/${progressId}`, {
        method: "DELETE",
        headers: getJsonHeaders(),
    });

    return handleResponse<string>(response);
}

export async function getProgressByEnrollment(
    enrollmentId: number,
): Promise<BlockProgress[]> {
    if (!Number.isFinite(enrollmentId) || enrollmentId <= 0) {
        throw new Error("No se pudo identificar la matrícula para consultar el progreso.");
    }

    const response = await fetch(
        `${BLOCKS_PROGRESS_ENDPOINT}/enrollment/${enrollmentId}`,
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
    if (!Number.isFinite(enrollmentId) || enrollmentId <= 0) {
        throw new Error("No se pudo identificar la matrícula.");
    }

    if (!Number.isFinite(lessonBlockId) || lessonBlockId <= 0) {
        throw new Error("No se pudo identificar el bloque de la lección.");
    }

    const url = new URL(`${BLOCKS_PROGRESS_ENDPOINT}/complete`);

    url.searchParams.set("enrollment_id", String(enrollmentId));
    url.searchParams.set("lesson_block_id", String(lessonBlockId));

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: getJsonHeaders(),
    });

    return handleResponse<string>(response);
}