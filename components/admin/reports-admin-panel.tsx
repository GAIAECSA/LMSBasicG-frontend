"use client";

import type { ElementType } from "react";
import {
    BadgeCheck,
    BookOpen,
    CalendarCheck,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Download,
    Eye,
    FileCheck2,
    FileQuestion,
    FileSpreadsheet,
    GraduationCap,
    IdCard,
    Layers3,
    Loader2,
    RefreshCcw,
    Search,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    COURSE_REPORT_OPTIONS,
    downloadCourseReportPdf,
    getCourseReportOption,
    getCourseReportPdfBlob,
    type CertificateType,
    type CourseReportType,
} from "@/services/reports.service";
import {
    getAllCourses,
    type Course,
} from "@/services/courses.service";

type ReportVisualData = {
    icon: ElementType;
};

type ReportPreview = {
    url: string;
    course: Course;
    reportType: CourseReportType;
    certificateType: CertificateType;
} | null;

const REPORT_VISUALS: Record<
    CourseReportType,
    ReportVisualData
> = {
    course_structure: {
        icon: Layers3,
    },
    degree_students: {
        icon: GraduationCap,
    },
    certificate_students: {
        icon: FileCheck2,
    },
    idnumber_students: {
        icon: IdCard,
    },
    payment_students: {
        icon: FileSpreadsheet,
    },
    student_attendance: {
        icon: CalendarCheck,
    },
    practice_lessons: {
        icon: BookOpen,
    },
    final_grades: {
        icon: TrendingUp,
    },
    teacher_attendance: {
        icon: UserCheck,
    },
    student_surveys: {
        icon: Users,
    },
    professor_surveys: {
        icon: ClipboardList,
    },
    practice_quizz: {
        icon: FileQuestion,
    },
    final_quizz: {
        icon: BadgeCheck,
    },
    mdt_certificates: {
        icon: ShieldCheck,
    },
};

function getErrorMessage(
    error: unknown,
    fallbackMessage: string,
): string {
    return error instanceof Error
        ? error.message
        : fallbackMessage;
}

const COURSES_PER_PAGE = 8;

export function ReportsAdminPanel() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseSearchTerm, setCourseSearchTerm] =
        useState("");

    const [coursePage, setCoursePage] =
        useState(1);

    const [selectedReportType, setSelectedReportType] =
        useState<CourseReportType | null>(null);

    const [certificateType, setCertificateType] =
        useState<CertificateType>("MDT");

    const [preview, setPreview] =
        useState<ReportPreview>(null);

    const [isLoadingCourses, setIsLoadingCourses] =
        useState(true);

    const [loadingCourseId, setLoadingCourseId] =
        useState<number | null>(null);

    const [isDownloading, setIsDownloading] =
        useState(false);

    const [pageErrorMessage, setPageErrorMessage] =
        useState("");

    const [modalErrorMessage, setModalErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    /*
     * Los estados se actualizan después de que responde la promesa.
     * Esto evita la advertencia de React relacionada con setState
     * ejecutado directamente dentro de useEffect.
     */
    useEffect(() => {
        let isMounted = true;

        getAllCourses()
            .then((response) => {
                if (!isMounted) return;

                setCourses(response);
            })
            .catch((error: unknown) => {
                if (!isMounted) return;

                setPageErrorMessage(
                    getErrorMessage(
                        error,
                        "No se pudo recuperar la lista de cursos.",
                    ),
                );
            })
            .finally(() => {
                if (!isMounted) return;

                setIsLoadingCourses(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    /*
     * Libera la URL temporal del PDF al cerrar o reemplazar
     * la vista previa.
     */
    useEffect(() => {
        return () => {
            if (preview?.url) {
                URL.revokeObjectURL(preview.url);
            }
        };
    }, [preview?.url]);

    const selectedReport = selectedReportType
        ? getCourseReportOption(selectedReportType)
        : null;

    const filteredCourses = useMemo(() => {
        const normalizedSearch =
            courseSearchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            return courses;
        }

        return courses.filter((course) => {
            return course.name
                .toLowerCase()
                .includes(normalizedSearch);
        });
    }, [courseSearchTerm, courses]);

    const totalCoursePages = Math.max(
        1,
        Math.ceil(
            filteredCourses.length / COURSES_PER_PAGE,
        ),
    );

    const safeCoursePage = Math.min(
        coursePage,
        totalCoursePages,
    );

    const paginatedCourses = useMemo(() => {
        const startIndex =
            (safeCoursePage - 1) * COURSES_PER_PAGE;

        return filteredCourses.slice(
            startIndex,
            startIndex + COURSES_PER_PAGE,
        );
    }, [filteredCourses, safeCoursePage]);

    const firstVisibleCourse =
        filteredCourses.length === 0
            ? 0
            : (safeCoursePage - 1) *
            COURSES_PER_PAGE +
            1;

    const lastVisibleCourse = Math.min(
        safeCoursePage * COURSES_PER_PAGE,
        filteredCourses.length,
    );

    async function handleRefreshCourses() {
        setPageErrorMessage("");
        setSuccessMessage("");
        setIsLoadingCourses(true);

        try {
            const response = await getAllCourses();

            setCourses(response);
        } catch (error) {
            setPageErrorMessage(
                getErrorMessage(
                    error,
                    "No se pudo actualizar la lista de cursos.",
                ),
            );
        } finally {
            setIsLoadingCourses(false);
        }
    }

    function openCoursesModal(
        reportType: CourseReportType,
    ) {
        setSelectedReportType(reportType);
        setCourseSearchTerm("");
        setCoursePage(1);
        setCertificateType("MDT");
        setModalErrorMessage("");
        setPageErrorMessage("");
        setSuccessMessage("");
    }

    function closeCoursesModal() {
        if (loadingCourseId !== null) return;

        setSelectedReportType(null);
        setCourseSearchTerm("");
        setCoursePage(1);
        setModalErrorMessage("");
    }

    function closePreview() {
        if (isDownloading) return;

        setPreview(null);
    }

    async function handleCourseSelected(
        course: Course,
    ) {
        if (!selectedReportType) return;

        const currentReportType =
            selectedReportType;

        setModalErrorMessage("");
        setLoadingCourseId(course.id);

        try {
            const pdfBlob =
                await getCourseReportPdfBlob(
                    currentReportType,
                    course.id,
                    certificateType,
                );

            const objectUrl =
                URL.createObjectURL(pdfBlob);

            setPreview({
                url: objectUrl,
                course,
                reportType: currentReportType,
                certificateType,
            });

            setSelectedReportType(null);
            setCourseSearchTerm("");
        } catch (error) {
            setModalErrorMessage(
                getErrorMessage(
                    error,
                    "No se pudo generar la vista previa del reporte.",
                ),
            );
        } finally {
            setLoadingCourseId(null);
        }
    }

    async function handleDownloadFromPreview() {
        if (!preview) return;

        setPageErrorMessage("");
        setSuccessMessage("");
        setIsDownloading(true);

        try {
            const report =
                getCourseReportOption(
                    preview.reportType,
                );

            await downloadCourseReportPdf(
                preview.reportType,
                preview.course.id,
                preview.course.name,
                preview.certificateType,
            );

            setSuccessMessage(
                `El reporte "${report.label}" se descargó correctamente.`,
            );
        } catch (error) {
            setPageErrorMessage(
                getErrorMessage(
                    error,
                    "No se pudo descargar el reporte.",
                ),
            );
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <>
            <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1450px] space-y-6">
                    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                                    Administración
                                </p>

                                <h1 className="mt-2 text-3xl font-black">
                                    Reportes
                                </h1>

                                <p className="mt-2 text-sm font-semibold text-blue-50">
                                    Selecciona el reporte que deseas consultar.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleRefreshCourses()
                                }
                                disabled={isLoadingCourses}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCcw
                                    className={`h-4 w-4 ${isLoadingCourses
                                        ? "animate-spin"
                                        : ""
                                        }`}
                                />

                                Actualizar cursos
                            </button>
                        </div>
                    </div>

                    {pageErrorMessage && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {pageErrorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                            <p>{successMessage}</p>
                        </div>
                    )}

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Tipos de reportes
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Presiona una opción para seleccionar el curso.
                            </p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {COURSE_REPORT_OPTIONS.map(
                                (report) => {
                                    const visual =
                                        REPORT_VISUALS[
                                        report.type
                                        ];

                                    const Icon =
                                        visual.icon;

                                    return (
                                        <button
                                            key={report.type}
                                            type="button"
                                            onClick={() =>
                                                openCoursesModal(
                                                    report.type,
                                                )
                                            }
                                            className="group flex min-h-[145px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md"
                                        >
                                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#172861] transition group-hover:bg-[#172861] group-hover:text-white">
                                                <Icon className="h-7 w-7" />
                                            </span>

                                            <span className="text-sm font-black leading-5 text-slate-800">
                                                {report.label}
                                            </span>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {selectedReportType && selectedReport && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="courses-modal-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                >
                    <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                                    Seleccionar curso
                                </p>

                                <h2
                                    id="courses-modal-title"
                                    className="mt-1 truncate text-lg font-black text-slate-950"
                                >
                                    {selectedReport.label}
                                </h2>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Selecciona un curso para generar la vista previa.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeCoursesModal}
                                disabled={
                                    loadingCourseId !== null
                                }
                                aria-label="Cerrar selección de curso"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            {selectedReport.requiresCertificateType && (
                                <div className="mb-4">
                                    <label
                                        htmlFor="certificate-type"
                                        className="text-xs font-black uppercase tracking-wide text-slate-600"
                                    >
                                        Tipo de certificado
                                    </label>

                                    <select
                                        id="certificate-type"
                                        value={certificateType}
                                        onChange={(event) =>
                                            setCertificateType(
                                                event.target
                                                    .value as CertificateType,
                                            )
                                        }
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="MDT">
                                            MDT
                                        </option>

                                        <option value="INSTITUTIONAL">
                                            Institucional
                                        </option>
                                    </select>
                                </div>
                            )}

                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    type="search"
                                    value={courseSearchTerm}
                                    onChange={(event) => {
                                        setCourseSearchTerm(
                                            event.target.value,
                                        );

                                        setCoursePage(1);
                                    }}
                                    placeholder="Buscar curso por nombre"
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                            {modalErrorMessage && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {modalErrorMessage}
                                </div>
                            )}

                            {isLoadingCourses ? (
                                <div className="flex min-h-[250px] items-center justify-center">
                                    <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
                                        <Loader2 className="h-5 w-5 animate-spin text-[#172861]" />
                                        Cargando cursos...
                                    </div>
                                </div>
                            ) : filteredCourses.length === 0 ? (
                                <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                                    <Users className="h-9 w-9 text-slate-300" />

                                    <p className="mt-3 text-sm font-black text-slate-700">
                                        No se encontraron cursos
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-400">
                                        Intenta buscar con otro nombre.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {paginatedCourses.map(
                                        (course) => (
                                            <button
                                                key={course.id}
                                                type="button"
                                                onClick={() =>
                                                    void handleCourseSelected(
                                                        course,
                                                    )
                                                }
                                                disabled={
                                                    loadingCourseId !==
                                                    null
                                                }
                                                className="group flex min-h-[72px] w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] transition group-hover:bg-[#172861] group-hover:text-white">
                                                        <BookOpen className="h-5 w-5" />
                                                    </span>

                                                    <p className="truncate text-sm font-black text-slate-900">
                                                        {course.name}
                                                    </p>
                                                </div>

                                                {loadingCourseId ===
                                                    course.id ? (
                                                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#172861]" />
                                                ) : (
                                                    <Eye className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-[#172861]" />
                                                )}
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="text-xs font-bold text-slate-500">
                                {filteredCourses.length === 0
                                    ? "No hay cursos disponibles"
                                    : `Mostrando ${firstVisibleCourse} - ${lastVisibleCourse} de ${filteredCourses.length} cursos`}
                            </p>

                            {totalCoursePages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCoursePage((current) =>
                                                Math.max(
                                                    1,
                                                    current - 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            safeCoursePage === 1 ||
                                            loadingCourseId !== null
                                        }
                                        className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Anterior
                                    </button>

                                    <span className="px-2 text-xs font-black text-slate-600">
                                        {safeCoursePage} de{" "}
                                        {totalCoursePages}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCoursePage((current) =>
                                                Math.min(
                                                    totalCoursePages,
                                                    current + 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            safeCoursePage ===
                                            totalCoursePages ||
                                            loadingCourseId !== null
                                        }
                                        className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Siguiente
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {preview && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="preview-modal-title"
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                >
                    <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                                    Vista previa
                                </p>

                                <h2
                                    id="preview-modal-title"
                                    className="mt-1 truncate text-lg font-black text-slate-950"
                                >
                                    {
                                        getCourseReportOption(
                                            preview.reportType,
                                        ).label
                                    }
                                </h2>

                                <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                                    {preview.course.name}
                                </p>

                                {preview.reportType ===
                                    "mdt_certificates" && (
                                        <p className="mt-1 text-xs font-black uppercase tracking-wide text-orange-600">
                                            Certificado:{" "}
                                            {preview.certificateType ===
                                                "MDT"
                                                ? "MDT"
                                                : "Institucional"}
                                        </p>
                                    )}
                            </div>

                            <button
                                type="button"
                                onClick={closePreview}
                                disabled={isDownloading}
                                aria-label="Cerrar vista previa"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 bg-slate-100 p-3 sm:p-4">
                            <iframe
                                title={`Vista previa del reporte de ${preview.course.name}`}
                                src={preview.url}
                                className="h-full w-full rounded-2xl border border-slate-200 bg-white"
                            />
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                            <button
                                type="button"
                                onClick={closePreview}
                                disabled={isDownloading}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cerrar
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleDownloadFromPreview()
                                }
                                disabled={isDownloading}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172861] px-5 text-sm font-black text-white transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}

                                Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}