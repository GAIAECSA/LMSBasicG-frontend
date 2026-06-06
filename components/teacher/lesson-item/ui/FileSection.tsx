"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
    ExternalLink,
    FileText,
    Image as ImageIcon,
    RefreshCw,
    Save,
    Trash2,
    UploadCloud,
} from "lucide-react";
import type { LessonItemState } from "../hook";

type FileSectionProps = {
    item: LessonItemState;
};

function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`;

    const kilobytes = size / 1024;

    if (kilobytes < 1024) {
        return `${kilobytes.toFixed(1)} KB`;
    }

    return `${(kilobytes / 1024).toFixed(2)} MB`;
}

export function FileSection({ item }: FileSectionProps) {
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
    const selectedObjectUrlRef = useRef("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isImage = item.itemType === "image";
    const isPdf = item.itemType === "pdf";

    useEffect(() => {
        return () => {
            if (selectedObjectUrlRef.current) {
                URL.revokeObjectURL(selectedObjectUrlRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!item.selectedFile && selectedObjectUrlRef.current) {
            URL.revokeObjectURL(selectedObjectUrlRef.current);
            selectedObjectUrlRef.current = "";
            setSelectedPreviewUrl("");
        }
    }, [item.selectedFile]);

    if (!isImage && !isPdf) return null;

    const previewUrl = item.selectedFile
        ? selectedPreviewUrl
        : item.fullExistingFileUrl;

    const hasPreview = Boolean(previewUrl);
    const hasSelectedFile = Boolean(item.selectedFile);
    const hasExistingFile = Boolean(item.fullExistingFileUrl);

    function releaseSelectedPreview() {
        if (selectedObjectUrlRef.current) {
            URL.revokeObjectURL(selectedObjectUrlRef.current);
            selectedObjectUrlRef.current = "";
        }

        setSelectedPreviewUrl("");
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (file) {
            releaseSelectedPreview();

            const objectUrl = URL.createObjectURL(file);

            selectedObjectUrlRef.current = objectUrl;
            setSelectedPreviewUrl(objectUrl);
        }

        item.handleSelectedFile(event);
    }

    function handleRemoveSelectedFile() {
        releaseSelectedPreview();
        item.setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
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
                        {isImage ? "PNG · JPG · WEBP" : "Archivo PDF"}
                    </span>
                </div>
            </div>

            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 [@media(max-height:760px)]:space-y-3 [@media(max-height:760px)]:p-4">
                <div className="space-y-2">
                    <label className="block text-[13px] font-black text-slate-700">
                        Descripción del material
                    </label>

                    <textarea
                        value={item.form.description}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                description: event.target.value,
                            }))
                        }
                        placeholder={
                            isImage
                                ? "Describe brevemente qué representa la imagen..."
                                : "Describe brevemente el contenido del documento..."
                        }
                        className="min-h-[80px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:min-h-[96px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                    />
                </div>

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
                                                ? item.selectedFile.name
                                                : isImage
                                                    ? "Imagen guardada actualmente"
                                                    : "PDF guardado actualmente"}
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={previewUrl}
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
                                <div className="flex min-h-[200px] items-center justify-center bg-slate-100 p-3 sm:min-h-[260px] sm:p-4 lg:min-h-[300px] [@media(max-height:760px)]:min-h-[180px]">
                                    <img
                                        src={previewUrl}
                                        alt={
                                            item.form.description ||
                                            "Vista previa de la imagen de la lección"
                                        }
                                        className="max-h-[420px] w-full rounded-xl object-contain sm:rounded-2xl lg:max-h-[520px] [@media(max-height:760px)]:max-h-[320px]"
                                    />
                                </div>
                            ) : (
                                <div className="bg-slate-100 p-3">
                                    <iframe
                                        src={previewUrl}
                                        title="Vista previa del PDF de la lección"
                                        className="h-[420px] w-full rounded-xl border border-slate-200 bg-white sm:h-[560px] sm:rounded-2xl lg:h-[680px] [@media(max-height:760px)]:h-[360px]"
                                    />
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div className="space-y-4">
                        <label className="group flex min-h-[145px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-4 text-center transition hover:border-blue-400 hover:bg-blue-50 sm:min-h-[170px] sm:rounded-3xl sm:px-5 sm:py-5 [@media(max-height:760px)]:min-h-[130px]">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm transition group-hover:-translate-y-1 sm:h-14 sm:w-14 sm:rounded-2xl">
                                {hasSelectedFile || hasExistingFile ? (
                                    <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
                                ) : (
                                    <UploadCloud className="h-7 w-7" />
                                )}
                            </span>

                            <span className="mt-4 block text-sm font-black text-slate-900">
                                {hasSelectedFile || hasExistingFile
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
                                ref={fileInputRef}
                                type="file"
                                accept={
                                    isImage
                                        ? "image/png,image/jpeg,image/webp"
                                        : "application/pdf"
                                }
                                onChange={handleFileChange}
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
                                        <p
                                            className={`text-[11px] font-black uppercase tracking-[0.12em] ${isImage
                                                    ? "text-blue-600"
                                                    : "text-red-600"
                                                }`}
                                        >
                                            Nuevo archivo seleccionado
                                        </p>

                                        <p
                                            className={`mt-1 truncate text-sm font-black ${isImage
                                                    ? "text-blue-950"
                                                    : "text-red-950"
                                                }`}
                                        >
                                            {item.selectedFile.name}
                                        </p>

                                        <p
                                            className={`mt-1 text-xs font-bold ${isImage
                                                    ? "text-blue-700"
                                                    : "text-red-700"
                                                }`}
                                        >
                                            {formatFileSize(
                                                item.selectedFile.size,
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleRemoveSelectedFile}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700 shadow-sm transition hover:bg-red-100"
                                        title="Quitar selección"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {!item.selectedFile && item.fullExistingFileUrl ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                            Archivo guardado
                                        </p>

                                        <p className="mt-1 truncate text-sm font-black text-slate-900">
                                            Material disponible actualmente
                                        </p>
                                    </div>

                                    <a
                                        href={item.fullExistingFileUrl}
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

                        {!item.selectedFile && !item.fullExistingFileUrl ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs font-semibold text-slate-500">
                                Todavía no se ha seleccionado ningún archivo.
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
        </section>
    );
}

export default FileSection;