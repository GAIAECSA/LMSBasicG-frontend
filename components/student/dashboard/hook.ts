"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notify";
import {
    getAllCourses,
} from "@/services/courses.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";

import {
    MAX_VISIBLE_MY_COURSES,
    MAX_VISIBLE_RECOMMENDED_COURSES,
    STUDENT_LINKS,
} from "./constants";
import type {
    DashboardCourse,
    StudentDashboardSummary,
} from "./types";
import {
    getEnrollmentCourseId,
    getInitials,
    getUserFullName,
    getUserId,
    isApprovedEnrollment,
    isCourseOpen,
    isCoursePublished,
    isPendingEnrollment,
    isStudentEnrollment,
    mergeEnrollmentCourse,
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

    return "No se pudo cargar la información del estudiante.";
}

export function useStudentDashboard() {
    const { user } = useAuth();

    const userId = useMemo(
        () => getUserId(user),
        [user],
    );

    const studentName = useMemo(
        () => getUserFullName(user),
        [user],
    );

    const initials = useMemo(
        () => getInitials(studentName),
        [studentName],
    );

    const [
        courses,
        setCourses,
    ] = useState<DashboardCourse[]>([]);

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
        error,
        setError,
    ] = useState("");

    const loadDashboard = useCallback(
        async (
            manualRefresh = false,
        ) => {
            if (!userId) {
                setLoading(false);
                setRefreshing(false);

                return;
            }

            try {
                if (manualRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const [
                    courseResponse,
                    enrollmentResponse,
                ] = await Promise.all([
                    getAllCourses(),
                    getEnrollmentsByUser(
                        userId,
                    ),
                ]);

                setCourses(
                    Array.isArray(
                        courseResponse,
                    )
                        ? courseResponse
                        : [],
                );

                setEnrollments(
                    Array.isArray(
                        enrollmentResponse,
                    )
                        ? enrollmentResponse
                        : [],
                );

                if (manualRefresh) {
                    notify.success(
                        "Panel actualizado correctamente.",
                        "La información de tus cursos y matrículas está al día.",
                    );
                }
            } catch (currentError) {
                console.error(
                    "Error al cargar dashboard del estudiante:",
                    currentError,
                );

                const message =
                    getErrorMessage(
                        currentError,
                    );

                setError(message);

                if (manualRefresh) {
                    notify.error(
                        "No se pudo actualizar el panel.",
                        message,
                    );
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [userId],
    );

    useEffect(() => {
        const timeoutId =
            window.setTimeout(() => {
                void loadDashboard();
            }, 0);

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [loadDashboard]);

    const studentEnrollments =
        useMemo(
            () =>
                enrollments.filter(
                    isStudentEnrollment,
                ),
            [enrollments],
        );

    const approvedEnrollments =
        useMemo(
            () =>
                studentEnrollments.filter(
                    isApprovedEnrollment,
                ),
            [studentEnrollments],
        );

    const pendingEnrollments =
        useMemo(
            () =>
                studentEnrollments.filter(
                    isPendingEnrollment,
                ),
            [studentEnrollments],
        );

    const courseMap = useMemo(() => {
        return new Map(
            courses.map(
                (course) => [
                    course.id,
                    course,
                ],
            ),
        );
    }, [courses]);

    const myCourses = useMemo(
        () =>
            approvedEnrollments
                .map((enrollment) =>
                    mergeEnrollmentCourse(
                        enrollment,
                        courseMap,
                    ),
                )
                .slice(
                    0,
                    MAX_VISIBLE_MY_COURSES,
                ),
        [
            approvedEnrollments,
            courseMap,
        ],
    );

    const enrolledCourseIds =
        useMemo(
            () =>
                new Set(
                    studentEnrollments.map(
                        (enrollment) =>
                            getEnrollmentCourseId(
                                enrollment,
                            ),
                    ),
                ),
            [studentEnrollments],
        );

    const recommendedCourses =
        useMemo(
            () =>
                courses
                    .filter(
                        (course) =>
                            isCoursePublished(
                                course,
                            ) &&
                            isCourseOpen(
                                course,
                            ) &&
                            !enrolledCourseIds.has(
                                course.id,
                            ),
                    )
                    .slice(
                        0,
                        MAX_VISIBLE_RECOMMENDED_COURSES,
                    ),
            [
                courses,
                enrolledCourseIds,
            ],
        );

    const summary =
        useMemo<StudentDashboardSummary>(
            () => ({
                enrolled:
                    studentEnrollments.length,
                approved:
                    approvedEnrollments.length,
                pending:
                    pendingEnrollments.length,
                certificatesHref:
                    STUDENT_LINKS.certificates,
            }),
            [
                approvedEnrollments.length,
                pendingEnrollments.length,
                studentEnrollments.length,
            ],
        );

    return {
        studentName,
        initials,
        loading,
        refreshing,
        error,
        summary,
        myCourses,
        pendingEnrollments,
        recommendedCourses,
        loadDashboard,
    };
}

export type StudentDashboardState =
    ReturnType<
        typeof useStudentDashboard
    >;