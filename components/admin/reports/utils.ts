import type { Course } from "@/services/courses.service";

export function getErrorMessage(
    error: unknown,
    fallbackMessage: string,
): string {
    return error instanceof Error
        ? error.message
        : fallbackMessage;
}

export function isMdtCourse(
    course: Course,
): boolean {
    return course.is_mdt === true;
}

function sanitizeFileNamePart(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}

export function getReportPdfFileName(
    reportLabel: string,
    courseName: string,
) {
    const reportPart = sanitizeFileNamePart(reportLabel) || "reporte";
    const coursePart = sanitizeFileNamePart(courseName) || "curso";

    return `${reportPart}-${coursePart}.pdf`;
}
