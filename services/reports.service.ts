import {
    API_URL,
    getJsonHeaders,
} from "./api-client.service";

const REPORTS_ROOT = `${API_URL}/api/v1/reports`;
const REPORTS_ENDPOINT = `${REPORTS_ROOT}/reports`;

type JsonRecord = Record<string, unknown>;

export type CertificateType =
    | "MDT"
    | "INSTITUTIONAL";

export type CourseReportType =
    | "course_structure"
    | "degree_students"
    | "certificate_students"
    | "idnumber_students"
    | "payment_students"
    | "student_attendance"
    | "practice_lessons"
    | "final_grades"
    | "teacher_attendance"
    | "student_surveys"
    | "professor_surveys"
    | "practice_quizz"
    | "final_quizz"
    | "mdt_certificates";

export type CourseReportOption = {
    type: CourseReportType;
    label: string;
    description: string;
    fileNamePrefix: string;
    requiresCertificateType?: boolean;
};

export const COURSE_REPORT_OPTIONS: readonly CourseReportOption[] = [
    {
        type: "course_structure",
        label: "Estructura del curso",
        description:
            "Muestra la organización académica del curso, sus módulos y contenidos.",
        fileNamePrefix: "estructura-curso",
    },
    {
        type: "degree_students",
        label: "Titulación de estudiantes",
        description:
            "Genera el reporte de estudiantes registrados para titulación.",
        fileNamePrefix: "titulacion-estudiantes",
    },
    {
        type: "certificate_students",
        label: "Certificados de estudiantes",
        description:
            "Genera el listado de estudiantes relacionado con certificados.",
        fileNamePrefix: "certificados-estudiantes",
    },
    {
        type: "idnumber_students",
        label: "Identificación de estudiantes",
        description:
            "Muestra los datos de identificación de los estudiantes del curso.",
        fileNamePrefix: "identificacion-estudiantes",
    },
    {
        type: "payment_students",
        label: "Pagos de estudiantes",
        description:
            "Genera el reporte de pagos correspondientes a los estudiantes.",
        fileNamePrefix: "pagos-estudiantes",
    },
    {
        type: "student_attendance",
        label: "Asistencia de estudiantes",
        description:
            "Muestra la asistencia registrada de los estudiantes del curso.",
        fileNamePrefix: "asistencia-estudiantes",
    },
    {
        type: "practice_lessons",
        label: "Lecciones prácticas",
        description:
            "Genera el reporte de actividades y lecciones prácticas.",
        fileNamePrefix: "lecciones-practicas",
    },
    {
        type: "final_grades",
        label: "Calificaciones finales",
        description:
            "Muestra las calificaciones finales obtenidas por los estudiantes.",
        fileNamePrefix: "calificaciones-finales",
    },
    {
        type: "teacher_attendance",
        label: "Asistencia del docente",
        description:
            "Genera el reporte de asistencia correspondiente al docente.",
        fileNamePrefix: "asistencia-docente",
    },
    {
        type: "student_surveys",
        label: "Encuestas de estudiantes",
        description:
            "Descarga la matriz de respuestas registradas por los estudiantes en las encuestas del curso.",
        fileNamePrefix: "encuestas-estudiantes",
    },
    {
        type: "professor_surveys",
        label: "Encuestas de docentes",
        description:
            "Descarga la matriz de respuestas registradas por los profesores o docentes en las encuestas del curso.",
        fileNamePrefix: "encuestas-docentes",
    },
    {
        type: "practice_quizz",
        label: "Cuestionarios prácticos",
        description:
            "Genera el reporte de cuestionarios prácticos correspondientes al curso seleccionado.",
        fileNamePrefix: "cuestionarios-practicos",
    },
    {
        type: "final_quizz",
        label: "Cuestionarios finales",
        description:
            "Genera el reporte de cuestionarios finales correspondientes al curso seleccionado.",
        fileNamePrefix: "cuestionarios-finales",
    },
    {
        type: "mdt_certificates",
        label: "Certificados MDT e institucionales",
        description:
            "Genera el reporte de certificados filtrado por tipo: MDT o institucional.",
        fileNamePrefix: "certificados-mdt",
        requiresCertificateType: true,
    },
];

type ReportEndpointBuilder = (
    courseId: number,
    certificateType?: CertificateType,
) => string;

const REPORT_ENDPOINT_BUILDERS: Record<
    CourseReportType,
    ReportEndpointBuilder
> = {
    course_structure: (courseId) =>
        `${REPORTS_ENDPOINT}/courses/structure/pdf?course_id=${courseId}`,

    degree_students: (courseId) =>
        `${REPORTS_ENDPOINT}/degree/students/pdf?course_id=${courseId}`,

    certificate_students: (courseId) =>
        `${REPORTS_ENDPOINT}/certificate/students/pdf?course_id=${courseId}`,

    idnumber_students: (courseId) =>
        `${REPORTS_ENDPOINT}/idnumber/students/pdf?course_id=${courseId}`,

    payment_students: (courseId) =>
        `${REPORTS_ENDPOINT}/payment/students/pdf?course_id=${courseId}`,

    student_attendance: (courseId) =>
        `${REPORTS_ENDPOINT}/courses/${courseId}/attendance/students/pdf`,

    practice_lessons: (courseId) =>
        `${REPORTS_ENDPOINT}/practice/lessons/pdf?course_id=${courseId}`,

    final_grades: (courseId) =>
        `${REPORTS_ENDPOINT}/final/grades/pdf?course_id=${courseId}`,

    teacher_attendance: (courseId) =>
        `${REPORTS_ENDPOINT}/teacher/attendance/pdf?course_id=${courseId}`,

    student_surveys: (courseId) =>
        `${REPORTS_ROOT}/survey/students?course_id=${courseId}`,

    professor_surveys: (courseId) =>
        `${REPORTS_ROOT}/survey/professors?course_id=${courseId}`,

    practice_quizz: (courseId) =>
        `${REPORTS_ENDPOINT}/practice/quizz/pdf?course_id=${courseId}`,

    final_quizz: (courseId) =>
        `${REPORTS_ENDPOINT}/final/quizz/pdf?course_id=${courseId}`,

    mdt_certificates: (
        courseId,
        certificateType = "MDT",
    ) =>
        `${REPORTS_ROOT}/mdt-certificates?course_id=${courseId}&certificate_type=${certificateType}`,
};

const FILE_REFERENCE_KEYS = [
    "url",
    "file_url",
    "fileUrl",
    "download_url",
    "downloadUrl",
    "pdf_url",
    "pdfUrl",
    "path",
    "file",
    "base64",
    "content",
    "pdf",
] as const;

const NESTED_RESPONSE_KEYS = [
    "data",
    "result",
    "report",
    "document",
] as const;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null;
}

function validateCourseId(courseId: number): void {
    if (!Number.isInteger(courseId) || courseId <= 0) {
        throw new Error("El identificador del curso no es válido.");
    }
}

function createRequestHeaders(): Headers {
    const headers = new Headers(getJsonHeaders());

    headers.set(
        "Accept",
        "application/pdf, application/octet-stream, application/json",
    );

    return headers;
}

function extractErrorMessage(payload: unknown): string {
    if (typeof payload === "string" && payload.trim()) {
        return payload.trim();
    }

    if (!isRecord(payload)) {
        return "No se pudo generar el reporte solicitado.";
    }

    if (
        typeof payload.message === "string" &&
        payload.message.trim()
    ) {
        return payload.message.trim();
    }

    if (
        typeof payload.detail === "string" &&
        payload.detail.trim()
    ) {
        return payload.detail.trim();
    }

    if (Array.isArray(payload.detail)) {
        const messages = payload.detail
            .map((item) => {
                if (!isRecord(item)) {
                    return "";
                }

                return typeof item.msg === "string"
                    ? item.msg.trim()
                    : "";
            })
            .filter(Boolean);

        if (messages.length > 0) {
            return messages.join(". ");
        }
    }

    return "No se pudo generar el reporte solicitado.";
}

async function getResponseError(
    response: Response,
): Promise<string> {
    const rawText = await response.text();

    if (!rawText.trim()) {
        return `Error ${response.status}: no se pudo generar el reporte.`;
    }

    try {
        return extractErrorMessage(
            JSON.parse(rawText) as unknown,
        );
    } catch {
        return extractErrorMessage(rawText);
    }
}

function extractFileReference(
    payload: unknown,
): string | null {
    if (typeof payload === "string") {
        return payload.trim() || null;
    }

    if (!isRecord(payload)) {
        return null;
    }

    for (const key of FILE_REFERENCE_KEYS) {
        const value = payload[key];

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value.trim();
        }
    }

    for (const key of NESTED_RESPONSE_KEYS) {
        const nestedReference =
            extractFileReference(payload[key]);

        if (nestedReference) {
            return nestedReference;
        }
    }

    return null;
}

function normalizeFileUrl(
    fileReference: string,
): string {
    if (/^(https?:\/\/|blob:)/i.test(fileReference)) {
        return fileReference;
    }

    const baseUrl = API_URL.endsWith("/")
        ? API_URL
        : `${API_URL}/`;

    return new URL(fileReference, baseUrl).toString();
}

function isPdfDataUrl(value: string): boolean {
    return /^data:application\/pdf;base64,/i.test(value);
}

function looksLikeBase64(value: string): boolean {
    const sanitized = value.replace(/\s/g, "");

    return (
        sanitized.length > 100 &&
        sanitized.length % 4 === 0 &&
        /^[A-Za-z0-9+/]+={0,2}$/.test(sanitized)
    );
}

function base64ToPdfBlob(value: string): Blob {
    const cleanValue = value.includes(",")
        ? value.substring(value.indexOf(",") + 1)
        : value;

    const sanitizedValue = cleanValue.replace(/\s/g, "");
    const decodedValue = window.atob(sanitizedValue);
    const bytes = new Uint8Array(decodedValue.length);

    for (
        let index = 0;
        index < decodedValue.length;
        index += 1
    ) {
        bytes[index] = decodedValue.charCodeAt(index);
    }

    return new Blob([bytes], {
        type: "application/pdf",
    });
}

function normalizePdfBlob(blob: Blob): Blob {
    if (blob.type === "application/pdf") {
        return blob;
    }

    return blob.slice(
        0,
        blob.size,
        "application/pdf",
    );
}

async function fetchPdfFromReference(
    fileReference: string,
    depth = 0,
): Promise<Blob> {
    if (depth > 2) {
        throw new Error(
            "No se pudo recuperar el archivo PDF enviado por el servidor.",
        );
    }

    const response = await fetch(
        normalizeFileUrl(fileReference),
        {
            method: "GET",
            headers: createRequestHeaders(),
            cache: "no-store",
        },
    );

    if (!response.ok) {
        throw new Error(
            await getResponseError(response),
        );
    }

    return readPdfBlobFromResponse(
        response,
        depth,
    );
}

async function readPdfBlobFromResponse(
    response: Response,
    depth = 0,
): Promise<Blob> {
    const contentType =
        response.headers
            .get("content-type")
            ?.toLowerCase() ?? "";

    if (
        contentType.includes("application/pdf") ||
        contentType.includes(
            "application/octet-stream",
        )
    ) {
        return normalizePdfBlob(
            await response.blob(),
        );
    }

    const clonedResponse = response.clone();
    const rawText = await response.text();

    if (rawText.trimStart().startsWith("%PDF-")) {
        return normalizePdfBlob(
            await clonedResponse.blob(),
        );
    }

    let payload: unknown = rawText;

    try {
        payload = JSON.parse(rawText) as unknown;
    } catch {
        payload = rawText;
    }

    const fileReference =
        extractFileReference(payload);

    if (!fileReference) {
        throw new Error(
            "El servidor respondió correctamente, pero no devolvió el archivo PDF.",
        );
    }

    if (
        isPdfDataUrl(fileReference) ||
        looksLikeBase64(fileReference)
    ) {
        return base64ToPdfBlob(fileReference);
    }

    return fetchPdfFromReference(
        fileReference,
        depth + 1,
    );
}

function sanitizeFileName(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
}

export function getCourseReportOption(
    reportType: CourseReportType,
): CourseReportOption {
    const option = COURSE_REPORT_OPTIONS.find(
        (item) => item.type === reportType,
    );

    if (!option) {
        throw new Error(
            "El tipo de reporte seleccionado no es válido.",
        );
    }

    return option;
}

export async function getCourseReportPdfBlob(
    reportType: CourseReportType,
    courseId: number,
    certificateType: CertificateType = "MDT",
): Promise<Blob> {
    validateCourseId(courseId);

    const endpointBuilder =
        REPORT_ENDPOINT_BUILDERS[reportType];

    if (!endpointBuilder) {
        throw new Error(
            "El tipo de reporte seleccionado no es válido.",
        );
    }

    const response = await fetch(
        endpointBuilder(
            courseId,
            certificateType,
        ),
        {
            method: "GET",
            headers: createRequestHeaders(),
            cache: "no-store",
        },
    );

    if (!response.ok) {
        throw new Error(
            await getResponseError(response),
        );
    }

    return readPdfBlobFromResponse(response);
}

export function downloadPdfBlob(
    blob: Blob,
    fileName: string,
): void {
    const objectUrl =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 1000);
}

export async function downloadCourseReportPdf(
    reportType: CourseReportType,
    courseId: number,
    courseName?: string,
    certificateType: CertificateType = "MDT",
): Promise<void> {
    const option =
        getCourseReportOption(reportType);

    const pdfBlob =
        await getCourseReportPdfBlob(
            reportType,
            courseId,
            certificateType,
        );

    const courseSuffix = courseName
        ? sanitizeFileName(courseName)
        : `curso-${courseId}`;

    const certificateSuffix =
        reportType === "mdt_certificates"
            ? `-${certificateType.toLowerCase()}`
            : "";

    downloadPdfBlob(
        pdfBlob,
        `${option.fileNamePrefix}${certificateSuffix}-${courseSuffix}.pdf`,
    );
}

/*
 * Compatibilidad con la integración inicial.
 * Estas funciones pueden conservarse para evitar errores
 * en componentes que todavía utilicen el reporte original.
 */
export async function getCourseStructurePdfBlob(
    courseId: number,
): Promise<Blob> {
    return getCourseReportPdfBlob(
        "course_structure",
        courseId,
    );
}

export async function downloadCourseStructurePdf(
    courseId: number,
): Promise<void> {
    return downloadCourseReportPdf(
        "course_structure",
        courseId,
    );
}