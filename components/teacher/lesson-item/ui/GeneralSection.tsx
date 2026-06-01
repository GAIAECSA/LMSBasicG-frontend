import type { LessonItemState } from "../hook";

type GeneralSectionProps = {
    item: LessonItemState;
};

export function GeneralSection({ item }: GeneralSectionProps) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
                Información general
            </h2>

            <div className="mt-6 space-y-2">
                <label className="block text-[13px] font-bold text-slate-700">
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>
        </div>
    );
}