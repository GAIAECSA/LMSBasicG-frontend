import type { LessonItemState } from "../hook";
import { Save } from "lucide-react";

type TextSectionProps = {
    item: LessonItemState;
};

export function TextSection({ item }: TextSectionProps) {
    if (item.itemType !== "text") return null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 [@media(max-height:760px)]:p-4">
            <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                Texto de la lección
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Este bloque se guarda como texto simple.
            </p>

            <textarea
                value={item.form.text}
                onChange={(event) =>
                    item.setForm((current) => ({
                        ...current,
                        text: event.target.value,
                    }))
                }
                placeholder="Escribe el texto que verá el estudiante..."
                className="mt-4 min-h-[220px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium leading-6 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:mt-5 sm:min-h-[320px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-7 [@media(max-height:760px)]:min-h-[180px]"
            />

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
