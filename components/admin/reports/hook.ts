"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { notify } from "@/lib/notify";
import {
    getCourseReportOption,
    getCourseReportPdfBlob,
    type CertificateType,
    type CourseReportType,
} from "@/services/reports.service";
import {
    getAllCourses,
    type Course,
} from "@/services/courses.service";
import { COURSES_PER_PAGE } from "./constants";
import type { ReportPreview } from "./types";
import {
    getErrorMessage,
    getReportPdfFileName,
    isMdtCourse,
} from "./utils";

function createLoadingToast(message: string) {
    const toastId = notify.loading(message);
    let dismissed = false;

    return () => {
        if (dismissed) return;

        notify.dismiss(toastId);
        dismissed = true;
    };
}

export function useReportsAdminPanel() {
    const coursesRequestRef = useRef<Promise<Course[]> | null>(null);
    const refreshMutationRef = useRef(false);
    const previewMutationRef = useRef<number | null>(null);
    const downloadMutationRef = useRef(false);

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

    const [initialLoading, setInitialLoading] =
        useState(true);

    const [isRefreshingCourses, setIsRefreshingCourses] =
        useState(false);

    const [loadingCourseId, setLoadingCourseId] =
        useState<number | null>(null);

    const [isDownloading, setIsDownloading] =
        useState(false);

    const [pageErrorMessage, setPageErrorMessage] =
        useState("");

    const requestCourses = useCallback(() => {
        if (coursesRequestRef.current) {
            return coursesRequestRef.current;
        }

        const request = getAllCourses();

        coursesRequestRef.current = request;

        const clearRequest = () => {
            if (coursesRequestRef.current === request) {
                coursesRequestRef.current = null;
            }
        };

        void request.then(clearRequest, clearRequest);

        return request;
    }, []);

    useEffect(() => {
        let isMounted = true;

        requestCourses()
            .then((response) => {
                if (!isMounted) return;

                setCourses(response);
                setPageErrorMessage("");
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

                setInitialLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [requestCourses]);

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

        const mdtCourses = courses.filter(isMdtCourse);

        if (!normalizedSearch) {
            return mdtCourses;
        }

        return mdtCourses.filter((course) => {
            return course.name
                .toLowerCase()
                .includes(normalizedSearch);
        });
    }, [courseSearchTerm, courses]);

    const totalCoursePages = Math.max(
        1,
        Math.ceil(
            filteredCourses.length /
                COURSES_PER_PAGE,
        ),
    );

    const safeCoursePage = Math.min(
        coursePage,
        totalCoursePages,
    );

    const paginatedCourses = useMemo(() => {
        const startIndex =
            (safeCoursePage - 1) *
            COURSES_PER_PAGE;

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
        if (refreshMutationRef.current) {
            notify.warning("La lista de cursos ya se está actualizando.");
            return;
        }

        refreshMutationRef.current = true;
        setIsRefreshingCourses(true);

        const dismissLoadingToast = createLoadingToast(
            "Actualizando cursos...",
        );

        try {
            const response = await requestCourses();

            setCourses(response);
            setPageErrorMessage("");
            notify.success("Lista de cursos actualizada correctamente.");
        } catch (error) {
            notify.error(
                getErrorMessage(
                    error,
                    "No se pudo actualizar la lista de cursos.",
                ),
            );
        } finally {
            dismissLoadingToast();
            refreshMutationRef.current = false;
            setIsRefreshingCourses(false);
        }
    }

    function openCoursesModal(
        reportType: CourseReportType,
    ) {
        if (
            refreshMutationRef.current ||
            previewMutationRef.current !== null ||
            downloadMutationRef.current
        ) {
            notify.warning("Espera a que finalice el proceso actual.");
            return;
        }

        setSelectedReportType(reportType);
        setCourseSearchTerm("");
        setCoursePage(1);
        setCertificateType("MDT");
    }

    function closeCoursesModal() {
        if (previewMutationRef.current !== null) return;

        setSelectedReportType(null);
        setCourseSearchTerm("");
        setCoursePage(1);
    }

    function closePreview() {
        if (downloadMutationRef.current) return;

        setPreview(null);
    }

    async function handleCourseSelected(
        course: Course,
    ) {
        if (!selectedReportType) return;

        if (previewMutationRef.current !== null) {
            notify.warning("Ya se está generando una vista previa.");
            return;
        }

        if (!isMdtCourse(course)) {
            notify.warning(
                "Solo se pueden generar reportes para cursos MDT.",
            );
            return;
        }

        const currentReportType = selectedReportType;

        previewMutationRef.current = course.id;
        setLoadingCourseId(course.id);

        const dismissLoadingToast = createLoadingToast(
            "Generando vista previa del reporte...",
        );

        try {
            const pdfBlob = await getCourseReportPdfBlob(
                currentReportType,
                course.id,
                certificateType,
            );

            if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
                throw new Error(
                    "El servidor devolvió un PDF vacío o no válido.",
                );
            }

            const objectUrl = URL.createObjectURL(pdfBlob);

            setPreview({
                url: objectUrl,
                course,
                reportType: currentReportType,
                certificateType,
            });

            setSelectedReportType(null);
            setCourseSearchTerm("");
            notify.success("Vista previa generada correctamente.");
        } catch (error) {
            notify.error(
                getErrorMessage(
                    error,
                    "No se pudo generar la vista previa del reporte.",
                ),
            );
        } finally {
            dismissLoadingToast();
            previewMutationRef.current = null;
            setLoadingCourseId(null);
        }
    }

    async function handleDownloadFromPreview() {
        if (!preview) return;

        if (downloadMutationRef.current) {
            notify.warning("El reporte ya se está descargando.");
            return;
        }

        downloadMutationRef.current = true;
        setIsDownloading(true);

        const dismissLoadingToast = createLoadingToast(
            "Preparando descarga...",
        );

        try {
            const report = getCourseReportOption(
                preview.reportType,
            );

            const anchor = document.createElement("a");

            anchor.href = preview.url;
            anchor.download = getReportPdfFileName(
                report.label,
                preview.course.name,
            );
            anchor.style.display = "none";

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            notify.success(
                `El reporte "${report.label}" se descargó correctamente.`,
            );
        } catch (error) {
            notify.error(
                getErrorMessage(
                    error,
                    "No se pudo descargar el reporte.",
                ),
            );
        } finally {
            dismissLoadingToast();
            downloadMutationRef.current = false;
            setIsDownloading(false);
        }
    }

    return {
        courses,
        courseSearchTerm,
        setCourseSearchTerm,
        coursePage,
        setCoursePage,
        selectedReportType,
        certificateType,
        setCertificateType,
        preview,
        initialLoading,
        isLoadingCourses:
            initialLoading || isRefreshingCourses,
        loadingCourseId,
        isDownloading,
        pageErrorMessage,
        selectedReport,
        filteredCourses,
        totalCoursePages,
        safeCoursePage,
        paginatedCourses,
        firstVisibleCourse,
        lastVisibleCourse,
        handleRefreshCourses,
        openCoursesModal,
        closeCoursesModal,
        closePreview,
        handleCourseSelected,
        handleDownloadFromPreview,
    };
}

export type ReportsAdminPanelState = ReturnType<
    typeof useReportsAdminPanel
>;
