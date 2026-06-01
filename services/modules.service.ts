const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000"
).replace(/\/+$/, "");

const MODULES_ENDPOINT = `${API_URL}/api/v1/modules/modules`;
const MODULES_BY_COURSE_ENDPOINT = `${API_URL}/api/v1/modules/courses`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

export type ModulePayload = {
    name: string;
    order: number;
    course_id: number;
};

export type UpdateModulePayload = {
    name?: string;
    order?: number;
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

function normalizeModule(value: unknown): CourseModule {
    if (!value || typeof value !== "object") {
        throw new Error("La respuesta del módulo no tiene un formato válido.");
    }

    const record = value as Record<string, unknown>;

    return {
        id: Number(record.id ?? 0),
        name: String(record.name ?? ""),
        order: Number(record.order ?? 0),
        course_id: Number(record.course_id ?? 0),
    };
}

function normalizeModules(value: unknown): CourseModule[] {
    if (!Array.isArray(value)) return [];

    return value.map(normalizeModule);
}

function normalizeCreatePayload(payload: ModulePayload): ModulePayload {
    const courseId = validateId(payload.course_id, "ID del curso");

    const name = payload.name.trim();

    if (!name) {
        throw new Error("El nombre del módulo es obligatorio.");
    }

    return {
        name,
        order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : 0,
        course_id: courseId,
    };
}

function normalizeUpdatePayload(payload: UpdateModulePayload): UpdateModulePayload {
    const nextPayload: UpdateModulePayload = {};

    if (payload.name !== undefined) {
        const name = payload.name.trim();

        if (!name) {
            throw new Error("El nombre del módulo es obligatorio.");
        }

        nextPayload.name = name;
    }

    if (payload.order !== undefined) {
        nextPayload.order = Number.isFinite(Number(payload.order))
            ? Number(payload.order)
            : 0;
    }

    return nextPayload;
}

export async function createModule(
    payload: ModulePayload,
): Promise<CourseModule> {
    const response = await fetch(MODULES_ENDPOINT, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(normalizeCreatePayload(payload)),
    });

    const data = await handleResponse<unknown>(response);

    return normalizeModule(data);
}

export async function updateModule(
    moduleId: number,
    payload: UpdateModulePayload,
): Promise<CourseModule> {
    const validModuleId = validateId(moduleId, "ID del módulo");

    const response = await fetch(`${MODULES_ENDPOINT}/${validModuleId}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify(normalizeUpdatePayload(payload)),
    });

    const data = await handleResponse<unknown>(response);

    return normalizeModule(data);
}

export async function deleteModule(moduleId: number): Promise<string> {
    const validModuleId = validateId(moduleId, "ID del módulo");

    const response = await fetch(`${MODULES_ENDPOINT}/${validModuleId}`, {
        method: "DELETE",
        headers: getJsonHeaders(),
    });

    return handleResponse<string>(response);
}

export async function getModule(moduleId: number): Promise<CourseModule> {
    const validModuleId = validateId(moduleId, "ID del módulo");

    const response = await fetch(`${MODULES_ENDPOINT}/${validModuleId}`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    const data = await handleResponse<unknown>(response);

    return normalizeModule(data);
}

export async function getModulesByCourse(
    courseId: number,
): Promise<CourseModule[]> {
    const validCourseId = validateId(courseId, "ID del curso");

    const response = await fetch(
        `${MODULES_BY_COURSE_ENDPOINT}/${validCourseId}/modules`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleResponse<unknown>(response);

    return normalizeModules(data).sort((a, b) => a.order - b.order);
}

export async function reorderModules(
    modules: CourseModule[],
): Promise<CourseModule[]> {
    const orderedModules = modules.map((courseModule, index) => ({
        ...courseModule,
        order: index + 1,
    }));

    const updatedModules = await Promise.all(
        orderedModules.map((courseModule) =>
            updateModule(courseModule.id, {
                name: courseModule.name,
                order: courseModule.order,
            }),
        ),
    );

    return updatedModules.sort((a, b) => a.order - b.order);
}