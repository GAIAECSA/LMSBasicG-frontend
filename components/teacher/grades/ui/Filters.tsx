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
    return (
        <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-950">
                        Filtros de calificaciones
                    </h3>

                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Busca por estudiante, actividad, módulo, matrícula o
                        puntaje.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing || currentCourseId <= 0}
                    className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="inline-flex items-center gap-2">
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                    </span>
                </button>
            </div>

            <div
                className={`mt-5 grid gap-3 ${isAdminRoute && routeCourseId <= 0
                        ? "xl:grid-cols-[1fr_320px_320px]"
                        : "xl:grid-cols-[1fr_320px]"
                    }`}
            >
                <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar estudiante, actividad, módulo, matrícula o puntaje..."
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <select
                    value={selectedBlockId}
                    onChange={(event) => {
                        setSelectedBlockId(Number(event.target.value));
                        setCurrentPage(1);
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

                {isAdminRoute && routeCourseId <= 0 ? (
                    <select
                        value={currentCourseId || ""}
                        onChange={(event) =>
                            onSelectCourse(event.target.value)
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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