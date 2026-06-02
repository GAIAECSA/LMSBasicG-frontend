import type { LessonItemState } from "../hook";
import { Save } from "lucide-react";

type TextSectionProps = {
    item: LessonItemState;
};

export function TextSection({ item }: TextSectionProps) {
    if (item.itemType !== "text") return null;

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
                Texto de la lección
            </h2>

            <p className="mt-1 text-sm text-slate-500">
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
                className="mt-5 min-h-[360px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-7 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <div className="mt-5 flex justify-end">
                <button
                    type="submit"
                    disabled={item.saving}
                    className="inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                >
                    <Save className="h-4 w-4" />

                    {item.saving ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>
        </div>
    );
}