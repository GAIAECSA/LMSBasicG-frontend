"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
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
import { COURSES_PER_PAGE } from "./constants";
import type { ReportPreview } from "./types";
import {
    getErrorMessage,
    isMdtCourse,
} from "./utils";

export function useReportsAdminPanel() {
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
        setPageErrorMessage("");
        setSuccessMessage("");
        setIsLoadingCourses(true);

        try {
            const response =
                await getAllCourses();

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

        if (!isMdtCourse(course)) {
            setModalErrorMessage(
                "Solo se pueden generar reportes para cursos MDT.",
            );

            return;
        }

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
        isLoadingCourses,
        loadingCourseId,
        isDownloading,
        pageErrorMessage,
        modalErrorMessage,
        successMessage,
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
