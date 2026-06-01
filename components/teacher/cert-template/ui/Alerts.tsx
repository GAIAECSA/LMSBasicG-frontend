type AlertsProps = {
    error: string;
    notice: string;
};

export function Alerts({ error, notice }: AlertsProps) {
    return (
        <>
            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                    {error}
                </div>
            ) : null}

            {notice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                    {notice}
                </div>
            ) : null}
        </>
    );
}