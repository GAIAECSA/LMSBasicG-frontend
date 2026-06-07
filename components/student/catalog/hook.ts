"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notify";
import {
    getAllCourses,
} from "@/services/courses.service";
import {
    createEnrollment,
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";

import {
    AUTO_APPROVE_FREE_ENROLLMENTS,
    STUDENT_ROLE_ID,
} from "./constants";
import type {
    CatalogCourse,
    CatalogFilter,
    LevelFilter,
} from "./types";
import {
    getCourseEnrollmentInfo,
    getInitials,
    getUserFullName,
    getUserId,
    isCourseOpen,
    matchesCatalogFilters,
} from "./utils";

function getErrorMessage(
    error: unknown,
    fallback: string,
) {
    if (
        error instanceof Error &&
        error.message.trim()
    ) {
        return error.message.trim();
    }

    if (
        typeof error === "string" &&
        error.trim()
    ) {
        return error.trim();
    }

    return fallback;
}

export function useStudentCatalog() {
    const { user } =
        useAuth();

    const userId =
        useMemo(
            () => getUserId(user),
            [user],
        );

    const studentName =
        useMemo(
            () => getUserFullName(user),
            [user],
        );

    const studentInitials =
        useMemo(
            () =>
                getInitials(
                    studentName,
                ),
            [studentName],
        );

    const loadingCatalogRef =
        useRef(false);

    const savingEnrollmentRef =
        useRef(false);

    const [
        courses,
        setCourses,
    ] = useState<CatalogCourse[]>([]);

    const [
        enrollments,
        setEnrollments,
    ] = useState<Enrollment[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        savingEnrollment,
        setSavingEnrollment,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        searchTerm,
        setSearchTerm,
    ] = useState("");

    const [
        catalogFilter,
        setCatalogFilter,
    ] =
        useState<CatalogFilter>(
            "all",
        );

    const [
        levelFilter,
        setLevelFilter,
    ] =
        useState<LevelFilter>(
            "all",
        );

    const [
        selectedCourse,
        setSelectedCourse,
    ] =
        useState<CatalogCourse | null>(
            null,
        );

    const [
        referenceCode,
        setReferenceCode,
    ] = useState("");

    const [
        comment,
        setComment,
    ] = useState("");

    const [
        voucherFile,
        setVoucherFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        modalError,
        setModalError,
    ] = useState("");

    const loadCatalog =
        useCallback(
            async (
                manualRefresh = false,
            ) => {
                if (
                    loadingCatalogRef.current
                ) {
                    return;
                }

                loadingCatalogRef.current =
                    true;

                let toastId:
                    | string
                    | number
                    | undefined;

                try {
                    if (
                        manualRefresh
                    ) {
                        setRefreshing(
                            true,
                        );

                        toastId =
                            notify.loading(
                                "Actualizando catálogo...",
                                "Estamos consultando los cursos disponibles.",
                            );
                    } else {
                        setLoading(
                            true,
                        );
                    }

                    setError("");

                    const coursesResponse =
                        await getAllCourses();

                    const enrollmentResponse =
                        userId > 0
                            ? await getEnrollmentsByUser(
                                userId,
                            )
                            : [];

                    setCourses(
                        Array.isArray(
                            coursesResponse,
                        )
                            ? coursesResponse
                            : [],
                    );

                    setEnrollments(
                        Array.isArray(
                            enrollmentResponse,
                        )
                            ? enrollmentResponse
                            : [],
                    );

                    if (
                        manualRefresh
                    ) {
                        if (
                            toastId !==
                            undefined
                        ) {
                            notify.dismiss(
                                toastId,
                            );

                            toastId =
                                undefined;
                        }

                        notify.success(
                            "Catálogo actualizado correctamente.",
                            "La información de los cursos se encuentra al día.",
                        );
                    }
                } catch (
                currentError
                ) {
                    console.error(
                        "Error al cargar el catálogo del estudiante:",
                        currentError,
                    );

                    const message =
                        getErrorMessage(
                            currentError,
                            "No se pudo cargar el catálogo de cursos.",
                        );

                    setError(
                        message,
                    );

                    if (
                        manualRefresh
                    ) {
                        if (
                            toastId !==
                            undefined
                        ) {
                            notify.dismiss(
                                toastId,
                            );

                            toastId =
                                undefined;
                        }

                        notify.error(
                            "No se pudo actualizar el catálogo.",
                            message,
                        );
                    }
                } finally {
                    if (
                        toastId !==
                        undefined
                    ) {
                        notify.dismiss(
                            toastId,
                        );
                    }

                    loadingCatalogRef.current =
                        false;

                    setLoading(
                        false,
                    );

                    setRefreshing(
                        false,
                    );
                }
            },
            [userId],
        );

    useEffect(() => {
        const timeoutId =
            window.setTimeout(
                () => {
                    void loadCatalog();
                },
                0,
            );

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [loadCatalog]);

    const visibleCourses =
        useMemo(
            () =>
                courses.filter(
                    (course) =>
                        matchesCatalogFilters(
                            {
                                course,
                                searchTerm,
                                catalogFilter,
                                levelFilter,
                            },
                        ),
                ),
            [
                courses,
                searchTerm,
                catalogFilter,
                levelFilter,
            ],
        );

    const courseEnrollmentMap =
        useMemo(() => {
            return new Map(
                courses.map(
                    (course) => [
                        course.id,
                        getCourseEnrollmentInfo(
                            course,
                            enrollments,
                        ),
                    ],
                ),
            );
        }, [
            courses,
            enrollments,
        ]);

    const stats =
        useMemo(() => {
            const publishedCourses =
                courses.filter(
                    (course) =>
                        matchesCatalogFilters(
                            {
                                course,
                                searchTerm:
                                    "",
                                catalogFilter:
                                    "all",
                                levelFilter:
                                    "all",
                            },
                        ),
                );

            return {
                total:
                    publishedCourses.length,
                open:
                    publishedCourses.filter(
                        isCourseOpen,
                    ).length,
                enrolled:
                    publishedCourses.filter(
                        (course) => {
                            const state =
                                courseEnrollmentMap.get(
                                    course.id,
                                )?.state;

                            return (
                                state ===
                                "approved"
                            );
                        },
                    ).length,
                pending:
                    publishedCourses.filter(
                        (course) => {
                            const state =
                                courseEnrollmentMap.get(
                                    course.id,
                                )?.state;

                            return (
                                state ===
                                "pending"
                            );
                        },
                    ).length,
            };
        }, [
            courses,
            courseEnrollmentMap,
        ]);

    function resetEnrollmentForm() {
        setSelectedCourse(
            null,
        );

        setReferenceCode(
            "",
        );

        setComment(
            "",
        );

        setVoucherFile(
            null,
        );

        setModalError(
            "",
        );
    }

    function openEnrollmentModal(
        course: CatalogCourse,
    ) {
        const state =
            courseEnrollmentMap.get(
                course.id,
            )?.state;

        if (
            state === "approved" ||
            state === "pending"
        ) {
            return;
        }

        if (
            !isCourseOpen(course)
        ) {
            return;
        }

        setSelectedCourse(
            course,
        );

        setReferenceCode(
            "",
        );

        setComment(
            "",
        );

        setVoucherFile(
            null,
        );

        setModalError(
            "",
        );
    }

    function closeEnrollmentModal() {
        if (
            savingEnrollment
        ) {
            return;
        }

        resetEnrollmentForm();
    }

    async function handleSubmitEnrollment(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            savingEnrollmentRef.current ||
            savingEnrollment
        ) {
            return;
        }

        if (!selectedCourse) {
            return;
        }

        if (!userId) {
            const message =
                "No se pudo identificar al estudiante. Inicia sesión nuevamente.";

            setModalError(
                message,
            );

            notify.error(
                "No se pudo continuar.",
                message,
            );

            return;
        }

        const isPaidCourse =
            !selectedCourse.is_free;

        if (
            isPaidCourse &&
            !referenceCode.trim()
        ) {
            const message =
                "Ingresa el código o referencia del comprobante.";

            setModalError(
                message,
            );

            notify.warning(
                "Referencia requerida.",
                message,
            );

            return;
        }

        if (
            isPaidCourse &&
            !voucherFile
        ) {
            const message =
                "Adjunta el comprobante de pago para continuar.";

            setModalError(
                message,
            );

            notify.warning(
                "Comprobante requerido.",
                message,
            );

            return;
        }

        savingEnrollmentRef.current =
            true;

        setSavingEnrollment(
            true,
        );

        setModalError(
            "",
        );

        const toastId =
            notify.loading(
                "Enviando solicitud...",
                "Estamos registrando tu matrícula.",
            );

        try {
            const createdEnrollment =
                await createEnrollment(
                    {
                        accepted:
                            selectedCourse.is_free &&
                                AUTO_APPROVE_FREE_ENROLLMENTS
                                ? true
                                : null,
                        reference_code:
                            isPaidCourse
                                ? referenceCode.trim()
                                : null,
                        comment:
                            comment.trim() ||
                            null,
                        user_id:
                            userId,
                        course_id:
                            selectedCourse.id,
                        role_id:
                            STUDENT_ROLE_ID,
                        image:
                            isPaidCourse
                                ? voucherFile
                                : null,
                    },
                );

            setEnrollments(
                (current) => [
                    createdEnrollment,
                    ...current,
                ],
            );

            const successMessage =
                selectedCourse.is_free &&
                    AUTO_APPROVE_FREE_ENROLLMENTS
                    ? "Matrícula aprobada. Ya puedes ingresar al aula."
                    : "Solicitud enviada correctamente. La matrícula se encuentra en revisión.";

            resetEnrollmentForm();

            notify.dismiss(
                toastId,
            );

            notify.success(
                "Solicitud registrada.",
                successMessage,
            );
        } catch (
        currentError
        ) {
            console.error(
                "Error al crear la matrícula:",
                currentError,
            );

            const message =
                getErrorMessage(
                    currentError,
                    "No se pudo enviar la solicitud de matrícula.",
                );

            setModalError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                "No se pudo enviar la solicitud.",
                message,
            );
        } finally {
            savingEnrollmentRef.current =
                false;

            setSavingEnrollment(
                false,
            );
        }
    }

    return {
        studentName,
        studentInitials,
        courses,
        visibleCourses,
        courseEnrollmentMap,
        stats,
        loading,
        refreshing,
        savingEnrollment,
        error,
        searchTerm,
        catalogFilter,
        levelFilter,
        selectedCourse,
        referenceCode,
        comment,
        voucherFile,
        modalError,
        setSearchTerm,
        setCatalogFilter,
        setLevelFilter,
        setReferenceCode,
        setComment,
        setVoucherFile,
        setModalError,
        loadCatalog,
        openEnrollmentModal,
        closeEnrollmentModal,
        handleSubmitEnrollment,
    };
}

export type StudentCatalogState =
    ReturnType<
        typeof useStudentCatalog
    >;