type PaginationProps = {
    startItem: number;
    endItem: number;
    totalItems: number;
    activePage: number;
    totalPages: number;
    setCurrentPage: (value: number | ((page: number) => number)) => void;
};

export function Pagination({
    startItem,
    endItem,
    totalItems,
    activePage,
    totalPages,
    setCurrentPage,
}: PaginationProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
                Mostrando {startItem} - {endItem} de {totalItems} matrículas
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={activePage === 1}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Anterior
                </button>

                <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                    Página {activePage} de {totalPages}
                </span>

                <button
                    type="button"
                    onClick={() =>
                        setCurrentPage((page) =>
                            Math.min(totalPages, page + 1),
                        )
                    }
                    disabled={activePage === totalPages}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
}