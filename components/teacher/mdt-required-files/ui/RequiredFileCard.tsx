import {
    ClipboardCheck,
    Edit3,
    ExternalLink,
    FileText,
    Trash2,
} from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
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
import type { Lesson } from "@/services/lessons.service";

type RequiredFileCardProps = {
    block: LessonBlock;
    lessons: Lesson[];
    isSaving: boolean;
    isLoadingVerifications: boolean;
    onVerify: (block: LessonBlock) => void;
    onEdit: (block: LessonBlock) => void;
    onDelete: (block: LessonBlock) => void;
};

export function RequiredFileCard({
    block,
    lessons,
    isSaving,
    isLoadingVerifications,
    onVerify,
    onEdit,
    onDelete,
}: RequiredFileCardProps) {
    const templateUrl = getBlockTemplateUrl(block);
    const fileName = getBlockFileName(block);
    const acceptedTypes =
        getBlockAcceptedTypes(block) || "Documento";
    const maxSize = getBlockMaxFileSize(block) || "10";

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-100 hover:shadow-md sm:p-4">
            <div className="grid gap-3 min-[1180px]:grid-cols-[minmax(0,1fr)_auto] min-[1180px]:items-start">
                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>

                        <div className="min-w-[160px] flex-1">
                            <h3 className="truncate text-sm font-black text-slate-950 sm:text-base">
                                {getBlockTitle(block)}
                            </h3>

                            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500 sm:text-xs">
                                {getLessonName(
                                    lessons,
                                    block.lesson_id,
                                )}
                            </p>
                        </div>

                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 sm:text-xs">
                            Obligatorio
                        </span>

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                            #{block.id}
                        </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                        {getBlockDescription(block)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-black text-slate-500 sm:gap-2 sm:text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Tipos: {acceptedTypes}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Máx: {maxSize} MB
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Actualizado:{" "}
                            {formatDate(
                                getValue(block, [
                                    "updated_at",
                                    "updatedAt",
                                    "created_at",
                                    "createdAt",
                                ]),
                            )}
                        </span>
                    </div>

                    {fileName ? (
                        <div className="mt-3 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            Archivo capturado: {fileName}
                        </div>
                    ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 min-[1180px]:w-[430px]">
                    {templateUrl ? (
                        <a
                            href={templateUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver archivo de referencia"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs"
                        >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Ver archivo</span>
                        </a>
                    ) : (
                        <span className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-black text-slate-400 sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs">
                            Sin archivo
                        </span>
                    )}

                    <button
                        type="button"
                        title="Verificar documentos enviados"
                        onClick={() => onVerify(block)}
                        disabled={isSaving || isLoadingVerifications}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs"
                    >
                        <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                        Verificar
                    </button>

                    <button
                        type="button"
                        title="Editar archivo obligatorio"
                        onClick={() => onEdit(block)}
                        disabled={isSaving}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-2.5 text-[11px] font-black text-blue-700 transition hover:bg-blue-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs"
                    >
                        <Edit3 className="h-3.5 w-3.5 shrink-0" />
                        Editar
                    </button>

                    <button
                        type="button"
                        title="Eliminar archivo obligatorio"
                        onClick={() => onDelete(block)}
                        disabled={isSaving}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 text-[11px] font-black text-red-700 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-3 sm:text-xs"
                    >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        Eliminar
                    </button>
                </div>
            </div>
        </article>
    );
}
