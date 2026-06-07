type SummaryItemProps = {
    icon: React.ReactNode;
    title: string;
    value: string;
};

export function SummaryItem({
    icon,
    title,
    value,
}: SummaryItemProps) {
    return (
        <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:lg:p-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm sm:h-10 sm:w-10">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] sm:text-xs">
                        {title}
                    </p>

                    <p
                        className="mt-1 truncate text-xs font-black text-[var(--foreground)] sm:text-sm"
                        title={value}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SummaryItem;
