import {
    CheckCircle2,
} from "lucide-react";

import type {
    EnrollmentsAdminBulkPanelState,
} from "../hook";

import {
    renderUnknownValue,
} from "../utils";

type BulkResultPanelProps = {
    panel: EnrollmentsAdminBulkPanelState;
};

export function BulkResultPanel({
    panel,
}: BulkResultPanelProps) {
    if (!panel.result) {
        return null;
    }

    return (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:rounded-[28px] sm:p-5 [@media(max-height:760px)]:p-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 sm:h-5 sm:w-5" />

                <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-black text-emerald-900 sm:text-sm">
                        Matrícula masiva finalizada
                    </h3>

                    <div className="mt-3 grid gap-2 xs:grid-cols-3 sm:gap-3">
                        <ResultCard
                            value={
                                panel.resultCount.created
                            }
                            label="Creados"
                            className="text-emerald-700"
                        />

                        <ResultCard
                            value={
                                panel.resultCount.skipped
                            }
                            label="Omitidos"
                            className="text-orange-600"
                        />

                        <ResultCard
                            value={
                                panel.resultCount.failed
                            }
                            label="Fallidos"
                            className="text-rose-600"
                        />
                    </div>

                    {panel.result.failed.length >
                    0 ? (
                        <ResultDetails
                            title="Ver fallidos"
                            tone="rose"
                            items={
                                panel.result.failed
                            }
                        />
                    ) : null}

                    {panel.result.skipped.length >
                    0 ? (
                        <ResultDetails
                            title="Ver omitidos"
                            tone="orange"
                            items={
                                panel.result.skipped
                            }
                        />
                    ) : null}
                </div>
            </div>
        </section>
    );
}

function ResultCard({
    value,
    label,
    className,
}: {
    value: number;
    label: string;
    className: string;
}) {
    return (
        <div className="rounded-xl bg-white p-2.5 text-center sm:rounded-2xl sm:p-3">
            <p
                className={`text-xl font-black sm:text-2xl ${className}`}
            >
                {value}
            </p>

            <p className="text-[10px] font-black text-slate-500 sm:text-xs">
                {label}
            </p>
        </div>
    );
}

function ResultDetails({
    title,
    tone,
    items,
}: {
    title: string;
    tone: "rose" | "orange";
    items: unknown[];
}) {
    const titleClass =
        tone === "rose"
            ? "text-rose-700"
            : "text-orange-700";

    const itemClass =
        tone === "rose"
            ? "bg-rose-50 text-rose-800"
            : "bg-orange-50 text-orange-800";

    return (
        <details className="mt-3 rounded-xl bg-white p-3 sm:mt-4 sm:rounded-2xl">
            <summary
                className={`cursor-pointer text-xs font-black sm:text-sm ${titleClass}`}
            >
                {title}
            </summary>

            <div className="mt-2 space-y-2 sm:mt-3">
                {items.map((item, index) => (
                    <div
                        key={`${tone}-${index}`}
                        className={`break-words rounded-xl p-2.5 text-[11px] font-semibold leading-4 [overflow-wrap:anywhere] sm:rounded-2xl sm:p-3 sm:text-xs sm:leading-5 ${itemClass}`}
                    >
                        {renderUnknownValue(item)}
                    </div>
                ))}
            </div>
        </details>
    );
}
