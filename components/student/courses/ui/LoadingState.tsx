export function LoadingState() {
    return (
        <div className="space-y-3">
            {[1, 2].map((item) => (
                <div
                    key={item}
                    className="h-[178px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:rounded-3xl"
                />
            ))}
        </div>
    );
}

export default LoadingState;
