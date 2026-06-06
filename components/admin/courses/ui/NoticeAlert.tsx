import type { Notice } from "../types";

type NoticeAlertProps = {
    notice: Notice;
};

export function NoticeAlert({ notice }: NoticeAlertProps) {
    if (!notice) return null;

    return (
        <div
            className={`rounded-xl border px-3 py-3 text-xs font-semibold leading-5 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${
                notice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
            {notice.text}
        </div>
    );
}
