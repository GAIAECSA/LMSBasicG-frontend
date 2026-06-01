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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
                href={backHref}
                className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a módulos
            </Link>

            {formId ? (
                <button
                    type="submit"
                    form={formId}
                    disabled={saving}
                    className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Guardando..." : "Guardar cambios"}
                </button>
            ) : null}
        </div>
    );
}

export default Toolbar;