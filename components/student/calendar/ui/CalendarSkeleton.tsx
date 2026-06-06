export function CalendarSkeleton() {
    return (
        <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-[26px] sm:p-4">
            <div className="mb-3 h-9 w-52 animate-pulse rounded-xl bg-[var(--muted)]" />

            <div className="overflow-x-auto">
                <div className="grid min-w-[700px] grid-cols-7 gap-1.5 sm:gap-2">
                    {Array.from({ length: 42 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="h-[88px] animate-pulse rounded-xl bg-[var(--muted)] sm:h-[104px]"
                            />
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}

export default CalendarSkeleton;
