type AlertsProps = {
    error: string;
    notice: string;
};

export function Alerts({
    error,
    notice,
}: AlertsProps) {
    return (
        <>
            {error ? (
                <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {error}
                </div>
            ) : null}

            {notice ? (
                <div className="break-words rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold leading-5 text-emerald-700 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {notice}
                </div>
            ) : null}
        </>
    );
}
