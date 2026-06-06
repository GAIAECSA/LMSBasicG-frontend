import {
    Eye,
    Loader2,
    Plus,
    RefreshCcw,
    Search,
} from "lucide-react";

type ToolbarProps = {
    searchTerm: string;
    isLoading: boolean;
    courseId: number;
    lessonsCount: number;
    visibleCount: number;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    onCreate: () => void;
    onClearSearch: () => void;
};

export function Toolbar({
    searchTerm,
    isLoading,
    courseId,
    lessonsCount,
    visibleCount,
    onSearchChange,
    onRefresh,
    onCreate,
    onClearSearch,
}: ToolbarProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-950 sm:text-lg">
                        Archivos obligatorios MDT
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        Busca, consulta y administra los archivos requeridos del curso.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isLoading || !courseId}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="h-4 w-4" />
                        )}

                        Actualizar
                    </button>

                    <button
                        type="button"
                        onClick={onCreate}
                        disabled={isLoading || lessonsCount === 0}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo archivo
                    </button>
                </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="relative min-w-0 lg:max-w-[620px]">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                        value={searchTerm}
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        placeholder="Buscar por nombre, descripción, lección o formato..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:pl-11 sm:text-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[11px] font-black text-slate-700 sm:text-xs">
                        Mostrando {visibleCount}
                    </span>

                    {searchTerm ? (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 transition hover:bg-slate-50 sm:text-xs"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Ver todos
                        </button>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
