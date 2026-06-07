import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type PaginationProps = {
    activePage:
        number;
    totalPages:
        number;
    currentItems:
        number;
    totalItems:
        number;
    itemLabel:
        string;
    onPrevious:
        () => void;
    onNext:
        () => void;
};

export function Pagination({
    activePage,
    totalPages,
    currentItems,
    totalItems,
    itemLabel,
    onPrevious,
    onNext,
}: PaginationProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-5 [@media(max-height:760px)]:py-2.5">
            <p className="text-center text-xs font-semibold text-slate-500 sm:text-left sm:text-sm">
                Mostrando{" "}
                <span className="font-black text-slate-700">
                    {currentItems}
                </span>{" "}
                de{" "}
                <span className="font-black text-slate-700">
                    {totalItems}
                </span>{" "}
                {itemLabel}
            </p>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex">
                <button
                    type="button"
                    onClick={
                        onPrevious
                    }
                    disabled={
                        activePage ===
                        1
                    }
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
                    aria-label="Página anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        Anterior
                    </span>
                </button>

                <span className="flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3 text-center text-xs font-black text-slate-700 sm:h-10 sm:px-4 sm:text-sm">
                    Página {activePage} de {totalPages}
                </span>

                <button
                    type="button"
                    onClick={
                        onNext
                    }
                    disabled={
                        activePage ===
                        totalPages
                    }
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
                    aria-label="Página siguiente"
                >
                    <span className="hidden sm:inline">
                        Siguiente
                    </span>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default Pagination;
