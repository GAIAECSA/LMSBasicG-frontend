import { AlertCircle, CheckCircle2 } from "lucide-react";

type AlertProps = {
    type: "success" | "error";
    message: string;
};

export function Alert({ type, message }: AlertProps) {
    if (!message) return null;

    const isSuccess = type === "success";

    return (
        <div
            className={`flex min-w-0 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-bold leading-5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
                isSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            )}

            <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                {message}
            </span>
        </div>
    );
}
