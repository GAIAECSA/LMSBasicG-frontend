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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Link
                href={backHref}
                className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al curso
            </Link>

            <div className="flex flex-wrap gap-2">

                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]"
                >
                    <Plus className="h-4 w-4" />
                    Nueva asistencia
                </button>
            </div>
        </div>
    );
}