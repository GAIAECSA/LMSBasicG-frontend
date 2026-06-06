import {
    RefreshCw,
    Search,
} from "lucide-react";
import type {
    CourseFilter,
} from "../types";

type CoursesToolbarProps = {
    activeFilter: CourseFilter;
    totalCount: number;
    inProgressCount: number;
    completedCount: number;
    searchTerm: string;
    isRefreshing: boolean;
    onFilterChange:
        (filter: CourseFilter) => void;
    onSearchChange:
        (value: string) => void;
    onRefresh: () => void;
};

const filterItems: Array<{
    value: CourseFilter;
    label: string;
}> = [
    {
        value: "all",
        label: "Todos",
    },
    {
        value: "progress",
        label: "En progreso",
    },
    {
        value: "completed",
        label: "Completados",
    },
];

export function CoursesToolbar({
    activeFilter,
    totalCount,
    inProgressCount,
    completedCount,
    searchTerm,
    isRefreshing,
    onFilterChange,
    onSearchChange,
    onRefresh,
}: CoursesToolbarProps) {
    function getFilterCount(
        filter: CourseFilter,
    ) {
        if (
            filter === "progress"
        ) {
            return inProgressCount;
        }

        if (
            filter === "completed"
        ) {
            return completedCount;
        }

        return totalCount;
    }

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-3xl sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filterItems.map(
                        (filter) => {
                            const selected =
                                activeFilter ===
                                filter.value;

                            return (
                                <button
                                    key={
                                        filter.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        onFilterChange(
                                            filter.value,
                                        )
                                    }
                                    className={`inline-flex h-9 shrink-0 items-center justify-center rounded-xl px-3 text-[11px] font-black transition active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-4 sm:text-xs ${
                                        selected
                                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                                    }`}
                                >
                                    {
                                        filter.label
                                    }{" "}
                                    (
                                    {getFilterCount(
                                        filter.value,
                                    )}
                                    )
                                </button>
                            );
                        },
                    )}
                </div>

                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-[520px] xl:w-[600px]">
                    <label className="relative block min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />

                        <input
                            type="search"
                            value={
                                searchTerm
                            }
                            onChange={(
                                event,
                            ) =>
                                onSearchChange(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Buscar mis cursos..."
                            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-xs font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30 sm:h-11 sm:rounded-2xl sm:pl-10 sm:pr-4 sm:text-sm"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={
                            isRefreshing
                        }
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
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
        </div>
    );
}

export default CoursesToolbar;
