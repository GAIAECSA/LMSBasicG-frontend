export function Loading() {
    return (
        <div className="grid gap-5 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="h-[280px] animate-pulse rounded-[26px] border border-[var(--border)] bg-white"
                />
            ))}
        </div>
    );
}
