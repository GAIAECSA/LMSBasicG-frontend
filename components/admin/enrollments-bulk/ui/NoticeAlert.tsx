import {
    AlertCircle,
} from "lucide-react";

type NoticeAlertProps = {
    error: string | null;
};

export function NoticeAlert({
    error,
}: NoticeAlertProps) {
    if (!error) {
        return null;
    }

    return (
        <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold leading-5 text-rose-800 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

            <span className="break-words [overflow-wrap:anywhere]">
                {error}
            </span>
        </div>
    );
}
