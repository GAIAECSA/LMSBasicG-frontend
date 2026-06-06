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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12 sm:rounded-2xl">
                <ItemIcon type={item.itemType} className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <h2 className="mt-3 text-base font-black text-slate-950 sm:mt-4 sm:text-lg">
                Resumen
            </h2>

            <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
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

                <CheckSummaryItem
                    label="Obligatorio"
                    checked={item.form.is_required}
                    onChange={(checked) =>
                        item.setForm((current) => ({
                            ...current,
                            is_required: checked,
                        }))
                    }
                />

                <CheckSummaryItem
                    label="Activo"
                    checked={item.form.is_active}
                    onChange={(checked) =>
                        item.setForm((current) => ({
                            ...current,
                            is_active: checked,
                        }))
                    }
                />
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
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                {label}
            </p>

            <p className="mt-1 break-words text-xs font-black text-slate-950 sm:text-sm">
                {value}
            </p>
        </div>
    );
}

function CheckSummaryItem({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <span className="text-xs font-bold text-slate-700 sm:text-sm">
                {label}
            </span>

            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 shrink-0 accent-blue-700 sm:h-5 sm:w-5"
            />
        </label>
    );
}
