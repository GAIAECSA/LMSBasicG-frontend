import {
    Edit3,
    ExternalLink,
    Loader2,
    Plus,
    UploadCloud,
    X,
} from "lucide-react";
import type { MdtRequiredFilesState } from "../hook";
import { getBlockTemplateUrl } from "../utils";

type FormModalProps = {
    files: MdtRequiredFilesState;
};

export function FormModal({
    files,
}: FormModalProps) {
    if (!files.formModal) return null;

    const currentTemplateUrl =
        files.formModal.mode === "edit"
            ? getBlockTemplateUrl(
                files.formModal.block,
            )
            : "";

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <form
                onSubmit={files.handleSubmit}
                className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[28px]"
            >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100 sm:text-xs">
                            Archivos MDT
                        </p>

                        <h2 className="mt-1 break-words text-lg font-black sm:text-xl">
                            {files.formModal.mode ===
                                "create"
                                ? "Agregar archivo obligatorio"
                                : "Editar archivo obligatorio"}
                        </h2>

                        <p className="mt-1 hidden text-xs font-semibold leading-5 text-blue-50 sm:block sm:text-sm sm:leading-6">
                            Registra el documento requerido que el estudiante deberá subir en el aula.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={files.closeFormModal}
                        disabled={files.isSaving}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                        aria-label="Cerrar modal"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 lg:p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-xs font-black text-slate-700 sm:text-sm">
                                Lección
                            </span>

                            <select
                                value={
                                    files.formState
                                        .lessonId
                                }
                                onChange={(event) =>
                                    files.setFormState(
                                        (current) => ({
                                            ...current,
                                            lessonId:
                                                event
                                                    .target
                                                    .value,
                                        }),
                                    )
                                }
                                disabled={
                                    files.isSaving
                                }
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                            >
                                <option value="">
                                    Selecciona una lección
                                </option>

                                {files.lessons.map(
                                    (lesson) => (
                                        <option
                                            key={
                                                lesson.id
                                            }
                                            value={
                                                lesson.id
                                            }
                                        >
                                            {
                                                lesson.name
                                            }
                                        </option>
                                    ),
                                )}

                                {!files.hasCurrentLessonInOptions &&
                                    files.formState.lessonId ? (
                                    <option
                                        value={
                                            files
                                                .formState
                                                .lessonId
                                        }
                                    >
                                        Lección #
                                        {
                                            files
                                                .formState
                                                .lessonId
                                        }
                                    </option>
                                ) : null}
                            </select>
                        </label>

                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 sm:text-xs">
                                Ubicación
                            </p>

                            <p className="mt-1 truncate text-xs font-black text-blue-950 sm:text-sm">
                                {files.selectedLessonName}
                            </p>
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-xs font-black text-slate-700 sm:text-sm">
                            Nombre del archivo obligatorio
                        </span>

                        <input
                            value={
                                files.formState.title
                            }
                            onChange={(event) =>
                                files.setFormState(
                                    (current) => ({
                                        ...current,
                                        title: event.target
                                            .value,
                                    }),
                                )
                            }
                            disabled={files.isSaving}
                            placeholder="Ejemplo: Copia de cédula"
                            className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-black text-slate-700 sm:text-sm">
                            Descripción o indicaciones
                        </span>

                        <textarea
                            value={
                                files.formState
                                    .description
                            }
                            onChange={(event) =>
                                files.setFormState(
                                    (current) => ({
                                        ...current,
                                        description:
                                            event.target
                                                .value,
                                    }),
                                )
                            }
                            disabled={files.isSaving}
                            rows={3}
                            placeholder="Ejemplo: Suba una copia legible de su documento de identidad."
                            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                        />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-xs font-black text-slate-700 sm:text-sm">
                                Formatos permitidos
                            </span>

                            <input
                                value={
                                    files.formState
                                        .acceptedFileTypes
                                }
                                onChange={(event) =>
                                    files.setFormState(
                                        (current) => ({
                                            ...current,
                                            acceptedFileTypes:
                                                event
                                                    .target
                                                    .value,
                                        }),
                                    )
                                }
                                disabled={
                                    files.isSaving
                                }
                                placeholder=".pdf,.jpg,.png"
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-black text-slate-700 sm:text-sm">
                                Tamaño máximo MB
                            </span>

                            <input
                                value={
                                    files.formState
                                        .maxFileSizeMb
                                }
                                onChange={(event) =>
                                    files.setFormState(
                                        (current) => ({
                                            ...current,
                                            maxFileSizeMb:
                                                event
                                                    .target
                                                    .value,
                                        }),
                                    )
                                }
                                disabled={
                                    files.isSaving
                                }
                                type="number"
                                min="1"
                                placeholder="10"
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                            />
                        </label>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center sm:rounded-2xl sm:p-5">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-11 sm:w-11 sm:rounded-2xl">
                            <UploadCloud className="h-5 w-5" />
                        </div>

                        <h3 className="mt-2 text-sm font-black text-slate-950 sm:text-base">
                            Archivo de referencia
                        </h3>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                            Opcional. Adjunta una plantilla para el estudiante.
                        </p>

                        <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm">
                            <UploadCloud className="h-4 w-4" />
                            Elegir archivo

                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                onChange={
                                    files.handleFileChange
                                }
                                disabled={
                                    files.isSaving
                                }
                                className="hidden"
                            />
                        </label>
                    </div>

                    {files.formState.file ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-950 sm:text-sm">
                                        Archivo seleccionado
                                    </p>

                                    <p className="mt-1 truncate text-xs font-bold text-slate-600 sm:text-sm">
                                        {
                                            files.formState
                                                .file.name
                                        }
                                    </p>

                                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                        {Math.max(
                                            files.formState
                                                .file.size /
                                            1024,
                                            1,
                                        ).toFixed(0)}{" "}
                                        KB
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        files.clearCapturedFile
                                    }
                                    disabled={
                                        files.isSaving
                                    }
                                    className="shrink-0 text-xs font-black text-red-600 hover:underline disabled:opacity-60"
                                >
                                    Quitar
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {currentTemplateUrl ? (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 sm:text-xs">
                                Archivo actual
                            </p>

                            <a
                                href={currentTemplateUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-black text-[#172861] hover:underline sm:text-sm"
                            >
                                Ver archivo actual
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    ) : null}
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:gap-3 sm:px-5 lg:px-6">
                    <button
                        type="button"
                        onClick={files.closeFormModal}
                        disabled={files.isSaving}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={files.isSaving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {files.isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : files.formModal.mode ===
                            "create" ? (
                            <Plus className="h-4 w-4" />
                        ) : (
                            <Edit3 className="h-4 w-4" />
                        )}

                        {files.formModal.mode ===
                            "create"
                            ? "Crear archivo"
                            : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}
