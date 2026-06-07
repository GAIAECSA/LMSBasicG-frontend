type AlertsProps = {
    error: string;
};

export function Alerts({
    error,
}: AlertsProps) {
    if (!error) return null;

    return (
        <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            {error}
        </div>
    );
}
