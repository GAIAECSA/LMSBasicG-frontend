type AlertsProps = {
    error: string;
    notice: string;
};

export function Alerts({ error, notice }: AlertsProps) {
    return (
        <>
            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            {notice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {notice}
                </div>
            ) : null}
        </>
    );
}