"use client";

import { useEffect, useState } from "react";

import {
    EditorContent,
    useEditor,
} from "@tiptap/react";

import {
    Extension,
    Mark,
    mergeAttributes,
    Node,
} from "@tiptap/core";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TiptapImage from "@tiptap/extension-image";

import {
    Bold,
    Code2,
    FileText,
    ImageIcon,
    Italic,
    List,
    ListOrdered,
    MonitorPlay,
    Quote,
    Redo2,
    Save,
    Underline as UnderlineIcon,
    Undo2,
} from "lucide-react";

import type { LessonItemState } from "../hook";

/* =========================================================
   TYPES
========================================================= */

type TextSectionProps = {
    item: LessonItemState;
};

type EditorMode =
    | "visual"
    | "html";

/* =========================================================
   EXTENSION: IFRAME
========================================================= */

const IframeExtension = Node.create({
    name: "iframe",

    group: "block",

    atom: true,

    selectable: true,

    draggable: false,

    addAttributes() {
        return {
            src: {
                default: null,

                parseHTML: (element) =>
                    element.getAttribute(
                        "src",
                    ),
            },

            width: {
                default: "100%",

                parseHTML: (element) =>
                    element.getAttribute(
                        "width",
                    ) || "100%",
            },

            height: {
                default: "600",

                parseHTML: (element) =>
                    element.getAttribute(
                        "height",
                    ) || "600",
            },

            frameborder: {
                default: "0",

                parseHTML: (element) =>
                    element.getAttribute(
                        "frameborder",
                    ) || "0",
            },

            loading: {
                default: "lazy",

                parseHTML: (element) =>
                    element.getAttribute(
                        "loading",
                    ) || "lazy",
            },

            allow: {
                default: null,

                parseHTML: (element) =>
                    element.getAttribute(
                        "allow",
                    ),
            },

            allowfullscreen: {
                default: null,

                parseHTML: (element) =>
                    element.getAttribute(
                        "allowfullscreen",
                    ),
            },

            referrerpolicy: {
                default: null,

                parseHTML: (element) =>
                    element.getAttribute(
                        "referrerpolicy",
                    ),
            },

            title: {
                default: null,

                parseHTML: (element) =>
                    element.getAttribute(
                        "title",
                    ),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "iframe",
            },
        ];
    },

    renderHTML({
        HTMLAttributes,
    }) {
        return [
            "iframe",

            mergeAttributes(
                {
                    class:
                        "lesson-editor-iframe",
                },

                HTMLAttributes,
            ),
        ];
    },
});

/* =========================================================
   EXTENSION: DIV

   Permite conservar:

   <div style="" class="" id="">
       ...
   </div>
========================================================= */

const HtmlDivExtension = Node.create({
    name: "htmlDiv",

    group: "block",

    content: "block+",

    defining: true,

    parseHTML() {
        return [
            {
                tag: "div",
            },
        ];
    },

    renderHTML({
        HTMLAttributes,
    }) {
        return [
            "div",

            mergeAttributes(
                HTMLAttributes,
            ),

            0,
        ];
    },
});

/* =========================================================
   EXTENSION GLOBAL HTML ATTRIBUTES

   Conserva:

   style=""
   class=""
   id=""

   en los nodos principales de TipTap.
========================================================= */

const HtmlAttributesExtension =
    Extension.create({
        name: "htmlAttributes",

        addGlobalAttributes() {
            return [
                {
                    types: [
                        "paragraph",
                        "heading",
                        "blockquote",
                        "bulletList",
                        "orderedList",
                        "listItem",
                        "codeBlock",
                        "horizontalRule",

                        "image",
                        "iframe",
                        "htmlDiv",

                        "bold",
                        "italic",
                        "underline",
                        "strike",
                        "code",
                    ],

                    attributes: {
                        style: {
                            default: null,

                            parseHTML: (
                                element,
                            ) =>
                                element.getAttribute(
                                    "style",
                                ),

                            renderHTML: (
                                attributes,
                            ) => {
                                if (
                                    !attributes.style
                                ) {
                                    return {};
                                }

                                return {
                                    style:
                                        attributes.style,
                                };
                            },
                        },

                        class: {
                            default: null,

                            parseHTML: (
                                element,
                            ) =>
                                element.getAttribute(
                                    "class",
                                ),

                            renderHTML: (
                                attributes,
                            ) => {
                                if (
                                    !attributes.class
                                ) {
                                    return {};
                                }

                                return {
                                    class:
                                        attributes.class,
                                };
                            },
                        },

                        id: {
                            default: null,

                            parseHTML: (
                                element,
                            ) =>
                                element.getAttribute(
                                    "id",
                                ),

                            renderHTML: (
                                attributes,
                            ) => {
                                if (
                                    !attributes.id
                                ) {
                                    return {};
                                }

                                return {
                                    id:
                                        attributes.id,
                                };
                            },
                        },
                    },
                },
            ];
        },
    });

/* =========================================================
   EXTENSION: SPAN CON STYLE

   Permite:

   <span style="color:red">
       texto
   </span>
========================================================= */

const StyledSpanExtension =
    Mark.create({
        name: "styledSpan",

        inclusive: true,

        addAttributes() {
            return {
                style: {
                    default: null,

                    parseHTML: (
                        element,
                    ) =>
                        element.getAttribute(
                            "style",
                        ),

                    renderHTML: (
                        attributes,
                    ) => {
                        if (
                            !attributes.style
                        ) {
                            return {};
                        }

                        return {
                            style:
                                attributes.style,
                        };
                    },
                },

                class: {
                    default: null,

                    parseHTML: (
                        element,
                    ) =>
                        element.getAttribute(
                            "class",
                        ),

                    renderHTML: (
                        attributes,
                    ) => {
                        if (
                            !attributes.class
                        ) {
                            return {};
                        }

                        return {
                            class:
                                attributes.class,
                        };
                    },
                },

                id: {
                    default: null,

                    parseHTML: (
                        element,
                    ) =>
                        element.getAttribute(
                            "id",
                        ),

                    renderHTML: (
                        attributes,
                    ) => {
                        if (
                            !attributes.id
                        ) {
                            return {};
                        }

                        return {
                            id:
                                attributes.id,
                        };
                    },
                },
            };
        },

        parseHTML() {
            return [
                {
                    tag: "span[style]",
                },

                {
                    tag: "span[class]",
                },

                {
                    tag: "span[id]",
                },
            ];
        },

        renderHTML({
            HTMLAttributes,
        }) {
            return [
                "span",

                mergeAttributes(
                    HTMLAttributes,
                ),

                0,
            ];
        },
    });

/* =========================================================
   COMPONENT
========================================================= */

export function TextSection({
    item,
}: TextSectionProps) {
    if (
        item.itemType !== "text"
    ) {
        return null;
    }

    return (
        <TextEditor item={item} />
    );
}

/* =========================================================
   TEXT EDITOR
========================================================= */

function TextEditor({
    item,
}: TextSectionProps) {
    const [mode, setMode] =
        useState<EditorMode>(
            "visual",
        );

    /* =====================================================
       TIPTAP
    ===================================================== */

    const editor = useEditor({
        immediatelyRender: false,

        extensions: [
            StarterKit,

            Underline,

            TiptapImage.configure({
                inline: false,

                allowBase64: false,

                HTMLAttributes: {
                    class:
                        "lesson-editor-image",
                },
            }),

            IframeExtension,

            HtmlDivExtension,

            HtmlAttributesExtension,

            StyledSpanExtension,
        ],

        content:
            item.form.text || "",

        editorProps: {
            attributes: {
                class:
                    "min-h-[400px] px-5 py-5 text-sm leading-7 text-slate-700 outline-none",
            },
        },

        onUpdate: ({
            editor,
        }) => {
            const html =
                editor.getHTML();

            item.setForm(
                (current) => {
                    if (
                        current.text ===
                        html
                    ) {
                        return current;
                    }

                    return {
                        ...current,

                        text: html,
                    };
                },
            );
        },
    });

    /* =====================================================
       SYNC
    ===================================================== */

    useEffect(() => {
        if (!editor) {
            return;
        }

        /*
         * Cuando estamos editando el HTML
         * manualmente no sincronizamos TipTap
         * en cada tecla.
         */
        if (
            mode === "html"
        ) {
            return;
        }

        const html =
            item.form.text || "";

        if (
            editor.getHTML() ===
            html
        ) {
            return;
        }

        editor.commands.setContent(
            html,

            {
                emitUpdate:
                    false,
            },
        );
    }, [
        editor,
        item.form.text,
        mode,
    ]);

    /* =====================================================
       CHANGE TO VISUAL
    ===================================================== */

    function changeToVisual() {
        if (!editor) {
            return;
        }

        /*
         * Aquí TipTap vuelve a interpretar
         * el código HTML escrito manualmente.
         */
        editor.commands.setContent(
            item.form.text || "",

            {
                emitUpdate:
                    false,
            },
        );

        /*
         * Obtenemos la versión normalizada.
         *
         * Con nuestras extensiones ya deben
         * conservarse style, class e id.
         */
        const normalizedHtml =
            editor.getHTML();

        item.setForm(
            (current) => {
                if (
                    current.text ===
                    normalizedHtml
                ) {
                    return current;
                }

                return {
                    ...current,

                    text:
                        normalizedHtml,
                };
            },
        );

        setMode("visual");
    }

    /* =====================================================
       CHANGE TO HTML
    ===================================================== */

    function changeToHtml() {
        if (!editor) {
            return;
        }

        const html =
            editor.getHTML();

        item.setForm(
            (current) => {
                if (
                    current.text ===
                    html
                ) {
                    return current;
                }

                return {
                    ...current,

                    text: html,
                };
            },
        );

        setMode("html");
    }

    /* =====================================================
       MANUAL HTML
    ===================================================== */

    function handleHtmlChange(
        value: string,
    ) {
        item.setForm(
            (current) => {
                if (
                    current.text ===
                    value
                ) {
                    return current;
                }

                return {
                    ...current,

                    text: value,
                };
            },
        );
    }

    /* =====================================================
       INSERT IMAGE
    ===================================================== */

    function insertImage() {
        if (!editor) {
            return;
        }

        const value =
            window.prompt(
                "Ingresa la URL completa de la imagen:",
            );

        if (!value) {
            return;
        }

        const url =
            value.trim();

        if (!url) {
            return;
        }

        if (
            !url.startsWith(
                "https://",
            ) &&
            !url.startsWith(
                "http://",
            )
        ) {
            window.alert(
                "La imagen debe tener una URL http:// o https://",
            );

            return;
        }

        editor
            .chain()
            .focus()
            .setImage({
                src: url,

                alt:
                    "Imagen de la lección",
            })
            .run();
    }

    /* =====================================================
       INSERT IFRAME
    ===================================================== */

    function insertIframe() {
        if (!editor) {
            return;
        }

        const value =
            window.prompt(
                "Ingresa la URL que deseas mostrar:",
                "https://fotos.gaiaecsa.com/compras/1",
            );

        if (!value) {
            return;
        }

        const url =
            value.trim();

        if (!url) {
            return;
        }

        if (
            !url.startsWith(
                "https://",
            ) &&
            !url.startsWith(
                "http://",
            )
        ) {
            window.alert(
                "La URL debe comenzar con http:// o https://",
            );

            return;
        }

        editor
            .chain()
            .focus()
            .insertContent({
                type: "iframe",

                attrs: {
                    src: url,

                    width:
                        "100%",

                    height:
                        "600",

                    frameborder:
                        "0",

                    loading:
                        "lazy",

                    style:
                        "border: none; width: 100%;",

                    title:
                        "Contenido de la lección",
                },
            })
            .run();
    }

    /* =====================================================
       BUTTON CLASSES
    ===================================================== */

    function toolbarClass(
        active = false,
    ) {
        return [
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",

            active
                ? "border-[#172861] bg-[#172861] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",

            "disabled:cursor-not-allowed disabled:opacity-40",
        ].join(" ");
    }

    function textButtonClass(
        active = false,
    ) {
        return [
            "h-9 rounded-lg border px-3 text-xs font-bold transition",

            active
                ? "border-[#172861] bg-[#172861] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",

            "disabled:cursor-not-allowed disabled:opacity-40",
        ].join(" ");
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                        Texto de la
                        lección
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Edita el contenido
                        visualmente o
                        directamente en
                        formato HTML.
                    </p>
                </div>

                {/* =============================================
                    VISUAL / HTML
                ============================================= */}

                <div className="flex self-start rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                        type="button"
                        onClick={
                            changeToVisual
                        }
                        className={[
                            "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold transition",

                            mode ===
                                "visual"
                                ? "bg-[#172861] text-white shadow-sm"
                                : "text-slate-600 hover:bg-white",
                        ].join(
                            " ",
                        )}
                    >
                        <FileText className="h-4 w-4" />

                        Visual
                    </button>

                    <button
                        type="button"
                        onClick={
                            changeToHtml
                        }
                        className={[
                            "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold transition",

                            mode ===
                                "html"
                                ? "bg-[#172861] text-white shadow-sm"
                                : "text-slate-600 hover:bg-white",
                        ].join(
                            " ",
                        )}
                    >
                        <Code2 className="h-4 w-4" />

                        HTML
                    </button>
                </div>
            </div>

            {/* =================================================
                EDITOR
            ================================================= */}

            <div className="mt-5">
                <div className="mb-2 flex items-center gap-2">
                    {mode ===
                        "visual" ? (
                        <FileText className="h-4 w-4 text-slate-500" />
                    ) : (
                        <Code2 className="h-4 w-4 text-slate-500" />
                    )}

                    <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                        {mode ===
                            "visual"
                            ? "Editor visual"
                            : "Código HTML"}
                    </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    {mode ===
                        "visual" ? (
                        <>
                            {/* =================================
                                TOOLBAR
                            ================================= */}

                            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2">
                                {/* TEXT */}

                                <button
                                    type="button"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .setParagraph()
                                            .run()
                                    }
                                    className={textButtonClass(
                                        editor?.isActive(
                                            "paragraph",
                                        ) ??
                                        false,
                                    )}
                                >
                                    Texto
                                </button>

                                {/* H2 */}

                                <button
                                    type="button"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleHeading(
                                                {
                                                    level: 2,
                                                },
                                            )
                                            .run()
                                    }
                                    className={textButtonClass(
                                        editor?.isActive(
                                            "heading",

                                            {
                                                level: 2,
                                            },
                                        ) ??
                                        false,
                                    )}
                                >
                                    Título
                                </button>

                                {/* H3 */}

                                <button
                                    type="button"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleHeading(
                                                {
                                                    level: 3,
                                                },
                                            )
                                            .run()
                                    }
                                    className={textButtonClass(
                                        editor?.isActive(
                                            "heading",

                                            {
                                                level: 3,
                                            },
                                        ) ??
                                        false,
                                    )}
                                >
                                    Subtítulo
                                </button>

                                <div className="mx-1 h-6 w-px bg-slate-300" />

                                {/* BOLD */}

                                <button
                                    type="button"
                                    title="Negrita"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleBold()
                                            .run()
                                    }
                                    className={toolbarClass(
                                        editor?.isActive(
                                            "bold",
                                        ) ??
                                        false,
                                    )}
                                >
                                    <Bold className="h-4 w-4" />
                                </button>

                                {/* ITALIC */}

                                <button
                                    type="button"
                                    title="Cursiva"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleItalic()
                                            .run()
                                    }
                                    className={toolbarClass(
                                        editor?.isActive(
                                            "italic",
                                        ) ??
                                        false,
                                    )}
                                >
                                    <Italic className="h-4 w-4" />
                                </button>

                                {/* UNDERLINE */}

                                <button
                                    type="button"
                                    title="Subrayado"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleUnderline()
                                            .run()
                                    }
                                    className={toolbarClass(
                                        editor?.isActive(
                                            "underline",
                                        ) ??
                                        false,
                                    )}
                                >
                                    <UnderlineIcon className="h-4 w-4" />
                                </button>

                                <div className="mx-1 h-6 w-px bg-slate-300" />

                                {/* BULLET LIST */}

                                <button
                                    type="button"
                                    title="Lista"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleBulletList()
                                            .run()
                                    }
                                    className={toolbarClass(
                                        editor?.isActive(
                                            "bulletList",
                                        ) ??
                                        false,
                                    )}
                                >
                                    <List className="h-4 w-4" />
                                </button>

                                {/* ORDERED LIST */}

                                <button
                                    type="button"
                                    title="Lista numerada"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleOrderedList()
                                            .run()
                                    }
                                    className={toolbarClass(
                                        editor?.isActive(
                                            "orderedList",
                                        ) ??
                                        false,
                                    )}
                                >
                                    <ListOrdered className="h-4 w-4" />
                                </button>

                                {/* QUOTE */}

                                <button
                                    type="button"
                                    title="Cita"
                                    disabled={
                                        !editor
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleBlockquote()
                                            .run()
                                    }
                                    className={toolbarClass(
                                        editor?.isActive(
                                            "blockquote",
                                        ) ??
                                        false,
                                    )}
                                >
                                    <Quote className="h-4 w-4" />
                                </button>

                                <div className="mx-1 h-6 w-px bg-slate-300" />

                                {/* IMAGE */}

                                <button
                                    type="button"
                                    title="Insertar imagen desde URL"
                                    disabled={
                                        !editor
                                    }
                                    onClick={
                                        insertImage
                                    }
                                    className={toolbarClass()}
                                >
                                    <ImageIcon className="h-4 w-4" />
                                </button>

                                {/* IFRAME */}

                                <button
                                    type="button"
                                    title="Insertar contenido externo"
                                    disabled={
                                        !editor
                                    }
                                    onClick={
                                        insertIframe
                                    }
                                    className={toolbarClass()}
                                >
                                    <MonitorPlay className="h-4 w-4" />
                                </button>

                                <div className="mx-1 h-6 w-px bg-slate-300" />

                                {/* UNDO */}

                                <button
                                    type="button"
                                    title="Deshacer"
                                    disabled={
                                        !editor ||
                                        !editor
                                            .can()
                                            .undo()
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .undo()
                                            .run()
                                    }
                                    className={toolbarClass()}
                                >
                                    <Undo2 className="h-4 w-4" />
                                </button>

                                {/* REDO */}

                                <button
                                    type="button"
                                    title="Rehacer"
                                    disabled={
                                        !editor ||
                                        !editor
                                            .can()
                                            .redo()
                                    }
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .redo()
                                            .run()
                                    }
                                    className={toolbarClass()}
                                >
                                    <Redo2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* =================================
                                VISUAL EDITOR
                            ================================= */}

                            <EditorContent
                                editor={
                                    editor
                                }
                            />
                        </>
                    ) : (
                        /* =====================================
                           HTML EDITOR
                        ===================================== */

                        <textarea
                            value={
                                item.form.text
                            }
                            onChange={(
                                event,
                            ) =>
                                handleHtmlChange(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            spellCheck={
                                false
                            }
                            className="min-h-[500px] w-full resize-y bg-[#0f172a] p-5 font-mono text-sm leading-7 text-slate-100 outline-none"
                            placeholder={`<h2
    style="
        color: #172861;
        text-align: center;
        font-size: 32px;
    "
>
    Compras Públicas
</h2>

<p
    style="
        font-size: 18px;
        color: #475569;
    "
>
    Contenido de la lección.
</p>

<span style="color:red;font-weight:bold;">
    Texto especial
</span>

<iframe
    src="https://fotos.gaiaecsa.com/compras/1"
    width="100%"
    height="600"
    style="
        border:none;
        border-radius:20px;
    "
></iframe>`}
                        />
                    )}
                </div>

                {mode ===
                    "html" && (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            Puedes utilizar
                            HTML con style,
                            class, id, span,
                            div, imágenes e
                            iframe. Cambia a
                            Visual para
                            interpretar el
                            resultado.
                        </p>
                    )}
            </div>

            {/* =================================================
                SAVE
            ================================================= */}

            <div className="mt-5 flex justify-end">
                <button
                    type="submit"
                    disabled={
                        item.saving ||
                        !editor
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:w-auto sm:min-w-[200px]"
                >
                    <Save className="h-4 w-4" />

                    {item.saving
                        ? "Guardando..."
                        : "Guardar cambios"}
                </button>
            </div>

            {/* =================================================
                EDITOR STYLES
            ================================================= */}

            <style jsx global>{`
                .ProseMirror {
                    min-height: 400px;

                    padding: 1.25rem;

                    color: #334155;

                    font-size: 0.875rem;

                    line-height: 1.75rem;
                }

                .ProseMirror:focus {
                    outline: none;
                }

                .ProseMirror
                    > *:first-child {
                    margin-top: 0;
                }

                .ProseMirror
                    > *:last-child {
                    margin-bottom: 0;
                }

                /* ============================
                   PARAGRAPH
                ============================ */

                .ProseMirror p {
                    margin:
                        0.65rem 0;
                }

                /* ============================
                   HEADINGS
                ============================ */

                .ProseMirror h1 {
                    margin:
                        1.5rem
                        0
                        0.75rem;

                    font-size: 2rem;

                    line-height:
                        2.5rem;

                    font-weight:
                        900;

                    color:
                        #0f172a;
                }

                .ProseMirror h2 {
                    margin:
                        1.5rem
                        0
                        0.75rem;

                    font-size:
                        1.5rem;

                    line-height:
                        2rem;

                    font-weight:
                        900;

                    color:
                        #0f172a;
                }

                .ProseMirror h3 {
                    margin:
                        1.25rem
                        0
                        0.6rem;

                    font-size:
                        1.25rem;

                    line-height:
                        1.75rem;

                    font-weight:
                        800;

                    color:
                        #0f172a;
                }

                /* ============================
                   FORMATTING
                ============================ */

                .ProseMirror strong {
                    font-weight:
                        800;
                }

                .ProseMirror em {
                    font-style:
                        italic;
                }

                .ProseMirror u {
                    text-decoration:
                        underline;

                    text-underline-offset:
                        2px;
                }

                /* ============================
                   LISTS
                ============================ */

                .ProseMirror ul {
                    margin:
                        0.75rem 0;

                    padding-left:
                        1.75rem;

                    list-style-type:
                        disc;
                }

                .ProseMirror ol {
                    margin:
                        0.75rem 0;

                    padding-left:
                        1.75rem;

                    list-style-type:
                        decimal;
                }

                .ProseMirror li {
                    margin:
                        0.25rem 0;
                }

                .ProseMirror li p {
                    margin:
                        0.1rem 0;
                }

                /* ============================
                   BLOCKQUOTE
                ============================ */

                .ProseMirror blockquote {
                    margin:
                        1rem 0;

                    border-left:
                        4px solid
                        #172861;

                    border-radius:
                        0
                        0.5rem
                        0.5rem
                        0;

                    background:
                        #f8fafc;

                    padding:
                        0.75rem
                        1rem;

                    color:
                        #475569;

                    font-style:
                        italic;
                }

                /* ============================
                   DIV
                ============================ */

                .ProseMirror div {
                    max-width:
                        100%;
                }

                /* ============================
                   IMAGE
                ============================ */

                .ProseMirror
                    .lesson-editor-image,
                .ProseMirror img {
                    display: block;

                    width: auto;

                    max-width:
                        100%;

                    height: auto;

                    margin:
                        1.5rem
                        auto;

                    border-radius:
                        0.75rem;

                    object-fit:
                        contain;
                }

                .ProseMirror
                    img.ProseMirror-selectednode {
                    outline:
                        3px solid
                        #3b82f6;

                    outline-offset:
                        3px;
                }

                /* ============================
                   IFRAME
                ============================ */

                .ProseMirror
                    .lesson-editor-iframe,
                .ProseMirror iframe {
                    display: block;

                    width: 100%;

                    max-width:
                        100%;

                    min-height:
                        600px;

                    margin:
                        1.5rem 0;

                    border: none;

                    border-radius:
                        0.75rem;

                    background:
                        #f8fafc;

                    overflow:
                        hidden;
                }

                .ProseMirror
                    iframe.ProseMirror-selectednode {
                    outline:
                        3px solid
                        #3b82f6;

                    outline-offset:
                        3px;
                }

                /* ============================
                   CODE
                ============================ */

                .ProseMirror code {
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
                }

                .ProseMirror pre {
                    max-width:
                        100%;

                    overflow-x:
                        auto;

                    margin:
                        1rem 0;

                    border-radius:
                        0.75rem;

                    background:
                        #0f172a;

                    padding:
                        1rem;

                    color:
                        white;
                }

                /* ============================
                   RESPONSIVE
                ============================ */

                @media (
                    max-width: 640px
                ) {
                    .ProseMirror
                        iframe {
                        min-height:
                            450px;
                    }
                }
            `}</style>
        </div>
    );
}

export default TextSection;