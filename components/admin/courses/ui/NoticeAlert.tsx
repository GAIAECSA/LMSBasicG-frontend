import {
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import type {
    Notice,
} from "../types";

type NoticeAlertProps = {
    notice:
        Notice;
};

export function NoticeAlert({
    notice,
}: NoticeAlertProps) {
    if (
        !notice
    ) {
        return null;
    }

    const isSuccess =
        notice.type ===
        "success";

    return (
        <div
            role={
                isSuccess
                    ? "status"
                    : "alert"
            }
            aria-live={
                isSuccess
                    ? "polite"
                    : "assertive"
            }
            className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-xs font-semibold leading-5 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${
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

            <div className="min-w-0">
                <p className="font-black">
                    {isSuccess
                        ? "Operación completada."
                        : "No se pudo completar la operación."}
                </p>

                <p className="mt-0.5 break-words">
                    {notice.text}
                </p>
            </div>
        </div>
    );
}

export default NoticeAlert;
