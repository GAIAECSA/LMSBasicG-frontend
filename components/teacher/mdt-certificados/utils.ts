import { API_URL } from "@/services/api-client.service";
import type { Enrollment } from "@/services/enrollments.service";
import type { CourseStudent, FlexibleRecord } from "./types";

export function cleanText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

export function readNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function toRecord(value: unknown): FlexibleRecord {
    if (!value || typeof value !== "object") return {};

    return value as FlexibleRecord;
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;

    return "Ocurrió un error inesperado.";
}

export function normalizeSearch(value: unknown) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeIdNumber(value: unknown) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, "");
}

export function getApiOrigin() {
    const cleanApiUrl = String(API_URL || "")
        .trim()
        .replace(/\/+$/, "");

    if (cleanApiUrl.endsWith("/api/v1")) {
        return cleanApiUrl.replace(/\/api\/v1$/, "");
    }

    return cleanApiUrl;
}

export function buildCertificateFileUrl(
    url: string | null | undefined,
) {
    const cleanUrl = cleanText(url);

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("blob:") ||
        cleanUrl.startsWith("data:")
    ) {
        return cleanUrl;
    }

    const apiOrigin = getApiOrigin();

    if (!apiOrigin) return cleanUrl;

    if (cleanUrl.startsWith("/")) {
        return `${apiOrigin}${cleanUrl}`;
    }

    return `${apiOrigin}/${cleanUrl}`;
}

export function formatDate(value: string | null | undefined) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Sin fecha";

    return new Intl.DateTimeFormat("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function getIdNumberFromFileName(fileName: string) {
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    const match = nameWithoutExtension.match(/\d{6,13}/);

    return match?.[0] ?? "";
}

export function getFileKey(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

export function adaptCourseStudent(
    enrollment: Enrollment,
): CourseStudent {
    const enrollmentRecord = toRecord(enrollment);
    const userRecord = toRecord(enrollmentRecord.user);

    const enrollmentId = readNumber(enrollmentRecord.id);
    const userId = readNumber(
        userRecord.id ?? enrollmentRecord.user_id,
    );

    return {
        id: enrollmentId || userId,
        userId,
        enrollmentId,
        firstname: cleanText(userRecord.firstname),
        lastname: cleanText(userRecord.lastname),
        email: cleanText(userRecord.email),
        idnumber: normalizeIdNumber(userRecord.idnumber),
    };
}

export function getStudentName(student: CourseStudent) {
    const name =
        `${student.firstname} ${student.lastname}`.trim();

    return (
        name ||
        student.email ||
        student.idnumber ||
        "Estudiante"
    );
}
