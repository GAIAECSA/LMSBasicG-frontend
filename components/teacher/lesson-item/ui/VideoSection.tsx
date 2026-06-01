import { BLOCK_TYPE_IDS } from "../constants";
import type { LessonItemState } from "../hook";

type VideoSectionProps = {
    item: LessonItemState;
};

export function VideoSection({ item }: VideoSectionProps) {
    if (item.itemType !== "video") return null;

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
                Video de la lección
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                Se guardará con block_type_id {BLOCK_TYPE_IDS.video} y
                completion_type VER.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                    <label className="block text-[13px] font-bold text-slate-700">
                        URL del video
                    </label>

                    <input
                        value={item.form.video_url}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                video_url: event.target.value,
                            }))
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[13px] font-bold text-slate-700">
                        Proveedor
                    </label>

                    <input
                        value={item.form.video_provider}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                video_provider: event.target.value,
                            }))
                        }
                        placeholder="youtube"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </div>
            </div>

            <div className="mt-5 space-y-2">
                <label className="block text-[13px] font-bold text-slate-700">
                    Porcentaje mínimo para completar
                </label>

                <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.form.completion_value}
                    onChange={(event) =>
                        item.setForm((current) => ({
                            ...current,
                            completion_value: Number(event.target.value),
                        }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>
        </div>
    );
}