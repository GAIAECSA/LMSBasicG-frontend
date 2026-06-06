import {
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

type ProfileAlertsProps = {
    message: string;
    error: string;
};

export function ProfileAlerts({
    message,
    error,
}: ProfileAlertsProps) {
    return (
        <div className="space-y-2">
            {message ? (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--success)] bg-[var(--success-soft)] px-3 py-2.5 text-xs font-bold leading-5 text-[var(--success)] shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                    <span>{message}</span>
                </div>
            ) : null}

            {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2.5 text-xs font-bold leading-5 text-[var(--danger)] shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                    <span>{error}</span>
                </div>
            ) : null}
        </div>
    );
}

export default ProfileAlerts;
