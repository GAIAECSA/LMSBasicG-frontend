import { AlertCircle } from "lucide-react";

type AlertsProps = {
    errorMessage: string;
    actionError: string;
};

export function Alerts({
    errorMessage,
    actionError,
}: AlertsProps) {
    return (
        <>
            {errorMessage ? (
                <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {errorMessage}
                    </span>
                </div>
            ) : null}

            {actionError ? (
                <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-5 text-amber-700 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {actionError}
                    </span>
                </div>
            ) : null}
        </>
    );
}
