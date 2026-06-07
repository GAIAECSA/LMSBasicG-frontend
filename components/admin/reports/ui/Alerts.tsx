type AlertsProps = {
    errorMessage: string;
};

export function Alerts({
    errorMessage,
}: AlertsProps) {
    if (!errorMessage) return null;

    return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            {errorMessage}
        </div>
    );
}
