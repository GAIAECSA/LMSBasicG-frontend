import type { Certificate } from "@/services/certificates.service";
import type { LessonBlock } from "@/services/lessons.service";
import type {
    EnrollmentGroup,
    GradeResponse,
    GradeRow,
    LessonBlockWithType,
    QuizQuestionView,
} from "./types";

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

export function getCourseIdFromPathname(pathname: string) {
    const teacherMatch = pathname.match(/^\/teacher\/courses\/([^/]+)\/grades/);
    const adminMatch = pathname.match(/^\/admin\/courses\/([^/]+)\/grades/);

    return teacherMatch?.[1] ?? adminMatch?.[1] ?? "";
}

export function sortByOrder<T extends { order: number }>(items: T[]) {
    return [...items].sort((a, b) => a.order - b.order);
}

export function parseJsonSafe<T>(value: unknown, fallback: T): T {
    if (value && typeof value === "object") return value as T;

    if (typeof value !== "string" || !value.trim()) return fallback;

    try {
        const parsedValue = JSON.parse(value) as T;

        return parsedValue ?? fallback;
    } catch {
        return fallback;
    }
}

export function formatDate(value?: string | null) {
    if (!value) return "Sin fecha";

    try {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat("es-EC", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    } catch {
        return value;
    }
}

export function getContentString(
    content: Record<string, unknown> | null | undefined,
    key: string,
) {
    const value = content?.[key];

    return typeof value === "string" ? value : "";
}

export function getContentNumber(
    content: Record<string, unknown> | null | undefined,
    key: string,
) {
    const value = content?.[key];

    if (typeof value === "number") return value;

    if (typeof value === "string") {
        const parsedValue = Number(value);

        if (Number.isFinite(parsedValue)) return parsedValue;
    }

    return null;
}

export function getStudentName(response: GradeResponse) {
    const user = response.enrollment?.user ?? response.user;
    const firstname = user?.firstname ?? "";
    const lastname = user?.lastname ?? "";
    const fullName = `${firstname} ${lastname}`.trim();

    return (
        fullName ||
        user?.email ||
        `Estudiante #${response.enrollment?.user?.id ?? response.user_id ?? ""}`
    );
}

export function getEnrollmentId(response: GradeResponse) {
    return Number(
        response.enrollment?.id ??
        response.enrollment_id ??
        response.enrollmentId ??
        0,
    );
}

export function getUserId(response: GradeResponse) {
    return Number(
        response.enrollment?.user?.id ??
        response.user?.id ??
        response.user_id ??
        response.userId ??
        0,
    );
}

export function getBlockTitleFromBlock(block: LessonBlock, fallback: string) {
    const content = (block.content ?? {}) as Record<string, unknown>;

    return (
        getContentString(content, "title") ||
        getContentString(content, "name") ||
        getContentString(content, "label") ||
        fallback
    );
}

export function getQuizTitleFromBlock(block: LessonBlock) {
    return getBlockTitleFromBlock(block, `Prueba #${block.id}`);
}

export function getHomeworkTitleFromBlock(block: LessonBlock) {
    return getBlockTitleFromBlock(block, `Tarea #${block.id}`);
}

export function getQuizTitleFromResponse(response: GradeResponse) {
    const parsedQuiz = parseJsonSafe<Record<string, unknown>>(
        response.quizz,
        {},
    );

    const title = parsedQuiz.title;
    const name = parsedQuiz.name;

    if (typeof title === "string" && title.trim()) return title;
    if (typeof name === "string" && name.trim()) return name;

    return `Prueba #${response.lesson_block_id ?? response.lessonBlockId}`;
}

export function getActivityTitle(row: GradeRow) {
    if (row.kind === "quiz") {
        return (
            getQuizTitleFromBlock(row.blockInfo.block) ||
            getQuizTitleFromResponse(row.response)
        );
    }

    return getHomeworkTitleFromBlock(row.blockInfo.block);
}

export function isQuizBlock(block: LessonBlock) {
    const content = (block.content ?? {}) as Record<string, unknown>;
    const typedBlock = block as LessonBlockWithType;

    const type =
        getContentString(content, "type").toLowerCase() ||
        getContentString(content, "itemType").toLowerCase() ||
        getContentString(content, "blockType").toLowerCase();

    const blockTypeId =
        getContentNumber(content, "block_type_id") ??
        typedBlock.block_type_id ??
        typedBlock.lesson_block_type?.id;

    const key = typedBlock.lesson_block_type?.key?.toLowerCase() ?? "";

    return (
        blockTypeId === 2 ||
        type.includes("quiz") ||
        type.includes("prueba") ||
        type.includes("evaluacion") ||
        type.includes("evaluación") ||
        key.includes("quiz") ||
        key.includes("prueba") ||
        key.includes("evaluacion") ||
        key.includes("evaluación")
    );
}

export function isHomeworkBlock(block: LessonBlock) {
    const content = (block.content ?? {}) as Record<string, unknown>;
    const typedBlock = block as LessonBlockWithType;

    const type =
        getContentString(content, "type").toLowerCase() ||
        getContentString(content, "itemType").toLowerCase() ||
        getContentString(content, "blockType").toLowerCase();

    const blockTypeId =
        getContentNumber(content, "block_type_id") ??
        typedBlock.block_type_id ??
        typedBlock.lesson_block_type?.id;

    const key = typedBlock.lesson_block_type?.key?.toLowerCase() ?? "";

    return (
        blockTypeId === 6 ||
        type.includes("homework") ||
        type.includes("tarea") ||
        type.includes("assignment") ||
        key.includes("homework") ||
        key.includes("tarea") ||
        key.includes("assignment")
    );
}

export function getQuizQuestionsFromBlock(
    block: LessonBlock,
): QuizQuestionView[] {
    const content = (block.content ?? {}) as Record<string, unknown>;
    const questions = content.questions;

    if (!Array.isArray(questions)) return [];

    return questions.map((question, index) => {
        const item = question as Partial<QuizQuestionView>;

        return {
            id: typeof item.id === "number" ? item.id : index + 1,
            question:
                typeof item.question === "string"
                    ? item.question
                    : `Pregunta ${index + 1}`,
            options: Array.isArray(item.options)
                ? item.options.filter(
                    (option): option is string =>
                        typeof option === "string",
                )
                : [],
            correct_answer:
                typeof item.correct_answer === "number"
                    ? item.correct_answer
                    : 0,
            points: typeof item.points === "number" ? item.points : 1,
        };
    });
}

export function getQuizQuestionsFromResponse(
    response: GradeResponse,
): QuizQuestionView[] {
    const parsedQuiz = parseJsonSafe<Record<string, unknown>>(
        response.quizz,
        {},
    );

    const questions = parsedQuiz.questions;

    if (!Array.isArray(questions)) return [];

    return questions.map((question, index) => {
        const item = question as Partial<QuizQuestionView>;

        return {
            id: typeof item.id === "number" ? item.id : index + 1,
            question:
                typeof item.question === "string"
                    ? item.question
                    : `Pregunta ${index + 1}`,
            options: Array.isArray(item.options)
                ? item.options.filter(
                    (option): option is string =>
                        typeof option === "string",
                )
                : [],
            correct_answer:
                typeof item.correct_answer === "number"
                    ? item.correct_answer
                    : 0,
            points: typeof item.points === "number" ? item.points : 1,
        };
    });
}

export function getQuizQuestions(row: GradeRow) {
    const questionsFromBlock = getQuizQuestionsFromBlock(row.blockInfo.block);

    if (questionsFromBlock.length > 0) return questionsFromBlock;

    return getQuizQuestionsFromResponse(row.response);
}

export function getParsedAnswers(response: GradeResponse) {
    const parsedResponse = parseJsonSafe<Record<string, unknown>>(
        response.response,
        {},
    );

    const answers = parsedResponse.answers;

    if (!answers || typeof answers !== "object") return {};

    return answers as Record<string, unknown>;
}

export function getAnswerValue(
    answers: Record<string, unknown>,
    questionId: number,
) {
    const rawValue = answers[String(questionId)];

    if (typeof rawValue === "number") return rawValue;

    if (typeof rawValue === "string") {
        const parsedValue = Number(rawValue);

        if (Number.isFinite(parsedValue)) return parsedValue;
    }

    return null;
}

export function getResponseText(response: GradeResponse) {
    const parsed = parseJsonSafe<Record<string, unknown>>(
        response.response,
        {},
    );

    const possibleValues = [
        parsed.answer,
        parsed.text,
        parsed.content,
        parsed.message,
        parsed.description,
        response.answer,
        response.content,
        response.message,
        typeof response.response === "string" ? response.response : "",
    ];

    for (const value of possibleValues) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }

    return "Sin respuesta textual.";
}

export function getResponseFileUrl(response: GradeResponse) {
    const parsed = parseJsonSafe<Record<string, unknown>>(
        response.response,
        {},
    );

    const values = [
        parsed.file_url,
        parsed.fileUrl,
        parsed.url,
        parsed.path,
        response.file_url,
    ];

    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }

    return "";
}

export function getMaxScore(questions: QuizQuestionView[]) {
    return questions.reduce(
        (total, question) => total + Number(question.points || 0),
        0,
    );
}

export function getScore(row: GradeRow) {
    const score = Number(row.response.score ?? row.response.grade ?? 0);

    return Number.isFinite(score) ? score : 0;
}

export function getMinimumScore(row: GradeRow) {
    const blockMinimum = Number(row.blockInfo.block.completion_value || 0);

    if (Number.isFinite(blockMinimum) && blockMinimum > 0) return blockMinimum;

    const parsedResponse = parseJsonSafe<Record<string, unknown>>(
        row.response.response,
        {},
    );

    const minimumFromResponse = parsedResponse.minimum_score;

    if (typeof minimumFromResponse === "number") return minimumFromResponse;

    if (typeof minimumFromResponse === "string") {
        const parsedValue = Number(minimumFromResponse);

        if (Number.isFinite(parsedValue)) return parsedValue;
    }

    return 0;
}

export function getCalculatedPassed(row: GradeRow) {
    const minimumScore = getMinimumScore(row);

    if (minimumScore <= 0 && typeof row.response.is_passed === "boolean") {
        return row.response.is_passed;
    }

    if (minimumScore <= 0) return Boolean(row.response.is_passed);

    return getScore(row) >= minimumScore;
}

export function getGroupAverage(rows: GradeRow[]) {
    if (rows.length === 0) return 0;

    const total = rows.reduce((sum, row) => sum + getScore(row), 0);

    return Math.round((total / rows.length) * 100) / 100;
}

export function getCertificateFinalGrade(certificate: Certificate | null) {
    const finalGrade = certificate?.final_grade?.trim();

    return finalGrade || "";
}

export function getCertificateFinalGradeLabel(certificate: Certificate | null) {
    return getCertificateFinalGrade(certificate) || "Pendiente";
}

export function isValidGroupForCertificate(group: EnrollmentGroup) {
    return group.rows.length > 0 && group.failedCount === 0;
}

export function getCertificateVerifyHref(certificate: Certificate | null) {
    if (!certificate?.certificate_code) return "";

    return `/certificates/verify/${encodeURIComponent(
        certificate.certificate_code,
    )}`;
}

export function openCertificateByRoute(certificate: Certificate | null) {
    const certificateHref = getCertificateVerifyHref(certificate);

    if (!certificateHref) return false;

    window.open(certificateHref, "_blank", "noopener,noreferrer");

    return true;
}

export function normalizeResponseToString(
    value: string | Record<string, unknown> | null | undefined,
) {
    if (typeof value === "string") return value;

    if (value && typeof value === "object") {
        return JSON.stringify(value);
    }

    return "";
}