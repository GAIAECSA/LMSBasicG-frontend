import type { ReactNode } from "react";
import {
    FileCheck2,
    FileText,
    ShieldCheck,
} from "lucide-react";
import type { PrivacySummary } from "../types";

type SummaryCardsProps = {
    summary: PrivacySummary;
};

export function SummaryCards({
    summary,
}: SummaryCardsProps) {
    return (
        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
            <SummaryCard
                icon={
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                }
                title="Políticas"
                value={summary.total}
                helper="Registros creados"
            />

            <SummaryCard
                icon={
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                }
                title="Activas"
                value={summary.active}
                helper="Políticas activas"
            />

            <SummaryCard
                icon={
                    <FileCheck2 className="h-4 w-4 sm:h-5 sm:w-5" />
                }
                title="Obligatorias"
                value={summary.mandatory}
                helper="Requieren aceptación"
            />
        </div>
    );
}

function SummaryCard({
    icon,
    title,
    value,
    helper,
}: {
    icon: ReactNode;
    title: string;
    value: number;
    helper: string;
}) {
    return (
        <div className="rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] sm:h-10 sm:w-10 sm:rounded-2xl">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 sm:text-xs">
                        {title}
                    </p>

                    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <p className="text-xl font-black text-slate-950 sm:text-2xl">
                            {value}
                        </p>

                        <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                            {helper}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
