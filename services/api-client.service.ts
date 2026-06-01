export const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000"
).replace(/\/+$/, "");

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

type BackendValidationError = {
    detail?: string | Array<{ loc?: unknown[]; msg?: string; type?: string }>;
    message?: string;
};

export function clearAuthSession() {
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

export function getAuthToken(): string | null {
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

export function getJsonHeaders(): HeadersInit {
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

export function getMultipartHeaders(): HeadersInit {
    const token = getAuthToken();

    if (!token) {
        throw new Error("No se encontró un token válido. Inicia sesión nuevamente.");
    }

    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export function getFormUrlEncodedHeaders(): HeadersInit {
    const token = getAuthToken();

    if (!token) {
        throw new Error("No se encontró un token válido. Inicia sesión nuevamente.");
    }

    return {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
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

export function validateId(value: number, label: string): number {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw new Error(`${label} no válido.`);
    }

    return numericValue;
}

export function formatDateValue(value: string | Date | null | undefined) {
    if (!value) return null;

    if (value instanceof Date) {
        return value.toISOString();
    }

    return value;
}

export function appendFormValue(
    data: FormData,
    key: string,
    value: string | number | boolean | Date | null | undefined,
) {
    if (value === undefined || value === null || value === "") return;

    if (value instanceof Date) {
        data.append(key, value.toISOString());
        return;
    }

    data.append(key, String(value));
}

export function appendFile(data: FormData, file?: File | Blob | null) {
    if (!file) return;

    const isFile = typeof File !== "undefined" && file instanceof File;
    const isBlob = typeof Blob !== "undefined" && file instanceof Blob;

    if (isFile || isBlob) {
        data.append("file", file);
    }
}