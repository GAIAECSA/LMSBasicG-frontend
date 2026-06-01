import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";
import type { LessonBlock } from "@/services/lessons.service";
import type { QuizzResponse } from "@/services/quizz-response.service";
import { API_URL } from "./constants";
import type {
    CourseWithImageFields,
    LessonBlockRoot,
    LessonBlockWithOptionalType,
    LessonItemType,
    StudentBlockResponse,
    SurveyQuestion,
    VideoPreview,
} from "./types";

export function sortByOrder<T extends { order?: number | null }>(items: T[]) {
    return [...items].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
}

export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function parseJsonSafe<T>(value: unknown, fallback: T): T {
    if (value && typeof value === "object") return value as T;
    if (typeof value !== "string" || !value.trim()) return fallback;
    try {
        return (JSON.parse(value) as T) ?? fallback;
    } catch {
        return fallback;
    }
}

export function normalizeList<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (Array.isArray(record.data)) return record.data as T[];
        if (Array.isArray(record.items)) return record.items as T[];
        if (Array.isArray(record.results)) return record.results as T[];
    }
    return [];
}

export function getBlockContent(block: LessonBlock | null | undefined): Record<string, unknown> {
    return block?.content && typeof block.content === "object"
        ? (block.content as Record<string, unknown>)
        : {};
}

export function getContentValue(content: Record<string, unknown> | null | undefined, key: string) {
    const value = content?.[key];
    return typeof value === "string" ? value : "";
}

export function getRootValue(block: LessonBlock | null | undefined, key: string) {
    if (!block) return "";
    const value = (block as LessonBlockRoot)[key];
    return typeof value === "string" ? value : "";
}

export function getContentNumber(content: Record<string, unknown> | null | undefined, key: string) {
    const value = content?.[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

export function normalizeResourceUrl(url: string) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    return url.startsWith("/") ? `${API_URL}${url}` : `${API_URL}/${url}`;
}

export function getStringFromUnknown(value: unknown) {
    return typeof value === "string" ? value : "";
}

function getNestedFileUrl(value: unknown) {
    if (!value || typeof value !== "object") return "";
    const record = value as Record<string, unknown>;
    return (
        getStringFromUnknown(record.url) ||
        getStringFromUnknown(record.src) ||
        getStringFromUnknown(record.source) ||
        getStringFromUnknown(record.file) ||
        getStringFromUnknown(record.file_url) ||
        getStringFromUnknown(record.path) ||
        getStringFromUnknown(record.file_path) ||
        getStringFromUnknown(record.image) ||
        getStringFromUnknown(record.image_url) ||
        getStringFromUnknown(record.thumbnail) ||
        getStringFromUnknown(record.pdf_url) ||
        getStringFromUnknown(record.document_url)
    );
}

export function getFileUrlFromBlock(block: LessonBlock | null) {
    if (!block) return "";
    const root = block as LessonBlockRoot;
    const content = getBlockContent(block);
    const directUrl =
        getContentValue(content, "file_url") ||
        getContentValue(content, "url") ||
        getContentValue(content, "src") ||
        getContentValue(content, "source") ||
        getContentValue(content, "image") ||
        getContentValue(content, "file") ||
        getContentValue(content, "path") ||
        getContentValue(content, "file_path") ||
        getContentValue(content, "image_url") ||
        getContentValue(content, "pdf_url") ||
        getContentValue(content, "document_url") ||
        getRootValue(block, "file_url") ||
        getRootValue(block, "url") ||
        getRootValue(block, "src") ||
        getRootValue(block, "source") ||
        getRootValue(block, "image") ||
        getRootValue(block, "file") ||
        getRootValue(block, "path") ||
        getRootValue(block, "file_path") ||
        getRootValue(block, "image_url") ||
        getRootValue(block, "pdf_url") ||
        getRootValue(block, "document_url");

    if (directUrl) return normalizeResourceUrl(directUrl);

    const nestedUrl =
        getNestedFileUrl(content.file) ||
        getNestedFileUrl(content.image) ||
        getNestedFileUrl(content.pdf) ||
        getNestedFileUrl(content.document) ||
        getNestedFileUrl(root.file) ||
        getNestedFileUrl(root.image) ||
        getNestedFileUrl(root.pdf) ||
        getNestedFileUrl(root.document);

    return nestedUrl ? normalizeResourceUrl(nestedUrl) : "";
}

export function getBlockTitle(block: LessonBlock) {
    const content = getBlockContent(block);
    return (
        getContentValue(content, "title") ||
        getContentValue(content, "name") ||
        getContentValue(content, "label") ||
        getRootValue(block, "title") ||
        getRootValue(block, "name") ||
        getRootValue(block, "label") ||
        `Bloque ${block.id}`
    );
}

export function getBlockDescription(block: LessonBlock | null) {
    if (!block) return "";
    const content = getBlockContent(block);
    return getContentValue(content, "description") || getContentValue(content, "descripcion") || getRootValue(block, "description") || getRootValue(block, "descripcion");
}

export function getLessonItemType(block: LessonBlock): LessonItemType {
    const content = getBlockContent(block);
    const optionalBlock = block as LessonBlockWithOptionalType;
    const contentType =
        getContentValue(content, "itemType").toLowerCase() ||
        getContentValue(content, "type").toLowerCase() ||
        getContentValue(content, "blockType").toLowerCase() ||
        getContentValue(content, "kind").toLowerCase();
    const key = optionalBlock.lesson_block_type?.key?.toLowerCase() ?? "";
    const typeText = `${contentType} ${key}`;
    const blockTypeId = getContentNumber(content, "block_type_id") ?? optionalBlock.block_type_id ?? optionalBlock.lesson_block_type?.id;

    if (typeText.includes("homework") || typeText.includes("tarea") || typeText.includes("assignment")) return "homework";
    if (typeText.includes("survey") || typeText.includes("encuesta") || typeText.includes("cuestionario")) return "survey";
    if (typeText.includes("forum") || typeText.includes("foro") || typeText.includes("discussion") || typeText.includes("discusion") || typeText.includes("discusión")) return "forum";
    if (blockTypeId === 1 || contentType.includes("video") || key.includes("video")) return "video";
    if (blockTypeId === 2 || contentType.includes("quiz") || contentType.includes("prueba") || contentType.includes("evaluacion") || key.includes("quiz") || key.includes("prueba") || key.includes("evaluacion")) return "quiz";
    if (blockTypeId === 3 || contentType.includes("homework") || contentType.includes("tarea") || key.includes("homework") || key.includes("tarea")) return "homework";
    if (blockTypeId === 6 || contentType.includes("survey") || contentType.includes("encuesta") || key.includes("survey") || key.includes("encuesta")) return "survey";
    if (blockTypeId === 7 || blockTypeId === 8 || contentType.includes("forum") || contentType.includes("foro") || key.includes("forum") || key.includes("foro")) return "forum";
    if (blockTypeId === 4 || contentType.includes("image") || contentType.includes("imagen") || contentType.includes("foto") || key.includes("image") || key.includes("imagen") || key.includes("foto")) return "image";
    if (blockTypeId === 5 || contentType.includes("pdf") || contentType.includes("document") || contentType.includes("documento") || key.includes("pdf") || key.includes("document") || key.includes("documento")) return "pdf";
    return "text";
}

export function getItemLabel(type: LessonItemType) {
    const labels: Record<LessonItemType, string> = {
        video: "Video",
        quiz: "Evaluación",
        homework: "Tarea",
        survey: "Encuesta",
        forum: "Foro",
        image: "Imagen",
        pdf: "PDF",
        text: "Texto",
    };
    return labels[type];
}

export function getVideoUrlFromBlock(block: LessonBlock | null) {
    if (!block) return "";
    const content = getBlockContent(block);
    const directUrl =
        getContentValue(content, "embed_url") ||
        getContentValue(content, "video_url") ||
        getContentValue(content, "microsoft365_url") ||
        getContentValue(content, "microsoft_365_url") ||
        getContentValue(content, "stream_url") ||
        getContentValue(content, "sharepoint_url") ||
        getContentValue(content, "onedrive_url") ||
        getContentValue(content, "url") ||
        getRootValue(block, "embed_url") ||
        getRootValue(block, "video_url") ||
        getRootValue(block, "microsoft365_url") ||
        getRootValue(block, "microsoft_365_url") ||
        getRootValue(block, "stream_url") ||
        getRootValue(block, "sharepoint_url") ||
        getRootValue(block, "onedrive_url") ||
        getRootValue(block, "url");
    return directUrl ? normalizeResourceUrl(directUrl) : "";
}

export function getVideoPreview(url: string): VideoPreview {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (!cleanUrl) return null;
    if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(cleanUrl)) return { type: "video", url: cleanUrl };
    try {
        const parsedUrl = new URL(cleanUrl);
        const hostname = parsedUrl.hostname.toLowerCase();
        const pathname = parsedUrl.pathname;
        if (hostname.includes("youtube.com")) {
            const videoId = parsedUrl.searchParams.get("v");
            if (videoId) return { type: "iframe", url: `https://www.youtube.com/embed/${videoId}` };
        }
        if (hostname.includes("youtu.be")) {
            const videoId = pathname.replace("/", "");
            if (videoId) return { type: "iframe", url: `https://www.youtube.com/embed/${videoId}` };
        }
        if (hostname.includes("web.microsoftstream.com") && !pathname.includes("/embed/video/")) {
            const parts = pathname.split("/").filter(Boolean);
            const videoIndex = parts.findIndex((part) => part === "video");
            const videoId = videoIndex >= 0 ? parts[videoIndex + 1] : "";
            if (videoId) return { type: "iframe", url: `${parsedUrl.origin}/embed/video/${videoId}` };
        }
        return { type: "iframe", url: cleanUrl };
    } catch {
        return null;
    }
}

export function getCourseImageUrl(course: CourseWithImageFields | null) {
    const imageUrl = course?.image_url || course?.course_image_url || course?.image || course?.thumbnail || "";
    return imageUrl ? normalizeResourceUrl(imageUrl) : "";
}

export function formatCourseLevel(value: unknown) {
    const cleanValue = String(value || "Principiante").trim();
    const normalizedValue = cleanValue.toUpperCase();
    if (normalizedValue === "PRINCIPIANTE") return "Principiante";
    if (normalizedValue === "INTERMEDIO") return "Intermedio";
    if (normalizedValue === "AVANZADO") return "Avanzado";
    return cleanValue ? cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1).toLowerCase() : "Principiante";
}

export function getCourseDurationLabel(course: Course | null) {
    const currentCourse = course as CourseWithImageFields | null;
    const durationHours = Number(currentCourse?.duration_hours ?? 0);
    if (Number.isFinite(durationHours) && durationHours > 0) return durationHours >= 40 ? `${Math.round(durationHours / 10)} semanas` : `${durationHours} horas`;
    return "4 semanas";
}

export function getCourseDescription(course: Course | null) {
    const description = typeof course?.description === "string" ? course.description.trim() : "";
    return description || "Avanza por los módulos, revisa contenidos, videos, imágenes, PDF y evaluaciones para completar tu proceso académico.";
}

export function getProtectedPdfViewerUrl(url: string) {
    return url ? `${url.split("#")[0]}#toolbar=0&navpanes=0&scrollbar=1&view=FitH` : "";
}

export function findApprovedEnrollment(enrollments: Enrollment[], courseId: number) {
    return enrollments.find((enrollment) => Number(enrollment.course?.id) === courseId && enrollment.accepted === true && Number(enrollment.role?.id) === 4) ?? enrollments.find((enrollment) => Number(enrollment.course?.id) === courseId && enrollment.accepted === true) ?? null;
}

export function getCertificateFileUrl(certificate: import("@/services/certificates.service").Certificate | null) {
    const currentCertificate = certificate as import("./types").CertificateWithFileFields | null;
    const fileUrl = currentCertificate?.pdf_url || currentCertificate?.file_url || currentCertificate?.certificate_url || currentCertificate?.url || currentCertificate?.path || "";
    return fileUrl ? normalizeResourceUrl(fileUrl) : "";
}

export function getCertificateVerifyUrl(certificate: import("@/services/certificates.service").Certificate | null) {
    return certificate?.certificate_code ? `/certificates/verify/${certificate.certificate_code}` : "";
}

export function getCertificateTargetUrl(certificate: import("@/services/certificates.service").Certificate | null) {
    return certificate ? getCertificateVerifyUrl(certificate) || getCertificateFileUrl(certificate) : "";
}

export function getUniqueNumbers(values: number[]) {
    return Array.from(new Set(values));
}

export function getQuizBlocks(blocks: LessonBlock[]) {
    return blocks.filter((block) => getLessonItemType(block) === "quiz");
}

export function getAverageQuizScore(responses: QuizzResponse[], blocks: LessonBlock[]) {
    const quizBlockIds = new Set(getQuizBlocks(blocks).map((block) => block.id));
    const scores = responses.filter((response) => quizBlockIds.has(Number(response.lesson_block_id))).map((response) => Number(response.score || 0));
    if (scores.length === 0) return 0;
    return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100;
}

export function getEnrollmentStudentName(enrollment: Enrollment | null) {
    const fullName = `${enrollment?.user?.firstname ?? ""} ${enrollment?.user?.lastname ?? ""}`.trim();
    return fullName || "Estudiante";
}

export function getResponseEnrollmentId(response: StudentBlockResponse) {
    return Number(response.enrollment_id ?? response.enrollmentId ?? response.enrollment?.id ?? 0);
}

export function responseBelongsToEnrollment(response: StudentBlockResponse, currentEnrollmentId: number) {
    const responseEnrollmentId = getResponseEnrollmentId(response);
    return responseEnrollmentId > 0 ? responseEnrollmentId === currentEnrollmentId : true;
}

export function getStudentResponseDate(response: StudentBlockResponse | null) {
    if (!response) return "Sin fecha";
    const rawDate = response.updated_at ?? response.created_at ?? "";
    if (!rawDate) return "Sin fecha";
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function getStudentResponsePayload(response: StudentBlockResponse | null) {
    return response ? parseJsonSafe<Record<string, unknown>>(response.response, {}) : {};
}

export function getStudentResponseText(response: unknown): string {
    const item = response as Record<string, unknown>;

    function parseJson(value: unknown): Record<string, unknown> {
        if (!value) return {};

        if (typeof value === "object" && !Array.isArray(value)) {
            return value as Record<string, unknown>;
        }

        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);

                if (
                    parsed &&
                    typeof parsed === "object" &&
                    !Array.isArray(parsed)
                ) {
                    return parsed as Record<string, unknown>;
                }

                return {};
            } catch {
                return {};
            }
        }

        return {};
    }

    const parsedResponse = parseJson(item.response);

    const possibleValues = [
        item.comment,
        parsedResponse.comment,

        item.response,
        parsedResponse.response,

        item.content,
        parsedResponse.content,

        item.message,
        parsedResponse.message,

        item.answer,
        parsedResponse.answer,

        item.text,
        parsedResponse.text,
    ];

    for (const value of possibleValues) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

export function getStudentResponseFileUrl(response: StudentBlockResponse | null) {
    if (!response) return "";
    const parsed = getStudentResponsePayload(response);
    const fileUrl = getStringFromUnknown(parsed.file_url) || getStringFromUnknown(parsed.fileUrl) || getStringFromUnknown(parsed.url) || getStringFromUnknown(response.file_url) || getStringFromUnknown(response.fileUrl);
    return fileUrl ? normalizeResourceUrl(fileUrl) : "";
}

export function getSurveyAnswersFromResponse(response: StudentBlockResponse | null) {
    if (!response) return {};
    const parsed = getStudentResponsePayload(response);
    const answers = parsed.answers ?? parsed.respuestas ?? parsed;
    return answers && typeof answers === "object" ? (answers as Record<string, string>) : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTextValue(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export function getForumAuthor(response: unknown): string {
    const item = isRecord(response) ? response : {};

    const enrollment = isRecord(item.enrollment) ? item.enrollment : {};
    const userFromEnrollment = isRecord(enrollment.user)
        ? enrollment.user
        : null;

    const studentFromEnrollment = isRecord(enrollment.student)
        ? enrollment.student
        : null;

    const directUser = isRecord(item.user) ? item.user : null;
    const directStudent = isRecord(item.student) ? item.student : null;

    const user =
        userFromEnrollment ??
        directUser ??
        directStudent ??
        studentFromEnrollment ??
        {};

    const firstname = getTextValue(user.firstname);
    const lastname = getTextValue(user.lastname);
    const fullName = `${firstname} ${lastname}`.trim();

    return (
        fullName ||
        getTextValue(user.name) ||
        getTextValue(user.email) ||
        getTextValue(item.student_name) ||
        getTextValue(item.user_name) ||
        "Estudiante"
    );
}

export function normalizeSurveyQuestions(value: unknown): SurveyQuestion[] {
    if (!Array.isArray(value)) return [];
    return value.map((question, index) => {
        const item = question && typeof question === "object" ? (question as Record<string, unknown>) : {};
        const rawOptions = Array.isArray(item.options) ? item.options : Array.isArray(item.opciones) ? item.opciones : [];
        const options = rawOptions.map((option) => (typeof option === "string" ? option : "")).filter(Boolean);
        const rawId = item.id ?? item.key ?? index + 1;
        return {
            id: String(rawId),
            question: getStringFromUnknown(item.question) || getStringFromUnknown(item.pregunta) || getStringFromUnknown(item.title) || `Pregunta ${index + 1}`,
            type: options.length > 0 ? "single" : "text",
            options,
            required: item.required !== false,
        };
    });
}
