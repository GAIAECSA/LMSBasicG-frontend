export interface Subcategory {
    id: number;
    name: string;
    category_id: number;
}

export interface SubcategoryPayload {
    name: string;
    category_id: number;
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const SUBCATEGORIES_ENDPOINT = `${API_BASE_URL}/api/v1/subcategories/subcategories`;
const SUBCATEGORIES_BY_CATEGORY_ENDPOINT = `${API_BASE_URL}/api/v1/subcategories/categories`;

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
        if (isTokenExpired(rawSession)) {
            clearAuthSession();
            return null;
        }

        return rawSession;
    }
}

function buildAuthHeaders(includeContentType = false): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (includeContentType) {
        headers["Content-Type"] = "application/json";
    }

    const token = getAuthToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function normalizeSubcategoryErrorMessage(message: string): string {
    if (
        /duplicate key|already exists|unique constraint|ix_subcategories_name/i.test(
            message,
        )
    ) {
        return "Ya existe una subcategoría con ese nombre.";
    }

    return message || "Ocurrió un error en la solicitud.";
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
        throw new Error("No se pudo procesar la respuesta del servidor.");
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
        } else if (typeof rawText === "string" && rawText.trim()) {
            message = rawText;
        }
    } catch {
        if (rawText.trim()) {
            message = rawText;
        }
    }

    throw new Error(normalizeSubcategoryErrorMessage(message));
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        return parseErrorResponse(response);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
}

export async function getAllSubcategories(): Promise<Subcategory[]> {
    const response = await fetch(SUBCATEGORIES_ENDPOINT, {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    return parseResponse<Subcategory[]>(response);
}

export async function getSubcategoryById(
    subcategoryId: number,
): Promise<Subcategory> {
    const response = await fetch(`${SUBCATEGORIES_ENDPOINT}/${subcategoryId}`, {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    return parseResponse<Subcategory>(response);
}

export async function getSubcategoriesByCategory(
    categoryId: number,
): Promise<Subcategory[]> {
    const response = await fetch(
        `${SUBCATEGORIES_BY_CATEGORY_ENDPOINT}/${categoryId}/subcategories`,
        {
            method: "GET",
            headers: buildAuthHeaders(),
            cache: "no-store",
        },
    );

    return parseResponse<Subcategory[]>(response);
}

export async function createSubcategory(
    payload: SubcategoryPayload,
): Promise<Subcategory> {
    const response = await fetch(SUBCATEGORIES_ENDPOINT, {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
    });

    return parseResponse<Subcategory>(response);
}

export async function updateSubcategory(
    subcategoryId: number,
    payload: SubcategoryPayload,
): Promise<Subcategory> {
    const response = await fetch(`${SUBCATEGORIES_ENDPOINT}/${subcategoryId}`, {
        method: "PUT",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
    });

    return parseResponse<Subcategory>(response);
}

export async function deleteSubcategory(
    subcategoryId: number,
): Promise<string> {
    const response = await fetch(`${SUBCATEGORIES_ENDPOINT}/${subcategoryId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
    });

    return parseResponse<string>(response);
}