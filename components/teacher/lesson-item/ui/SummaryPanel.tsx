import type { LessonBlock } from "@/services/lessons.service";
import { BLOCK_TYPE_IDS, DEFAULT_COMPLETION_TYPE } from "../constants";
import type { LessonItemState } from "../hook";
import { ItemIcon } from "./ItemIcon";

type SummaryPanelProps = {
    item: LessonItemState;
    block: LessonBlock;
};

export function SummaryPanel({ item, block }: SummaryPanelProps) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <ItemIcon type={item.itemType} className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-950">Resumen</h2>

            <div className="mt-5 space-y-3">
                <SummaryItem label="Lección" value={`#${block.lesson_id}`} />
                <SummaryItem label="Tipo" value={item.itemTypeLabel} />
                <SummaryItem
                    label="Block type ID"
                    value={BLOCK_TYPE_IDS[item.itemType]}
                />
                <SummaryItem
                    label="Completion type"
                    value={DEFAULT_COMPLETION_TYPE[item.itemType]}
                />

                <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-bold text-slate-700">
                        Obligatorio
                    </span>

                    <input
                        type="checkbox"
                        checked={item.form.is_required}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                is_required: event.target.checked,
                            }))
                        }
                        className="h-5 w-5 accent-blue-700"
                    />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-bold text-slate-700">
                        Activo
                    </span>

                    <input
                        type="checkbox"
                        checked={item.form.is_active}
                        onChange={(event) =>
                            item.setForm((current) => ({
                                ...current,
                                is_active: event.target.checked,
                            }))
                        }
                        className="h-5 w-5 accent-blue-700"
                    />
                </label>
            </div>
        </div>
    );
}

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
        </div>
    );
}