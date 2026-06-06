import { AlertCircle } from "lucide-react";

type DashboardAlertProps = {
    error: string;
};

export function DashboardAlert({
    error,
}: DashboardAlertProps) {
    if (!error) return null;

    return (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span>{error}</span>
        </div>
    );
}

export default DashboardAlert;
