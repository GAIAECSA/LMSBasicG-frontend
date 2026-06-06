import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { LessonItemType } from "../types";

type ToolbarProps = {
    backHref: string;
    reviewHref?: string;
    itemType?: LessonItemType;
    formId?: string;
    saving?: boolean;
};

export function Toolbar({
    backHref,
    formId,
    saving = false,
}: ToolbarProps) {
    return (
        <div className="grid min-w-0 grid-cols-1 gap-2 xs:grid-cols-2 xs:items-center xs:justify-between sm:flex">
            <Link
                href={backHref}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:w-fit sm:justify-start sm:rounded-2xl sm:px-4 sm:text-sm"
            >
                <ArrowLeft className="h-4 w-4 shrink-0" />

                <span className="truncate">
                    Volver a módulos
                </span>
            </Link>

            {formId ? (
                <button
                    type="submit"
                    form={formId}
                    disabled={saving}
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#0f1d48] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:rounded-2xl sm:px-5 sm:text-sm"
                >
                    <Save className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                        {saving
                            ? "Guardando..."
                            : "Guardar cambios"}
                    </span>
                </button>
            ) : null}
        </div>
    );
}

export default Toolbar;
