import type { FormEvent } from "react";
import { Loader2, Save, X } from "lucide-react";
import type { CourseModsState } from "../hook";
import type { LessonItemType } from "../types";
import { getItemLabel } from "../utils";
import { BlockFields } from "./BlockFields";

type FormModalProps = {
    title: string;
    description: string;
    submitLabel: string;
    itemType: LessonItemType | null;
    mods: CourseModsState;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function FormModal({
    title,
    description,
    submitLabel,
    itemType,
    mods,
    onClose,
    onSubmit,
}: FormModalProps) {
    function handleBackdropClick() {
        if (mods.isSaving) return;

        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={handleBackdropClick}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="form-modal-title"
                className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[28px]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <h2
                                id="form-modal-title"
                                className="break-words text-lg font-black leading-6 text-white [overflow-wrap:anywhere] sm:text-xl sm:leading-7"
                            >
                                {title}
                            </h2>

                            <p className="mt-1 break-words text-xs leading-5 text-blue-50 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                                {description}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={mods.isSaving}
                            aria-label="Cerrar modal"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-5 lg:p-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 sm:text-[13px]">
                                Nombre

                                {!mods.formTitle.trim() ? (
                                    <span className="ml-1 text-red-600">
                                        *
                                    </span>
                                ) : null}
                            </label>

                            <input
                                value={mods.formTitle}
                                onChange={(event) => {
                                    mods.setFormTitle(
                                        event.target.value,
                                    );

                                    mods.setFormError("");
                                }}
                                placeholder={
                                    itemType
                                        ? `Ej: ${getItemLabel(
                                            itemType,
                                        )} introductorio`
                                        : "Ej: Unidad I. Presentación"
                                }
                                className="mt-1.5 h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:mt-2 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm"
                                disabled={mods.isSaving}
                                aria-invalid={Boolean(mods.formError)}
                                aria-describedby={
                                    mods.formError
                                        ? "course-mod-form-error"
                                        : undefined
                                }
                            />

                            {mods.formError ? (
                                <p
                                    id="course-mod-form-error"
                                    className="mt-1.5 break-words text-[11px] font-bold leading-4 text-red-600 sm:text-xs"
                                >
                                    {mods.formError}
                                </p>
                            ) : null}
                        </div>

                        {itemType ? (
                            <BlockFields
                                itemType={itemType}
                                blockForm={mods.blockForm}
                                setBlockForm={
                                    mods.setBlockForm
                                }
                            />
                        ) : null}
                    </div>

                    <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-white p-4 xs:grid-cols-2 sm:gap-3 sm:px-5 lg:flex lg:justify-end lg:px-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={mods.isSaving}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={mods.isSaving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                        >
                            {mods.isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            {mods.isSaving
                                ? "Guardando..."
                                : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}