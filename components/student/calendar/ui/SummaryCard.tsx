import { CalendarDays } from "lucide-react";
import type { CalendarSummaryTone } from "../types";

type SummaryCardProps = {
    title: string;
    value: number;
    detail: string;
    tone: CalendarSummaryTone;
};

export function SummaryCard({
    title,
    value,
    detail,
    tone,
}: SummaryCardProps) {
    const styles = {
        blue: "bg-[var(--secondary)] text-[var(--primary)]",
        green: "bg-[var(--success-soft)] text-[var(--success)]",
        red: "bg-red-50 text-red-700",
    }[tone];

    return (
        <article className="min-w-0 rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-sm sm:rounded-[20px] sm:p-3.5 [@media(max-height:760px)]:sm:p-3">
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${styles}`}
            >
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] sm:text-xs">
                {title}
            </p>

            <p className="mt-0.5 text-xl font-black text-[var(--foreground)] sm:text-2xl">
                {value}
            </p>

            <p className="mt-0.5 hidden truncate text-[11px] font-semibold text-[var(--muted-foreground)] sm:block">
                {detail}
            </p>
        </article>
    );
}

export default SummaryCard;
