import {
    Plus,
    RefreshCw,
    Search,
} from "lucide-react";

type CoursesToolbarProps = {
    search: string;
    isRefreshing: boolean;
    onSearchChange: (value: string) => void;
    onCreate: () => void;
    onRefresh: () => void;
};

export function CoursesToolbar({
    search,
    isRefreshing,
    onSearchChange,
    onCreate,
    onRefresh,
}: CoursesToolbarProps) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                        Lista de cursos
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Busca por nombre, descripción, nivel,
                        categoría, subcategoría o MDT.
                    </p>
                </div>

                <div className="grid w-full shrink-0 grid-cols-1 gap-2 xs:grid-cols-2 sm:gap-3 lg:w-auto">
                    <button
                        type="button"
                        onClick={onCreate}
                        className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                    >
                        <Plus className="h-4 w-4 shrink-0" />

                        <span>Nuevo curso</span>
                    </button>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm [@media(max-height:760px)]:h-10"
                    >
                        <RefreshCw
                            className={`h-4 w-4 shrink-0 ${isRefreshing
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />

                        <span>
                            {isRefreshing
                                ? "Actualizando..."
                                : "Actualizar"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="relative mt-4 w-full sm:mt-5 lg:max-w-[520px] [@media(max-height:760px)]:mt-3">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                    value={search}
                    onChange={(event) =>
                        onSearchChange(event.target.value)
                    }
                    placeholder="Buscar por nombre, nivel, categoría, subcategoría o MDT"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:pl-11 sm:pr-5 sm:text-sm [@media(max-height:760px)]:h-10"
                />
            </div>
        </div>
    );
}