import {
    ClipboardCheck,
    ExternalLink,
    FileText,
} from "lucide-react";

import type {
    Lesson,
    LessonBlock,
} from "@/services/lessons.service";

import {
    formatDate,
    getBlockAcceptedTypes,
    getBlockDescription,
    getBlockFileName,
    getBlockMaxFileSize,
    getBlockTemplateUrl,
    getBlockTitle,
    getLessonName,
    getValue,
} from "../utils";

type RequiredFileCardProps = {
    block: LessonBlock;
    lessons: Lesson[];

    isSaving: boolean;
    isLoadingVerifications: boolean;

    onVerify: (
        block: LessonBlock,
    ) => void;

    onEdit: (
        block: LessonBlock,
    ) => void;

    onDelete: (
        block: LessonBlock,
    ) => void;
};

export function RequiredFileCard({
    block,
    lessons,
    isSaving,
    isLoadingVerifications,
    onVerify,
}: RequiredFileCardProps) {
    /* =====================================================
       ARCHIVO
    ===================================================== */

    const templateUrl =
        getBlockTemplateUrl(
            block,
        );

    const fileName =
        getBlockFileName(
            block,
        );

    const acceptedTypes =
        getBlockAcceptedTypes(
            block,
        ) ||
        "Documento";

    const maxSize =
        getBlockMaxFileSize(
            block,
        ) ||
        "10";

    /* =====================================================
       LECCIÓN

       Los bloques MDT default pueden tener:
       lesson_id = null

       Por eso NO llamamos getLessonName()
       hasta comprobar que realmente existe.
    ===================================================== */

    const lessonId =
        block.lesson_id !== null &&
            block.lesson_id !== undefined
            ? Number(
                block.lesson_id,
            )
            : null;

    const lessonName =
        lessonId !== null &&
            Number.isFinite(
                lessonId,
            ) &&
            lessonId > 0
            ? getLessonName(
                lessons,
                lessonId,
            )
            : "Archivo general del curso";

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-100 hover:shadow-md sm:p-4">
            <div className="grid gap-3 min-[1180px]:grid-cols-[minmax(0,1fr)_auto] min-[1180px]:items-start">

                {/* =========================================
                    INFORMACIÓN
                ========================================= */}

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>

                        <div className="min-w-[160px] flex-1">
                            <h3 className="truncate text-sm font-black text-slate-950 sm:text-base">
                                {getBlockTitle(
                                    block,
                                )}
                            </h3>

                            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500 sm:text-xs">
                                {
                                    lessonName
                                }
                            </p>
                        </div>

                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 sm:text-xs">
                            Obligatorio
                        </span>

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                            #
                            {
                                block.id
                            }
                        </span>
                    </div>

                    {/* =====================================
                        DESCRIPCIÓN
                    ===================================== */}

                    <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                        {getBlockDescription(
                            block,
                        )}
                    </p>

                    {/* =====================================
                        INFORMACIÓN ADICIONAL
                    ===================================== */}

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-black text-slate-500 sm:gap-2 sm:text-xs">

                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Tipos:{" "}
                            {
                                acceptedTypes
                            }
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Máx:{" "}
                            {
                                maxSize
                            }{" "}
                            MB
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Actualizado:{" "}
                            {formatDate(
                                getValue(
                                    block,
                                    [
                                        "updated_at",
                                        "updatedAt",
                                        "created_at",
                                        "createdAt",
                                    ],
                                ),
                            )}
                        </span>
                    </div>

                    {/* =====================================
                        ARCHIVO CAPTURADO
                    ===================================== */}

                    {fileName ? (
                        <div className="mt-3 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            Archivo capturado:{" "}
                            {
                                fileName
                            }
                        </div>
                    ) : null}
                </div>

                {/* =========================================
                    ACCIONES
                ========================================= */}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 min-[1180px]:w-[430px]">

                    {/* VER ARCHIVO */}

                    {templateUrl ? (
                        <a
                            href={
                                templateUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            title="Ver archivo de referencia"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs"
                        >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />

                            <span className="truncate">
                                Ver archivo
                            </span>
                        </a>
                    ) : (
                        <span className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-black text-slate-400 sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs">
                            Sin archivo
                        </span>
                    )}

                    {/* VERIFICAR */}

                    <button
                        type="button"
                        title="Verificar documentos enviados"
                        onClick={() =>
                            onVerify(
                                block,
                            )
                        }
                        disabled={
                            isSaving ||
                            isLoadingVerifications
                        }
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs"
                    >
                        <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />

                        Verificar
                    </button>
                </div>
            </div>
        </article>
    );
}

export default RequiredFileCard;