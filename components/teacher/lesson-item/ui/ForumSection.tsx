import { Info, MessageSquareText, Save } from "lucide-react";
import type { LessonItemState } from "../hook";

type ForumSectionProps = {
    item: LessonItemState;
};

export function ForumSection({ item }: ForumSectionProps) {
    if (item.itemType !== "forum") return null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                        <MessageSquareText className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-base font-black text-slate-950 sm:text-lg">
                            Configuración del foro
                        </h2>

                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            Información visible para el estudiante.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                <div className="flex gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                    <p className="text-xs font-bold leading-5 text-amber-800">
                        La descripción y la consigna aparecerán en la pestaña
                        Foro del estudiante.
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[0.9fr_1.1fr] xl:gap-4">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wide text-slate-600 sm:text-[11px]">
                        Descripción del foro
                    </label>

                    <textarea
                        value={item.form.description}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                description: event.target.value,
                            }))
                        }
                        placeholder="Ej: En este foro se discutirá el tema revisado."
                        className="min-h-[96px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:min-h-[110px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6 [@media(max-height:760px)]:min-h-[86px]"
                    />

                    <p className="text-[10px] font-semibold text-slate-400 sm:text-[11px]">
                        Objetivo general del foro.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wide text-slate-600 sm:text-[11px]">
                        Consigna o instrucción
                    </label>

                    <textarea
                        value={item.form.forum_prompt}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                forum_prompt: event.target.value,
                            }))
                        }
                        placeholder="Ej: Comparte tu opinión sobre el tema revisado."
                        className="min-h-[96px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:min-h-[110px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6 [@media(max-height:760px)]:min-h-[86px]"
                    />

                    <p className="text-[10px] font-semibold text-slate-400 sm:text-[11px]">
                        Instrucción principal antes de participar.
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

export default ForumSection;
