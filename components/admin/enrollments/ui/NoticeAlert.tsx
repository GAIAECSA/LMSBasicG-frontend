type NoticeAlertProps = {
    error: string;
    hidden?: boolean;
};

export function NoticeAlert({
    error,
    hidden = false,
}: NoticeAlertProps) {
    if (hidden || !error) {
        return null;
    }

    return (
        <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-700 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            {error}
        </div>
    );
}
