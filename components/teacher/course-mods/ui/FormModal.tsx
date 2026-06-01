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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
                <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-white">
                                {title}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-blue-50">
                                {description}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={mods.isSaving}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="max-h-[calc(92vh-96px)] space-y-5 overflow-y-auto p-6"
                >
                    {mods.formError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {mods.formError}
                        </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                        <div className="space-y-2">
                            <label className="block text-[13px] font-bold text-slate-700">
                                Nombre
                            </label>

                            <input
                                value={mods.formTitle}
                                onChange={(event) => {
                                    mods.setFormTitle(event.target.value);
                                    mods.setFormError("");
                                }}
                                placeholder={
                                    itemType
                                        ? `Ej: ${getItemLabel(
                                            itemType,
                                        )} introductorio`
                                        : "Ej: Unidad I. Presentación"
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                disabled={mods.isSaving}
                            />
                        </div>

                        {/* <div className="space-y-2">
                            <label className="block text-[13px] font-bold text-slate-700">
                                Orden
                            </label>

                            <input
                                type="number"
                                value={mods.formOrder}
                                onChange={(event) =>
                                    mods.setFormOrder(event.target.value)
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                disabled={mods.isSaving}
                            />
                        </div> */}
                    </div>

                    {itemType ? (
                        <BlockFields
                            itemType={itemType}
                            blockForm={mods.blockForm}
                            setBlockForm={mods.setBlockForm}
                        />
                    ) : null}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={mods.isSaving}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={mods.isSaving}
                        >
                            {mods.isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}