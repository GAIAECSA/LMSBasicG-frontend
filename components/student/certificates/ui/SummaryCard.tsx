import type { ReactNode } from "react";

type SummaryCardProps = {
    title: string;
    value: string;
    detail: string;
    tone: "green" | "orange" | "blue";
    icon: ReactNode;
};

export function SummaryCard({
    title,
    value,
    detail,
    tone,
    icon,
}: SummaryCardProps) {
    const styles = {
        green: {
            bg: "bg-[var(--success-soft)] text-[var(--success)]",
            line: "bg-[var(--success)]",
        },
        orange: {
            bg: "bg-[var(--warning-soft)] text-[var(--warning)]",
            line: "bg-[var(--warning)]",
        },
        blue: {
            bg: "bg-[var(--secondary)] text-[var(--primary)]",
            line: "bg-[var(--primary)]",
        },
    }[tone];

    return (
        <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${styles.bg}`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                        {title}
                    </p>

                    <p className="mt-1 text-3xl font-black text-[var(--foreground)]">
                        {value}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                        {detail}
                    </p>
                </div>
            </div>

            <div className="mt-5 h-1.5 rounded-full bg-[var(--muted)]">
                <div className={`h-1.5 w-4/5 rounded-full ${styles.line}`} />
            </div>
        </div>
    );
}
