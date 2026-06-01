import type { Enrollment } from "@/services/enrollments.service";
import type { LessonBlock } from "@/services/lessons.service";
import { ITEM_TYPE_LABELS } from "./constants";
import type { LessonReviewItemType, ReviewStatus, ReviewStudentRow } from "./types";

type AnyRecord = Record<string, unknown>;

const API_ORIGIN = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000"
)
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "");

export function getContentRecord(value: unknown): AnyRecord {
    if (!value) return {};

    if (typeof value === "object" && !Array.isArray(value)) {
        return value as AnyRecord;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as AnyRecord;
            }

            return {};
        } catch {
            return {};
        }
    }

    return {};
}

export function readString(value: unknown, fallback = "") {
    if (typeof value === "string") return value.trim();

    if (typeof value === "number") return String(value);

    return fallback;
}

export function readNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function normalizeUrl(value: unknown) {
    const url = readString(value);

    if (!url) return "";

    if (/^https?:\/\//i.test(url)) return url;

    if (url.startsWith("/")) {
        return `${API_ORIGIN}${url}`;
    }

    return `${API_ORIGIN}/${url}`;
}

export function formatDate(value?: string | null) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function getItemTypeFromBlock(block?: LessonBlock | null): LessonReviewItemType {
    if (!block) return "unknown";

    const key = block.lesson_block_type?.key?.toLowerCase();

    if (key) {
        if (key.includes("video")) return "video";
        if (key.includes("quiz") || key.includes("quizz") || key.includes("evaluacion")) return "quiz";
        if (key.includes("text")) return "text";
        if (key.includes("image") || key.includes("imagen")) return "image";
        if (key.includes("pdf")) return "pdf";
        if (key.includes("homework") || key.includes("tarea")) return "homework";
        if (key.includes("survey") || key.includes("encuesta")) return "survey";
        if (key.includes("forum") || key.includes("foro")) return "forum";
    }

    const blockTypeId = Number(block.block_type_id);

    if (blockTypeId === 1) return "video";
    if (blockTypeId === 2) return "quiz";
    if (blockTypeId === 3) return "text";
    if (blockTypeId === 4) return "image";
    if (blockTypeId === 5) return "pdf";
    if (blockTypeId === 6) return "homework";
    if (blockTypeId === 7) return "survey";
    if (blockTypeId === 8) return "forum";

    return "unknown";
}

export function getItemTypeLabel(itemType: LessonReviewItemType) {
    return ITEM_TYPE_LABELS[itemType] ?? "Ítem";
}

export function getBlockTitle(block?: LessonBlock | null) {
    const content = getContentRecord(block?.content);

    return (
        readString(content.title) ||
        readString(content.name) ||
        readString(content.question) ||
        readString(content.prompt) ||
        (block?.id ? `Bloque ${block.id}` : "Ítem")
    );
}

export function getBlockDescription(block?: LessonBlock | null) {
    const content = getContentRecord(block?.content);

    return (
        readString(content.description) ||
        readString(content.instructions) ||
        readString(content.quiz_instructions) ||
        readString(content.survey_instructions) ||
        readString(content.forum_prompt)
    );
}

export function getBlockFileUrl(block?: LessonBlock | null) {
    const content = getContentRecord(block?.content);

    return normalizeUrl(
        content.file_url ??
        content.fileUrl ??
        content.url ??
        content.src ??
        content.path ??
        content.pdf_url ??
        content.image_url,
    );
}

export function getBlockVideoUrl(block?: LessonBlock | null) {
    const content = getContentRecord(block?.content);

    return readString(content.video_url ?? content.videoUrl ?? content.url);
}

export function getStudentName(enrollment?: Enrollment | null) {
    const firstname = readString(enrollment?.user?.firstname);
    const lastname = readString(enrollment?.user?.lastname);
    const fullName = `${firstname} ${lastname}`.trim();

    return fullName || `Estudiante #${enrollment?.id ?? ""}`;
}

export function getResponseRecord(response: unknown): AnyRecord {
    return getContentRecord(response);
}

export function getResponseId(response: unknown) {
    const record = getResponseRecord(response);
    const id = Number(record.id);

    return Number.isFinite(id) ? id : null;
}

export function getResponseEnrollmentId(response: unknown) {
    const record = getResponseRecord(response);

    const directId = Number(record.enrollment_id ?? record.enrollmentId);

    if (Number.isFinite(directId) && directId > 0) return directId;

    const enrollment = getContentRecord(record.enrollment);
    const nestedId = Number(enrollment.id);

    if (Number.isFinite(nestedId) && nestedId > 0) return nestedId;

    return null;
}

export function getNestedStudentName(response: unknown) {
    const record = getResponseRecord(response);
    const enrollment = getContentRecord(record.enrollment);
    const user = getContentRecord(enrollment.user ?? record.user);

    const firstname = readString(user.firstname);
    const lastname = readString(user.lastname);
    const name = `${firstname} ${lastname}`.trim();

    return name;
}

function getResponseStatus(
    itemType: LessonReviewItemType,
    response: unknown,
): {
    status: ReviewStatus;
    label: string;
} {
    if (!response) {
        return {
            status: "sin_entrega",
            label: "Sin entrega",
        };
    }

    const record = getResponseRecord(response);
    const backendStatus = readString(record.status).toUpperCase();
    const score = record.score;

    if (backendStatus.includes("CALIFICADO") || score !== null && score !== undefined && score !== "") {
        return {
            status: "calificado",
            label: "Calificado",
        };
    }

    if (itemType === "quiz") {
        return {
            status: "revisado",
            label: "Respondido",
        };
    }

    if (itemType === "survey") {
        return {
            status: "revisado",
            label: "Respondido",
        };
    }

    if (itemType === "forum") {
        return {
            status: "revisado",
            label: "Participó",
        };
    }

    return {
        status: "entregado",
        label: backendStatus || "Entregado",
    };
}

export function buildStudentRows(args: {
    itemType: LessonReviewItemType;
    enrollments: Enrollment[];
    responses: unknown[];
}): ReviewStudentRow[] {
    const { itemType, enrollments, responses } = args;

    const responsesByEnrollment = new Map<number, unknown>();

    responses.forEach((response) => {
        const enrollmentId = getResponseEnrollmentId(response);

        if (enrollmentId) {
            responsesByEnrollment.set(enrollmentId, response);
        }
    });

    const rows: ReviewStudentRow[] = enrollments.map((enrollment) => {
        const response = responsesByEnrollment.get(enrollment.id);
        const record = getResponseRecord(response);
        const status = getResponseStatus(itemType, response);

        return {
            id: `enrollment-${enrollment.id}`,
            enrollmentId: enrollment.id,
            userId: enrollment.user?.id ?? null,
            studentName: getStudentName(enrollment),
            studentEmail: null,
            status: status.status,
            statusLabel: status.label,
            hasSubmission: Boolean(response),
            responseId: getResponseId(response),
            score: record.score as string | number | null | undefined,
            submittedAt: readString(record.created_at) || null,
            updatedAt: readString(record.updated_at) || null,
            fileUrl: normalizeUrl(
                record.submitted_file_url ??
                record.submittedFileUrl ??
                record.file_url ??
                record.fileUrl,
            ) || null,
            fileName:
                readString(record.submitted_filename) ||
                readString(record.filename) ||
                readString(record.file_name) ||
                null,
            comment:
                readString(record.comment) ||
                readString(record.message) ||
                readString(record.answer) ||
                null,
            raw: response,
        };
    });

    responses.forEach((response) => {
        const enrollmentId = getResponseEnrollmentId(response);

        if (enrollmentId && enrollments.some((enrollment) => enrollment.id === enrollmentId)) {
            return;
        }

        const record = getResponseRecord(response);
        const status = getResponseStatus(itemType, response);
        const fallbackEnrollmentId = enrollmentId ?? readNumber(record.id);

        rows.push({
            id: `response-${getResponseId(response) ?? Math.random()}`,
            enrollmentId: fallbackEnrollmentId,
            userId: null,
            studentName: getNestedStudentName(response) || `Estudiante #${fallbackEnrollmentId}`,
            studentEmail: null,
            status: status.status,
            statusLabel: status.label,
            hasSubmission: true,
            responseId: getResponseId(response),
            score: record.score as string | number | null | undefined,
            submittedAt: readString(record.created_at) || null,
            updatedAt: readString(record.updated_at) || null,
            fileUrl: normalizeUrl(record.submitted_file_url ?? record.file_url) || null,
            fileName: readString(record.submitted_filename) || null,
            comment: readString(record.comment) || null,
            raw: response,
        });
    });

    return rows;
}

export function parseJsonValue(value: unknown) {
    if (!value) return null;

    if (typeof value === "object") return value;

    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    return value;
}

export function stringifyPretty(value: unknown) {
    const parsed = parseJsonValue(value);

    if (parsed === null || parsed === undefined || parsed === "") {
        return "Sin información.";
    }

    if (typeof parsed === "string") return parsed;

    return JSON.stringify(parsed, null, 2);
}