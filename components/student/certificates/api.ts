import { API_BASE_URL, AUTH_STORAGE_KEY } from "./constants";
import type {
    EnrollmentForCertificate,
    MdtCertificateForStudent,
} from "./types";


function cleanToken(value: unknown): string {
    if (typeof value !== "string") return "";

    return value.trim().replace(/^Bearer\s+/i, "");
}

function getStoredAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) return null;

    try {
        const parsed = JSON.parse(rawSession);

        return (
            cleanToken(parsed?.accessToken) ||
            cleanToken(parsed?.access_token) ||
            cleanToken(parsed?.token) ||
            cleanToken(parsed?.data?.accessToken) ||
            cleanToken(parsed?.data?.access_token) ||
            cleanToken(parsed?.data?.token) ||
            null
        );
    } catch {
        return cleanToken(rawSession) || null;
    }
}

function getAuthHeaders(): HeadersInit {
    const token = getStoredAuthToken();

    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
    const rawText = await response.text();

    let data: unknown = rawText;

    try {
        data = rawText ? JSON.parse(rawText) : null;
    } catch {
        data = rawText;
    }

    if (!response.ok) {
        let message = "No se pudo completar la solicitud.";

        if (typeof data === "string" && data.trim()) {
            message = data;
        }

        if (data && typeof data === "object") {
            const record = data as {
                detail?: string | Array<{ msg?: string }>;
                message?: string;
                error?: string;
            };

            if (typeof record.detail === "string") {
                message = record.detail;
            } else if (Array.isArray(record.detail)) {
                message =
                    record.detail
                        .map((item) => item.msg)
                        .filter(Boolean)
                        .join(", ") || message;
            } else if (typeof record.message === "string") {
                message = record.message;
            } else if (typeof record.error === "string") {
                message = record.error;
            }
        }

        throw new Error(message);
    }

    return data as T;
}

export async function getEnrollmentsByUserForCertificates(
    userId: number,
): Promise<EnrollmentForCertificate[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/enrollments/enrollments/by-user?user_id=${userId}`,
        {
            method: "GET",
            headers: getAuthHeaders(),
            cache: "no-store",
        },
    );

    const data = await parseApiResponse<EnrollmentForCertificate[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function getMdtCertificateByCourseAndIdNumber(
    idNumber: string,
    courseId: number,
): Promise<MdtCertificateForStudent | null> {
    const cleanIdNumber = idNumber.trim();

    if (!cleanIdNumber || !courseId) {
        return null;
    }

    const response = await fetch(
        `${API_BASE_URL}/api/v1/mdt-certificates/id-number/${encodeURIComponent(
            cleanIdNumber,
        )}?course_id=${courseId}&certificate_type=MDT`,
        {
            method: "GET",
            headers: getAuthHeaders(),
            cache: "no-store",
        },
    );

    /*
     * Es normal que un curso matriculado todavía no tenga un certificado MDT.
     * En ese caso no se debe interrumpir la carga del resto de certificados.
     */
    if (response.status === 404) {
        return null;
    }

    const data =
        await parseApiResponse<MdtCertificateForStudent | null>(response);

    if (!data || typeof data !== "object" || !("id" in data)) {
        return null;
    }

    return data;
}