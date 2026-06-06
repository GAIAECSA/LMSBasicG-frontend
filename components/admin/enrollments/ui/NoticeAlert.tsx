type NoticeAlertProps = {
    error: string;
    success: string;
    hidden?: boolean;
};

export function NoticeAlert({
    error,
    success,
    hidden = false,
}: NoticeAlertProps) {
    if (hidden || (!error && !success)) {
        return null;
    }

    return (
        <div
            className={`break-words rounded-xl border px-3 py-2.5 text-xs font-semibold leading-5 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
                error
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
        >
            {error || success}
        </div>
    );
}
