import type { AuthUser, LoginPayload, LoginResponse, UserRole } from "@/types/auth";

const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://213.165.74.184:9000"
).replace(/\/+$/, "");

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

export interface RegisterPayload {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    departament?: string;
    password: string;
}

export interface RegisterResponse {
    ok: boolean;
    message: string;
    user?: AuthUser | null;
}

type AuthTokenData = {
    accessToken: string;
    refreshToken: string | null;
    tokenType: string;
    userPayload?: unknown;
};

function asString(value: unknown, fallback = ""): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return fallback;
}

function asNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function cleanToken(value: unknown): string {
    if (typeof value !== "string") return "";

    return value.trim().replace(/^Bearer\s+/i, "");
}

function extractMessage(payload: unknown): string {
    if (typeof payload === "string" && payload.trim()) {
        return payload.trim();
    }

    if (!payload || typeof payload !== "object") {
        return "";
    }

    const data = payload as Record<string, unknown>;

    if (typeof data.message === "string" && data.message.trim()) {
        return data.message.trim();
    }

    if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail.trim();
    }

    if (typeof data.error === "string" && data.error.trim()) {
        return data.error.trim();
    }

    if (Array.isArray(data.detail) && data.detail.length > 0) {
        const messages = data.detail
            .map((item) => {
                if (!item || typeof item !== "object") return "";

                const detailItem = item as Record<string, unknown>;

                return typeof detailItem.msg === "string"
                    ? detailItem.msg.trim()
                    : "";
            })
            .filter(Boolean);

        if (messages.length > 0) {
            return messages.join(", ");
        }
    }

    return "";
}

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

        return JSON.parse(globalThis.atob(paddedPayload)) as { exp?: number };
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

function extractAuthTokenData(payload: unknown): AuthTokenData {
    if (typeof payload === "string") {
        const accessToken = cleanToken(payload);

        if (!accessToken) {
            throw new Error("La respuesta del login no contiene token.");
        }

        return {
            accessToken,
            refreshToken: null,
            tokenType: "Bearer",
        };
    }

    if (!payload || typeof payload !== "object") {
        throw new Error("La respuesta del login no contiene token.");
    }

    const source = payload as Record<string, unknown>;
    const data =
        source.data && typeof source.data === "object"
            ? (source.data as Record<string, unknown>)
            : source;

    const accessToken = cleanToken(
        data.accessToken ??
        data.access_token ??
        data.token ??
        source.accessToken ??
        source.access_token ??
        source.token,
    );

    if (!accessToken) {
        throw new Error("La respuesta del login no contiene token.");
    }

    const refreshToken =
        asString(
            data.refreshToken ??
            data.refresh_token ??
            source.refreshToken ??
            source.refresh_token,
        ) || null;

    const tokenType =
        asString(
            data.tokenType ??
            data.token_type ??
            source.tokenType ??
            source.token_type,
            "Bearer",
        ) || "Bearer";

    return {
        accessToken,
        refreshToken,
        tokenType,
        userPayload: data.user ?? source.user,
    };
}

export function getStoredAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) return null;

    try {
        const parsed = JSON.parse(rawSession) as unknown;
        const authData = extractAuthTokenData(parsed);

        if (isTokenExpired(authData.accessToken)) {
            clearAuthSession();
            return null;
        }

        return authData.accessToken;
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

export function getStoredAuthSession(): LoginResponse | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) return null;

    try {
        const parsed = JSON.parse(rawSession) as unknown;
        const authData = extractAuthTokenData(parsed);

        if (isTokenExpired(authData.accessToken)) {
            clearAuthSession();
            return null;
        }

        if (!authData.userPayload) {
            return null;
        }

        return {
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            tokenType: authData.tokenType,
            user: normalizeCurrentUserResponse(authData.userPayload),
        };
    } catch {
        clearAuthSession();
        return null;
    }
}

export function saveAuthSession(session: LoginResponse) {
    if (typeof window === "undefined") return;

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function buildAuthorizationHeader(token?: string | null): string {
    const cleanAccessToken = cleanToken(token);

    if (!cleanAccessToken) {
        throw new Error("No se encontró un token válido. Inicia sesión nuevamente.");
    }

    if (isTokenExpired(cleanAccessToken)) {
        clearAuthSession();
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
    }

    return `Bearer ${cleanAccessToken}`;
}

function buildAuthHeaders(token?: string | null): HeadersInit {
    const accessToken = token ?? getStoredAuthToken();

    return {
        Accept: "application/json",
        Authorization: buildAuthorizationHeader(accessToken),
    };
}

async function parseResponse<T>(response: Response): Promise<T> {
    const rawText = await response.text().catch(() => "");
    let payload: unknown = rawText;

    if (rawText) {
        try {
            payload = JSON.parse(rawText);
        } catch {
            payload = rawText;
        }
    } else {
        payload = null;
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();

            throw new Error("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
        }

        throw new Error(
            extractMessage(payload) ||
            `Error ${response.status}: ${response.statusText || "No se pudo completar la solicitud."
            }`,
        );
    }

    return payload as T;
}

function resolveRole(value: unknown): UserRole {
    const roleId = asNumber(value);
    const raw = asString(value).trim().toLowerCase();

    if (roleId === 1 || raw === "admin" || raw === "administrador") {
        return "admin";
    }

    if (roleId === 3 || raw === "teacher" || raw === "docente" || raw === "profesor") {
        return "teacher";
    }

    return "student";
}

function normalizeCurrentUserResponse(payload: unknown): AuthUser {
    const source =
        payload && typeof payload === "object"
            ? (payload as Record<string, unknown>)
            : {};

    const firstname = asString(source.firstname).trim();
    const lastname = asString(source.lastname).trim();
    const username = asString(source.username ?? source.email).trim();
    const email = asString(source.email).trim();

    const phoneNumber = asString(
        source.phone_number ?? source.phoneNumber ?? source.phone,
    ).trim();

    const roleId = asNumber(source.role_id ?? source.roleId) ?? 2;
    const rawRole = source.role ?? roleId;

    const fullName =
        asString(source.fullName ?? source.full_name).trim() ||
        [firstname, lastname].filter(Boolean).join(" ").trim() ||
        username ||
        email ||
        "Usuario";

    return {
        id: asString(source.id, ""),
        username,
        firstname,
        lastname,
        fullName,
        email,
        phone_number: phoneNumber,
        role_id: roleId,
        role: resolveRole(rawRole),
    };
}

export async function getCurrentUserService(
    accessToken?: string,
): Promise<AuthUser> {
    const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: "GET",
        headers: buildAuthHeaders(accessToken),
        cache: "no-store",
    });

    const data = await parseResponse<unknown>(response);

    return normalizeCurrentUserResponse(data);
}

export async function loginService(payload: LoginPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/v1/users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            username: payload.username.trim(),
            password: payload.password,
        }),
        cache: "no-store",
    });

    const loginData = await parseResponse<unknown>(response);
    const authData = extractAuthTokenData(loginData);

    if (isTokenExpired(authData.accessToken)) {
        throw new Error("El token recibido ya se encuentra expirado.");
    }

    const user = await getCurrentUserService(authData.accessToken);

    const session: LoginResponse = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        tokenType: authData.tokenType,
        user,
    };

    saveAuthSession(session);

    return session;
}

export async function registerService(
    payload: RegisterPayload,
): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/api/v1/users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            username: payload.username.trim(),
            password: payload.password,
            firstname: payload.firstname.trim(),
            lastname: payload.lastname.trim(),
            email: payload.email.trim(),
            phone_number: payload.phone_number.trim(),
            departament: payload.departament?.trim() ?? "",
        }),
        cache: "no-store",
    });

    const data = await parseResponse<unknown>(response);

    return {
        ok: true,
        message: extractMessage(data) || "Usuario registrado correctamente.",
        user: null,
    };
}

export function logoutService() {
    clearAuthSession();
}