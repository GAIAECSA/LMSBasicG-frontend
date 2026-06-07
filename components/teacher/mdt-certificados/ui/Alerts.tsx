import { AlertCircle } from "lucide-react";

type AlertsProps = {
    error: string;
};

export function Alerts({
    error,
}: AlertsProps) {
    if (!error) return null;

    return (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words [overflow-wrap:anywhere]">
                {error}
            </span>
        </div>
    );
}
