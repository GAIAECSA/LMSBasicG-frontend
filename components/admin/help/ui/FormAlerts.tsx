import {
    AlertCircle,
} from "lucide-react";

type FormAlertsProps = {
    error: string;
};

export function FormAlerts({
    error,
}: FormAlertsProps) {
    if (
        !error
    ) {
        return null;
    }

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2.5 text-xs font-bold leading-5 text-[var(--danger)] shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
        >
            <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5"
            />

            <div className="min-w-0">
                <p className="font-black">
                    Revisa tu solicitud.
                </p>

                <p className="mt-0.5 break-words">
                    {error}
                </p>
            </div>
        </div>
    );
}

export default FormAlerts;