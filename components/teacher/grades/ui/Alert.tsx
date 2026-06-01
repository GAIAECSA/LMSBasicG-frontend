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
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${isSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <span>{message}</span>
        </div>
    );
}