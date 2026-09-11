"use client";

import {
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileText,
    ImageIcon,
    MessageSquare,
    PlayCircle,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    CourseModuleView,
    LessonItemView,
    LessonView,
} from "../types";

import {
    getItemLabel,
} from "../utils";

import {
    ItemIcon,
} from "./ItemIcon";

/* =========================================================
 * CONFIG
 * ======================================================= */

const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://sysathena.gaiaecsa.com";

/*
 * NEXT_PUBLIC_API_URL puede venir como:
 *
 * https://sysathena.gaiaecsa.com
 *
 * o:
 *
 * https://sysathena.gaiaecsa.com/api/v1
 *
 * Para los archivos necesitamos únicamente el ORIGIN:
 *
 * https://sysathena.gaiaecsa.com
 */
function getApiOrigin() {
    const cleanUrl =
        RAW_API_URL
            .trim()
            .replace(/\/+$/, "");

    return cleanUrl
        .replace(
            /\/api\/v1$/i,
            "",
        )
        .replace(
            /\/api$/i,
            "",
        );
}

const API_ORIGIN =
    getApiOrigin();

/* =========================================================
 * TYPES
 * ======================================================= */

type CoursePreviewModalProps = {
    open: boolean;
    courseName: string;
    modules: CourseModuleView[];
    onClose: () => void;
};

type AnyRecord =
    Record<string, unknown>;

/* =========================================================
 * GENERIC HELPERS
 * ======================================================= */

function getContentRecord(
    value: unknown,
): AnyRecord {
    if (!value) {
        return {};
    }

    if (
        typeof value ===
        "object" &&
        !Array.isArray(value)
    ) {
        return value as AnyRecord;
    }

    if (
        typeof value ===
        "string"
    ) {
        try {
            const parsed =
                JSON.parse(
                    value,
                ) as unknown;

            if (
                parsed &&
                typeof parsed ===
                "object" &&
                !Array.isArray(
                    parsed,
                )
            ) {
                return parsed as AnyRecord;
            }
        } catch {
            return {};
        }
    }

    return {};
}

function getString(
    record: AnyRecord,
    ...keys: string[]
) {
    for (
        const key of keys
    ) {
        const value =
            record[key];

        if (
            typeof value ===
            "string" &&
            value.trim()
        ) {
            return value.trim();
        }

        if (
            typeof value ===
            "number"
        ) {
            return String(
                value,
            );
        }
    }

    return "";
}

/* =========================================================
 * FILE / MEDIA URL
 * ======================================================= */

function normalizeMediaUrl(
    value: unknown,
) {
    if (
        typeof value !==
        "string"
    ) {
        return "";
    }

    const url =
        value.trim();

    if (!url) {
        return "";
    }

    /*
     * Ya es una URL absoluta.
     */
    if (
        /^https?:\/\//i.test(
            url,
        )
    ) {
        return url;
    }

    /*
     * blob URL.
     */
    if (
        url.startsWith(
            "blob:",
        )
    ) {
        return url;
    }

    /*
     * Base64/data URL.
     */
    if (
        url.startsWith(
            "data:",
        )
    ) {
        return url;
    }

    /*
     * //dominio.com/archivo
     */
    if (
        url.startsWith("//")
    ) {
        return `https:${url}`;
    }

    /*
     * Backend devuelve:
     *
     * /uploads/lesson_blocks/...
     *
     * Resultado:
     *
     * https://sysathena.gaiaecsa.com/uploads/lesson_blocks/...
     */
    if (
        url.startsWith("/")
    ) {
        return `${API_ORIGIN}${url}`;
    }

    /*
     * Backend devuelve:
     *
     * uploads/lesson_blocks/...
     */
    return `${API_ORIGIN}/${url}`;
}

function getExistingFileUrl(
    content: AnyRecord,
) {
    /*
     * En tu API real la imagen viene así:
     *
     * content.file_url
     *
     * Damos prioridad a file_url.
     */
    const rawUrl =
        getString(
            content,
            "file_url",
            "url",
            "path",
            "file_path",
            "src",
            "image_url",
            "document_url",
            "pdf_url",
        );

    return normalizeMediaUrl(
        rawUrl,
    );
}

/* =========================================================
 * VIDEO
 * ======================================================= */

function getYouTubeEmbedUrl(
    value: string,
) {
    const url =
        value.trim();

    if (!url) {
        return "";
    }

    try {
        const parsed =
            new URL(url);

        /*
         * youtu.be/xxxxx
         */
        if (
            parsed.hostname.includes(
                "youtu.be",
            )
        ) {
            const videoId =
                parsed.pathname
                    .replace(
                        /^\/+/,
                        "",
                    )
                    .split("/")[0];

            return videoId
                ? `https://www.youtube.com/embed/${videoId}`
                : "";
        }

        /*
         * youtube.com
         */
        if (
            parsed.hostname.includes(
                "youtube.com",
            )
        ) {
            /*
             * Ya viene /embed/
             */
            if (
                parsed.pathname.startsWith(
                    "/embed/",
                )
            ) {
                return url;
            }

            /*
             * Shorts.
             */
            if (
                parsed.pathname.startsWith(
                    "/shorts/",
                )
            ) {
                const videoId =
                    parsed.pathname
                        .replace(
                            "/shorts/",
                            "",
                        )
                        .split(
                            "/",
                        )[0];

                return videoId
                    ? `https://www.youtube.com/embed/${videoId}`
                    : "";
            }

            /*
             * watch?v=
             */
            const videoId =
                parsed.searchParams.get(
                    "v",
                );

            return videoId
                ? `https://www.youtube.com/embed/${videoId}`
                : "";
        }

        return url;
    } catch {
        return url;
    }
}

/* =========================================================
 * STUDENT VISIBILITY
 * ======================================================= */

function isAvailableForStudent(
    item: LessonItemView,
) {
    /*
     * Para preview ocultamos únicamente
     * actividades explícitamente inactivas.
     */
    if (
        item.is_active ===
        false
    ) {
        return false;
    }

    return true;
}

function getVisibleItems(
    lesson: LessonView,
) {
    return lesson.items.filter(
        isAvailableForStudent,
    );
}

/* =========================================================
 * PREVIEW ITEM
 * ======================================================= */

function PreviewItem({
    item,
}: {
    item: LessonItemView;
}) {
    const content =
        getContentRecord(
            item.content,
        );

    const title =
        getString(
            content,
            "title",
            "name",
            "label",
        ) || item.title;

    const text =
        getString(
            content,
            "text",
            "description",
            "instructions",
            "body",
            "content",
        );

    /* =====================================================
     * TEXT
     * =================================================== */

    if (
        item.type === "text"
    ) {
        return (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="text-lg font-black text-slate-950">
                        {title}
                    </h3>
                </div>

                <div className="p-5 sm:p-6">
                    {text ? (
                        /*
                         * El editor está guardando HTML.
                         *
                         * Esto permite que:
                         *
                         * <strong>
                         * <h2>
                         * <p>
                         *
                         * se rendericen realmente.
                         *
                         * En producción idealmente el backend
                         * debe sanitizar este HTML.
                         */
                        <div
                            className="prose prose-slate max-w-none text-sm leading-7 sm:text-base"
                            dangerouslySetInnerHTML={{
                                __html: text,
                            }}
                        />
                    ) : (
                        <p className="text-sm text-slate-400">
                            Este bloque todavía
                            no tiene contenido.
                        </p>
                    )}
                </div>
            </article>
        );
    }

    /* =====================================================
     * IMAGE
     * =================================================== */

    if (
        item.type === "image"
    ) {
        const imageUrl =
            getExistingFileUrl(
                content,
            );

        const alt =
            getString(
                content,
                "alt",
            ) ||
            title;

        return (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-[#172861]" />

                        <h3 className="font-black text-slate-950">
                            {title}
                        </h3>
                    </div>
                </div>

                {imageUrl ? (
                    <div className="flex min-h-[180px] items-center justify-center bg-slate-50 p-4 sm:p-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={
                                imageUrl
                            }
                            alt={
                                alt
                            }
                            className="max-h-[650px] max-w-full rounded-xl object-contain"
                            onError={(
                                event,
                            ) => {
                                console.error(
                                    "[CoursePreview] Error cargando imagen",
                                    {
                                        itemId:
                                            item.id,
                                        content,
                                        resolvedUrl:
                                            imageUrl,
                                        apiOrigin:
                                            API_ORIGIN,
                                    },
                                );

                                event.currentTarget.style.display =
                                    "none";

                                const fallback =
                                    event.currentTarget
                                        .nextElementSibling;

                                if (
                                    fallback instanceof
                                    HTMLElement
                                ) {
                                    fallback.style.display =
                                        "flex";
                                }
                            }}
                        />

                        <div
                            style={{
                                display:
                                    "none",
                            }}
                            className="min-h-[180px] w-full items-center justify-center text-slate-400"
                        >
                            <div className="text-center">
                                <ImageIcon className="mx-auto mb-3 h-10 w-10" />

                                <p className="text-sm font-semibold">
                                    No se pudo
                                    cargar la
                                    imagen
                                </p>

                                <p className="mt-1 max-w-md break-all text-xs text-slate-400">
                                    {
                                        imageUrl
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-[220px] items-center justify-center bg-slate-50 p-6 text-slate-400">
                        <div className="text-center">
                            <ImageIcon className="mx-auto mb-3 h-9 w-9" />

                            <p className="text-sm font-semibold">
                                Imagen no
                                disponible
                            </p>

                            <p className="mt-1 text-xs">
                                No existe
                                file_url en el
                                contenido.
                            </p>
                        </div>
                    </div>
                )}
            </article>
        );
    }

    /* =====================================================
     * VIDEO
     * =================================================== */

    if (
        item.type === "video"
    ) {
        const videoUrl =
            getString(
                content,
                "video_url",
                "url",
                "src",
            );

        const embedUrl =
            getYouTubeEmbedUrl(
                videoUrl,
            );

        return (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-[#172861]" />

                        <h3 className="font-black text-slate-950">
                            {title}
                        </h3>
                    </div>
                </div>

                {embedUrl ? (
                    <div className="aspect-video w-full bg-black">
                        <iframe
                            src={
                                embedUrl
                            }
                            title={
                                title
                            }
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-950 text-white">
                        <div className="text-center">
                            <PlayCircle className="mx-auto mb-2 h-10 w-10" />

                            <p className="text-sm">
                                Video no
                                configurado
                            </p>
                        </div>
                    </div>
                )}
            </article>
        );
    }

    /* =====================================================
     * PDF
     * =================================================== */

    if (
        item.type === "pdf"
    ) {
        const pdfUrl =
            getExistingFileUrl(
                content,
            );

        return (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-red-600" />

                        <div className="min-w-0">
                            <h3 className="truncate font-black text-slate-950">
                                {title}
                            </h3>

                            {text ? (
                                <p className="mt-1 truncate text-xs text-slate-500">
                                    {text}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {pdfUrl ? (
                        <a
                            href={
                                pdfUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded-xl bg-[#172861] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0B163F]"
                        >
                            Abrir PDF
                        </a>
                    ) : null}
                </div>

                {pdfUrl ? (
                    <iframe
                        src={
                            pdfUrl
                        }
                        title={
                            title
                        }
                        className="h-[650px] w-full bg-slate-100"
                    />
                ) : (
                    <div className="flex h-64 items-center justify-center bg-slate-50 text-slate-400">
                        <div className="text-center">
                            <FileText className="mx-auto mb-2 h-9 w-9" />

                            <span className="text-sm">
                                PDF no disponible
                            </span>
                        </div>
                    </div>
                )}
            </article>
        );
    }

    /* =====================================================
     * QUIZ
     * =================================================== */

    if (
        item.type === "quiz"
    ) {
        const questionsRaw =
            content.questions ??
            content.quiz_questions;

        const questions =
            Array.isArray(
                questionsRaw,
            )
                ? questionsRaw
                : [];

        const instructions =
            getString(
                content,
                "quiz_instructions",
                "instructions",
                "description",
            );

        return (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">
                            Evaluación
                        </span>

                        <h3 className="mt-1 text-lg font-black text-slate-950">
                            {title}
                        </h3>

                        {instructions ? (
                            <p className="mt-2 text-sm text-slate-600">
                                {
                                    instructions
                                }
                            </p>
                        ) : null}
                    </div>

                    <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        {
                            questions.length
                        }{" "}
                        {questions.length ===
                            1
                            ? "pregunta"
                            : "preguntas"}
                    </span>
                </div>

                {questions.length ===
                    0 ? (
                    <p className="text-sm text-slate-500">
                        Este quiz todavía
                        no tiene preguntas.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {questions.map(
                            (
                                question,
                                index,
                            ) => {
                                const record =
                                    getContentRecord(
                                        question,
                                    );

                                const questionText =
                                    getString(
                                        record,
                                        "question",
                                        "text",
                                        "title",
                                        "label",
                                    );

                                const optionsRaw =
                                    record.options ??
                                    record.answers;

                                const options =
                                    Array.isArray(
                                        optionsRaw,
                                    )
                                        ? optionsRaw
                                        : [];

                                return (
                                    <div
                                        key={
                                            index
                                        }
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div className="flex gap-3">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#172861] text-xs font-bold text-white">
                                                {index +
                                                    1}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="pt-1 text-sm font-semibold text-slate-800">
                                                    {questionText ||
                                                        `Pregunta ${index +
                                                        1
                                                        }`}
                                                </p>

                                                {options.length >
                                                    0 ? (
                                                    <div className="mt-3 space-y-2">
                                                        {options.map(
                                                            (
                                                                option,
                                                                optionIndex,
                                                            ) => {
                                                                const optionRecord =
                                                                    getContentRecord(
                                                                        option,
                                                                    );

                                                                const optionText =
                                                                    typeof option ===
                                                                        "string"
                                                                        ? option
                                                                        : getString(
                                                                            optionRecord,
                                                                            "text",
                                                                            "label",
                                                                            "name",
                                                                            "value",
                                                                        );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            optionIndex
                                                                        }
                                                                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                                                    >
                                                                        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />

                                                                        <span className="text-sm text-slate-600">
                                                                            {optionText ||
                                                                                `Opción ${optionIndex +
                                                                                1
                                                                                }`}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}
            </article>
        );
    }

    /* =====================================================
     * HOMEWORK
     * =================================================== */

    if (
        item.type ===
        "homework"
    ) {
        const instructions =
            getString(
                content,
                "instructions",
                "description",
                "text",
            );

        const maxScore =
            getString(
                content,
                "max_score",
                "maxScore",
                "score",
            );

        return (
            <article className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-purple-600">
                            Tarea
                        </span>

                        <h3 className="mt-1 text-lg font-black text-slate-950">
                            {title}
                        </h3>
                    </div>

                    {maxScore ? (
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                            {
                                maxScore
                            }{" "}
                            puntos
                        </span>
                    ) : null}
                </div>

                {instructions ? (
                    <div
                        className="mt-4 text-sm leading-7 text-slate-700"
                        dangerouslySetInnerHTML={{
                            __html:
                                instructions,
                        }}
                    />
                ) : (
                    <p className="mt-4 text-sm text-slate-400">
                        La tarea todavía
                        no tiene instrucciones.
                    </p>
                )}

                <div className="mt-5 rounded-xl border border-dashed border-purple-200 bg-purple-50 p-5 text-center">
                    <p className="text-sm font-semibold text-purple-700">
                        Entrega del
                        estudiante
                    </p>

                    <p className="mt-1 text-xs text-purple-500">
                        Aquí el estudiante
                        podrá adjuntar su
                        archivo.
                    </p>

                    <button
                        type="button"
                        disabled
                        className="mt-4 rounded-xl bg-purple-200 px-4 py-2 text-xs font-bold text-purple-500 opacity-70"
                    >
                        Adjuntar archivo
                    </button>
                </div>
            </article>
        );
    }

    /* =====================================================
     * SURVEY
     * =================================================== */

    if (
        item.type === "survey"
    ) {
        const questionsRaw =
            content.questions ??
            content.survey_questions;

        const questions =
            Array.isArray(
                questionsRaw,
            )
                ? questionsRaw
                : [];

        const instructions =
            getString(
                content,
                "survey_instructions",
                "instructions",
                "description",
            );

        return (
            <article className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                            Encuesta
                        </span>

                        <h3 className="mt-1 text-lg font-black text-slate-950">
                            {title}
                        </h3>
                    </div>

                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                        {
                            questions.length
                        }{" "}
                        {questions.length ===
                            1
                            ? "pregunta"
                            : "preguntas"}
                    </span>
                </div>

                {instructions ? (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                        {
                            instructions
                        }
                    </p>
                ) : null}

                {questions.length >
                    0 ? (
                    <div className="mt-5 space-y-3">
                        {questions.map(
                            (
                                question,
                                index,
                            ) => {
                                const record =
                                    getContentRecord(
                                        question,
                                    );

                                const questionText =
                                    getString(
                                        record,
                                        "question",
                                        "text",
                                        "title",
                                        "label",
                                    );

                                return (
                                    <div
                                        key={
                                            index
                                        }
                                        className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4"
                                    >
                                        <p className="text-sm font-semibold text-slate-800">
                                            {index +
                                                1}
                                            .{" "}
                                            {questionText ||
                                                `Pregunta ${index +
                                                1
                                                }`}
                                        </p>
                                    </div>
                                );
                            },
                        )}
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-slate-400">
                        Esta encuesta
                        todavía no tiene
                        preguntas.
                    </p>
                )}
            </article>
        );
    }

    /* =====================================================
     * FORUM
     * =================================================== */

    if (
        item.type === "forum"
    ) {
        const prompt =
            getString(
                content,
                "forum_prompt",
                "prompt",
                "instructions",
                "description",
            );

        return (
            <article className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                        <MessageSquare className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
                            Foro
                        </span>

                        <h3 className="mt-1 text-lg font-black text-slate-950">
                            {title}
                        </h3>

                        {prompt ? (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {
                                    prompt
                                }
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                        Participar en el
                        foro
                    </p>

                    <textarea
                        disabled
                        placeholder="Escribe tu participación..."
                        className="mt-3 min-h-24 w-full resize-none rounded-xl border border-orange-100 bg-white p-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    />

                    <button
                        type="button"
                        disabled
                        className="mt-3 rounded-xl bg-orange-200 px-4 py-2 text-xs font-bold text-orange-500 opacity-70"
                    >
                        Publicar
                    </button>
                </div>
            </article>
        );
    }

    return null;
}

/* =========================================================
 * COURSE PREVIEW MODAL
 * ======================================================= */

export function CoursePreviewModal({
    open,
    courseName,
    modules,
    onClose,
}: CoursePreviewModalProps) {
    const [
        selectedLessonId,
        setSelectedLessonId,
    ] = useState("");

    const [
        openModules,
        setOpenModules,
    ] = useState<
        Record<string, boolean>
    >({});

    /* =====================================================
     * FLAT LESSONS
     * =================================================== */

    const lessons =
        useMemo(
            () =>
                modules.flatMap(
                    (
                        courseModule,
                    ) =>
                        courseModule.lessons,
                ),
            [
                modules,
            ],
        );

    /* =====================================================
     * CURRENT LESSON
     * =================================================== */

    const effectiveSelectedLessonId =
        lessons.some(
            (
                lesson,
            ) =>
                lesson.id ===
                selectedLessonId,
        )
            ? selectedLessonId
            : lessons[0]?.id ??
            "";

    const selectedLesson =
        lessons.find(
            (
                lesson,
            ) =>
                lesson.id ===
                effectiveSelectedLessonId,
        ) ?? null;

    const currentLessonIndex =
        selectedLesson
            ? lessons.findIndex(
                (
                    lesson,
                ) =>
                    lesson.id ===
                    selectedLesson.id,
            )
            : -1;

    const previousLesson =
        currentLessonIndex >
            0
            ? lessons[
            currentLessonIndex -
            1
            ]
            : null;

    const nextLesson =
        currentLessonIndex >=
            0 &&
            currentLessonIndex <
            lessons.length -
            1
            ? lessons[
            currentLessonIndex +
            1
            ]
            : null;

    const selectedVisibleItems =
        selectedLesson
            ? getVisibleItems(
                selectedLesson,
            )
            : [];

    /* =====================================================
     * SCROLL TO ITEM
     * =================================================== */

    function handleGoToItem(
        lessonId: string,
        itemId: string,
    ) {
        setSelectedLessonId(
            lessonId,
        );

        window.requestAnimationFrame(
            () => {
                window.requestAnimationFrame(
                    () => {
                        const element =
                            document.getElementById(
                                `preview-item-${itemId}`,
                            );

                        element?.scrollIntoView(
                            {
                                behavior:
                                    "smooth",
                                block:
                                    "start",
                            },
                        );
                    },
                );
            },
        );
    }

    function scrollMainToTop() {
        window.requestAnimationFrame(
            () => {
                document
                    .getElementById(
                        "course-preview-main",
                    )
                    ?.scrollTo({
                        top: 0,
                        behavior:
                            "smooth",
                    });
            },
        );
    }

    function handleSelectLesson(
        lessonId: string,
    ) {
        setSelectedLessonId(
            lessonId,
        );

        scrollMainToTop();
    }

    /* =====================================================
     * ESCAPE + BODY SCROLL
     * =================================================== */

    useEffect(() => {
        if (!open) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (
                event.key ===
                "Escape"
            ) {
                onClose();
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        const previousOverflow =
            document.body
                .style
                .overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [
        open,
        onClose,
    ]);

    if (!open) {
        return null;
    }

    /* =====================================================
     * RENDER
     * =================================================== */

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100">
            {/* =================================================
             * HEADER
             * =============================================== */}

            <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-white">
                        <BookOpen className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Vista previa del
                            estudiante
                        </p>

                        <h2
                            className="truncate text-sm font-black text-slate-950 sm:text-base"
                            title={
                                courseName
                            }
                        >
                            {
                                courseName
                            }
                        </h2>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-[#172861] sm:block">
                        Modo vista previa
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-[0.96]"
                        title="Cerrar vista previa"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-4rem)] min-w-0">
                {/* =================================================
                 * SIDEBAR
                 * =============================================== */}

                <aside className="hidden w-[320px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block xl:w-[350px]">
                    {/* HEADER */}

                    <div className="sticky top-0 z-20 border-b border-slate-100 bg-white p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Contenido del curso
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            {modules.length}{" "}
                            {modules.length ===
                                1
                                ? "módulo"
                                : "módulos"}{" "}
                            ·{" "}
                            {lessons.length}{" "}
                            {lessons.length ===
                                1
                                ? "lección"
                                : "lecciones"}
                        </p>
                    </div>

                    {/* MODULES */}

                    <div className="p-3">
                        {modules.length ===
                            0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                                El curso todavía
                                no tiene módulos.
                            </div>
                        ) : (
                            modules.map(
                                (
                                    courseModule,
                                    moduleIndex,
                                ) => {
                                    const moduleOpen =
                                        openModules[
                                        courseModule
                                            .id
                                        ] ??
                                        true;

                                    return (
                                        <div
                                            key={
                                                courseModule.id
                                            }
                                            className="mb-3"
                                        >
                                            {/* MODULE BUTTON */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenModules(
                                                        (
                                                            current,
                                                        ) => ({
                                                            ...current,
                                                            [courseModule.id]:
                                                                !moduleOpen,
                                                        }),
                                                    )
                                                }
                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                                            >
                                                <ChevronDown
                                                    className={`h-4 w-4 shrink-0 text-slate-400 transition ${moduleOpen
                                                            ? ""
                                                            : "-rotate-90"
                                                        }`}
                                                />

                                                <div className="min-w-0">
                                                    <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#172861]">
                                                        Módulo{" "}
                                                        {moduleIndex +
                                                            1}
                                                    </span>

                                                    <span
                                                        className="block truncate text-sm font-bold text-slate-800"
                                                        title={
                                                            courseModule.title
                                                        }
                                                    >
                                                        {
                                                            courseModule.title
                                                        }
                                                    </span>
                                                </div>
                                            </button>

                                            {/* LESSONS */}

                                            {moduleOpen ? (
                                                <div className="ml-5 border-l border-slate-200 pl-2">
                                                    {courseModule
                                                        .lessons
                                                        .length ===
                                                        0 ? (
                                                        <div className="px-3 py-3 text-xs text-slate-400">
                                                            Sin
                                                            lecciones
                                                        </div>
                                                    ) : (
                                                        courseModule.lessons.map(
                                                            (
                                                                lesson,
                                                                lessonIndex,
                                                            ) => {
                                                                const active =
                                                                    effectiveSelectedLessonId ===
                                                                    lesson.id;

                                                                const lessonItems =
                                                                    getVisibleItems(
                                                                        lesson,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            lesson.id
                                                                        }
                                                                        className="my-1"
                                                                    >
                                                                        {/* LESSON */}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleSelectLesson(
                                                                                    lesson.id,
                                                                                )
                                                                            }
                                                                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${active
                                                                                    ? "bg-blue-50 text-[#172861]"
                                                                                    : "text-slate-600 hover:bg-slate-50"
                                                                                }`}
                                                                        >
                                                                            <CheckCircle2
                                                                                className={`h-4 w-4 shrink-0 ${active
                                                                                        ? "text-[#172861]"
                                                                                        : "text-slate-300"
                                                                                    }`}
                                                                            />

                                                                            <span className="min-w-0 flex-1">
                                                                                <span className="block text-[9px] font-bold uppercase tracking-wide opacity-60">
                                                                                    Lección{" "}
                                                                                    {lessonIndex +
                                                                                        1}
                                                                                </span>

                                                                                <span
                                                                                    className="block truncate text-xs font-bold"
                                                                                    title={
                                                                                        lesson.title
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        lesson.title
                                                                                    }
                                                                                </span>
                                                                            </span>

                                                                            {lessonItems.length >
                                                                                0 ? (
                                                                                <span
                                                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${active
                                                                                            ? "bg-white text-[#172861]"
                                                                                            : "bg-slate-100 text-slate-400"
                                                                                        }`}
                                                                                >
                                                                                    {
                                                                                        lessonItems.length
                                                                                    }
                                                                                </span>
                                                                            ) : null}
                                                                        </button>

                                                                        {/* ITEMS */}

                                                                        {active ? (
                                                                            <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-2">
                                                                                {lessonItems.length ===
                                                                                    0 ? (
                                                                                    <div className="px-3 py-2 text-[11px] text-slate-400">
                                                                                        Sin
                                                                                        contenido
                                                                                    </div>
                                                                                ) : (
                                                                                    lessonItems.map(
                                                                                        (
                                                                                            item,
                                                                                            itemIndex,
                                                                                        ) => (
                                                                                            <button
                                                                                                key={
                                                                                                    item.id
                                                                                                }
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleGoToItem(
                                                                                                        lesson.id,
                                                                                                        item.id,
                                                                                                    )
                                                                                                }
                                                                                                title={
                                                                                                    item.title
                                                                                                }
                                                                                                className="group flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-500 transition hover:bg-slate-100 hover:text-[#172861]"
                                                                                            >
                                                                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-white group-hover:text-[#172861]">
                                                                                                    <ItemIcon
                                                                                                        type={
                                                                                                            item.type
                                                                                                        }
                                                                                                        className="h-3.5 w-3.5"
                                                                                                    />
                                                                                                </span>

                                                                                                <span className="min-w-0 flex-1">
                                                                                                    <span className="block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                                                                                        {getItemLabel(
                                                                                                            item.type,
                                                                                                        )}{" "}
                                                                                                        {itemIndex +
                                                                                                            1}
                                                                                                    </span>

                                                                                                    <span className="block truncate text-[11px] font-semibold">
                                                                                                        {
                                                                                                            item.title
                                                                                                        }
                                                                                                    </span>
                                                                                                </span>

                                                                                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                                                                                            </button>
                                                                                        ),
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            },
                                                        )
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                },
                            )
                        )}
                    </div>
                </aside>

                {/* =================================================
                 * MAIN
                 * =============================================== */}

                <main
                    id="course-preview-main"
                    className="min-w-0 flex-1 overflow-y-auto bg-slate-50"
                >
                    {!selectedLesson ? (
                        <div className="flex min-h-full items-center justify-center p-6">
                            <div className="max-w-md text-center">
                                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                    <BookOpen className="h-8 w-8 text-slate-300" />
                                </span>

                                <h3 className="mt-4 text-lg font-black text-slate-900">
                                    El curso
                                    todavía no
                                    tiene
                                    lecciones
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Agrega una
                                    lección para
                                    visualizar
                                    cómo verá el
                                    estudiante el
                                    contenido.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                            {/* MOBILE INFO */}

                            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Curso
                                </p>

                                <p className="mt-1 truncate text-sm font-black text-slate-900">
                                    {
                                        courseName
                                    }
                                </p>

                                <p className="mt-2 text-xs text-slate-500">
                                    Lección{" "}
                                    {currentLessonIndex +
                                        1}{" "}
                                    de{" "}
                                    {
                                        lessons.length
                                    }
                                </p>
                            </div>

                            {/* LESSON HEADER */}

                            <div className="mb-6">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#172861]">
                                    Lección{" "}
                                    {currentLessonIndex +
                                        1}{" "}
                                    de{" "}
                                    {
                                        lessons.length
                                    }
                                </p>

                                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                    {
                                        selectedLesson.title
                                    }
                                </h1>

                                <p className="mt-2 text-sm text-slate-500">
                                    {
                                        selectedVisibleItems.length
                                    }{" "}
                                    {selectedVisibleItems.length ===
                                        1
                                        ? "contenido disponible"
                                        : "contenidos disponibles"}
                                </p>
                            </div>

                            {/* ITEMS */}

                            <div className="space-y-5">
                                {selectedVisibleItems.length ===
                                    0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                                        <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

                                        <p className="mt-3 text-sm font-semibold text-slate-600">
                                            Esta
                                            lección
                                            todavía
                                            no tiene
                                            contenido
                                            disponible.
                                        </p>
                                    </div>
                                ) : (
                                    selectedVisibleItems.map(
                                        (
                                            item,
                                        ) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                id={`preview-item-${item.id}`}
                                                className="scroll-mt-6"
                                            >
                                                <PreviewItem
                                                    item={
                                                        item
                                                    }
                                                />
                                            </div>
                                        ),
                                    )
                                )}
                            </div>

                            {/* NAVIGATION */}

                            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
                                <button
                                    type="button"
                                    disabled={
                                        !previousLesson
                                    }
                                    onClick={() => {
                                        if (
                                            !previousLesson
                                        ) {
                                            return;
                                        }

                                        handleSelectLesson(
                                            previousLesson.id,
                                        );
                                    }}
                                    className="inline-flex h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                                >
                                    <ChevronRight className="h-4 w-4 shrink-0 rotate-180" />

                                    <span className="truncate">
                                        Anterior
                                    </span>
                                </button>

                                <div className="hidden text-center sm:block">
                                    <p className="text-xs font-semibold text-slate-400">
                                        {
                                            currentLessonIndex +
                                            1
                                        }{" "}
                                        /{" "}
                                        {
                                            lessons.length
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        !nextLesson
                                    }
                                    onClick={() => {
                                        if (
                                            !nextLesson
                                        ) {
                                            return;
                                        }

                                        handleSelectLesson(
                                            nextLesson.id,
                                        );
                                    }}
                                    className="inline-flex h-11 min-w-0 items-center gap-2 rounded-xl bg-[#172861] px-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                                >
                                    <span className="truncate">
                                        Siguiente
                                    </span>

                                    <ChevronRight className="h-4 w-4 shrink-0" />
                                </button>
                            </div>

                            <div className="h-8" />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default CoursePreviewModal;