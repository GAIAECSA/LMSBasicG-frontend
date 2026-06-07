import { AlertCircle, AlertTriangle } from "lucide-react";

type AlertsProps = {
    errorMessage: string;
    actionError: string;
};

export function Alerts({
    errorMessage,
    actionError,
}: AlertsProps) {
    return (
        <div className="space-y-2">
            {errorMessage ? (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                    <div className="min-w-0">
                        <p className="font-black">
                            No se pudo cargar la estructura del curso.
                        </p>

                        <p className="mt-0.5 break-words">
                            {errorMessage}
                        </p>
                    </div>
                </div>
            ) : null}

            {actionError ? (
                <div
                    role="alert"
                    aria-live="polite"
                    className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-5 text-amber-700 shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                    <div className="min-w-0">
                        <p className="font-black">
                            No se pudo completar la acción.
                        </p>

                        <p className="mt-0.5 break-words">
                            {actionError}
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default Alerts;
