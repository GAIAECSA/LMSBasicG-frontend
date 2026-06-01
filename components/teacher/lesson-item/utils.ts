import type { LessonBlock } from "@/services/lessons.service";
import {
    API_URL,
    BLOCK_TYPE_IDS,
    DEFAULT_COMPLETION_TYPE,
    DEFAULT_COMPLETION_VALUE,
} from "./constants";
import type {
    ActivityResponse,
    FormState,
    LessonBlockPayloadWithFile,
    LessonBlockWithOptionalType,
    LessonItemType,
    QuizQuestion,
    SurveyQuestion,
} from "./types";

type AnyRecord = Record<string, unknown>;

const BLOCK_TYPE_FALLBACK: Record<string, number> = {
    video: 1,
    quiz: 2,
    text: 3,
    image: 4,
    pdf: 5,
    homework: 6,
    survey: 7,
    forum: 8,
};

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

export function parseJsonObject(value: unknown): AnyRecord {
    if (!value) return {};

    if (typeof value === "object" && !Array.isArray(value)) {
        return value as AnyRecord;
    }

    if (typeof value !== "string" || !value.trim()) return {};

    try {
        const parsed = JSON.parse(value) as unknown;

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as AnyRecord;
        }

        return {};
    } catch {
        return {};
    }
}

function getFormRecord(form: FormState): AnyRecord {
    return form as unknown as AnyRecord;
}

function getBlockRecord(block: LessonBlock | null | undefined): AnyRecord {
    return (block ?? {}) as unknown as AnyRecord;
}

function getSafeText(value: unknown, fallback = "") {
    if (value === undefined || value === null) return fallback;

    return String(value);
}

function getSafeTrimText(value: unknown, fallback = "") {
    const text = getSafeText(value, fallback).trim();

    return text || fallback;
}

function getSafeNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getSafeBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") return value;

    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}


function getBlockTypeConstant(key: string, fallback: number) {
    const constants = BLOCK_TYPE_IDS as unknown as Record<string, unknown>;

    const possibleKeys = [
        key,
        key.toUpperCase(),
        key.toLowerCase(),
        key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
    ];

    for (const possibleKey of possibleKeys) {
        const value = constants[possibleKey];

        if (typeof value === "number") return value;

        const numericValue = Number(value);

        if (Number.isFinite(numericValue)) return numericValue;
    }

    return fallback;
}

function normalizeText(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizeOptions(value: unknown): string[] {
    const options = Array.isArray(value)
        ? value.map((option) => getSafeText(option).trim())
        : [];

    const paddedOptions = [...options];

    while (paddedOptions.length < 4) {
        paddedOptions.push("");
    }

    return paddedOptions.slice(0, 4);
}

function getPossibleContentTitle(content: AnyRecord, fallback: string) {
    return (
        getContentValue(content, "title") ||
        getContentValue(content, "name") ||
        getContentValue(content, "label") ||
        getContentValue(content, "description") ||
        fallback
    );
}

export function getActivityResponseStudent(response: ActivityResponse) {
    const user = response.enrollment?.user ?? response.user;
    const fullName = `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim();

    return (
        fullName ||
        user?.email ||
        `Usuario #${response.user_id ?? response.enrollment?.id ?? "N/D"}`
    );
}

export function getActivityResponseText(response: ActivityResponse) {
    const parsed = parseJsonObject(response.response);

    const possibleValues = [
        parsed.answer,
        parsed.text,
        parsed.content,
        parsed.message,
        response.answer,
        response.content,
        response.message,
        typeof response.response === "string" ? response.response : "",
    ];

    for (const value of possibleValues) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    const answers = parsed.answers ?? parsed.respuestas;

    if (answers && typeof answers === "object" && !Array.isArray(answers)) {
        return Object.entries(answers as AnyRecord)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join("\n");
    }

    return "Sin contenido.";
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

export function getContentValue(content: unknown, key: string) {
    const contentRecord = parseJsonObject(content);
    const value = contentRecord[key];

    if (typeof value === "string") return value;

    if (typeof value === "number") return String(value);

    return "";
}

export function getContentNumber(content: unknown, key: string) {
    const contentRecord = parseJsonObject(content);
    const value = contentRecord[key];

    if (typeof value === "number") return value;

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) return numericValue;

    return null;
}

export function getBooleanContentValue(
    content: unknown,
    key: string,
    fallback: boolean,
) {
    const contentRecord = parseJsonObject(content);

    return getSafeBoolean(contentRecord[key], fallback);
}

export function normalizeUrl(url: string) {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

export function getExistingFileUrl(content: unknown) {
    return (
        getContentValue(content, "file_url") ||
        getContentValue(content, "url") ||
        getContentValue(content, "path") ||
        getContentValue(content, "file_path")
    );
}

export function getBlockTypeId(block: LessonBlock | null | undefined) {
    if (!block) return 0;

    const content = parseJsonObject(block.content);
    const optionalBlock = block as LessonBlockWithOptionalType;

    const contentBlockTypeId = getContentNumber(content, "block_type_id");

    if (typeof contentBlockTypeId === "number") {
        return contentBlockTypeId;
    }

    if (typeof optionalBlock.block_type_id === "number") {
        return optionalBlock.block_type_id;
    }

    if (typeof optionalBlock.lesson_block_type?.id === "number") {
        return optionalBlock.lesson_block_type.id;
    }

    return 0;
}

export function getItemType(
    block: LessonBlock | null | undefined,
): LessonItemType {
    if (!block) return "text" as LessonItemType;

    const content = parseJsonObject(block.content);
    const blockTypeId = getBlockTypeId(block);

    const contentType = normalizeText(
        content.itemType ??
        content.type ??
        content.blockType ??
        content.content_type ??
        "",
    );

    const blockKey = normalizeText(block.lesson_block_type?.key);

    const key = contentType || blockKey;

    const videoId = getBlockTypeConstant("video", BLOCK_TYPE_FALLBACK.video);
    const quizId = getBlockTypeConstant("quiz", BLOCK_TYPE_FALLBACK.quiz);
    const textId = getBlockTypeConstant("text", BLOCK_TYPE_FALLBACK.text);
    const imageId = getBlockTypeConstant("image", BLOCK_TYPE_FALLBACK.image);
    const pdfId = getBlockTypeConstant("pdf", BLOCK_TYPE_FALLBACK.pdf);
    const homeworkId = getBlockTypeConstant(
        "homework",
        BLOCK_TYPE_FALLBACK.homework,
    );
    const surveyId = getBlockTypeConstant("survey", BLOCK_TYPE_FALLBACK.survey);
    const forumId = getBlockTypeConstant("forum", BLOCK_TYPE_FALLBACK.forum);

    if (blockTypeId === videoId || key.includes("video")) {
        return "video" as LessonItemType;
    }

    if (
        blockTypeId === quizId ||
        key.includes("quiz") ||
        key.includes("evaluacion") ||
        key.includes("prueba")
    ) {
        return "quiz" as LessonItemType;
    }

    if (blockTypeId === textId || key.includes("text") || key.includes("texto")) {
        return "text" as LessonItemType;
    }

    if (
        blockTypeId === imageId ||
        key.includes("image") ||
        key.includes("imagen")
    ) {
        return "image" as LessonItemType;
    }

    if (
        blockTypeId === pdfId ||
        key.includes("pdf") ||
        key.includes("document")
    ) {
        return "pdf" as LessonItemType;
    }

    if (
        blockTypeId === homeworkId ||
        key.includes("homework") ||
        key.includes("tarea")
    ) {
        return "homework" as LessonItemType;
    }

    if (
        blockTypeId === surveyId ||
        key.includes("survey") ||
        key.includes("encuesta")
    ) {
        return "survey" as LessonItemType;
    }

    if (
        blockTypeId === forumId ||
        key.includes("forum") ||
        key.includes("foro")
    ) {
        return "forum" as LessonItemType;
    }

    return "text" as LessonItemType;
}

export function getItemTypeLabel(itemType: LessonItemType) {
    const labels: Record<string, string> = {
        text: "Texto",
        video: "Video",
        image: "Imagen",
        pdf: "PDF",
        quiz: "Evaluación",
        homework: "Tarea",
        survey: "Encuesta",
        forum: "Foro",
    };

    return labels[String(itemType)] ?? "Contenido";
}

export function createQuestion(id: number): QuizQuestion {
    return {
        id,
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
        points: 0,
    } as QuizQuestion;
}

export function createSurveyQuestion(id: number): SurveyQuestion {
    return {
        id,
        question: "",
        type: "text",
        options: [],
        required: true,
    } as SurveyQuestion;
}

function normalizeQuizQuestions(value: unknown): QuizQuestion[] {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
        const questionRecord = parseJsonObject(item);

        const options = normalizeOptions(questionRecord.options);

        const rawCorrectAnswer =
            questionRecord.correct_answer ?? questionRecord.correctAnswer ?? 0;

        const correctAnswer = Math.trunc(getSafeNumber(rawCorrectAnswer, 0));

        const safeCorrectAnswer =
            correctAnswer >= 0 && correctAnswer < options.length
                ? correctAnswer
                : 0;

        return {
            id: Math.trunc(getSafeNumber(questionRecord.id, index + 1)),
            question: getSafeText(
                questionRecord.question ?? questionRecord.text,
            ),
            options,
            correct_answer: safeCorrectAnswer,
            points: getSafeNumber(questionRecord.points, 0),
        } as QuizQuestion;
    });
}

function normalizeSurveyQuestions(value: unknown): SurveyQuestion[] {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
        const questionRecord = parseJsonObject(item);

        const type = getSafeText(questionRecord.type, "text");
        const normalizedType =
            type === "single" || type === "multiple" || type === "text"
                ? type
                : "text";

        return {
            id: Math.trunc(getSafeNumber(questionRecord.id, index + 1)),
            question: getSafeText(
                questionRecord.question ?? questionRecord.text,
            ),
            type: normalizedType,
            options: Array.isArray(questionRecord.options)
                ? questionRecord.options.map((option) =>
                    getSafeText(option).trim(),
                )
                : [],
            required: getSafeBoolean(questionRecord.required, true),
        } as SurveyQuestion;
    });
}

function getDefaultCompletionValue(itemType: LessonItemType): number {
    const values = DEFAULT_COMPLETION_VALUE as unknown as Partial<
        Record<LessonItemType, number>
    >;

    return values[itemType] ?? 0;
}

function getDefaultCompletionType(itemType: LessonItemType): string {
    const values = DEFAULT_COMPLETION_TYPE as unknown as Partial<
        Record<LessonItemType, string>
    >;

    return values[itemType] ?? "VER";
}

export function getFormFromBlock(block: LessonBlock): FormState {
    const content = parseJsonObject(block.content);
    const itemType = getItemType(block);

    const title = getPossibleContentTitle(content, `Bloque ${block.id}`);

    const contentQuestions =
        content.questions ?? content.quiz_questions ?? content.quizQuestions;

    const surveyQuestions =
        content.survey_questions ??
        content.questions ??
        content.surveyQuestions ??
        [];

    const description =
        getContentValue(content, "description") ||
        getContentValue(content, "body") ||
        getContentValue(content, "text") ||
        "";

    const form = {
        title,
        description,

        text:
            getContentValue(content, "text") ||
            getContentValue(content, "body") ||
            getContentValue(content, "description") ||
            "",

        video_url:
            getContentValue(content, "video_url") ||
            getContentValue(content, "videoUrl") ||
            getContentValue(content, "url") ||
            "",

        video_provider:
            getContentValue(content, "video_provider") ||
            getContentValue(content, "provider") ||
            "youtube",

        file_url: getExistingFileUrl(content),

        quiz_instructions:
            getContentValue(content, "quiz_instructions") ||
            getContentValue(content, "instructions") ||
            "",

        quiz_questions:
            itemType === "quiz"
                ? normalizeQuizQuestions(contentQuestions)
                : [],

        survey_instructions:
            getContentValue(content, "survey_instructions") ||
            getContentValue(content, "instructions") ||
            "",

        survey_questions:
            itemType === "survey"
                ? normalizeSurveyQuestions(surveyQuestions)
                : [],

        forum_prompt:
            getContentValue(content, "forum_prompt") ||
            getContentValue(content, "prompt") ||
            getContentValue(content, "instructions") ||
            "",

        completion_type:
            block.completion_type ||
            getContentValue(content, "completion_type") ||
            getDefaultCompletionType(itemType),

        completion_value: getSafeNumber(
            block.completion_value ?? content.completion_value,
            getDefaultCompletionValue(itemType),
        ),

        order: getSafeNumber(block.order ?? content.order, 1),

        date_available:
            block.date_available ??
            getContentValue(content, "date_available") ??
            "",

        counts_toward_grade: getSafeBoolean(
            block.counts_toward_grade ?? content.counts_toward_grade,
            false,
        ),

        is_required: getSafeBoolean(content.is_required, false),

        is_active: getSafeBoolean(
            block.is_active ?? content.is_active,
            true,
        ),
    };

    return form as unknown as FormState;
}

function buildQuizApiQuestions(questions: QuizQuestion[]) {
    return questions.map((question, index) => {
        const options = normalizeOptions(question.options);

        const correctAnswer = Math.trunc(
            getSafeNumber(question.correct_answer, 0),
        );

        const safeCorrectAnswer =
            correctAnswer >= 0 && correctAnswer < options.length
                ? correctAnswer
                : 0;

        return {
            id: Math.trunc(getSafeNumber(question.id, index + 1)),
            question: getSafeText(question.question).trim(),
            options,
            correct_answer: safeCorrectAnswer,
            correctAnswer: safeCorrectAnswer,
            points: getSafeNumber(question.points, 0),
        };
    });
}

function buildSurveyApiQuestions(questions: SurveyQuestion[]) {
    return questions.map((question, index) => ({
        id: Math.trunc(getSafeNumber(question.id, index + 1)),
        question: getSafeText(question.question).trim(),
        type: getSafeText(question.type, "text"),
        options: Array.isArray(question.options)
            ? question.options.map((option) => getSafeText(option).trim())
            : [],
        required: getSafeBoolean(question.required, true),
    }));
}

function buildContentByType(
    block: LessonBlock,
    itemType: LessonItemType,
    form: FormState,
) {
    const content = parseJsonObject(block.content);
    const formRecord = getFormRecord(form);
    const blockRecord = getBlockRecord(block);

    const title = getSafeTrimText(formRecord.title, "Contenido");

    const baseContent = {
        ...content,
        type: itemType,
        itemType,
        title,
        default: getSafeBoolean(blockRecord.default ?? content.default, true),
        is_active: getSafeBoolean(
            blockRecord.is_active ?? content.is_active,
            true,
        ),
        block_type_id: getBlockTypeId(block),
        counts_toward_grade: getSafeBoolean(
            blockRecord.counts_toward_grade ?? content.counts_toward_grade,
            false,
        ),
    };

    if (itemType === "quiz") {
        const quizInstructions = getSafeText(formRecord.quiz_instructions);

        return {
            ...baseContent,
            instructions: quizInstructions,
            quiz_instructions: quizInstructions,
            minimum_score: getSafeNumber(
                formRecord.completion_value,
                getDefaultCompletionValue(itemType),
            ),
            questions: buildQuizApiQuestions(
                Array.isArray(formRecord.quiz_questions)
                    ? (formRecord.quiz_questions as QuizQuestion[])
                    : [],
            ),
        };
    }

    if (itemType === "survey") {
        return {
            ...baseContent,
            instructions: getSafeText(formRecord.survey_instructions),
            questions: buildSurveyApiQuestions(
                Array.isArray(formRecord.survey_questions)
                    ? (formRecord.survey_questions as SurveyQuestion[])
                    : [],
            ),
            survey_questions: buildSurveyApiQuestions(
                Array.isArray(formRecord.survey_questions)
                    ? (formRecord.survey_questions as SurveyQuestion[])
                    : [],
            ),
        };
    }

    if (itemType === "forum") {
        return {
            ...baseContent,
            prompt: getSafeText(formRecord.forum_prompt),
            forum_prompt: getSafeText(formRecord.forum_prompt),
            instructions: getSafeText(formRecord.forum_prompt),
        };
    }

    if (itemType === "video") {
        return {
            ...baseContent,
            url: getSafeText(formRecord.video_url),
            video_url: getSafeText(formRecord.video_url),
        };
    }

    if (itemType === "image" || itemType === "pdf") {
        return {
            ...baseContent,
            file_url:
                getSafeText(formRecord.file_url) ||
                getExistingFileUrl(content),
        };
    }

    return {
        ...baseContent,
        text: getSafeText(formRecord.text),
        description: getSafeText(formRecord.text),
    };
}

export function buildLessonBlockPayload(
    block: LessonBlock,
    itemType: LessonItemType,
    form: FormState,
    selectedFile: File | null,
): LessonBlockPayloadWithFile {
    const formRecord = getFormRecord(form);

    const payload = {
        lesson_id: block.lesson_id,
        block_type_id: getBlockTypeId(block),
        completion_type:
            getSafeTrimText(formRecord.completion_type) ||
            block.completion_type ||
            getDefaultCompletionType(itemType),
        completion_value: getSafeNumber(
            formRecord.completion_value ?? block.completion_value,
            getDefaultCompletionValue(itemType),
        ),
        order: getSafeNumber(formRecord.order ?? block.order, 1),
        default: getSafeBoolean(block.default, true),
        counts_toward_grade: getSafeBoolean(block.counts_toward_grade, false),
        date_available:
            getSafeText(formRecord.date_available) ||
            block.date_available ||
            null,
        is_active: getSafeBoolean(block.is_active, true),
        content: buildContentByType(block, itemType, form),
        file: selectedFile,
    };

    return payload as LessonBlockPayloadWithFile;
}