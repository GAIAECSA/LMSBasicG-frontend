export interface Category {
    id: number;
    name: string;
    is_mdt: boolean;
}

export interface CategoryPayload {
    name: string;
    is_mdt: boolean;
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

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/v1/categories/categories`;

const categoryEndpoint = (categoryId: number) =>
    `${CATEGORIES_ENDPOINT}/${categoryId}`;

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

function buildHeaders(hasBody = false): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (hasBody) {
        headers["Content-Type"] = "application/json";
    }

    const token = getAuthToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function normalizeCategoryErrorMessage(message: string): string {
    if (
        /duplicate key|already exists|unique constraint|ix_categories_name/i.test(
            message,
        )
    ) {
        return "Ya existe una categoría con ese nombre.";
    }

    if (/not found|no encontrada|does not exist/i.test(message)) {
        return "La categoría no existe o ya fue eliminada.";
    }

    return message || "Ocurrió un error en la solicitud.";
}

async function parseErrorResponse(response: Response): Promise<never> {
    let rawText = "";

    try {
        rawText = await response.text();
    } catch {
        throw new ApiError(
            "No se pudo procesar la respuesta del servidor.",
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

    let message = "Ocurrió un error en la solicitud.";

    try {
        const data = rawText ? JSON.parse(rawText) : null;

        if (Array.isArray(data?.detail)) {
            message = data.detail
                .map((item: { msg?: string }) => item.msg)
                .filter(Boolean)
                .join(", ");
        } else if (typeof data?.detail === "string") {
            message = data.detail;
        } else if (typeof data?.message === "string") {
            message = data.message;
        } else if (typeof data?.error === "string") {
            message = data.error;
        } else if (rawText.trim()) {
            message = rawText;
        }
    } catch {
        if (rawText.trim()) {
            message = rawText;
        }
    }

    throw new ApiError(
        normalizeCategoryErrorMessage(message),
        response.status,
    );
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
    const hasBody = Boolean(options.body);

    const response = await fetch(endpoint, {
        ...options,
        headers: {
            ...buildHeaders(hasBody),
            ...(options.headers || {}),
        },
        cache: "no-store",
    });

    if (!response.ok) {
        await parseErrorResponse(response);
    }

    return readResponse<T>(response);
}

function buildCategoryPayload(payload: CategoryPayload) {
    return {
        name: payload.name.trim(),
        is_mdt: Boolean(payload.is_mdt),
    };
}

export async function getAllCategories(): Promise<Category[]> {
    const data = await apiRequest<Category[]>(CATEGORIES_ENDPOINT, {
        method: "GET",
    });

    return Array.isArray(data) ? data : [];
}

export async function getCategories(): Promise<Category[]> {
    return getAllCategories();
}

export async function getCategoryById(categoryId: number): Promise<Category> {
    return apiRequest<Category>(categoryEndpoint(categoryId), {
        method: "GET",
    });
}

export async function createCategory(
    payload: CategoryPayload,
): Promise<Category> {
    return apiRequest<Category>(CATEGORIES_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(buildCategoryPayload(payload)),
    });
}

export async function updateCategory(
    categoryId: number,
    payload: CategoryPayload,
): Promise<Category> {
    return apiRequest<Category>(categoryEndpoint(categoryId), {
        method: "PUT",
        body: JSON.stringify(buildCategoryPayload(payload)),
    });
}

export async function deleteCategory(categoryId: number): Promise<string> {
    return apiRequest<string>(categoryEndpoint(categoryId), {
        method: "DELETE",
    });
}