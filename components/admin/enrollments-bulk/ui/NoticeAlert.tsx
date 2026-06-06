import {
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

type NoticeAlertProps = {
    error: string | null;
    success: string | null;
};

export function NoticeAlert({
    error,
    success,
}: NoticeAlertProps) {
    if (!error && !success) {
        return null;
    }

    const hasError = Boolean(error);

    return (
        <div
            className={`flex gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-bold leading-5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
                hasError
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
        >
            {hasError ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            )}

            <span className="break-words [overflow-wrap:anywhere]">
                {error || success}
            </span>
        </div>
    );
}
