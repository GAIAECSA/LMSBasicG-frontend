import { Loader2, RefreshCw, Search } from "lucide-react";
import type { Course } from "@/services/courses.service";
import type { GradeBlockInfo } from "../types";
import { getActivityTitle } from "../utils";

type FiltersProps = {
    isAdminRoute: boolean;
    routeCourseId: number;
    currentCourseId: number;
    isRefreshing: boolean;
    searchTerm: string;
    selectedBlockId: number;
    activityBlocks: GradeBlockInfo[];
    courseOptions: Course[];
    setSearchTerm: (value: string) => void;
    setSelectedBlockId: (value: number) => void;
    setCurrentPage: (value: number | ((page: number) => number)) => void;
    onRefresh: () => void;
    onSelectCourse: (value: string) => void;
};

export function Filters({
    isAdminRoute,
    routeCourseId,
    currentCourseId,
    isRefreshing,
    searchTerm,
    selectedBlockId,
    activityBlocks,
    courseOptions,
    setSearchTerm,
    setSelectedBlockId,
    setCurrentPage,
    onRefresh,
    onSelectCourse,
}: FiltersProps) {
    const showCourseSelect = isAdminRoute && routeCourseId <= 0;

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                        Filtros de calificaciones
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Busca por estudiante, actividad, módulo, matrícula o
                        puntaje.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing || currentCourseId <= 0}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 xs:w-fit sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                >
                    {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}

                    {isRefreshing ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            <div
                className={`mt-4 grid gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3 ${showCourseSelect
                    ? "2xl:grid-cols-[minmax(0,1fr)_280px_280px]"
                    : "2xl:grid-cols-[minmax(0,1fr)_320px]"
                    }`}
            >
                <div
                    className={`relative min-w-0 ${showCourseSelect
                            ? "sm:col-span-2 2xl:col-span-1"
                            : ""
                        }`}
                >
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />

                    <input
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar estudiante, actividad, módulo, matrícula o puntaje..."
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:pl-11 sm:pr-4 sm:text-sm"
                    />
                </div>

                <select
                    value={selectedBlockId}
                    onChange={(event) => {
                        setSelectedBlockId(Number(event.target.value));
                        setCurrentPage(1);
                    }}
                    className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <option value={0}>Todas las actividades</option>

                    {activityBlocks.map((item) => (
                        <option key={item.block.id} value={item.block.id}>
                            {item.kind === "quiz" ? "Prueba" : "Tarea"} ·{" "}
                            {getActivityTitle({
                                kind: item.kind,
                                blockInfo: item,
                                response: {
                                    id: 0,
                                    lesson_block_id: item.block.id,
                                },
                            })}
                        </option>
                    ))}
                </select>

                {showCourseSelect ? (
                    <select
                        value={currentCourseId || ""}
                        onChange={(event) =>
                            onSelectCourse(event.target.value)
                        }
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <option value="">Selecciona un curso</option>

                        {courseOptions.map((courseItem) => (
                            <option key={courseItem.id} value={courseItem.id}>
                                {courseItem.name}
                            </option>
                        ))}
                    </select>
                ) : null}
            </div>
        </div>
    );
}
