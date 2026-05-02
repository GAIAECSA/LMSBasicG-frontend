"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    FileText,
    ImageIcon,
    Plus,
    Save,
    Trash2,
    UploadCloud,
    Video,
} from "lucide-react";
import {
    getLessonBlock,
    updateLessonBlock,
    type LessonBlock,
    type LessonBlockPayload,
} from "@/services/lessons.service";

type LessonItemEditorPageProps = {
    courseId: string;
    itemId: string;
};

type LessonItemType = "text" | "image" | "pdf" | "video" | "quiz";
type LessonCompletionType = "VER" | "RESPONDER" | "SUBIR";

type QuizQuestion = {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    points: number;
};

type FormState = {
    title: string;
    description: string;
    text: string;
    video_url: string;
    video_provider: string;
    quiz_instructions: string;
    quiz_questions: QuizQuestion[];
    completion_value: number;
    is_required: boolean;
    is_active: boolean;
};

type LessonBlockWithOptionalType = LessonBlock & {
    block_type_id?: number;
    deleted?: boolean;
    lesson_block_type?: {
        id?: number;
        key?: string;
    };
};

type LessonBlockPayloadWithFile = Omit<LessonBlockPayload, "completion_value"> & {
    completion_value?: number;
    deleted?: boolean;
    file?: File | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

const BLOCK_TYPE_IDS: Record<LessonItemType, number> = {
    video: 1,
    quiz: 2,
    text: 3,
    image: 4,
    pdf: 5,
};

const DEFAULT_COMPLETION_TYPE: Record<LessonItemType, LessonCompletionType> = {
    video: "VER",
    quiz: "RESPONDER",
    text: "VER",
    image: "SUBIR",
    pdf: "SUBIR",
};

const DEFAULT_COMPLETION_VALUE: Partial<Record<LessonItemType, number>> = {
    video: 80,
    quiz: 7,
};

const emptyForm: FormState = {
    title: "",
    description: "",
    text: "",
    video_url: "",
    video_provider: "youtube",
    quiz_instructions: "",
    quiz_questions: [],
    completion_value: 0,
    is_required: true,
    is_active: true,
};

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

function getContentValue(content: Record<string, unknown>, key: string) {
    const value = content[key];

    if (typeof value === "string") return value;

    return "";
}

function getContentNumber(content: Record<string, unknown>, key: string) {
    const value = content[key];

    if (typeof value === "number") return value;

    return null;
}

function getBooleanContentValue(
    content: Record<string, unknown>,
    key: string,
    fallback: boolean,
) {
    const value = content[key];

    if (typeof value === "boolean") return value;

    return fallback;
}

function normalizeUrl(url: string) {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

function getExistingFileUrl(content: Record<string, unknown>) {
    return (
        getContentValue(content, "file_url") ||
        getContentValue(content, "url") ||
        getContentValue(content, "path") ||
        getContentValue(content, "file_path")
    );
}

function getBlockTypeId(block: LessonBlock) {
    const content = block.content ?? {};
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

    return BLOCK_TYPE_IDS.text;
}

function getItemType(block: LessonBlock | null): LessonItemType {
    if (!block) return "text";

    const content = block.content ?? {};
    const optionalBlock = block as LessonBlockWithOptionalType;

    const contentType =
        getContentValue(content, "itemType").toLowerCase() ||
        getContentValue(content, "type").toLowerCase() ||
        getContentValue(content, "blockType").toLowerCase();

    const key = optionalBlock.lesson_block_type?.key?.toLowerCase() ?? "";
    const blockTypeId = getBlockTypeId(block);

    if (
        blockTypeId === BLOCK_TYPE_IDS.video ||
        contentType.includes("video") ||
        key.includes("video")
    ) {
        return "video";
    }

    if (
        blockTypeId === BLOCK_TYPE_IDS.quiz ||
        contentType.includes("quiz") ||
        contentType.includes("prueba") ||
        contentType.includes("evaluacion") ||
        key.includes("quiz") ||
        key.includes("prueba") ||
        key.includes("evaluacion")
    ) {
        return "quiz";
    }

    if (
        blockTypeId === BLOCK_TYPE_IDS.image ||
        contentType.includes("image") ||
        contentType.includes("imagen") ||
        contentType.includes("foto") ||
        key.includes("image") ||
        key.includes("imagen") ||
        key.includes("foto")
    ) {
        return "image";
    }

    if (
        blockTypeId === BLOCK_TYPE_IDS.pdf ||
        contentType.includes("pdf") ||
        contentType.includes("documento") ||
        key.includes("pdf") ||
        key.includes("documento")
    ) {
        return "pdf";
    }

    return "text";
}

function getItemTypeLabel(type: LessonItemType) {
    if (type === "video") return "Video";
    if (type === "quiz") return "Evaluación";
    if (type === "image") return "Imagen";
    if (type === "pdf") return "PDF";

    return "Texto";
}

function renderItemIcon(type: LessonItemType, className: string) {
    if (type === "video") return <Video className={className} />;
    if (type === "quiz") return <ClipboardList className={className} />;
    if (type === "image") return <ImageIcon className={className} />;
    if (type === "pdf") return <FileText className={className} />;

    return <FileText className={className} />;
}

function getValidOptions(options: unknown) {
    if (!Array.isArray(options)) {
        return ["", "", "", ""];
    }

    const normalizedOptions = options.map((option) =>
        typeof option === "string" ? option : "",
    );

    while (normalizedOptions.length < 4) {
        normalizedOptions.push("");
    }

    return normalizedOptions.slice(0, 4);
}

function normalizeQuizQuestions(value: unknown): QuizQuestion[] {
    if (!Array.isArray(value)) return [];

    return value.map((question, index) => {
        const item = question as Partial<QuizQuestion>;

        return {
            id: typeof item.id === "number" ? item.id : index + 1,
            question: typeof item.question === "string" ? item.question : "",
            options: getValidOptions(item.options),
            correct_answer:
                typeof item.correct_answer === "number"
                    ? item.correct_answer
                    : 0,
            points: typeof item.points === "number" ? item.points : 1,
        };
    });
}

function createQuestion(nextId: number): QuizQuestion {
    return {
        id: nextId,
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
        points: 1,
    };
}

function getFormFromBlock(block: LessonBlock): FormState {
    const content = block.content ?? {};
    const itemType = getItemType(block);

    return {
        title:
            getContentValue(content, "title") ||
            getContentValue(content, "name") ||
            `Bloque ${block.id}`,
        description: getContentValue(content, "description"),
        text:
            getContentValue(content, "text") ||
            getContentValue(content, "body") ||
            getContentValue(content, "content_body"),
        video_url: itemType === "video" ? getContentValue(content, "url") : "",
        video_provider: getContentValue(content, "provider") || "youtube",
        quiz_instructions: getContentValue(content, "instructions"),
        quiz_questions: normalizeQuizQuestions(content.questions),
        completion_value:
            typeof block.completion_value === "number"
                ? block.completion_value
                : DEFAULT_COMPLETION_VALUE[itemType] ?? 0,
        is_required:
            typeof block.is_required === "boolean"
                ? block.is_required
                : getBooleanContentValue(content, "is_required", true),
        is_active:
            typeof block.is_active === "boolean"
                ? block.is_active
                : getBooleanContentValue(content, "is_active", true),
    };
}

function buildContentPayload(type: LessonItemType, form: FormState) {
    if (type === "video") {
        return {
            url: form.video_url.trim(),
            title: form.title.trim(),
            provider: form.video_provider.trim() || "youtube",
            type: "video",
            itemType: "video",
            block_type_id: BLOCK_TYPE_IDS.video,
        };
    }

    if (type === "quiz") {
        return {
            title: form.title.trim(),
            type: "quiz",
            itemType: "quiz",
            block_type_id: BLOCK_TYPE_IDS.quiz,
            instructions: form.quiz_instructions.trim(),
            questions: form.quiz_questions.map((question, index) => ({
                id: index + 1,
                question: question.question.trim(),
                options: question.options.map((option) => option.trim()),
                correct_answer: question.correct_answer,
                points: question.points,
            })),
        };
    }

    if (type === "image") {
        return {
            title: form.title.trim(),
            description: form.description.trim(),
            type: "image",
            itemType: "image",
            block_type_id: BLOCK_TYPE_IDS.image,
        };
    }

    if (type === "pdf") {
        return {
            title: form.title.trim(),
            description: form.description.trim(),
            type: "pdf",
            itemType: "pdf",
            block_type_id: BLOCK_TYPE_IDS.pdf,
        };
    }

    return {
        text: form.text.trim(),
        title: form.title.trim(),
        type: "text",
        itemType: "text",
        block_type_id: BLOCK_TYPE_IDS.text,
    };
}

function buildLessonBlockPayload(
    block: LessonBlock,
    type: LessonItemType,
    form: FormState,
    selectedFile: File | null,
): LessonBlockPayloadWithFile {
    const completionValue = DEFAULT_COMPLETION_VALUE[type];

    const payload: LessonBlockPayloadWithFile = {
        lesson_id: block.lesson_id,
        block_type_id: BLOCK_TYPE_IDS[type],
        completion_type: DEFAULT_COMPLETION_TYPE[type],
        order: block.order,
        is_required: form.is_required,
        is_active: form.is_active,
        deleted: false,
        content: buildContentPayload(type, form),
    };

    if (typeof completionValue === "number") {
        payload.completion_value =
            typeof form.completion_value === "number"
                ? form.completion_value
                : completionValue;
    }

    if ((type === "image" || type === "pdf") && selectedFile) {
        payload.file = selectedFile;
    }

    return payload;
}

export function LessonItemEditorPage({
    courseId,
    itemId,
}: LessonItemEditorPageProps) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith("/admin");

    const backHref = isAdminRoute
        ? `/admin/modules/${courseId}`
        : `/teacher/courses/${courseId}/modules`;

    const numericCourseId = useMemo(() => Number(courseId), [courseId]);
    const numericItemId = useMemo(() => Number(itemId), [itemId]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [block, setBlock] = useState<LessonBlock | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const itemType = getItemType(block);
    const itemTypeLabel = getItemTypeLabel(itemType);
    const existingFileUrl = block ? getExistingFileUrl(block.content ?? {}) : "";
    const fullExistingFileUrl = existingFileUrl
        ? normalizeUrl(existingFileUrl)
        : "";

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setNotice("");
            setSelectedFile(null);

            if (!numericCourseId || Number.isNaN(numericCourseId)) {
                throw new Error("No se pudo identificar el curso.");
            }

            if (!numericItemId || Number.isNaN(numericItemId)) {
                throw new Error("No se pudo identificar el bloque seleccionado.");
            }

            const currentBlock = await getLessonBlock(numericItemId);

            setBlock(currentBlock);
            setForm(getFormFromBlock(currentBlock));
        } catch (err) {
            setError(getErrorMessage(err));
            setBlock(null);
        } finally {
            setLoading(false);
        }
    }, [numericCourseId, numericItemId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadDetail();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadDetail]);

    function handleAddQuestion() {
        setForm((current) => {
            const lastId = current.quiz_questions.reduce(
                (maxId, question) => Math.max(maxId, question.id),
                0,
            );

            return {
                ...current,
                quiz_questions: [
                    ...current.quiz_questions,
                    createQuestion(lastId + 1),
                ],
            };
        });
    }

    function handleRemoveQuestion(questionId: number) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.filter(
                (question) => question.id !== questionId,
            ),
        }));
    }

    function handleChangeQuestion(questionId: number, value: string) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        question: value,
                    }
                    : question,
            ),
        }));
    }

    function handleChangeOption(
        questionId: number,
        optionIndex: number,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) => {
                if (question.id !== questionId) return question;

                return {
                    ...question,
                    options: question.options.map((option, index) =>
                        index === optionIndex ? value : option,
                    ),
                };
            }),
        }));
    }

    function handleChangeCorrectAnswer(questionId: number, value: number) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        correct_answer: value,
                    }
                    : question,
            ),
        }));
    }

    function handleChangePoints(questionId: number, value: number) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        points: value,
                    }
                    : question,
            ),
        }));
    }

    function handleSelectedFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (!file) return;

        if (itemType === "image") {
            const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];

            if (!allowedImageTypes.includes(file.type)) {
                setError("Solo puedes subir imágenes PNG, JPG o WEBP.");
                event.target.value = "";
                return;
            }
        }

        if (itemType === "pdf" && file.type !== "application/pdf") {
            setError("Solo puedes subir archivos PDF.");
            event.target.value = "";
            return;
        }

        setError("");
        setSelectedFile(file);
        event.target.value = "";
    }

    function validateForm() {
        if (!form.title.trim()) {
            throw new Error("Ingresa el título.");
        }

        if (itemType === "text" && !form.text.trim()) {
            throw new Error("Ingresa el texto de la lección.");
        }

        if (itemType === "video" && !form.video_url.trim()) {
            throw new Error("Ingresa la URL del video.");
        }

        if (
            (itemType === "image" || itemType === "pdf") &&
            !selectedFile &&
            !existingFileUrl
        ) {
            throw new Error(
                itemType === "image"
                    ? "Selecciona una imagen para guardar este bloque."
                    : "Selecciona un archivo PDF para guardar este bloque.",
            );
        }

        if (itemType === "quiz") {
            if (form.quiz_questions.length === 0) {
                throw new Error("Agrega al menos una pregunta para la evaluación.");
            }

            const hasEmptyQuestion = form.quiz_questions.some(
                (question) => !question.question.trim(),
            );

            if (hasEmptyQuestion) {
                throw new Error("Todas las preguntas deben tener texto.");
            }

            const hasEmptyOptions = form.quiz_questions.some((question) =>
                question.options.some((option) => !option.trim()),
            );

            if (hasEmptyOptions) {
                throw new Error(
                    "Todas las opciones de las preguntas deben estar completas.",
                );
            }

            const hasInvalidAnswer = form.quiz_questions.some(
                (question) =>
                    question.correct_answer < 0 || question.correct_answer > 3,
            );

            if (hasInvalidAnswer) {
                throw new Error("Selecciona una respuesta correcta válida.");
            }
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setNotice("");

            if (!block) {
                throw new Error("No se encontró el bloque seleccionado.");
            }

            validateForm();

            const payload = buildLessonBlockPayload(
                block,
                itemType,
                form,
                selectedFile,
            );

            const updatedBlock = await updateLessonBlock(
                numericItemId,
                payload as LessonBlockPayload,
            );

            setBlock(updatedBlock);
            setForm(getFormFromBlock(updatedBlock));
            setSelectedFile(null);
            setNotice("Información guardada correctamente.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href={backHref}
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a módulos
                </Link>
            </div>

            {loading ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-600">
                        Cargando información...
                    </p>
                </div>
            ) : null}

            {!loading && error && !block ? (
                <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                        <AlertCircle className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-xl font-black text-red-800">
                        No se pudo abrir el contenido
                    </h2>

                    <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-red-700">
                        {error}
                    </p>

                    <Link
                        href={backHref}
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                        Volver a módulos
                    </Link>
                </div>
            ) : null}

            {!loading && block ? (
                <>
                    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-6 md:px-8">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                                        {renderItemIcon(itemType, "h-3.5 w-3.5")}
                                        {itemTypeLabel}
                                    </div>

                                    <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                                        {form.title || `Bloque ${block.id}`}
                                    </h1>

                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                        Lección #{block.lesson_id} / Orden #
                                        {block.order}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
                                        Block type ID
                                    </p>

                                    <p className="mt-1 text-2xl font-black">
                                        {BLOCK_TYPE_IDS[itemType]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {notice ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            {notice}
                        </div>
                    ) : null}

                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-6 xl:grid-cols-[1fr_360px]"
                    >
                        <div className="space-y-6">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-black text-slate-950">
                                    Información general
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Edita la información principal que verá el
                                    estudiante.
                                </p>

                                <div className="mt-6 space-y-2">
                                    <label className="block text-[13px] font-bold text-slate-700">
                                        Título
                                    </label>

                                    <input
                                        value={form.title}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                title: event.target.value,
                                            }))
                                        }
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {itemType === "text" ? (
                                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-xl font-black text-slate-950">
                                        Texto de la lección
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Este bloque se guarda como texto simple.
                                    </p>

                                    <textarea
                                        value={form.text}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                text: event.target.value,
                                            }))
                                        }
                                        placeholder="Escribe el texto que verá el estudiante..."
                                        className="mt-5 min-h-[360px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-7 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            ) : null}

                            {itemType === "image" || itemType === "pdf" ? (
                                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-xl font-black text-slate-950">
                                        {itemType === "image"
                                            ? "Imagen de la lección"
                                            : "PDF de la lección"}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {itemType === "image"
                                            ? "Selecciona una imagen PNG, JPG o WEBP."
                                            : "Selecciona un archivo PDF."}
                                    </p>

                                    <div className="mt-5 space-y-2">
                                        <label className="block text-[13px] font-bold text-slate-700">
                                            Descripción
                                        </label>

                                        <textarea
                                            value={form.description}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    description:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="Describe brevemente el material..."
                                            className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                                        <label className="block cursor-pointer text-center">
                                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                                                <UploadCloud className="h-6 w-6" />
                                            </span>

                                            <span className="mt-3 block text-sm font-black text-slate-800">
                                                {itemType === "image"
                                                    ? "Subir imagen"
                                                    : "Subir PDF"}
                                            </span>

                                            <span className="mt-1 block text-xs font-semibold text-slate-500">
                                                {itemType === "image"
                                                    ? "Formatos permitidos: PNG, JPG, WEBP"
                                                    : "Formato permitido: PDF"}
                                            </span>

                                            <input
                                                type="file"
                                                accept={
                                                    itemType === "image"
                                                        ? "image/png,image/jpeg,image/webp"
                                                        : "application/pdf"
                                                }
                                                onChange={handleSelectedFile}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        {selectedFile ? (
                                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black text-blue-950">
                                                        {selectedFile.name}
                                                    </p>

                                                    <p className="text-xs font-semibold text-blue-700">
                                                        Nuevo archivo
                                                        seleccionado ·{" "}
                                                        {(
                                                            selectedFile.size /
                                                            1024
                                                        ).toFixed(1)}{" "}
                                                        KB
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFile(null)
                                                    }
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700 transition hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : null}

                                        {fullExistingFileUrl ? (
                                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black text-slate-950">
                                                        Archivo actual
                                                    </p>

                                                    <p className="truncate text-xs font-semibold text-slate-500">
                                                        {existingFileUrl}
                                                    </p>
                                                </div>

                                                <a
                                                    href={fullExistingFileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    Ver
                                                </a>
                                            </div>
                                        ) : null}

                                        {!selectedFile &&
                                            !fullExistingFileUrl ? (
                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                                                Todavía no has seleccionado
                                                archivo.
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            {itemType === "video" ? (
                                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-xl font-black text-slate-950">
                                        Video de la lección
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Se guardará con block_type_id 1 y
                                        completion_type VER.
                                    </p>

                                    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
                                        <div className="space-y-2">
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                URL del video
                                            </label>

                                            <input
                                                value={form.video_url}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        video_url:
                                                            event.target.value,
                                                    }))
                                                }
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                Proveedor
                                            </label>

                                            <input
                                                value={form.video_provider}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        video_provider:
                                                            event.target.value,
                                                    }))
                                                }
                                                placeholder="youtube"
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-2">
                                        <label className="block text-[13px] font-bold text-slate-700">
                                            Porcentaje mínimo para completar
                                        </label>

                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={form.completion_value}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    completion_value: Number(
                                                        event.target.value,
                                                    ),
                                                }))
                                            }
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {itemType === "quiz" ? (
                                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-950">
                                                Configuración de la evaluación
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Se guardará con block_type_id 2
                                                y completion_type RESPONDER.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddQuestion}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Pregunta
                                        </button>
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
                                        <div className="space-y-2">
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                Instrucciones de la evaluación
                                            </label>

                                            <textarea
                                                value={form.quiz_instructions}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        quiz_instructions:
                                                            event.target.value,
                                                    }))
                                                }
                                                placeholder="Ej: Responda cada pregunta según el contenido revisado..."
                                                className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                Nota mínima
                                            </label>

                                            <input
                                                type="number"
                                                min={0}
                                                value={form.completion_value}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        completion_value: Number(
                                                            event.target.value,
                                                        ),
                                                    }))
                                                }
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-4">
                                        {form.quiz_questions.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                                Todavía no has agregado
                                                preguntas.
                                            </div>
                                        ) : (
                                            form.quiz_questions.map(
                                                (question, index) => (
                                                    <div
                                                        key={question.id}
                                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                    >
                                                        <div className="mb-4 flex items-center justify-between gap-3">
                                                            <p className="text-sm font-black text-slate-950">
                                                                Pregunta{" "}
                                                                {index + 1}
                                                            </p>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveQuestion(
                                                                        question.id,
                                                                    )
                                                                }
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="block text-xs font-bold text-slate-600">
                                                                    Texto de la
                                                                    pregunta
                                                                </label>

                                                                <input
                                                                    value={
                                                                        question.question
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        handleChangeQuestion(
                                                                            question.id,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Ej: ¿Qué es Python?"
                                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                                />
                                                            </div>

                                                            <div className="grid gap-3 md:grid-cols-2">
                                                                {question.options.map(
                                                                    (
                                                                        option,
                                                                        optionIndex,
                                                                    ) => (
                                                                        <div
                                                                            key={`${question.id}-${optionIndex}`}
                                                                            className="space-y-2"
                                                                        >
                                                                            <label className="block text-xs font-bold text-slate-600">
                                                                                Opción{" "}
                                                                                {optionIndex +
                                                                                    1}
                                                                            </label>

                                                                            <input
                                                                                value={
                                                                                    option
                                                                                }
                                                                                onChange={(
                                                                                    event,
                                                                                ) =>
                                                                                    handleChangeOption(
                                                                                        question.id,
                                                                                        optionIndex,
                                                                                        event
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                placeholder={`Opción ${optionIndex +
                                                                                    1
                                                                                    }`}
                                                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                                            />
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>

                                                            <div className="grid gap-3 md:grid-cols-2">
                                                                <div className="space-y-2">
                                                                    <label className="block text-xs font-bold text-slate-600">
                                                                        Respuesta
                                                                        correcta
                                                                    </label>

                                                                    <select
                                                                        value={
                                                                            question.correct_answer
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            handleChangeCorrectAnswer(
                                                                                question.id,
                                                                                Number(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                                    >
                                                                        <option
                                                                            value={
                                                                                0
                                                                            }
                                                                        >
                                                                            Opción
                                                                            1
                                                                        </option>
                                                                        <option
                                                                            value={
                                                                                1
                                                                            }
                                                                        >
                                                                            Opción
                                                                            2
                                                                        </option>
                                                                        <option
                                                                            value={
                                                                                2
                                                                            }
                                                                        >
                                                                            Opción
                                                                            3
                                                                        </option>
                                                                        <option
                                                                            value={
                                                                                3
                                                                            }
                                                                        >
                                                                            Opción
                                                                            4
                                                                        </option>
                                                                    </select>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="block text-xs font-bold text-slate-600">
                                                                        Puntos
                                                                    </label>

                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        value={
                                                                            question.points
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            handleChangePoints(
                                                                                question.id,
                                                                                Number(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <aside className="space-y-5">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                    {renderItemIcon(itemType, "h-6 w-6")}
                                </div>

                                <h2 className="mt-4 text-lg font-black text-slate-950">
                                    Resumen
                                </h2>

                                <div className="mt-5 space-y-3">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                            Lección
                                        </p>

                                        <p className="mt-1 text-sm font-black text-slate-950">
                                            #{block.lesson_id}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                            Tipo
                                        </p>

                                        <p className="mt-1 text-sm font-black text-slate-950">
                                            {itemTypeLabel}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                            Block type ID
                                        </p>

                                        <p className="mt-1 text-sm font-black text-slate-950">
                                            {BLOCK_TYPE_IDS[itemType]}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                            Completion type
                                        </p>

                                        <p className="mt-1 text-sm font-black text-slate-950">
                                            {DEFAULT_COMPLETION_TYPE[itemType]}
                                        </p>
                                    </div>

                                    <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-bold text-slate-700">
                                            Obligatorio
                                        </span>

                                        <input
                                            type="checkbox"
                                            checked={form.is_required}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    is_required:
                                                        event.target.checked,
                                                }))
                                            }
                                            className="h-5 w-5 accent-blue-700"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-bold text-slate-700">
                                            Activo
                                        </span>

                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    is_active:
                                                        event.target.checked,
                                                }))
                                            }
                                            className="h-5 w-5 accent-blue-700"
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,99,216,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    "Guardando..."
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Guardar información
                                    </>
                                )}
                            </button>

                            {notice ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <CheckCircle2 className="h-5 w-5" />

                                        <p className="text-sm font-bold">
                                            Guardado correctamente
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </aside>
                    </form>
                </>
            ) : null}
        </section>
    );
}

export default LessonItemEditorPage;