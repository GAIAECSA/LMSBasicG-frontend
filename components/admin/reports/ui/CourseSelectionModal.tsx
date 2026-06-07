"use client";

import {
    BookOpen,
    Eye,
    Loader2,
    Search,
    Users,
    X,
} from "lucide-react";
import type { CertificateType } from "@/services/reports.service";
import type { ReportsAdminPanelState } from "../hook";
import { CoursePagination } from "./CoursePagination";

type CourseSelectionModalProps = {
    reports: ReportsAdminPanelState;
};

export function CourseSelectionModal({
    reports,
}: CourseSelectionModalProps) {
    if (
        !reports.selectedReportType ||
        !reports.selectedReport
    ) {
        return null;
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="courses-modal-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
            <div className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500 sm:text-xs sm:tracking-[0.18em]">
                            Seleccionar curso
                        </p>

                        <h2
                            id="courses-modal-title"
                            className="mt-1 truncate text-base font-black text-slate-950 sm:text-lg"
                        >
                            {reports.selectedReport.label}
                        </h2>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                            Selecciona un curso para generar la vista previa.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            reports.closeCoursesModal
                        }
                        disabled={
                            reports.loadingCourseId !==
                            null
                        }
                        aria-label="Cerrar selección de curso"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
                    {reports.selectedReport
                        .requiresCertificateType ? (
                        <div className="mb-3 sm:mb-4">
                            <label
                                htmlFor="certificate-type"
                                className="text-[10px] font-black uppercase tracking-wide text-slate-600 sm:text-xs"
                            >
                                Tipo de certificado
                            </label>

                            <select
                                id="certificate-type"
                                value={
                                    reports.certificateType
                                }
                                onChange={(event) =>
                                    reports.setCertificateType(
                                        event.target
                                            .value as CertificateType,
                                    )
                                }
                                disabled={
                                    reports.loadingCourseId !==
                                    null
                                }
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:px-4 sm:text-sm"
                            >
                                <option value="MDT">
                                    MDT
                                </option>

                                <option value="INSTITUTIONAL">
                                    Institucional
                                </option>
                            </select>
                        </div>
                    ) : null}

                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />

                        <input
                            type="search"
                            value={
                                reports.courseSearchTerm
                            }
                            onChange={(event) => {
                                reports.setCourseSearchTerm(
                                    event.target.value,
                                );

                                reports.setCoursePage(1);
                            }}
                            placeholder="Buscar curso por nombre"
                            disabled={
                                reports.loadingCourseId !==
                                null
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:pl-11 sm:pr-4 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
                    {reports.isLoadingCourses ? (
                        <div className="flex min-h-[190px] items-center justify-center">
                            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 sm:gap-3 sm:text-sm">
                                <Loader2 className="h-5 w-5 animate-spin text-[#172861]" />
                                Cargando cursos...
                            </div>
                        </div>
                    ) : reports.filteredCourses
                          .length === 0 ? (
                        <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
                            <Users className="h-8 w-8 text-slate-300 sm:h-9 sm:w-9" />

                            <p className="mt-3 text-xs font-black text-slate-700 sm:text-sm">
                                No se encontraron cursos MDT
                            </p>

                            <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400 sm:text-xs">
                                Los reportes están disponibles únicamente para cursos MDT.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                            {reports.paginatedCourses.map(
                                (course) => (
                                    <button
                                        key={course.id}
                                        type="button"
                                        onClick={() =>
                                            void reports.handleCourseSelected(
                                                course,
                                            )
                                        }
                                        disabled={
                                            reports.loadingCourseId !==
                                            null
                                        }
                                        className="group flex min-h-[62px] w-full items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[68px] sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] transition group-hover:bg-[#172861] group-hover:text-white sm:h-10 sm:w-10">
                                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </span>

                                            <p className="truncate text-xs font-black text-slate-900 sm:text-sm">
                                                {course.name}
                                            </p>
                                        </div>

                                        {reports.loadingCourseId ===
                                        course.id ? (
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#172861] sm:h-5 sm:w-5" />
                                        ) : (
                                            <Eye className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-[#172861] sm:h-5 sm:w-5" />
                                        )}
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                </div>

                <CoursePagination
                    filteredCoursesLength={
                        reports.filteredCourses.length
                    }
                    firstVisibleCourse={
                        reports.firstVisibleCourse
                    }
                    lastVisibleCourse={
                        reports.lastVisibleCourse
                    }
                    safeCoursePage={
                        reports.safeCoursePage
                    }
                    totalCoursePages={
                        reports.totalCoursePages
                    }
                    loadingCourseId={
                        reports.loadingCourseId
                    }
                    onPrevious={() =>
                        reports.setCoursePage(
                            (current) =>
                                Math.max(
                                    1,
                                    current - 1,
                                ),
                        )
                    }
                    onNext={() =>
                        reports.setCoursePage(
                            (current) =>
                                Math.min(
                                    reports.totalCoursePages,
                                    current + 1,
                                ),
                        )
                    }
                />
            </div>
        </div>
    );
}

export default CourseSelectionModal;
