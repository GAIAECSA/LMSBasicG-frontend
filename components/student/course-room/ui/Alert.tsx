import { AlertCircle } from "lucide-react";

type AlertProps = {
    message: string;
};

export function Alert({
    message,
}: AlertProps) {
    if (!message) {
        return null;
    }

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)] shadow-sm"
        >
            <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0"
            />

            <span className="min-w-0 break-words">
                {message}
            </span>
        </div>
    );
}

export default Alert;
