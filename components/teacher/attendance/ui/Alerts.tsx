import { AlertCircle } from "lucide-react";

type AlertsProps = {
    errorMessage: string;
    actionError: string;
};

export function Alerts({ errorMessage, actionError }: AlertsProps) {
    return (
        <>
            {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}

            {actionError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{actionError}</span>
                </div>
            ) : null}
        </>
    );
}