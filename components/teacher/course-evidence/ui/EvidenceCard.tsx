"use client";

import type {
    ChangeEvent,
} from "react";

import {
    ExternalLink,
    FileCheck2,
    Loader2,
    RefreshCw,
    Upload,
} from "lucide-react";

import type {
    EvidenceItem,
} from "../types";

type EvidenceCardProps = {
    item: EvidenceItem;

    uploading: boolean;

    canUpload?: boolean;

    onUpload: (
        item: EvidenceItem,
        file: File,
    ) => void;
};

export function EvidenceCard({
    item,
    uploading,
    canUpload = true,
    onUpload,
}: EvidenceCardProps) {
    const hasFile =
        Boolean(
            item.fileUrl,
        );

    function handleFileChange(
        event:
            ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target
                .files?.[0] ??
            null;

        /*
         * Permitimos seleccionar el mismo
         * archivo nuevamente.
         */
        event.target.value =
            "";

        if (!file) {
            return;
        }

        onUpload(
            item,
            file,
        );
    }

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* =========================
                    INFORMACIÓN
                ========================= */}

                <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <FileCheck2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black text-slate-950 sm:text-base">
                                {
                                    item.content
                                        .title
                                }
                            </h3>

                            {item.content
                                .required ? (
                                <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                                    Obligatorio
                                </span>
                            ) : null}

                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                                #
                                {
                                    item.block
                                        .id
                                }
                            </span>
                        </div>

                        {item.content
                            .description ? (
                            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                {
                                    item.content
                                        .description
                                }
                            </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                Máx:{" "}
                                {
                                    item.content
                                        .maxSizeMb
                                }{" "}
                                MB
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                Bloque #
                                {
                                    item.block
                                        .id
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {/* =========================
                    ACCIONES
                ========================= */}

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span
                        className={`inline-flex min-h-10 items-center rounded-xl px-4 text-xs font-black ${hasFile
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                    >
                        {hasFile
                            ? "Archivo cargado"
                            : "Sin archivo"}
                    </span>

                    {/* VER */}

                    {hasFile ? (
                        <a
                            href={
                                item.fileUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                        >
                            <ExternalLink className="h-4 w-4" />

                            Ver archivo
                        </a>
                    ) : null}

                    {/* SUBIR / REEMPLAZAR */}

                    {canUpload ? (
                        <label
                            className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black text-white transition hover:bg-[#203674] ${uploading
                                    ? "pointer-events-none opacity-60"
                                    : ""
                                }`}
                        >
                            {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : hasFile ? (
                                <RefreshCw className="h-4 w-4" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}

                            {uploading
                                ? "Subiendo..."
                                : hasFile
                                    ? "Reemplazar"
                                    : "Subir evidencia"}

                            <input
                                type="file"
                                className="hidden"
                                disabled={
                                    uploading
                                }
                                onChange={
                                    handleFileChange
                                }
                            />
                        </label>
                    ) : null}
                </div>
            </div>

            {/* =========================
                NOMBRE ARCHIVO
            ========================= */}

            {item.filename ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="truncate text-xs font-semibold text-slate-500">
                        Archivo:{" "}
                        <span className="font-bold text-slate-700">
                            {
                                item.filename
                            }
                        </span>
                    </p>
                </div>
            ) : null}
        </article>
    );
}

export default EvidenceCard;