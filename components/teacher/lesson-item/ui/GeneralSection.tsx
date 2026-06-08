import type { LessonItemState } from "../hook";
import { Save } from "lucide-react";

type GeneralSectionProps = {
    item: LessonItemState;
};

export function GeneralSection({ item }: GeneralSectionProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 [@media(max-height:760px)]:p-4">
            <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                Información general
            </h2>

            <div className="mt-4 space-y-2 sm:mt-6">
                <label className="block text-xs font-bold text-slate-700 sm:text-[13px]">
                    Título
                </label>

                <input
                    value={item.form.title}
                    onChange={(event) =>
                        item.setForm((current) => ({
                            ...current,
                            title: event.target.value,
                        }))
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                />
            </div>
            <div className="mt-4 grid gap-3  xl:gap-4">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wide text-slate-600 sm:text-[11px]">
                        Descripción de la Tarea
                    </label>

                    <textarea
                        value={item.form.description}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                description: event.target.value,
                            }))
                        }
                        placeholder="Ej: En esta tarea se evaluará el conocimiento adquirido."
                        className="min-h-[96px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:min-h-[110px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6 [@media(max-height:760px)]:min-h-[86px]"
                    />

                    <p className="text-[10px] font-semibold text-slate-400 sm:text-[11px]">
                        Objetivo general de la tarea.
                    </p>
                </div>
            </div>

            <div className="mt-4 flex justify-end sm:mt-5">
                <button
                    type="submit"
                    disabled={item.saving}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:h-12 sm:w-auto sm:min-w-[190px] sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                >
                    <Save className="h-4 w-4" />

                    {item.saving ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>
        </div>
    );
}
