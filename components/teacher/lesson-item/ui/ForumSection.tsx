import { Info, MessageSquareText, Save } from "lucide-react";
import { BLOCK_TYPE_IDS } from "../constants";
import type { LessonItemState } from "../hook";

type ForumSectionProps = {
    item: LessonItemState;
};

export function ForumSection({ item }: ForumSectionProps) {
    if (item.itemType !== "forum") return null;

    return (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <MessageSquareText className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-lg font-black text-slate-950">
                            Configuración del foro
                        </h2>

                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            Información visible para el estudiante.
                        </p>
                    </div>
                </div>

            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <div className="flex gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                    <p className="text-xs font-bold leading-5 text-amber-800">
                        La descripción y la consigna aparecerán en la pestaña
                        Foro del estudiante.
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wide text-slate-600">
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
                        className="min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="text-[11px] font-semibold text-slate-400">
                        Objetivo general del foro.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wide text-slate-600">
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
                        className="min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="text-[11px] font-semibold text-slate-400">
                        Instrucción principal antes de participar.
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-2">
                    <Save className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                    <p className="text-xs font-semibold leading-5 text-slate-500">
                        Al guardar, el bloque se mantendrá como foro y los
                        estudiantes podrán participar desde la pestaña Foro.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForumSection;