"use client";

import { useMemo, useState } from "react";
import {
    ChevronDown,
    Filter,
    Search,
} from "lucide-react";
import {
    LEVEL_FILTERS,
} from "../constants";
import type { StudentCatalogState } from "../hook";
import type { CatalogFilter } from "../types";
import {
    hasCourseOffer,
    isCourseOpen,
    isCoursePublished,
} from "../utils";

type CatalogToolbarProps = {
    catalog: StudentCatalogState;
};

const PRIMARY_FILTERS: Array<{
    value: CatalogFilter;
    label: string;
}> = [
    { value: "all", label: "Todos" },
    { value: "free", label: "Gratis" },
    { value: "paid", label: "Pagados" },
];

export function CatalogToolbar({
    catalog,
}: CatalogToolbarProps) {
    const [showExtraFilters, setShowExtraFilters] =
        useState(false);

    const publishedCourses = useMemo(
        () =>
            catalog.courses.filter((course) =>
                isCoursePublished(course),
            ),
        [catalog.courses],
    );

    const counters = useMemo(
        () => ({
            all: publishedCourses.length,
            open: publishedCourses.filter(isCourseOpen)
                .length,
            free: publishedCourses.filter(
                (course) => Boolean(course.is_free),
            ).length,
            paid: publishedCourses.filter(
                (course) => !course.is_free,
            ).length,
            offers: publishedCourses.filter(hasCourseOffer)
                .length,
        }),
        [publishedCourses],
    );

    return (
        <section className="min-w-0">
            <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 overflow-x-auto pb-1">
                    <div className="flex min-w-max gap-2">
                        {PRIMARY_FILTERS.map((filter) => {
                            const active =
                                catalog.catalogFilter ===
                                filter.value;

                            return (
                                <button
                                    key={filter.value}
                                    type="button"
                                    onClick={() =>
                                        catalog.setCatalogFilter(
                                            filter.value,
                                        )
                                    }
                                    className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-black transition active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm ${
                                        active
                                            ? "bg-[#00469B] text-white shadow-sm"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                                >
                                    {filter.label} (
                                    {counters[filter.value]})
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_170px_auto] xl:w-[min(100%,700px)]">
                    <label className="relative min-w-0">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                            value={catalog.searchTerm}
                            onChange={(event) =>
                                catalog.setSearchTerm(
                                    event.target.value,
                                )
                            }
                            placeholder="Buscar cursos disponibles..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:text-sm"
                        />
                    </label>

                    <select
                        value={catalog.levelFilter}
                        onChange={(event) =>
                            catalog.setLevelFilter(
                                event.target
                                    .value as typeof catalog.levelFilter,
                            )
                        }
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {LEVEL_FILTERS.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() =>
                            setShowExtraFilters(
                                (current) => !current,
                            )
                        }
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black shadow-sm transition active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:text-sm ${
                            showExtraFilters ||
                            catalog.catalogFilter === "offers"
                                ? "border-orange-200 bg-orange-50 text-orange-700"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        aria-expanded={showExtraFilters}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                        <ChevronDown
                            className={`h-4 w-4 transition ${
                                showExtraFilters
                                    ? "rotate-180"
                                    : ""
                            }`}
                        />
                    </button>
                </div>
            </div>

            {showExtraFilters ? (
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/70 p-2 sm:rounded-2xl sm:p-3">
                    <span className="px-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700 sm:text-xs">
                        Filtros adicionales
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            catalog.setCatalogFilter("offers")
                        }
                        className={`inline-flex h-8 items-center justify-center rounded-xl px-3 text-[11px] font-black transition active:scale-[0.97] sm:h-9 sm:text-xs ${
                            catalog.catalogFilter === "offers"
                                ? "bg-orange-500 text-white"
                                : "border border-orange-200 bg-white text-orange-700 hover:bg-orange-100"
                        }`}
                    >
                        Ofertas ({counters.offers})
                    </button>

                    {catalog.catalogFilter === "offers" ? (
                        <button
                            type="button"
                            onClick={() =>
                                catalog.setCatalogFilter("all")
                            }
                            className="inline-flex h-8 items-center justify-center rounded-xl px-3 text-[11px] font-black text-slate-600 transition hover:bg-white active:scale-[0.97] sm:h-9 sm:text-xs"
                        >
                            Limpiar filtro
                        </button>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}

export default CatalogToolbar;
