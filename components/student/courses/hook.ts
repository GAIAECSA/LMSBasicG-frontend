"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { getAuthSession } from "@/lib/auth";
import {
    getEffectiveRoleByPathname,
    roleLabels,
} from "@/lib/constants";
import { notify } from "@/lib/notify";
import {
    getAllCourses,
    type Course,
} from "@/services/courses.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";

import type {
    CourseFilter,
    CourseProgressMap,
    CourseWithExtraFields,
    EnrollmentWithExtraFields,
    SessionUserWithRole,
} from "./types";
import {
    buildCoursesMap,
    getFilteredEnrollments,
    getInitials,
    getProgressMapForEnrollments,
    getResolvedProgress,
    getUniqueActiveCourseEnrollments,
    getUserFullName,
    toNumericId,
} from "./utils";

function getErrorMessage(
    error: unknown,
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

    return "No se pudieron cargar tus cursos.";
}

export function useStudentCourses() {
    const pathname =
        usePathname();

    const { user } =
        useAuth();

    const authSession =
        getAuthSession();

    const sessionUser =
        authSession?.user as
        | SessionUserWithRole
        | undefined;

    const currentUserId =
        toNumericId(
            user?.id ??
            sessionUser?.id,
        ) ?? 0;

    const refreshInProgressRef =
        useRef(false);

    const [
        enrollments,
        setEnrollments,
    ] = useState<Enrollment[]>([]);

    const [
        coursesById,
        setCoursesById,
    ] = useState<
        Record<
            number,
            CourseWithExtraFields
        >
    >({});

    const [
        progressByEnrollment,
        setProgressByEnrollment,
    ] = useState<CourseProgressMap>(
        {},
    );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isRefreshing,
        setIsRefreshing,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        searchTerm,
        setSearchTerm,
    ] = useState("");

    const [
        activeFilter,
        setActiveFilter,
    ] = useState<CourseFilter>(
        "all",
    );

    const displayName =
        getUserFullName(user);

    const initials =
        getInitials(displayName);

    const effectiveRole =
        getEffectiveRoleByPathname(
            user?.role,
            pathname,
        );

    const roleLabel =
        roleLabels[effectiveRole] ??
        "Estudiante";

    const inProgressCount =
        useMemo(
            () =>
                enrollments.filter(
                    (enrollment) => {
                        const courseId =
                            Number(
                                (
                                    enrollment as EnrollmentWithExtraFields
                                ).course
                                    ?.id ??
                                (
                                    enrollment as EnrollmentWithExtraFields
                                )
                                    .course_id ??
                                0,
                            );

                        const course =
                            coursesById[
                            courseId
                            ] ??
                            (
                                enrollment as EnrollmentWithExtraFields
                            ).course ??
                            null;

                        return (
                            getResolvedProgress(
                                enrollment,
                                course,
                                progressByEnrollment,
                            ) < 100
                        );
                    },
                ).length,
            [
                coursesById,
                enrollments,
                progressByEnrollment,
            ],
        );

    const completedCount =
        useMemo(
            () =>
                enrollments.filter(
                    (enrollment) => {
                        const courseId =
                            Number(
                                (
                                    enrollment as EnrollmentWithExtraFields
                                ).course
                                    ?.id ??
                                (
                                    enrollment as EnrollmentWithExtraFields
                                )
                                    .course_id ??
                                0,
                            );

                        const course =
                            coursesById[
                            courseId
                            ] ??
                            (
                                enrollment as EnrollmentWithExtraFields
                            ).course ??
                            null;

                        return (
                            getResolvedProgress(
                                enrollment,
                                course,
                                progressByEnrollment,
                            ) >= 100
                        );
                    },
                ).length,
            [
                coursesById,
                enrollments,
                progressByEnrollment,
            ],
        );

    const filteredEnrollments =
        useMemo(
            () =>
                getFilteredEnrollments(
                    enrollments,
                    coursesById,
                    progressByEnrollment,
                    activeFilter,
                    searchTerm,
                ),
            [
                activeFilter,
                coursesById,
                enrollments,
                progressByEnrollment,
                searchTerm,
            ],
        );

    const loadMyCourses =
        useCallback(async () => {
            const session =
                getAuthSession();

            const localSessionUser =
                session?.user as
                | SessionUserWithRole
                | undefined;

            const userId =
                Number(
                    user?.id ??
                    localSessionUser?.id,
                );

            if (
                !userId ||
                Number.isNaN(userId)
            ) {
                throw new Error(
                    "No se pudo identificar al usuario autenticado.",
                );
            }

            const enrollmentsResponse =
                await getEnrollmentsByUser(
                    userId,
                );

            let coursesResponse:
                Course[] = [];

            try {
                const data =
                    await getAllCourses();

                coursesResponse =
                    Array.isArray(data)
                        ? data
                        : [];
            } catch {
                coursesResponse = [];
            }

            const myCourseEnrollments =
                Array.isArray(
                    enrollmentsResponse,
                )
                    ? getUniqueActiveCourseEnrollments(
                        enrollmentsResponse,
                        localSessionUser,
                        userId,
                    )
                    : [];

            const coursesMap =
                buildCoursesMap(
                    coursesResponse,
                );

            const progressMap =
                await getProgressMapForEnrollments(
                    myCourseEnrollments,
                    coursesMap,
                    localSessionUser,
                    userId,
                );

            return {
                myCourseEnrollments,
                coursesMap,
                progressMap,
            };
        }, [user?.id]);

    const handleRefreshCourses =
        useCallback(async () => {
            if (
                refreshInProgressRef.current
            ) {
                return;
            }

            refreshInProgressRef.current =
                true;

            setIsRefreshing(true);
            setErrorMessage("");

            const toastId =
                notify.loading(
                    "Actualizando tus cursos...",
                    "Estamos consultando la información más reciente.",
                );

            try {
                const data =
                    await loadMyCourses();

                setEnrollments(
                    data.myCourseEnrollments,
                );

                setCoursesById(
                    data.coursesMap,
                );

                setProgressByEnrollment(
                    data.progressMap,
                );

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    "Cursos actualizados correctamente.",
                    "Tu listado y progreso se encuentran al día.",
                );
            } catch (error) {
                const message =
                    getErrorMessage(
                        error,
                    );

                /*
                 * No se borran los cursos visibles.
                 * Si falla una actualización manual,
                 * se conserva la última información cargada.
                 */
                setErrorMessage(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    "No se pudieron actualizar tus cursos.",
                    message,
                );
            } finally {
                refreshInProgressRef.current =
                    false;

                setIsRefreshing(
                    false,
                );
            }
        }, [loadMyCourses]);

    useEffect(() => {
        let isMounted =
            true;

        const timer =
            window.setTimeout(() => {
                setIsLoading(
                    true,
                );

                loadMyCourses()
                    .then((data) => {
                        if (!isMounted) {
                            return;
                        }

                        setEnrollments(
                            data.myCourseEnrollments,
                        );

                        setCoursesById(
                            data.coursesMap,
                        );

                        setProgressByEnrollment(
                            data.progressMap,
                        );

                        setErrorMessage(
                            "",
                        );
                    })
                    .catch((error) => {
                        if (!isMounted) {
                            return;
                        }

                        console.error(
                            "Error al cargar los cursos del estudiante:",
                            error,
                        );

                        setEnrollments(
                            [],
                        );

                        setCoursesById(
                            {},
                        );

                        setProgressByEnrollment(
                            {},
                        );

                        setErrorMessage(
                            getErrorMessage(
                                error,
                            ),
                        );
                    })
                    .finally(() => {
                        if (!isMounted) {
                            return;
                        }

                        setIsLoading(
                            false,
                        );
                    });
            }, 0);

        return () => {
            isMounted = false;

            window.clearTimeout(
                timer,
            );
        };
    }, [loadMyCourses]);

    return {
        enrollments,
        coursesById,
        progressByEnrollment,
        filteredEnrollments,
        inProgressCount,
        completedCount,
        isLoading,
        isRefreshing,
        errorMessage,
        searchTerm,
        activeFilter,
        roleLabel,
        initials,
        sessionUser,
        currentUserId,
        setSearchTerm,
        setActiveFilter,
        handleRefreshCourses,
    };
}

export type StudentCoursesState =
    ReturnType<
        typeof useStudentCourses
    >;