import {
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

type FormAlertsProps = {
    error: string;
    copied: boolean;
};

export function FormAlerts({
    error,
    copied,
}: FormAlertsProps) {
    return (
        <div className="space-y-2">
            {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2.5 text-xs font-bold leading-5 text-[var(--danger)] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : null}

            {copied ? (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--success)] bg-[var(--success-soft)] px-3 py-2.5 text-xs font-bold leading-5 text-[var(--success)] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Solicitud copiada correctamente.
                </div>
            ) : null}
        </div>
    );
}

export default FormAlerts;
