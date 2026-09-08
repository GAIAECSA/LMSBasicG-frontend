"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import {
    EditorContent,
    useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TiptapImage from "@tiptap/extension-image";

import {
    Bold,
    Code2,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Italic,
    List,
    ListOrdered,
    Quote,
    Redo2,
    RefreshCw,
    Save,
    Trash2,
    Underline as UnderlineIcon,
    Undo2,
    UploadCloud,
} from "lucide-react";

import type { LessonItemState } from "../hook";

type FileSectionProps = {
    item: LessonItemState;
};

type DescriptionMode = "visual" | "html";

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    const kilobytes = size / 1024;

    if (kilobytes < 1024) {
        return `${kilobytes.toFixed(1)} KB`;
    }

    return `${(kilobytes / 1024).toFixed(2)} MB`;
}

function htmlToPlainText(html: string) {
    return html
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function FileSection({
    item,
}: FileSectionProps) {
    const [selectedPreviewUrl, setSelectedPreviewUrl] =
        useState("");

    const [descriptionMode, setDescriptionMode] =
        useState<DescriptionMode>("visual");

    const selectedObjectUrlRef = useRef("");
    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const isImage = item.itemType === "image";
    const isPdf = item.itemType === "pdf";

    /* =====================================================
       EDITOR DE DESCRIPCIÓN
    ===================================================== */

    const descriptionEditor = useEditor({
        immediatelyRender: false,

        extensions: [
            StarterKit,
            Underline,

            TiptapImage.configure({
                inline: false,
                allowBase64: false,

                HTMLAttributes: {
                    class:
                        "file-description-editor-image",
                },
            }),
        ],

        content: item.form.description || "",

        editorProps: {
            attributes: {
                class:
                    "min-h-[180px] px-4 py-4 text-sm leading-7 text-slate-700 outline-none",
            },
        },

        onUpdate: ({ editor }) => {
            const html = editor.getHTML();

            item.setForm((current) => {
                if (
                    current.description === html
                ) {
                    return current;
                }

                return {
                    ...current,
                    description: html,
                };
            });
        },
    });

    /* =====================================================
       ARCHIVO TEMPORAL
    ===================================================== */

    useEffect(() => {
        return () => {
            if (
                selectedObjectUrlRef.current
            ) {
                URL.revokeObjectURL(
                    selectedObjectUrlRef.current,
                );
            }
        };
    }, []);

    useEffect(() => {
        if (
            !item.selectedFile &&
            selectedObjectUrlRef.current
        ) {
            URL.revokeObjectURL(
                selectedObjectUrlRef.current,
            );

            selectedObjectUrlRef.current =
                "";
        }
    }, [item.selectedFile]);

    /* =====================================================
       SINCRONIZAR DESCRIPCIÓN CON API
    ===================================================== */

    useEffect(() => {
        if (!descriptionEditor) {
            return;
        }

        if (
            descriptionMode === "html"
        ) {
            return;
        }

        const html =
            item.form.description || "";

        if (
            descriptionEditor.getHTML() ===
            html
        ) {
            return;
        }

        descriptionEditor.commands.setContent(
            html,
            {
                emitUpdate: false,
            },
        );
    }, [
        descriptionEditor,
        descriptionMode,
        item.form.description,
    ]);

    if (!isImage && !isPdf) {
        return null;
    }

    const previewUrl =
        item.selectedFile
            ? selectedPreviewUrl
            : item.fullExistingFileUrl;

    const hasPreview =
        Boolean(previewUrl);

    const hasSelectedFile =
        Boolean(item.selectedFile);

    const hasExistingFile =
        Boolean(item.fullExistingFileUrl);

    /* =====================================================
       DESCRIPCIÓN VISUAL / HTML
    ===================================================== */

    function changeDescriptionToVisual() {
        if (!descriptionEditor) {
            return;
        }

        descriptionEditor.commands.setContent(
            item.form.description || "",
            {
                emitUpdate: false,
            },
        );

        const normalizedHtml =
            descriptionEditor.getHTML();

        item.setForm((current) => {
            if (
                current.description ===
                normalizedHtml
            ) {
                return current;
            }

            return {
                ...current,
                description:
                    normalizedHtml,
            };
        });

        setDescriptionMode("visual");
    }

    function changeDescriptionToHtml() {
        if (!descriptionEditor) {
            return;
        }

        const html =
            descriptionEditor.getHTML();

        item.setForm((current) => {
            if (
                current.description === html
            ) {
                return current;
            }

            return {
                ...current,
                description: html,
            };
        });

        setDescriptionMode("html");
    }

    function handleDescriptionHtmlChange(
        value: string,
    ) {
        item.setForm((current) => ({
            ...current,
            description: value,
        }));
    }

    function insertDescriptionImage() {
        if (!descriptionEditor) {
            return;
        }

        const value = window.prompt(
            "Ingresa la URL de la imagen:",
        );

        if (!value) {
            return;
        }

        const url = value.trim();

        if (!url) {
            return;
        }

        if (
            !url.startsWith("https://") &&
            !url.startsWith("http://")
        ) {
            window.alert(
                "La URL debe comenzar con http:// o https://",
            );

            return;
        }

        descriptionEditor
            .chain()
            .focus()
            .setImage({
                src: url,
                alt: "Imagen de la descripción",
            })
            .run();
    }

    /* =====================================================
       ARCHIVOS
    ===================================================== */

    function releaseSelectedPreview() {
        if (
            selectedObjectUrlRef.current
        ) {
            URL.revokeObjectURL(
                selectedObjectUrlRef.current,
            );

            selectedObjectUrlRef.current =
                "";
        }

        setSelectedPreviewUrl("");
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0] ??
            null;

        const accepted =
            item.handleSelectedFile(
                event,
            );

        if (!file || !accepted) {
            return;
        }

        releaseSelectedPreview();

        const objectUrl =
            URL.createObjectURL(file);

        selectedObjectUrlRef.current =
            objectUrl;

        setSelectedPreviewUrl(
            objectUrl,
        );
    }

    function handleRemoveSelectedFile() {
        releaseSelectedPreview();

        item.setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    }

    /* =====================================================
       CLASES TOOLBAR
    ===================================================== */

    function toolbarButtonClass(
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

    const imageAlt =
        htmlToPlainText(
            item.form.description,
        ) ||
        "Vista previa de la imagen de la lección";

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
            {/* HEADER */}

            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-4 py-4 sm:px-6 sm:py-5 [@media(max-height:760px)]:py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-white shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl">
                            {isImage ? (
                                <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                        </span>

                        <div>
                            <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                                {isImage
                                    ? "Imagen de la lección"
                                    : "PDF de la lección"}
                            </h2>

                            <p className="mt-1 text-xs font-medium leading-5 text-slate-500 sm:text-sm">
                                {isImage
                                    ? "Agrega una imagen de apoyo para el contenido del curso."
                                    : "Publica un documento que el estudiante pueda consultar."}
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-600 ring-1 ring-slate-200">
                        {isImage
                            ? "PNG · JPG · WEBP"
                            : "Archivo PDF"}
                    </span>
                </div>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
                {/* =================================================
                    DESCRIPCIÓN HTML
                ================================================= */}

                <div>
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="text-[13px] font-black text-slate-700">
                            Descripción del material
                        </label>

                        <div className="flex self-start rounded-xl border border-slate-200 bg-slate-50 p-1">
                            <button
                                type="button"
                                onClick={
                                    changeDescriptionToVisual
                                }
                                className={[
                                    "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-bold transition",
                                    descriptionMode ===
                                        "visual"
                                        ? "bg-[#172861] text-white shadow-sm"
                                        : "text-slate-600 hover:bg-white",
                                ].join(
                                    " ",
                                )}
                            >
                                <FileText className="h-3.5 w-3.5" />

                                Visual
                            </button>

                            <button
                                type="button"
                                onClick={
                                    changeDescriptionToHtml
                                }
                                className={[
                                    "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-bold transition",
                                    descriptionMode ===
                                        "html"
                                        ? "bg-[#172861] text-white shadow-sm"
                                        : "text-slate-600 hover:bg-white",
                                ].join(
                                    " ",
                                )}
                            >
                                <Code2 className="h-3.5 w-3.5" />

                                HTML
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                        {descriptionMode ===
                            "visual" ? (
                            <>
                                {/* TOOLBAR */}

                                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2">
                                    <button
                                        type="button"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .setParagraph()
                                                .run()
                                        }
                                        className={textButtonClass(
                                            descriptionEditor?.isActive(
                                                "paragraph",
                                            ) ??
                                            false,
                                        )}
                                    >
                                        Texto
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
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
                                            descriptionEditor?.isActive(
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

                                    <button
                                        type="button"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
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
                                            descriptionEditor?.isActive(
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

                                    <button
                                        type="button"
                                        title="Negrita"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .toggleBold()
                                                .run()
                                        }
                                        className={toolbarButtonClass(
                                            descriptionEditor?.isActive(
                                                "bold",
                                            ) ??
                                            false,
                                        )}
                                    >
                                        <Bold className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        title="Cursiva"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .toggleItalic()
                                                .run()
                                        }
                                        className={toolbarButtonClass(
                                            descriptionEditor?.isActive(
                                                "italic",
                                            ) ??
                                            false,
                                        )}
                                    >
                                        <Italic className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        title="Subrayado"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .toggleUnderline()
                                                .run()
                                        }
                                        className={toolbarButtonClass(
                                            descriptionEditor?.isActive(
                                                "underline",
                                            ) ??
                                            false,
                                        )}
                                    >
                                        <UnderlineIcon className="h-4 w-4" />
                                    </button>

                                    <div className="mx-1 h-6 w-px bg-slate-300" />

                                    <button
                                        type="button"
                                        title="Lista"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .toggleBulletList()
                                                .run()
                                        }
                                        className={toolbarButtonClass(
                                            descriptionEditor?.isActive(
                                                "bulletList",
                                            ) ??
                                            false,
                                        )}
                                    >
                                        <List className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        title="Lista numerada"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .toggleOrderedList()
                                                .run()
                                        }
                                        className={toolbarButtonClass(
                                            descriptionEditor?.isActive(
                                                "orderedList",
                                            ) ??
                                            false,
                                        )}
                                    >
                                        <ListOrdered className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        title="Cita"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .toggleBlockquote()
                                                .run()
                                        }
                                        className={toolbarButtonClass(
                                            descriptionEditor?.isActive(
                                                "blockquote",
                                            ) ??
                                            false,
                                        )}
                                    >
                                        <Quote className="h-4 w-4" />
                                    </button>

                                    <div className="mx-1 h-6 w-px bg-slate-300" />

                                    <button
                                        type="button"
                                        title="Insertar imagen desde URL"
                                        disabled={
                                            !descriptionEditor
                                        }
                                        onClick={
                                            insertDescriptionImage
                                        }
                                        className={toolbarButtonClass()}
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                    </button>

                                    <div className="mx-1 h-6 w-px bg-slate-300" />

                                    <button
                                        type="button"
                                        title="Deshacer"
                                        disabled={
                                            !descriptionEditor ||
                                            !descriptionEditor
                                                .can()
                                                .undo()
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .undo()
                                                .run()
                                        }
                                        className={toolbarButtonClass()}
                                    >
                                        <Undo2 className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        title="Rehacer"
                                        disabled={
                                            !descriptionEditor ||
                                            !descriptionEditor
                                                .can()
                                                .redo()
                                        }
                                        onClick={() =>
                                            descriptionEditor
                                                ?.chain()
                                                .focus()
                                                .redo()
                                                .run()
                                        }
                                        className={toolbarButtonClass()}
                                    >
                                        <Redo2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <EditorContent
                                    editor={
                                        descriptionEditor
                                    }
                                />
                            </>
                        ) : (
                            <textarea
                                value={
                                    item.form
                                        .description
                                }
                                onChange={(
                                    event,
                                ) =>
                                    handleDescriptionHtmlChange(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                spellCheck={
                                    false
                                }
                                placeholder={`<h2>Descripción</h2>

<p>Contenido del material...</p>

<ul>
    <li>Punto uno</li>
    <li>Punto dos</li>
</ul>`}
                                className="min-h-[260px] w-full resize-y bg-[#0f172a] p-5 font-mono text-sm leading-7 text-slate-100 outline-none"
                            />
                        )}
                    </div>

                    {descriptionMode ===
                        "html" && (
                            <p className="mt-2 text-xs text-slate-500">
                                Puedes escribir
                                HTML directamente y
                                cambiar a Visual para
                                ver el resultado
                                formateado.
                            </p>
                        )}
                </div>

                {/* =================================================
                    ARCHIVO + PREVIEW
                ================================================= */}

                <div
                    className={`grid gap-5 ${hasPreview
                            ? "xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_320px]"
                            : ""
                        }`}
                >
                    {hasPreview ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:rounded-3xl">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isImage
                                                ? "bg-blue-50 text-blue-700"
                                                : "bg-red-50 text-red-700"
                                            }`}
                                    >
                                        {isImage ? (
                                            <ImageIcon className="h-4 w-4" />
                                        ) : (
                                            <FileText className="h-4 w-4" />
                                        )}
                                    </span>

                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                            Vista previa
                                        </p>

                                        <p className="truncate text-sm font-bold text-slate-800">
                                            {item.selectedFile
                                                ? item
                                                    .selectedFile
                                                    .name
                                                : isImage
                                                    ? "Imagen guardada actualmente"
                                                    : "PDF guardado actualmente"}
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={
                                        previewUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                                    title={
                                        isImage
                                            ? "Abrir imagen en otra pestaña"
                                            : "Abrir PDF en otra pestaña"
                                    }
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>

                            {isImage ? (
                                <div className="flex min-h-[200px] items-center justify-center bg-slate-100 p-3 sm:min-h-[260px] sm:p-4 lg:min-h-[300px]">
                                    <img
                                        src={
                                            previewUrl
                                        }
                                        alt={
                                            imageAlt
                                        }
                                        className="max-h-[420px] w-full rounded-xl object-contain sm:rounded-2xl lg:max-h-[520px]"
                                    />
                                </div>
                            ) : (
                                <div className="bg-slate-100 p-3">
                                    <iframe
                                        src={
                                            previewUrl
                                        }
                                        title="Vista previa del PDF de la lección"
                                        className="h-[420px] w-full rounded-xl border border-slate-200 bg-white sm:h-[560px] sm:rounded-2xl lg:h-[680px]"
                                    />
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* =================================================
                        SELECTOR ARCHIVO
                    ================================================= */}

                    <div className="space-y-4">
                        <label className="group flex min-h-[145px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-4 text-center transition hover:border-blue-400 hover:bg-blue-50 sm:min-h-[170px] sm:rounded-3xl sm:px-5 sm:py-5">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm transition group-hover:-translate-y-1 sm:h-14 sm:w-14 sm:rounded-2xl">
                                {hasSelectedFile ||
                                    hasExistingFile ? (
                                    <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
                                ) : (
                                    <UploadCloud className="h-7 w-7" />
                                )}
                            </span>

                            <span className="mt-4 block text-sm font-black text-slate-900">
                                {hasSelectedFile ||
                                    hasExistingFile
                                    ? isImage
                                        ? "Cambiar imagen"
                                        : "Cambiar PDF"
                                    : isImage
                                        ? "Seleccionar imagen"
                                        : "Seleccionar PDF"}
                            </span>

                            <span className="mt-1 block max-w-[260px] text-xs font-semibold leading-5 text-slate-500">
                                {isImage
                                    ? "Selecciona una imagen PNG, JPG o WEBP desde tu equipo."
                                    : "Selecciona un documento PDF desde tu equipo."}
                            </span>

                            <input
                                ref={
                                    fileInputRef
                                }
                                type="file"
                                accept={
                                    isImage
                                        ? "image/png,image/jpeg,image/webp"
                                        : "application/pdf"
                                }
                                onChange={
                                    handleFileChange
                                }
                                className="hidden"
                            />
                        </label>

                        {item.selectedFile ? (
                            <div
                                className={`rounded-2xl border px-4 py-3 ${isImage
                                        ? "border-blue-200 bg-blue-50"
                                        : "border-red-200 bg-red-50"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-[0.12em]">
                                            Nuevo archivo
                                            seleccionado
                                        </p>

                                        <p className="mt-1 truncate text-sm font-black">
                                            {
                                                item
                                                    .selectedFile
                                                    .name
                                            }
                                        </p>

                                        <p className="mt-1 text-xs font-bold">
                                            {formatFileSize(
                                                item
                                                    .selectedFile
                                                    .size,
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleRemoveSelectedFile
                                        }
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700 shadow-sm transition hover:bg-red-100"
                                        title="Quitar selección"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {!item.selectedFile &&
                            item.fullExistingFileUrl ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                            Archivo guardado
                                        </p>

                                        <p className="mt-1 truncate text-sm font-black text-slate-900">
                                            Material
                                            disponible
                                            actualmente
                                        </p>
                                    </div>

                                    <a
                                        href={
                                            item.fullExistingFileUrl
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                                    >
                                        <ExternalLink className="h-4 w-4" />

                                        Abrir
                                    </a>
                                </div>
                            </div>
                        ) : null}

                        {!item.selectedFile &&
                            !item.fullExistingFileUrl ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs font-semibold text-slate-500">
                                Todavía no se ha
                                seleccionado ningún
                                archivo.
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={
                                item.saving ||
                                (!item.selectedFile &&
                                    !item.fullExistingFileUrl)
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#0f1d48] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm"
                        >
                            <Save className="h-4 w-4" />

                            {item.saving
                                ? "Guardando..."
                                : "Guardar cambios"}
                        </button>
                    </div>
                </div>
            </div>

            {/* =================================================
                ESTILOS DESCRIPCIÓN
            ================================================= */}

            <style jsx global>{`
                .ProseMirror {
                    outline: none;
                }

                .ProseMirror p {
                    margin: 0.6rem 0;
                }

                .ProseMirror h2 {
                    margin: 1.25rem 0 0.65rem;
                    font-size: 1.4rem;
                    line-height: 1.8rem;
                    font-weight: 900;
                    color: #0f172a;
                }

                .ProseMirror h3 {
                    margin: 1rem 0 0.5rem;
                    font-size: 1.15rem;
                    line-height: 1.6rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .ProseMirror strong {
                    font-weight: 800;
                    color: #0f172a;
                }

                .ProseMirror u {
                    text-decoration: underline;
                }

                .ProseMirror ul {
                    margin: 0.75rem 0;
                    padding-left: 1.75rem;
                    list-style-type: disc;
                }

                .ProseMirror ol {
                    margin: 0.75rem 0;
                    padding-left: 1.75rem;
                    list-style-type: decimal;
                }

                .ProseMirror li {
                    margin: 0.25rem 0;
                }

                .ProseMirror li p {
                    margin: 0.1rem 0;
                }

                .ProseMirror blockquote {
                    margin: 1rem 0;
                    border-left: 4px solid #172861;
                    background: #f8fafc;
                    padding: 0.75rem 1rem;
                    color: #475569;
                    font-style: italic;
                }

                .ProseMirror
                    .file-description-editor-image,
                .ProseMirror img {
                    display: block;
                    width: auto;
                    max-width: 100%;
                    height: auto;
                    margin: 1rem auto;
                    border-radius: 0.75rem;
                    object-fit: contain;
                }

                .ProseMirror
                    img.ProseMirror-selectednode {
                    outline: 3px solid #3b82f6;
                    outline-offset: 3px;
                }
            `}</style>
        </section>
    );
}

export default FileSection;