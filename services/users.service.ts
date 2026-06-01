export interface User {
    id: number;
    username: string;
    idnumber?: string | null;
    firstname: string;
    lastname: string;
    role_id: number;
    email: string;
    phone_number: string | null;
    departament: string | null;
}

export interface RegisterUserPayload {
    username: string;
    idnumber?: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number?: string | null;
    departament?: string | null;
    role_id?: number;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface UpdateUserPayload {
    username?: string;
    idnumber?: string;
    password?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone_number?: string | null;
    departament?: string | null;
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

const REGISTER_ENDPOINT = `${API_BASE_URL}/api/v1/users/register`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/v1/users/login`;
const ME_ENDPOINT = `${API_BASE_URL}/api/v1/users/me`;
const USERS_ENDPOINT = `${API_BASE_URL}/api/v1/users/users`;

const userEndpoint = (userId: number) => `${USERS_ENDPOINT}/${userId}`;

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

function textValue(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    return "";
}

function nullableTextValue(value: string | null | undefined): string {
    if (typeof value !== "string") return "";

    return value.trim();
}

async function parseUserErrorResponse(response: Response): Promise<never> {
    let rawText = "";

    try {
        rawText = await response.text();
    } catch {
        throw new ApiError(
            "No se pudo leer la respuesta del servidor.",
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

    if (!rawText) {
        throw new ApiError(
            "Ocurrió un error al consultar los usuarios.",
            response.status,
        );
    }

    try {
        const parsed = JSON.parse(rawText) as
            | {
                detail?: string | Array<{ msg?: string }>;
                message?: string;
                error?: string;
            }
            | undefined;

        if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
            const detailMessage = parsed.detail
                .map((item) => item.msg)
                .filter(Boolean)
                .join(", ");

            throw new ApiError(
                detailMessage || "Error de validación al consultar usuarios.",
                response.status,
            );
        }

        if (typeof parsed?.detail === "string") {
            throw new ApiError(parsed.detail, response.status);
        }

        if (typeof parsed?.message === "string") {
            throw new ApiError(parsed.message, response.status);
        }

        if (typeof parsed?.error === "string") {
            throw new ApiError(parsed.error, response.status);
        }

        throw new ApiError(rawText, response.status);
    } catch (error) {
        if (error instanceof ApiError) throw error;

        throw new ApiError(rawText, response.status);
    }
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
        await parseUserErrorResponse(response);
    }

    return readResponse<T>(response);
}

function buildRegisterPayload(payload: RegisterUserPayload) {
    return {
        username: textValue(payload.username),
        idnumber: textValue(payload.idnumber),
        password: textValue(payload.password),
        firstname: textValue(payload.firstname),
        lastname: textValue(payload.lastname),
        email: textValue(payload.email),
        phone_number: nullableTextValue(payload.phone_number),
        departament: nullableTextValue(payload.departament),
    };
}

function buildUpdatePayload(payload: UpdateUserPayload) {
    const body: Record<string, string> = {};

    if (payload.username !== undefined) {
        body.username = textValue(payload.username);
    }

    if (payload.idnumber !== undefined) {
        body.idnumber = textValue(payload.idnumber);
    }

    if (payload.password !== undefined && payload.password.trim()) {
        body.password = textValue(payload.password);
    }

    if (payload.firstname !== undefined) {
        body.firstname = textValue(payload.firstname);
    }

    if (payload.lastname !== undefined) {
        body.lastname = textValue(payload.lastname);
    }

    if (payload.email !== undefined) {
        body.email = textValue(payload.email);
    }

    if (payload.phone_number !== undefined) {
        body.phone_number = nullableTextValue(payload.phone_number);
    }

    if (payload.departament !== undefined) {
        body.departament = nullableTextValue(payload.departament);
    }

    return body;
}

export async function registerUser(
    payload: RegisterUserPayload,
): Promise<string> {
    return apiRequest<string>(REGISTER_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(buildRegisterPayload(payload)),
    });
}

export async function loginUser(payload: LoginPayload): Promise<string> {
    return apiRequest<string>(LOGIN_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
            username: textValue(payload.username),
            password: textValue(payload.password),
        }),
    });
}

export async function getCurrentUser(): Promise<User> {
    return apiRequest<User>(ME_ENDPOINT, {
        method: "GET",
    });
}

export async function getAllUsers(): Promise<User[]> {
    const data = await apiRequest<User[]>(USERS_ENDPOINT, {
        method: "GET",
    });

    return Array.isArray(data) ? data : [];
}

export async function getUserById(userId: number): Promise<User> {
    return apiRequest<User>(userEndpoint(userId), {
        method: "GET",
    });
}

export async function updateUser(
    userId: number,
    payload: UpdateUserPayload,
): Promise<User> {
    return apiRequest<User>(userEndpoint(userId), {
        method: "PUT",
        body: JSON.stringify(buildUpdatePayload(payload)),
    });
}

export async function deleteUser(userId: number): Promise<void | string> {
    return apiRequest<void | string>(userEndpoint(userId), {
        method: "DELETE",
    });
}