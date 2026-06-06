import type { LessonItemState } from "../hook";

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
        </div>
    );
}
