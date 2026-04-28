const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000"
).replace(/\/+$/, "");

const MODULES_ENDPOINT = `${API_URL}/api/v1/modules`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

export type ModulePayload = {
    name: string;
    order: number;
    course_id: number;
};

export type UpdateModulePayload = {
    name: string;
    order: number;
};

export type CourseModule = {
    id: number;
    name: string;
    order: number;
    course_id: number;
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

function getHeaders(): HeadersInit {
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

export async function createModule(payload: ModulePayload): Promise<CourseModule> {
    const response = await fetch(`${MODULES_ENDPOINT}/modules`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse<CourseModule>(response);
}

export async function updateModule(
    moduleId: number,
    payload: UpdateModulePayload,
): Promise<CourseModule> {
    const response = await fetch(`${MODULES_ENDPOINT}/modules/${moduleId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse<CourseModule>(response);
}

export async function deleteModule(moduleId: number): Promise<string> {
    const response = await fetch(`${MODULES_ENDPOINT}/modules/${moduleId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });

    return handleResponse<string>(response);
}

export async function getModule(moduleId: number): Promise<CourseModule> {
    const response = await fetch(`${MODULES_ENDPOINT}/modules/${moduleId}`, {
        method: "GET",
        headers: getHeaders(),
        cache: "no-store",
    });

    return handleResponse<CourseModule>(response);
}

export async function getModulesByCourse(courseId: number): Promise<CourseModule[]> {
    const response = await fetch(`${MODULES_ENDPOINT}/courses/${courseId}/modules`, {
        method: "GET",
        headers: getHeaders(),
        cache: "no-store",
    });

    const data = await handleResponse<CourseModule[]>(response);

    return Array.isArray(data) ? data : [];
}