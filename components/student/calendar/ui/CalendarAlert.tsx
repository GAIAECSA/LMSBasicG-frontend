import {
    AlertCircle,
} from "lucide-react";

type CalendarAlertProps = {
    message: string;
};

export function CalendarAlert({
    message,
}: CalendarAlertProps) {
    if (!message) {
        return null;
    }

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700 shadow-sm sm:rounded-2xl sm:p-4 sm:text-sm"
        >
            <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5"
            />

            <div className="min-w-0">
                <p className="font-black">
                    No se pudo cargar el
                    calendario.
                </p>

                <p className="mt-0.5 break-words">
                    {message}
                </p>
            </div>
        </div>
    );
}

export default CalendarAlert;