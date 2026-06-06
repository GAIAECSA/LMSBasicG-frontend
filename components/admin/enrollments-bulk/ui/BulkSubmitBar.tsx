import {
    CheckCircle2,
    Loader2,
    XCircle,
} from "lucide-react";

import type {
    EnrollmentsAdminBulkPanelState,
} from "../hook";

type BulkSubmitBarProps = {
    panel: EnrollmentsAdminBulkPanelState;
};

export function BulkSubmitBar({
    panel,
}: BulkSubmitBarProps) {
    return (
        <div className="sticky bottom-3 z-10 flex justify-end sm:bottom-4">
            <button
                type="submit"
                disabled={panel.isSubmitting}
                className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none xs:w-auto sm:h-12 sm:rounded-2xl sm:px-6 sm:text-sm ${
                    panel.validation.canSubmit
                        ? "bg-orange-500 shadow-orange-500/20 hover:bg-orange-600"
                        : "bg-slate-400 shadow-slate-300/30 hover:bg-slate-500"
                }`}
            >
                {panel.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : panel.validation
                      .canSubmit ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <XCircle className="h-4 w-4" />
                )}

                {panel.isSubmitting
                    ? "Matriculando..."
                    : "Matricular masivamente"}
            </button>
        </div>
    );
}
