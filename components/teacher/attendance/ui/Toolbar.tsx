import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";

type ToolbarProps = {
    backHref: string;
    selectedSessionId: string;
    onRefresh: (preferredSessionId?: string) => void;
    onCreate: () => void;
};

export function Toolbar({
    backHref,
    selectedSessionId,
    onRefresh,
    onCreate,
}: ToolbarProps) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <Link
                href={backHref}
                className="inline-flex h-10 w-fit max-w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:rounded-2xl sm:px-4 sm:text-sm"
            >
                <ArrowLeft className="h-4 w-4 shrink-0" />

                <span className="truncate">
                    Volver al curso
                </span>
            </Link>

            <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                    type="button"
                    onClick={() =>
                        onRefresh(selectedSessionId || undefined)
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <RefreshCw className="h-4 w-4 shrink-0" />
                    Actualizar
                </button>

                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <Plus className="h-4 w-4 shrink-0" />
                    Nueva asistencia
                </button>
            </div>
        </div>
    );
}
