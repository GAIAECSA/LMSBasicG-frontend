import Link from "next/link";

import {
    ArrowLeft,
    Eye,
    Plus,
    RefreshCw,
} from "lucide-react";

type ToolbarProps = {
    backHref: string;
    backLabel: string;
    isLoading: boolean;
    isRefreshing: boolean;
    numericCourseId: number;
    onRefresh: () => void;
    onCreateModule: () => void;
    onPreview: () => void;
};

export function Toolbar({
    backHref,
    backLabel,
    isLoading,
    isRefreshing,
    numericCourseId,
    onRefresh,
    onCreateModule,
    onPreview,
}: ToolbarProps) {
    return (
        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 xs:items-center sm:flex">
            <Link
                href={backHref}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:w-fit sm:justify-start sm:rounded-2xl sm:px-4 sm:text-sm"
            >
                <ArrowLeft className="h-4 w-4 shrink-0" />

                <span className="truncate">
                    {backLabel}
                </span>
            </Link>

            <button
                type="button"
                onClick={onRefresh}
                disabled={
                    isLoading ||
                    isRefreshing
                }
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-700 shadow-sm transition hover:bg-orange-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-fit sm:rounded-2xl sm:px-4 sm:text-sm"
            >
                <RefreshCw
                    className={`h-4 w-4 shrink-0 ${isRefreshing
                            ? "animate-spin"
                            : ""
                        }`}
                />

                <span className="truncate">
                    {isRefreshing
                        ? "Actualizando..."
                        : "Actualizar"}
                </span>
            </button>

            <button
                type="button"
                onClick={onPreview}
                disabled={
                    isLoading ||
                    numericCourseId <= 0
                }
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-[#172861] bg-white px-3 text-xs font-bold text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:rounded-2xl sm:px-4 sm:text-sm"
            >
                <Eye className="h-4 w-4 shrink-0" />

                <span className="truncate">
                    Vista previa
                </span>
            </button>

            <button
                type="button"
                onClick={onCreateModule}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:rounded-2xl sm:px-4 sm:text-sm"
                disabled={
                    isLoading ||
                    numericCourseId <= 0
                }
            >
                <Plus className="h-4 w-4 shrink-0" />

                <span className="truncate">
                    Agregar módulo
                </span>
            </button>
        </div>
    );
}