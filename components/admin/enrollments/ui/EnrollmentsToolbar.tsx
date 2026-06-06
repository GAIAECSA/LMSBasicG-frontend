import {
    Plus,
    RefreshCw,
    Search,
} from "lucide-react";
import type { StatusFilter } from "../types";

type EnrollmentsToolbarProps = {
    search: string;
    statusFilter: StatusFilter;
    isRefreshing: boolean;
    isLoading: boolean;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (
        value: StatusFilter,
    ) => void;
    onCreate: () => void;
    onRefresh: () => void;
};

export function EnrollmentsToolbar({
    search,
    statusFilter,
    isRefreshing,
    isLoading,
    onSearchChange,
    onStatusFilterChange,
    onCreate,
    onRefresh,
}: EnrollmentsToolbarProps) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                        Lista de matrículas
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Busca por curso, estudiante, código, estado o ID.
                    </p>
                </div>

                <div className="grid shrink-0 grid-cols-1 gap-2 xs:grid-cols-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onCreate}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                    >
                        <Plus className="h-4 w-4 shrink-0" />
                        Matricular estudiante
                    </button>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={
                            isRefreshing ||
                            isLoading
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                    >
                        <RefreshCw
                            className={`h-4 w-4 shrink-0 ${
                                isRefreshing
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />

                        {isRefreshing
                            ? "Actualizando..."
                            : "Actualizar"}
                    </button>
                </div>
            </div>

            <div className="mt-4 grid gap-2 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_220px] xl:max-w-[880px]">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                        value={search}
                        onChange={(event) =>
                            onSearchChange(
                                event.target.value,
                            )
                        }
                        placeholder="Buscar matrícula, curso, estudiante, código o ID"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:pl-11 sm:text-sm"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(event) =>
                        onStatusFilterChange(
                            event.target
                                .value as StatusFilter,
                        )
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <option value="all">
                        Todos los estados
                    </option>

                    <option value="approved">
                        Aprobadas
                    </option>

                    <option value="pending">
                        Pendientes
                    </option>

                    <option value="rejected">
                        No aprobadas
                    </option>
                </select>
            </div>
        </div>
    );
}
