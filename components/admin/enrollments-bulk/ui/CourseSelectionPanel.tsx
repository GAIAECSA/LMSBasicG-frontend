import {
    AlertCircle,
    Download,
    RefreshCw,
    Search,
    Upload,
} from "lucide-react";

import type {
    EnrollmentsAdminBulkPanelState,
} from "../hook";

import {
    getCourseName,
} from "../utils";

type CourseSelectionPanelProps = {
    panel: EnrollmentsAdminBulkPanelState;
};

export function CourseSelectionPanel({
    panel,
}: CourseSelectionPanelProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5 [@media(max-height:760px)]:p-4">
            <div className="mb-3 flex min-w-0 flex-col gap-2 sm:mb-4">
                <h2 className="text-base font-black text-slate-950 sm:text-lg">
                    Selección del curso
                </h2>

                <p className="text-xs font-medium leading-5 text-slate-500 sm:text-sm">
                    Elige el curso donde se matricularán los estudiantes de la
                    carga masiva.
                </p>
            </div>

            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-4">
                    <div className="min-w-0">
                        <label className="mb-1.5 block text-xs font-black text-slate-900 sm:mb-2 sm:text-sm">
                            Buscar curso
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />

                            <input
                                type="text"
                                value={panel.courseSearch}
                                onChange={(event) =>
                                    panel.setCourseSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Buscar por nombre del curso"
                                className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#172861] focus:ring-4 focus:ring-blue-50 sm:h-11 sm:rounded-2xl sm:pl-11 sm:pr-4 sm:text-sm [@media(max-height:760px)]:h-10"
                            />
                        </div>
                    </div>

                    <div className="min-w-0">
                        <label
                            htmlFor="course-id"
                            className="mb-1.5 block text-xs font-black text-slate-900 sm:mb-2 sm:text-sm"
                        >
                            Curso disponible
                        </label>

                        <select
                            id="course-id"
                            value={panel.courseId}
                            onChange={(event) =>
                                panel.handleCourseChange(
                                    event.target.value,
                                )
                            }
                            disabled={
                                panel.isLoadingCourses ||
                                panel.isSubmitting
                            }
                            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#172861] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                        >
                            <option value="">
                                {panel.isLoadingCourses
                                    ? "Cargando cursos..."
                                    : "Selecciona un curso"}
                            </option>

                            {panel.filteredCourses.map(
                                (course) => (
                                    <option
                                        key={course.id}
                                        value={course.id}
                                    >
                                        {getCourseName(
                                            course,
                                        )}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </div>

                <div className="grid shrink-0 grid-cols-1 gap-2 xs:grid-cols-2 sm:flex">
                    <button
                        type="button"
                        onClick={
                            panel.handleDownloadTemplate
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#172861]/15 bg-white px-3 text-xs font-black text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Download className="h-4 w-4 shrink-0" />

                        Plantilla Excel
                    </button>

                    <button
                        type="button"
                        onClick={
                            panel.handleImportExcelClick
                        }
                        disabled={
                            !panel.hasSelectedCourse ||
                            panel.isSubmitting ||
                            panel.isReadingFile
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#e9702c] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#d9601f] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Upload className="h-4 w-4 shrink-0" />

                        {panel.isReadingFile
                            ? "Leyendo Excel..."
                            : "Importar Excel"}
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            void panel.loadCourses(
                                true,
                            )
                        }
                        disabled={
                            panel.isRefreshingCourses ||
                            panel.isSubmitting
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-11 sm:rounded-2xl sm:px-0"
                        title="Actualizar cursos"
                        aria-label="Actualizar cursos"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${panel.isRefreshingCourses
                                ? "animate-spin"
                                : ""
                                }`}
                        />

                        <span className="sm:hidden">
                            Actualizar cursos
                        </span>
                    </button>

                    <input
                        id="bulk-enrollment-excel-file"
                        type="file"
                        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={
                            panel.handleFileChange
                        }
                        className="hidden"
                    />
                </div>
            </div>

            {!panel.hasSelectedCourse &&
                !panel.isLoadingCourses ? (
                <div className="mt-3 flex gap-2.5 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-800 sm:mt-4 sm:gap-3 sm:rounded-2xl sm:p-4 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                    <span className="break-words [overflow-wrap:anywhere]">
                        Primero selecciona un curso.
                        Después podrás importar el
                        archivo Excel, agregar filas y
                        ejecutar la matrícula masiva.
                    </span>
                </div>
            ) : null}
        </section>
    );
}

export default CourseSelectionPanel;