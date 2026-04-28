const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const QUIZZ_RESPONSE_ENDPOINT = `${API_BASE_URL}/api/v1/quizz-response/quiz-responses`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

export type QuizzResponse = {
    id: number;
    enrollment_id: number;
    lesson_block_id: number;
    quizz: string;
    response: string;
    score: number;
    is_passed: boolean;
    created_at: string;
};

export type CreateQuizzResponsePayload = {
    enrollment_id: number;
    lesson_block_id: number;
    quizz: string;
    response: string;
    score: number;
    is_passed: boolean;
};

export type QuizzResponseByLessonBlock = {
    id: number;
    lesson_block_id: number;
    quizz: string;
    response: string;
    score: number;
    is_passed: boolean;
    created_at: string;
    enrollment: {
        id: number;
        user: {
            id: number;
            firstname: string;
            lastname: string;
            role_id: number;
        };
    };
};

export type UpdateQuizzResponsePayload = {
    response: string;
    score: number;
    is_passed: boolean;
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

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();

            throw new Error("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
        }

        let message = "Ocurrió un error al procesar la respuesta del quizz.";

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

export async function createQuizzResponse(
    payload: CreateQuizzResponsePayload,
): Promise<QuizzResponse> {
    const response = await fetch(QUIZZ_RESPONSE_ENDPOINT, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse<QuizzResponse>(response);
}

export async function updateQuizzResponse(
    quizzResponseId: number,
    payload: UpdateQuizzResponsePayload,
): Promise<QuizzResponse> {
    if (!Number.isFinite(quizzResponseId) || quizzResponseId <= 0) {
        throw new Error("No se pudo identificar la respuesta del quizz.");
    }

    const response = await fetch(
        `${QUIZZ_RESPONSE_ENDPOINT}/${quizzResponseId}`,
        {
            method: "PUT",
            headers: getJsonHeaders(),
            body: JSON.stringify(payload),
        },
    );

    return handleResponse<QuizzResponse>(response);
}

export async function getQuizzResponse(
    quizzResponseId: number,
): Promise<QuizzResponse> {
    if (!Number.isFinite(quizzResponseId) || quizzResponseId <= 0) {
        throw new Error("No se pudo identificar la respuesta del quizz.");
    }

    const response = await fetch(
        `${QUIZZ_RESPONSE_ENDPOINT}/${quizzResponseId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleResponse<QuizzResponse>(response);
}

export async function deleteQuizzResponse(
    quizzResponseId: number,
): Promise<string> {
    if (!Number.isFinite(quizzResponseId) || quizzResponseId <= 0) {
        throw new Error("No se pudo identificar la respuesta del quizz.");
    }

    const response = await fetch(
        `${QUIZZ_RESPONSE_ENDPOINT}/${quizzResponseId}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
        },
    );

    return handleResponse<string>(response);
}

async function getQuizzResponsesByEnrollmentFromUrl(
    url: string,
): Promise<QuizzResponse[]> {
    const response = await fetch(url, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    if (response.status === 404 || response.status >= 500) {
        return [];
    }

    const data = await handleResponse<QuizzResponse[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function getQuizzResponsesByEnrollment(
    enrollmentId: number,
): Promise<QuizzResponse[]> {
    if (!Number.isFinite(enrollmentId) || enrollmentId <= 0) {
        throw new Error("No se pudo identificar la matrícula para consultar el quizz.");
    }

    const byEnrollmentUrl = `${QUIZZ_RESPONSE_ENDPOINT}/by-enrollment/${enrollmentId}`;
    const legacyEnrollmentUrl = `${QUIZZ_RESPONSE_ENDPOINT}/enrollment/${enrollmentId}`;

    const byEnrollmentResponses = await getQuizzResponsesByEnrollmentFromUrl(
        byEnrollmentUrl,
    );

    if (byEnrollmentResponses.length > 0) {
        return byEnrollmentResponses;
    }

    return getQuizzResponsesByEnrollmentFromUrl(legacyEnrollmentUrl);
}

export async function getQuizzResponsesByLessonBlock(
    lessonBlockId: number,
): Promise<QuizzResponseByLessonBlock[]> {
    if (!Number.isFinite(lessonBlockId) || lessonBlockId <= 0) {
        throw new Error("No se pudo identificar el bloque de la prueba.");
    }

    const response = await fetch(
        `${QUIZZ_RESPONSE_ENDPOINT}/lesson-block/${lessonBlockId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleResponse<QuizzResponseByLessonBlock[]>(response);

    return Array.isArray(data) ? data : [];
}