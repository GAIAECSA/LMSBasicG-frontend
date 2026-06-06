import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

type ToolbarProps = {
    backHref: string;
    backLabel: string;
    isLoading: boolean;
    numericCourseId: number;
    onCreateModule: () => void;
};

export function Toolbar({
    backHref,
    backLabel,
    isLoading,
    numericCourseId,
    onCreateModule,
}: ToolbarProps) {
    return (
        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 xs:items-center xs:justify-between sm:flex">
            <Link
                href={backHref}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:w-fit sm:justify-start sm:rounded-2xl sm:px-4 sm:text-sm"
            >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{backLabel}</span>
            </Link>

            <button
                type="button"
                onClick={onCreateModule}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:rounded-2xl sm:px-4 sm:text-sm"
                disabled={isLoading || numericCourseId <= 0}
            >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">Agregar módulo</span>
            </button>
        </div>
    );
}
