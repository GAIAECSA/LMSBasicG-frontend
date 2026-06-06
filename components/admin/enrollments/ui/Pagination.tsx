import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type PaginationProps = {
    activePage: number;
    totalPages: number;
    visibleCount: number;
    totalCount: number;
    onPrevious: () => void;
    onNext: () => void;
};

export function Pagination({
    activePage,
    totalPages,
    visibleCount,
    totalCount,
    onPrevious,
    onNext,
}: PaginationProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4 lg:px-5 [@media(max-height:760px)]:py-3">
            <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                Mostrando {visibleCount} de{" "}
                {totalCount} matrículas
            </p>

            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:flex sm:gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={activePage === 1}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-xs"
                    aria-label="Página anterior"
                >
                    <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden xs:inline">
                        Anterior
                    </span>
                </button>

                <span className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-2 text-[10px] font-bold text-slate-700 sm:px-3 sm:text-xs">
                    Página {activePage} de{" "}
                    {totalPages}
                </span>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={
                        activePage === totalPages
                    }
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-xs"
                    aria-label="Página siguiente"
                >
                    <span className="hidden xs:inline">
                        Siguiente
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
            </div>
        </div>
    );
}
