"use client";

import DOMPurify from "dompurify";

import {
    CheckCircle2,
    Loader2,
} from "lucide-react";

import type { CourseRoomHook } from "../../hook";

import {
    getContentValue,
} from "../../utils";

/* =========================================================
   BOTÓN COMPLETAR
========================================================= */

type CompleteButtonProps = {
    blockId: number;

    label: string;

    completedBlocks: number[];

    progressSavingBlockId:
    | number
    | null;

    onComplete: (
        blockId: number,
    ) => Promise<number[] | null>;
};

export function CompleteButton({
    blockId,
    label,
    completedBlocks,
    progressSavingBlockId,
    onComplete,
}: CompleteButtonProps) {
    const isCompleted =
        completedBlocks.includes(
            blockId,
        );

    const isSaving =
        progressSavingBlockId ===
        blockId;

    return (
        <button
            type="button"
            disabled={
                isCompleted ||
                isSaving
            }
            onClick={() =>
                void onComplete(
                    blockId,
                )
            }
            className="
                inline-flex
                min-h-10
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[var(--primary)]
                px-4
                py-2.5
                text-center
                text-xs
                font-bold
                text-[var(--primary-foreground)]
                transition
                hover:opacity-95
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:w-auto
                sm:rounded-2xl
                sm:px-5
                sm:text-sm
            "
        >
            {isSaving ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}

            <span className="min-w-0 break-words">
                {isCompleted
                    ? "Bloque completado"
                    : label}
            </span>
        </button>
    );
}

/* =========================================================
   BLOQUE DE TEXTO
========================================================= */

type TextBlockProps = {
    room: CourseRoomHook;
};

export function TextBlock({
    room,
}: TextBlockProps) {
    if (!room.selectedBlock) {
        return null;
    }

    /* =====================================================
       OBTENER HTML
    ===================================================== */

    const body =
        getContentValue(
            room.selectedContent,
            "text",
        ) ||
        getContentValue(
            room.selectedContent,
            "body",
        ) ||
        getContentValue(
            room.selectedContent,
            "content_body",
        ) ||
        getContentValue(
            room.selectedContent,
            "description",
        );

    /* =====================================================
       SANITIZAR HTML

       Permitimos:
       - style
       - class
       - id
       - iframe
       - img
       - div
       - span
       - atributos iframe

       DOMPurify continúa eliminando elementos peligrosos
       como script.
    ===================================================== */

    const safeHtml = body
        ? DOMPurify.sanitize(
            String(body),
            {
                USE_PROFILES: {
                    html: true,
                },

                ADD_TAGS: [
                    "iframe",
                ],

                ADD_ATTR: [
                    /* HTML general */
                    "style",
                    "class",
                    "id",

                    /* imagen */
                    "src",
                    "alt",

                    /* tamaño */
                    "width",
                    "height",

                    /* iframe */
                    "frameborder",
                    "loading",
                    "allow",
                    "allowfullscreen",
                    "referrerpolicy",
                    "title",
                    "name",

                    /* links */
                    "href",
                    "target",
                    "rel",
                ],

                FORBID_TAGS: [
                    "script",
                ],
            },
        )
        : "";

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="min-w-0 space-y-4">
            {/* =================================================
                HTML DE LA LECCIÓN
            ================================================= */}

            <div className="min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[22px] sm:p-6">
                {safeHtml ? (
                    <div
                        className="student-lesson-html"
                        dangerouslySetInnerHTML={{
                            __html:
                                safeHtml,
                        }}
                    />
                ) : (
                    <p className="break-words text-sm text-slate-500">
                        Este texto todavía no
                        tiene información
                        cargada.
                    </p>
                )}
            </div>

            {/* =================================================
                COMPLETAR
            ================================================= */}

            <CompleteButton
                blockId={
                    room.selectedBlock.id
                }
                label="Marcar texto como completado"
                completedBlocks={
                    room.completedBlocks
                }
                progressSavingBlockId={
                    room.progressSavingBlockId
                }
                onComplete={
                    room.markBlockAsCompleted
                }
            />

            {/* =================================================
                ESTILOS POR DEFECTO

                IMPORTANTE:
                Estos son estilos por defecto.

                Los style="" que vienen desde el HTML
                tienen prioridad sobre estos estilos,
                porque aquí NO usamos !important.
            ================================================= */}

            <style jsx global>{`
                .student-lesson-html {
                    width: 100%;
                    min-width: 0;

                    color: #334155;

                    font-size: 0.875rem;
                    line-height: 1.8;

                    overflow-wrap: anywhere;
                    word-break: normal;
                }

                /* ==============================
                   PRIMER / ÚLTIMO ELEMENTO
                ============================== */

                .student-lesson-html
                    > *:first-child {
                    margin-top: 0;
                }

                .student-lesson-html
                    > *:last-child {
                    margin-bottom: 0;
                }

                /* ==============================
                   DIV
                ============================== */

                .student-lesson-html div {
                    max-width: 100%;
                }

                /* ==============================
                   PÁRRAFOS
                ============================== */

                .student-lesson-html p {
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;

                    line-height: 1.8;
                }

                /* ==============================
                   TÍTULOS
                ============================== */

                .student-lesson-html h1 {
                    margin-top: 1.75rem;
                    margin-bottom: 0.9rem;

                    font-size: 2rem;
                    line-height: 1.2;

                    font-weight: 900;

                    color: #0f172a;
                }

                .student-lesson-html h2 {
                    margin-top: 1.5rem;
                    margin-bottom: 0.8rem;

                    font-size: 1.6rem;
                    line-height: 1.3;

                    font-weight: 900;

                    color: #0f172a;
                }

                .student-lesson-html h3 {
                    margin-top: 1.3rem;
                    margin-bottom: 0.7rem;

                    font-size: 1.3rem;
                    line-height: 1.4;

                    font-weight: 800;

                    color: #0f172a;
                }

                .student-lesson-html h4 {
                    margin-top: 1.2rem;
                    margin-bottom: 0.6rem;

                    font-size: 1.1rem;
                    line-height: 1.4;

                    font-weight: 800;

                    color: #0f172a;
                }

                /* ==============================
                   SPAN
                ============================== */

                .student-lesson-html span {
                    max-width: 100%;
                }

                /* ==============================
                   NEGRITA
                ============================== */

                .student-lesson-html strong,
                .student-lesson-html b {
                    font-weight: 800;
                }

                /* ==============================
                   CURSIVA
                ============================== */

                .student-lesson-html em,
                .student-lesson-html i {
                    font-style: italic;
                }

                /* ==============================
                   SUBRAYADO
                ============================== */

                .student-lesson-html u {
                    text-decoration: underline;

                    text-underline-offset:
                        3px;
                }

                /* ==============================
                   LISTAS
                ============================== */

                .student-lesson-html ul {
                    margin-top: 1rem;
                    margin-bottom: 1rem;

                    padding-left:
                        1.75rem;

                    list-style-type:
                        disc;

                    list-style-position:
                        outside;
                }

                .student-lesson-html ol {
                    margin-top: 1rem;
                    margin-bottom: 1rem;

                    padding-left:
                        1.75rem;

                    list-style-type:
                        decimal;

                    list-style-position:
                        outside;
                }

                .student-lesson-html li {
                    margin-top:
                        0.35rem;

                    margin-bottom:
                        0.35rem;

                    padding-left:
                        0.15rem;
                }

                .student-lesson-html
                    li
                    p {
                    margin-top:
                        0.15rem;

                    margin-bottom:
                        0.15rem;
                }

                /* ==============================
                   CITA
                ============================== */

                .student-lesson-html
                    blockquote {
                    margin-top:
                        1.25rem;

                    margin-bottom:
                        1.25rem;

                    border-left:
                        4px solid
                        var(--primary);

                    border-radius:
                        0
                        0.75rem
                        0.75rem
                        0;

                    background:
                        #f8fafc;

                    padding:
                        0.85rem
                        1rem;

                    color:
                        #475569;

                    font-style:
                        italic;
                }

                /* ==============================
                   LINKS
                ============================== */

                .student-lesson-html a {
                    color:
                        var(--primary);

                    font-weight:
                        700;

                    text-decoration:
                        underline;

                    text-underline-offset:
                        3px;

                    overflow-wrap:
                        anywhere;
                }

                .student-lesson-html
                    a:hover {
                    opacity: 0.8;
                }

                /* ==============================
                   IMÁGENES
                ============================== */

                .student-lesson-html img {
                    display: block;

                    width: auto;
                    max-width: 100%;
                    height: auto;

                    margin:
                        1.25rem
                        auto;

                    border-radius:
                        0.75rem;

                    object-fit:
                        contain;
                }

                /* ==============================
                   IFRAME

                   No usamos !important.

                   Así un style=""
                   definido en el HTML
                   puede sobrescribir estos
                   valores.
                ============================== */

                .student-lesson-html
                    iframe {
                    display: block;

                    width: 100%;
                    max-width: 100%;

                    min-height: 600px;

                    margin-top:
                        1.5rem;

                    margin-bottom:
                        1.5rem;

                    border: none;

                    border-radius:
                        0.75rem;

                    background:
                        #f8fafc;

                    overflow: hidden;
                }

                /* iframe dentro de p */

                .student-lesson-html
                    p:has(iframe) {
                    width: 100%;

                    margin-top: 0;
                    margin-bottom: 0;
                }

                /* ==============================
                   CÓDIGO INLINE
                ============================== */

                .student-lesson-html
                    code {
                    border-radius:
                        0.35rem;

                    background:
                        #f1f5f9;

                    padding:
                        0.15rem
                        0.35rem;

                    font-family:
                        ui-monospace,
                        SFMono-Regular,
                        Menlo,
                        Monaco,
                        Consolas,
                        monospace;

                    font-size:
                        0.9em;

                    color:
                        #0f172a;
                }

                /* ==============================
                   BLOQUE CÓDIGO
                ============================== */

                .student-lesson-html
                    pre {
                    max-width: 100%;

                    margin-top: 1rem;
                    margin-bottom: 1rem;

                    overflow-x: auto;

                    border-radius:
                        0.75rem;

                    background:
                        #0f172a;

                    padding: 1rem;

                    color:
                        #f8fafc;
                }

                .student-lesson-html
                    pre
                    code {
                    background:
                        transparent;

                    padding: 0;

                    color: inherit;
                }

                /* ==============================
                   HR
                ============================== */

                .student-lesson-html hr {
                    margin-top:
                        1.5rem;

                    margin-bottom:
                        1.5rem;

                    border: 0;

                    border-top:
                        1px solid
                        #e2e8f0;
                }

                /* ==============================
                   TABLAS
                ============================== */

                .student-lesson-html
                    table {
                    display: block;

                    width: 100%;
                    max-width: 100%;

                    margin-top: 1rem;
                    margin-bottom: 1rem;

                    border-collapse:
                        collapse;

                    overflow-x: auto;
                }

                .student-lesson-html th,
                .student-lesson-html td {
                    border:
                        1px solid
                        #e2e8f0;

                    padding:
                        0.65rem
                        0.75rem;

                    text-align: left;

                    vertical-align:
                        top;
                }

                .student-lesson-html th {
                    background:
                        #f8fafc;

                    font-weight:
                        800;

                    color:
                        #0f172a;
                }

                /* ==============================
                   RESPONSIVE
                ============================== */

                @media (
                    min-width: 640px
                ) {
                    .student-lesson-html {
                        font-size:
                            0.95rem;
                    }
                }

                @media (
                    max-width: 639px
                ) {
                    .student-lesson-html {
                        font-size:
                            0.875rem;

                        line-height:
                            1.7;
                    }

                    .student-lesson-html
                        h1 {
                        font-size:
                            1.6rem;
                    }

                    .student-lesson-html
                        h2 {
                        font-size:
                            1.35rem;
                    }

                    .student-lesson-html
                        h3 {
                        font-size:
                            1.15rem;
                    }

                    .student-lesson-html
                        iframe {
                        min-height:
                            480px;
                    }
                }

                @media (
                    max-width: 420px
                ) {
                    .student-lesson-html
                        iframe {
                        min-height:
                            420px;
                    }
                }
            `}</style>
        </div>
    );
}

export default TextBlock;