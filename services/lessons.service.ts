import {
    API_URL,
    getJsonHeaders,
    getMultipartHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const LESSONS_ENDPOINT = `${API_URL}/api/v1/lessons/lessons`;
const LESSONS_BY_MODULE_ENDPOINT = `${API_URL}/api/v1/lessons/modules`;

const LESSON_BLOCKS_ENDPOINT = `${API_URL}/api/v1/lesson-blocks/lesson-blocks`;
const LESSON_BLOCKS_BY_LESSON_ENDPOINT = `${API_URL}/api/v1/lesson-blocks/lesson`;

const LESSON_BLOCK_TYPES_ENDPOINT = `${API_URL}/api/v1/lesson-block-types/lesson-block-types`;

export type Lesson = {
    id: number;
    name: string;
    order: number;
    module_id: number;
};

export type LessonPayload = {
    name: string;
    order: number;
    module_id: number;
};

export type LessonBlockType = {
    id: number;
    key: string;
    name?: string | null;
    description?: string | null;
    icon?: string | null;
    content_type?: string | null;
    config?: Record<string, unknown> | null;
    is_active?: boolean | null;
};

export type LessonBlockContent = Record<string, unknown> | string | null;

export type LessonBlock = {
    id: number;
    content: LessonBlockContent;
    counts_toward_grade: boolean;
    completion_type: string;
    completion_value: number;
    order: number;
    default: boolean;
    lesson_id: number | null;
    block_type_id: number;
    date_available?: string | null;
    is_active: boolean;
    deleted?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    lesson_block_type?: {
        id?: number;
        key?: string;
        name?: string | null;
    } | null;
};

export type LessonBlockPayload = {
    lesson_id: number | string;
    block_type_id: number | string;
    completion_type: string;
    completion_value?: number | string | null;
    order?: number | string | null;
    default?: boolean | string | number | null;
    counts_toward_grade?: boolean | string | number | null;
    date_available?: string | null;
    is_active?: boolean | string | number | null;
    content?: unknown;
    file?: File | Blob | null;
};

export type UpdateLessonBlockPayload = Partial<LessonBlockPayload>;

export type LessonCalendarActivity = {
    id: string;
    lesson_id: number;
    lesson_block_id: number;
    title: string;
    type_key: string;
    date_available: string;
    counts_toward_grade: boolean;
    url: string;
    course_id?: number | null;
    raw?: LessonBlock;
};

type AnyRecord = Record<string, unknown>;

function cleanText(value: unknown): string {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

function normalizeId(value: unknown, label: string): number {
    const numericValue = Number(value);

    return validateId(numericValue, label);
}

function readBoolean(value: unknown, fallback = false): boolean {
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

function readNumber(value: unknown, fallback = 0): number {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function readString(value: unknown, fallback = ""): string {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (typeof value === "number") {
        return String(value);
    }

    return fallback;
}

/**
 * IMPORTANTE:
 * Cuando se usa FormData, NO se debe enviar manualmente:
 * Content-Type: multipart/form-data
 *
 * El navegador agrega automáticamente el boundary.
 */
function getSafeMultipartHeaders(): HeadersInit {
    const headers = new Headers(getMultipartHeaders());

    headers.delete("Content-Type");
    headers.delete("content-type");

    return headers;
}

function debugFormData(formData: FormData, label: string) {
    if (process.env.NODE_ENV === "production") return;

    for (const [key, value] of formData.entries()) {
        console.log(label, key, value);
    }
}

function parseContentForFormData(content: unknown): unknown {
    if (content === undefined || content === null) return undefined;

    if (typeof content === "string") {
        const cleanContent = content.trim();

        if (!cleanContent) return undefined;

        try {
            return JSON.parse(cleanContent);
        } catch {
            return cleanContent;
        }
    }

    return content;
}

function appendFormValue(
    formData: FormData,
    key: string,
    value: unknown,
): void {
    if (value === undefined || value === null) return;

    if (typeof value === "boolean") {
        formData.append(key, value ? "true" : "false");
        return;
    }

    if (typeof value === "number") {
        formData.append(key, String(value));
        return;
    }

    if (typeof value === "string") {
        if (value.trim() === "") return;

        formData.append(key, value);
        return;
    }

    formData.append(key, JSON.stringify(value));
}

function appendFile(formData: FormData, file?: File | Blob | null): void {
    if (!file) return;

    const isFile = typeof File !== "undefined" && file instanceof File;
    const isBlob = typeof Blob !== "undefined" && file instanceof Blob;

    if (!isFile && !isBlob) {
        throw new Error("El archivo seleccionado no es válido.");
    }

    formData.append("file", file);
}

function normalizeDateForApi(value: unknown): string | null {
    if (value === undefined || value === null) return null;

    const text = String(value).trim();

    if (!text) return null;

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) {
        return text;
    }

    return date.toISOString();
}

function buildLessonBlockFormData(payload: LessonBlockPayload): FormData {
    const formData = new FormData();

    appendFormValue(
        formData,
        "lesson_id",
        normalizeId(payload.lesson_id, "ID de lección"),
    );

    appendFormValue(
        formData,
        "block_type_id",
        normalizeId(payload.block_type_id, "ID de tipo de bloque"),
    );

    const completionType = cleanText(payload.completion_type);

    if (!completionType) {
        throw new Error("El tipo de finalización es obligatorio.");
    }

    appendFormValue(formData, "completion_type", completionType);

    appendFormValue(
        formData,
        "completion_value",
        readNumber(payload.completion_value, 0),
    );

    appendFormValue(formData, "order", readNumber(payload.order, 1));

    appendFormValue(formData, "default", readBoolean(payload.default, true));

    appendFormValue(
        formData,
        "counts_toward_grade",
        readBoolean(payload.counts_toward_grade, false),
    );

    const dateAvailable = normalizeDateForApi(payload.date_available);

    if (dateAvailable) {
        appendFormValue(formData, "date_available", dateAvailable);
    }

    appendFormValue(formData, "is_active", readBoolean(payload.is_active, true));

    const content = parseContentForFormData(payload.content);

    if (content !== undefined) {
        formData.append(
            "content",
            typeof content === "string" ? content : JSON.stringify(content),
        );
    }

    appendFile(formData, payload.file);

    return formData;
}

function buildLessonBlockSafeFormData(
    currentBlock: LessonBlock,
    payload: UpdateLessonBlockPayload,
): FormData {
    const formData = new FormData();

    /**
     * IMPORTANTE:
     * Los bloques "default" del curso pueden venir con lesson_id = null.
     *
     * No debemos convertir null a la cadena "null", porque FastAPI intenta
     * parsearla como entero y responde con int_parsing.
     *
     * Si existe un lesson_id válido, se conserva y se envía.
     * Si no existe, simplemente no se agrega al FormData.
     */
    const rawLessonId =
        payload.lesson_id !== undefined
            ? payload.lesson_id
            : currentBlock.lesson_id;

    const lessonId =
        rawLessonId === null ||
            rawLessonId === undefined ||
            String(rawLessonId).trim() === ""
            ? null
            : Number(rawLessonId);

    const blockTypeId = readNumber(
        payload.block_type_id,
        currentBlock.block_type_id,
    );

    const completionType = readString(
        payload.completion_type,
        currentBlock.completion_type || "VER",
    );

    const completionValue = readNumber(
        payload.completion_value,
        readNumber(currentBlock.completion_value, 0),
    );

    const order = readNumber(payload.order, readNumber(currentBlock.order, 1));

    const isDefault = readBoolean(
        payload.default,
        readBoolean(currentBlock.default, true),
    );

    const countsTowardGrade = readBoolean(
        payload.counts_toward_grade,
        readBoolean(currentBlock.counts_toward_grade, false),
    );

    const isActive = readBoolean(
        payload.is_active,
        readBoolean(currentBlock.is_active, true),
    );

    const dateAvailable = normalizeDateForApi(
        payload.date_available !== undefined
            ? payload.date_available
            : currentBlock.date_available,
    );

    const content =
        parseContentForFormData(payload.content) ??
        parseContentForFormData(currentBlock.content) ??
        {};

    if (
        lessonId !== null &&
        Number.isFinite(lessonId) &&
        lessonId > 0
    ) {
        formData.append("lesson_id", String(lessonId));
    }

    formData.append("block_type_id", String(blockTypeId));
    formData.append("completion_type", completionType);
    formData.append("completion_value", String(completionValue));
    formData.append("order", String(order));
    formData.append("default", String(isDefault));
    formData.append("counts_toward_grade", String(countsTowardGrade));
    formData.append("is_active", String(isActive));

    if (dateAvailable) {
        formData.append("date_available", dateAvailable);
    }

    formData.append(
        "content",
        typeof content === "string" ? content : JSON.stringify(content),
    );

    appendFile(formData, payload.file);

    return formData;
}

function isActiveLessonBlock(block: LessonBlock): boolean {
    return block.deleted !== true;
}

function getContentRecord(content: unknown): AnyRecord {
    if (!content) return {};

    if (typeof content === "object" && !Array.isArray(content)) {
        return content as AnyRecord;
    }

    if (typeof content === "string") {
        try {
            const parsed = JSON.parse(content) as unknown;

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as AnyRecord;
            }
        } catch {
            return {};
        }
    }

    return {};
}

function normalizeText(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getContentText(content: unknown, keys: string[]): string {
    const contentRecord = getContentRecord(content);

    for (const key of keys) {
        const value = contentRecord[key];

        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }

        if (typeof value === "number") {
            return String(value);
        }
    }

    return "";
}

function getLessonBlockTitle(block: LessonBlock): string {
    const contentTitle = getContentText(block.content, [
        "title",
        "name",
        "text",
        "description",
        "label",
    ]);

    if (contentTitle) return contentTitle;

    return `Bloque ${block.id}`;
}

function getLessonCalendarTypeKey(block: LessonBlock): string {
    const content = getContentRecord(block.content);

    const contentType = normalizeText(
        getContentText(content, [
            "itemType",
            "type",
            "blockType",
            "content_type",
        ]),
    );

    const fallbackKey = normalizeText(block.lesson_block_type?.key);

    const blockTypeId =
        Number(content.block_type_id) ||
        Number(block.block_type_id) ||
        Number(block.lesson_block_type?.id) ||
        0;

    const key = contentType || fallbackKey;

    if (blockTypeId === 1 || key.includes("video")) return "video";

    if (blockTypeId === 2 || key.includes("quiz") || key.includes("prueba")) {
        return "quiz";
    }

    if (blockTypeId === 3 || key.includes("text") || key.includes("texto")) {
        return "text";
    }

    if (blockTypeId === 4 || key.includes("image") || key.includes("imagen")) {
        return "image";
    }

    if (blockTypeId === 5 || key.includes("pdf") || key.includes("document")) {
        return "resource";
    }

    if (
        blockTypeId === 6 ||
        key.includes("homework") ||
        key.includes("tarea")
    ) {
        return "homework";
    }

    if (
        blockTypeId === 7 ||
        key.includes("survey") ||
        key.includes("encuesta")
    ) {
        return "survey";
    }

    if (blockTypeId === 8 || key.includes("forum") || key.includes("foro")) {
        return "forum";
    }

    return "resource";
}

function mapLessonBlockToCalendarActivity(
    block: LessonBlock,
    courseId?: number,
): LessonCalendarActivity | null {
    const dateAvailable = cleanText(block.date_available);

    if (!dateAvailable) return null;

    const isActive = readBoolean(block.is_active, true);

    if (!isActive || block.deleted === true) return null;

    const countsTowardGrade = readBoolean(block.counts_toward_grade, false);

    return {
        id: `${block.lesson_id}-${block.id}`,
        lesson_id: Number(block.lesson_id),
        lesson_block_id: Number(block.id),
        title: getLessonBlockTitle(block),
        type_key: getLessonCalendarTypeKey(block),
        date_available: dateAvailable,
        counts_toward_grade: countsTowardGrade,
        url: courseId
            ? `/student/courses/${courseId}?tab=content&block=${block.id}`
            : "/student/calendar",
        course_id: courseId ?? null,
        raw: block,
    };
}

/* =========================================================
   LECCIONES
========================================================= */

export async function createLesson(payload: LessonPayload): Promise<Lesson> {
    const cleanName = cleanText(payload.name);

    if (!cleanName) {
        throw new Error("El nombre de la lección es obligatorio.");
    }

    const response = await fetch(LESSONS_ENDPOINT, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({
            name: cleanName,
            order: Number(payload.order) || 1,
            module_id: normalizeId(payload.module_id, "ID de módulo"),
        }),
    });

    return handleApiResponse<Lesson>(response);
}

export async function updateLesson(
    lessonId: number,
    payload: LessonPayload,
): Promise<Lesson> {
    const validLessonId = normalizeId(lessonId, "ID de lección");
    const cleanName = cleanText(payload.name);

    if (!cleanName) {
        throw new Error("El nombre de la lección es obligatorio.");
    }

    const response = await fetch(`${LESSONS_ENDPOINT}/${validLessonId}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({
            name: cleanName,
            order: Number(payload.order) || 1,
            module_id: normalizeId(payload.module_id, "ID de módulo"),
        }),
    });

    return handleApiResponse<Lesson>(response);
}

export async function deleteLesson(lessonId: number): Promise<string> {
    const validLessonId = normalizeId(lessonId, "ID de lección");

    const response = await fetch(`${LESSONS_ENDPOINT}/${validLessonId}`, {
        method: "DELETE",
        headers: getJsonHeaders(),
    });

    return handleApiResponse<string>(response);
}

export async function getLesson(lessonId: number): Promise<Lesson> {
    const validLessonId = normalizeId(lessonId, "ID de lección");

    const response = await fetch(`${LESSONS_ENDPOINT}/${validLessonId}`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    return handleApiResponse<Lesson>(response);
}

export async function getLessonsByModule(
    moduleId: number,
): Promise<Lesson[]> {
    const validModuleId = normalizeId(moduleId, "ID de módulo");

    const response = await fetch(
        `${LESSONS_BY_MODULE_ENDPOINT}/${validModuleId}/lessons`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<Lesson[]>(response);

    return Array.isArray(data) ? data : [];
}

/* =========================================================
   BLOQUES DE LECCIÓN
========================================================= */

export async function createLessonBlock(
    payload: LessonBlockPayload,
): Promise<LessonBlock> {
    const formData = buildLessonBlockFormData(payload);

    debugFormData(formData, "CREATE LESSON BLOCK FORMDATA:");

    const response = await fetch(LESSON_BLOCKS_ENDPOINT, {
        method: "POST",
        headers: getSafeMultipartHeaders(),
        body: formData,
    });

    return handleApiResponse<LessonBlock>(response);
}

export async function updateLessonBlock(
    lessonBlockId: number,
    payload: UpdateLessonBlockPayload,
): Promise<LessonBlock> {
    const validLessonBlockId = normalizeId(
        lessonBlockId,
        "ID de bloque de lección",
    );

    const currentBlock = await getLessonBlock(validLessonBlockId);

    const formData = buildLessonBlockSafeFormData(currentBlock, payload);

    debugFormData(formData, "UPDATE LESSON BLOCK FORMDATA:");

    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/${validLessonBlockId}`,
        {
            method: "PUT",
            headers: getSafeMultipartHeaders(),
            body: formData,
        },
    );

    return handleApiResponse<LessonBlock>(response);
}

export async function deleteLessonBlock(
    lessonBlockId: number,
): Promise<string> {
    const validLessonBlockId = normalizeId(
        lessonBlockId,
        "ID de bloque de lección",
    );

    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/${validLessonBlockId}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
        },
    );

    return handleApiResponse<string>(response);
}

export async function getLessonBlock(
    lessonBlockId: number,
): Promise<LessonBlock> {
    const validLessonBlockId = normalizeId(
        lessonBlockId,
        "ID de bloque de lección",
    );

    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/${validLessonBlockId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<LessonBlock>(response);
}

export async function getLessonBlocksByLesson(
    lessonId: number,
): Promise<LessonBlock[]> {
    const validLessonId = normalizeId(lessonId, "ID de lección");

    const response = await fetch(
        `${LESSON_BLOCKS_BY_LESSON_ENDPOINT}/${validLessonId}/lesson-blocks`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<LessonBlock[]>(response);

    return Array.isArray(data) ? data.filter(isActiveLessonBlock) : [];
}

/* =========================================================
   ACTIVIDADES DE CALENDARIO / NOTIFICACIONES
========================================================= */

export async function getLessonCalendarActivitiesByLesson(
    lessonId: number,
    courseId?: number,
): Promise<LessonCalendarActivity[]> {
    const blocks = await getLessonBlocksByLesson(lessonId);

    return blocks
        .map((block) => mapLessonBlockToCalendarActivity(block, courseId))
        .filter(
            (activity): activity is LessonCalendarActivity =>
                activity !== null,
        );
}

export async function getLessonCalendarActivitiesByLessons(
    lessonIds: number[],
    courseId?: number,
): Promise<LessonCalendarActivity[]> {
    const validLessonIds = Array.from(
        new Set(
            lessonIds
                .map((lessonId) => Number(lessonId))
                .filter((lessonId) => Number.isFinite(lessonId) && lessonId > 0),
        ),
    );

    if (validLessonIds.length === 0) return [];

    const activities = (
        await Promise.all(
            validLessonIds.map((lessonId) =>
                getLessonCalendarActivitiesByLesson(lessonId, courseId),
            ),
        )
    ).flat();

    return activities.sort(
        (a, b) =>
            new Date(a.date_available).getTime() -
            new Date(b.date_available).getTime(),
    );
}

/* =========================================================
   TIPOS DE BLOQUES
========================================================= */

export async function getLessonBlockType(
    lessonBlockTypeId: number,
): Promise<LessonBlockType> {
    const validLessonBlockTypeId = normalizeId(
        lessonBlockTypeId,
        "ID de tipo de bloque",
    );

    const response = await fetch(
        `${LESSON_BLOCK_TYPES_ENDPOINT}/${validLessonBlockTypeId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<LessonBlockType>(response);
}

export async function getAllLessonBlockTypes(): Promise<LessonBlockType[]> {
    const response = await fetch(LESSON_BLOCK_TYPES_ENDPOINT, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    const data = await handleApiResponse<LessonBlockType[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function getDefaultLessonBlocksByCourseAndType(
    courseId: number | string,
    blockTypeId: number | string,
): Promise<LessonBlock[]> {
    const validCourseId = normalizeId(courseId, "ID de curso");

    const validBlockTypeId = normalizeId(
        blockTypeId,
        "ID de tipo de bloque",
    );

    const params = new URLSearchParams({
        course_id: String(validCourseId),
        block_type_id: String(validBlockTypeId),
    });

    const response = await fetch(
        `${LESSON_BLOCKS_ENDPOINT}/default/?${params.toString()}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<LessonBlock[]>(response);

    return Array.isArray(data) ? data.filter(isActiveLessonBlock) : [];
}

/**
 * Alias de compatibilidad.
 * Ahora el backend exige course_id, por eso se debe enviar también.
 */
export async function getDefaultLessonBlocksByType(
    blockTypeId: number | string,
    courseId?: number | string,
): Promise<LessonBlock[]> {
    if (
        courseId === undefined ||
        courseId === null ||
        String(courseId).trim() === ""
    ) {
        throw new Error(
            "El ID del curso es obligatorio para cargar bloques por defecto.",
        );
    }

    return getDefaultLessonBlocksByCourseAndType(courseId, blockTypeId);
}

/* =========================================================
   ALIASES DE COMPATIBILIDAD
========================================================= */

export const getLessonById = getLesson;
export const getLessonBlockById = getLessonBlock;
export const getLessonBlocks = getLessonBlocksByLesson;
export const getLessons = getLessonsByModule;

export const getCalendarActivitiesByLesson =
    getLessonCalendarActivitiesByLesson;

export const getCalendarActivitiesByLessons =
    getLessonCalendarActivitiesByLessons;