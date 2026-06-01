import type { LessonBlock, LessonBlockPayload } from "@/services/lessons.service";
import {
    DEFAULT_LESSON_BLOCK_TYPE_IDS,
    DEFAULT_LESSON_COMPLETION_TYPE,
    DEFAULT_LESSON_COMPLETION_VALUE,
} from "./constants";
import type {
    BlockFormState,
    CourseModuleView,
    CreateModalState,
    EditModalState,
    LessonBlockPayloadWithOptionalFile,
    LessonBlockWithOptionalType,
    LessonCompletionType,
    LessonItemType,
    LessonItemView,
} from "./types";

type AnyRecord = Record<string, unknown>;

export function getCourseIdFromPathname(pathname: string) {
    const teacherMatch = pathname.match(/^\/teacher\/courses\/([^/]+)\/modules/);
    const adminCourseMatch = pathname.match(/^\/admin\/courses\/([^/]+)\/modules/);
    const adminModuleMatch = pathname.match(/^\/admin\/modules\/([^/]+)/);

    return (
        teacherMatch?.[1] ??
        adminCourseMatch?.[1] ??
        adminModuleMatch?.[1] ??
        ""
    );
}

export function sortByOrder<T extends { id?: number | string; order?: number | string | null }>(
    items: T[],
) {
    return [...items].sort((a, b) => {
        const orderA = toSafeNumber(a.order, 0);
        const orderB = toSafeNumber(b.order, 0);

        if (orderA !== orderB) return orderA - orderB;

        return toSafeNumber(a.id, 0) - toSafeNumber(b.id, 0);
    });
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

export function toNumericId(value: unknown) {
    if (value === null || value === undefined || value === "") return null;

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
}

export function toSafeNumber(
    value: string | number | null | undefined | unknown,
    fallback = 0,
) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function normalizeText(value: unknown) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function readBoolean(value: unknown, fallback = false) {
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

export function getContentRecord(content: unknown): AnyRecord {
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

export function normalizeCompletionType(value: unknown): LessonCompletionType {
    const cleanValue = String(value ?? "").trim().toUpperCase();

    if (
        cleanValue === "VER" ||
        cleanValue === "RESPONDER" ||
        cleanValue === "SUBIR"
    ) {
        return cleanValue;
    }

    return "VER";
}

export function toDateTimeLocal(value: string | null | undefined) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
    if (!value.trim()) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
}

export function getItemLabel(type: LessonItemType) {
    if (type === "video") return "Video";
    if (type === "quiz") return "Quiz";
    if (type === "image") return "Imagen";
    if (type === "pdf") return "PDF";
    if (type === "homework") return "Tarea";
    if (type === "survey") return "Encuesta";
    if (type === "forum") return "Foro";

    return "Texto";
}

export function getItemButtonClass(type: LessonItemType) {
    if (type === "text") return "bg-slate-100 text-slate-700 hover:bg-slate-200";

    if (type === "image") {
        return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    }

    if (type === "pdf") return "bg-red-50 text-red-700 hover:bg-red-100";
    if (type === "video") return "bg-blue-50 text-[#172861] hover:bg-blue-100";
    if (type === "quiz") return "bg-amber-50 text-amber-700 hover:bg-amber-100";

    if (type === "homework") {
        return "bg-purple-50 text-purple-700 hover:bg-purple-100";
    }

    if (type === "survey") return "bg-cyan-50 text-cyan-700 hover:bg-cyan-100";

    return "bg-orange-50 text-orange-700 hover:bg-orange-100";
}

export function getCreateModalTitle(modal: CreateModalState | null) {
    if (!modal) return "";

    if (modal.type === "module") return "Agregar módulo";
    if (modal.type === "lesson") return "Agregar lección";

    return `Agregar ${getItemLabel(modal.itemType).toLowerCase()}`;
}

export function getEditModalTitle(modal: EditModalState | null) {
    if (!modal) return "";

    if (modal.type === "module") return "Editar módulo";
    if (modal.type === "lesson") return "Editar lección";

    return `Editar ${getItemLabel(modal.itemType).toLowerCase()}`;
}

export function getCreateModalDescription(modal: CreateModalState | null) {
    if (!modal) return "";

    if (modal.type === "module") {
        return "Crea una nueva unidad para organizar las lecciones del curso.";
    }

    if (modal.type === "lesson") {
        return "Agrega una lección dentro del módulo seleccionado.";
    }

    return "Configura las propiedades del bloque de aprendizaje.";
}

export function isInteractiveDragTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
        target.closest(
            "button, a, input, textarea, select, label, [data-no-drag='true']",
        ),
    );
}

export function moveItem<T extends { id: string }>(
    items: T[],
    draggedId: string,
    targetId: string,
) {
    const nextItems = [...items];

    const fromIndex = nextItems.findIndex((item) => item.id === draggedId);
    const toIndex = nextItems.findIndex((item) => item.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return items;

    const [removedItem] = nextItems.splice(fromIndex, 1);

    nextItems.splice(toIndex, 0, removedItem);

    return nextItems;
}

export function getContentText(
    content: Record<string, unknown> | string | null | undefined,
    keys: string[],
) {
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

export function getLessonBlockTitle(block: LessonBlock) {
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

export function getLessonItemType(block: LessonBlock): LessonItemType {
    const content = getContentRecord(block.content);

    const contentType = normalizeText(
        getContentText(content, [
            "itemType",
            "type",
            "blockType",
            "content_type",
        ]),
    );

    const optionalBlock = block as LessonBlockWithOptionalType;
    const fallbackKey = normalizeText(optionalBlock.lesson_block_type?.key);

    const blockTypeId =
        toNumericId(content.block_type_id) ??
        toNumericId(optionalBlock.block_type_id) ??
        toNumericId(optionalBlock.lesson_block_type?.id);

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
        return "pdf";
    }

    if (blockTypeId === 6 || key.includes("homework") || key.includes("tarea")) {
        return "homework";
    }

    if (blockTypeId === 7 || key.includes("survey") || key.includes("encuesta")) {
        return "survey";
    }

    if (blockTypeId === 8 || key.includes("forum") || key.includes("foro")) {
        return "forum";
    }

    return "text";
}

export function buildInitialLessonBlockContent(
    title: string,
    type: LessonItemType,
) {
    const blockTypeId = DEFAULT_LESSON_BLOCK_TYPE_IDS[type];

    if (type === "video") {
        return {
            title,
            type,
            itemType: type,
            block_type_id: blockTypeId,
            url: "",
            provider: "youtube",
        };
    }

    if (type === "quiz") {
        return {
            title,
            type,
            itemType: type,
            block_type_id: blockTypeId,
            questions: [],
        };
    }

    if (type === "image") {
        return {
            title,
            type,
            itemType: type,
            block_type_id: blockTypeId,
            url: "",
            alt: "",
        };
    }

    if (type === "pdf") {
        return {
            title,
            type,
            itemType: type,
            block_type_id: blockTypeId,
            url: "",
            description: "",
        };
    }

    if (type === "homework") {
        return {
            title,
            type,
            itemType: type,
            block_type_id: blockTypeId,
            instructions: "",
            max_score: 10,
            attachments: [],
        };
    }

    if (type === "survey") {
        return {
            title,
            type,
            itemType: type,
            block_type_id: blockTypeId,
            questions: [],
        };
    }

    if (type === "forum") {
        return {
            title,
            type,
            itemType: type,
            block_type_id: blockTypeId,
            description: "",
            topics: [],
        };
    }

    return {
        title,
        text: "",
        type: "text",
        itemType: "text",
        block_type_id: blockTypeId,
    };
}

export function stringifyContent(content: Record<string, unknown>) {
    return JSON.stringify(content, null, 2);
}

export function parseContent(content: string): Record<string, unknown> {
    const cleanContent = content.trim();

    if (!cleanContent) return {};

    const parsed = JSON.parse(cleanContent) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("El contenido debe ser un objeto JSON válido.");
    }

    return parsed as Record<string, unknown>;
}

export function buildBlockFormState(params: {
    type: LessonItemType;
    title: string;
    order: number;
    block?: LessonBlock;
}): BlockFormState {
    const blockTypeId = DEFAULT_LESSON_BLOCK_TYPE_IDS[params.type];

    const originalContent = getContentRecord(params.block?.content);

    const content = params.block
        ? {
            ...originalContent,
            title: getLessonBlockTitle(params.block),
            type: params.type,
            itemType: params.type,
            block_type_id: blockTypeId,
        }
        : buildInitialLessonBlockContent(params.title, params.type);

    return {
        completion_type: params.block
            ? normalizeCompletionType(params.block.completion_type)
            : DEFAULT_LESSON_COMPLETION_TYPE[params.type],
        completion_value: String(
            params.block?.completion_value ??
            DEFAULT_LESSON_COMPLETION_VALUE[params.type],
        ),
        order: String(params.block?.order ?? params.order),

        /*
            IMPORTANTE:
            Los bloques creados desde Módulos son contenido normal.
            Por eso por defecto:
            default = true
            counts_toward_grade = false
            is_active = true

            Los archivos obligatorios MDT se crean desde su propia pantalla con:
            default = false
            counts_toward_grade = true
            is_active = true
        */
        default: params.block
            ? readBoolean(params.block.default, false)
            : true,
        counts_toward_grade: params.block
            ? readBoolean(params.block.counts_toward_grade, false)
            : false,
        date_available: toDateTimeLocal(params.block?.date_available ?? null),
        is_active: params.block
            ? readBoolean(params.block.is_active, true)
            : true,

        content: stringifyContent(content),
        file: null,
    };
}

export function ensureBlockContentProperties(params: {
    content: Record<string, unknown>;
    title: string;
    type: LessonItemType;
    form?: BlockFormState;
}) {
    return {
        ...params.content,
        title: params.title,
        type: params.type,
        itemType: params.type,
        block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS[params.type],
        ...(params.form
            ? {
                default: params.form.default,
                counts_toward_grade: params.form.counts_toward_grade,
                is_active: params.form.is_active,
            }
            : {}),
    };
}

export function buildLessonBlockPayload(params: {
    lessonId: string | number;
    type: LessonItemType;
    title: string;
    form: BlockFormState;
}): LessonBlockPayloadWithOptionalFile {
    const content = ensureBlockContentProperties({
        content: parseContent(params.form.content),
        title: params.title,
        type: params.type,
        form: params.form,
    });

    return {
        lesson_id: Number(params.lessonId),
        block_type_id: DEFAULT_LESSON_BLOCK_TYPE_IDS[params.type],
        completion_type: params.form.completion_type,
        completion_value: toSafeNumber(params.form.completion_value, 0),
        order: toSafeNumber(params.form.order, 0),
        default: params.form.default,
        counts_toward_grade: params.form.counts_toward_grade,
        date_available: fromDateTimeLocal(params.form.date_available),
        is_active: params.form.is_active,
        content,
        file: params.form.file,
    };
}

export function toLessonBlockPayload(
    block: LessonBlock,
    order: number,
    fallbackType: LessonItemType,
): LessonBlockPayloadWithOptionalFile {
    const blockTypeId = DEFAULT_LESSON_BLOCK_TYPE_IDS[fallbackType];
    const content = getContentRecord(block.content);

    return {
        lesson_id: block.lesson_id,
        block_type_id: blockTypeId,
        completion_type:
            normalizeCompletionType(block.completion_type) ||
            DEFAULT_LESSON_COMPLETION_TYPE[fallbackType],
        completion_value:
            block.completion_value ??
            DEFAULT_LESSON_COMPLETION_VALUE[fallbackType],
        order,
        default: readBoolean(block.default, false),
        counts_toward_grade: readBoolean(block.counts_toward_grade, false),
        date_available: block.date_available ?? null,
        is_active: readBoolean(block.is_active, true),
        content: {
            ...content,
            block_type_id: blockTypeId,
            type: fallbackType,
            itemType: fallbackType,
            default: readBoolean(block.default, false),
            counts_toward_grade: readBoolean(block.counts_toward_grade, false),
            is_active: readBoolean(block.is_active, true),
        },
        file: null,
    };
}

export function mapLessonBlockToView(block: LessonBlock): LessonItemView {
    const itemType = getLessonItemType(block);

    return {
        id: String(block.id),
        title: getLessonBlockTitle(block),
        type: itemType,
        order: block.order,
        lessonId: String(block.lesson_id),
        raw: block,

        default: block.default,
        counts_toward_grade: block.counts_toward_grade,
        is_active: block.is_active,
        content: block.content,
        block_type_id: block.block_type_id,
        completion_type: block.completion_type,
        lesson_block_type: block.lesson_block_type,
    } as LessonItemView;
}

export function findLessonInModules(
    modules: CourseModuleView[],
    lessonId: string,
) {
    for (const courseModule of modules) {
        const lesson = courseModule.lessons.find(
            (currentLesson) => currentLesson.id === lessonId,
        );

        if (lesson) return lesson;
    }

    return null;
}