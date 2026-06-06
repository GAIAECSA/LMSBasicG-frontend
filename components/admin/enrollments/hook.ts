"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    getAllCourses,
    type Course,
} from "@/services/courses.service";

import {
    createEnrollment,
    deleteEnrollment,
    getEnrollmentsByRole,
    updateEnrollment,
    type Enrollment,
} from "@/services/enrollments.service";

import {
    getAllUsers,
    type User,
} from "@/services/users.service";

import {
    ROWS_PER_PAGE,
    STUDENT_ROLE_ID,
} from "./constants";

import type {
    EnrollmentStats,
    StatusFilter,
} from "./types";

import {
    getCourseName,
    getEnrollmentStudentName,
    getStatusText,
    getUserName,
} from "./utils";

export function useEnrollmentsAdminPanel() {
    const [enrollments, setEnrollments] =
        useState<Enrollment[]>([]);

    const [courses, setCourses] =
        useState<Course[]>([]);

    const [users, setUsers] =
        useState<User[]>([]);

    const [courseId, setCourseId] =
        useState("");

    const [studentId, setStudentId] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isRefreshing, setIsRefreshing] =
        useState(false);

    const [isSaving, setIsSaving] =
        useState(false);

    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [deletingId, setDeletingId] =
        useState<number | null>(null);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [
        enrollmentModalOpen,
        setEnrollmentModalOpen,
    ] = useState(false);

    const [
        voucherModalUrl,
        setVoucherModalUrl,
    ] = useState<string | null>(null);

    const [
        voucherModalTitle,
        setVoucherModalTitle,
    ] = useState("Comprobante");

    const [
        rejectModalOpen,
        setRejectModalOpen,
    ] = useState(false);

    const [rejectReason, setRejectReason] =
        useState("");

    const [
        selectedEnrollment,
        setSelectedEnrollment,
    ] = useState<Enrollment | null>(null);

    const [courseSearch, setCourseSearch] =
        useState("");

    const [userSearch, setUserSearch] =
        useState("");

    const loadEnrollments = useCallback(
        async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                setError("");

                const [
                    enrollmentsData,
                    coursesData,
                    usersData,
                ] = await Promise.all([
                    getEnrollmentsByRole(
                        STUDENT_ROLE_ID,
                    ),
                    getAllCourses(),
                    getAllUsers(),
                ]);

                setEnrollments(
                    Array.isArray(enrollmentsData)
                        ? enrollmentsData
                        : [],
                );

                setCourses(
                    Array.isArray(coursesData)
                        ? coursesData
                        : [],
                );

                setUsers(
                    Array.isArray(usersData)
                        ? usersData
                        : [],
                );

                if (showRefresh) {
                    setSuccess(
                        "Lista de matrículas actualizada correctamente.",
                    );
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar las matrículas.",
                );
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(
            () => {
                void loadEnrollments();
            },
            0,
        );

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadEnrollments]);

    useEffect(() => {
        if (!error && !success) return;

        const timeoutId = window.setTimeout(
            () => {
                setError("");
                setSuccess("");
            },
            3000,
        );

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [error, success]);

    const filteredCourses = useMemo(() => {
        const query = courseSearch
            .trim()
            .toLowerCase();

        if (!query) return courses;

        return courses.filter((course) =>
            getCourseName(course)
                .toLowerCase()
                .includes(query),
        );
    }, [courses, courseSearch]);

    const filteredUsers = useMemo(() => {
        const query = userSearch
            .trim()
            .toLowerCase();

        return users
            .filter(
                (user) =>
                    user.role_id === 2 ||
                    user.role_id === 4,
            )
            .filter((user) => {
                if (!query) return true;

                const fullName =
                    getUserName(user).toLowerCase();

                const email =
                    user.email?.toLowerCase() || "";

                const username =
                    user.username?.toLowerCase() ||
                    "";

                return (
                    fullName.includes(query) ||
                    email.includes(query) ||
                    username.includes(query)
                );
            });
    }, [users, userSearch]);

    const stats = useMemo<EnrollmentStats>(
        () => {
            const approved = enrollments.filter(
                (item) =>
                    item.accepted === true,
            ).length;

            const rejected = enrollments.filter(
                (item) =>
                    item.accepted === false,
            ).length;

            const pending = enrollments.filter(
                (item) =>
                    item.accepted === null,
            ).length;

            return {
                total: enrollments.length,
                approved,
                pending,
                rejected,
            };
        },
        [enrollments],
    );

    const filteredEnrollments = useMemo(
        () => {
            const query = search
                .trim()
                .toLowerCase();

            return enrollments.filter(
                (enrollment) => {
                    const courseName =
                        enrollment.course.name
                            ?.toLowerCase() ||
                        "";

                    const studentName =
                        getEnrollmentStudentName(
                            enrollment,
                        ).toLowerCase();

                    const reference =
                        enrollment.reference_code
                            ?.toLowerCase() ||
                        "";

                    const comment =
                        enrollment.comment
                            ?.toLowerCase() ||
                        "";

                    const status =
                        getStatusText(
                            enrollment.accepted,
                        ).toLowerCase();

                    const matchesSearch =
                        !query ||
                        courseName.includes(query) ||
                        studentName.includes(
                            query,
                        ) ||
                        reference.includes(query) ||
                        comment.includes(query) ||
                        status.includes(query) ||
                        String(
                            enrollment.id,
                        ).includes(query) ||
                        String(
                            enrollment.user.id,
                        ).includes(query) ||
                        String(
                            enrollment.course.id,
                        ).includes(query);

                    const matchesStatus =
                        statusFilter === "all" ||
                        (statusFilter ===
                            "approved" &&
                            enrollment.accepted ===
                                true) ||
                        (statusFilter ===
                            "pending" &&
                            enrollment.accepted ===
                                null) ||
                        (statusFilter ===
                            "rejected" &&
                            enrollment.accepted ===
                                false);

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                },
            );
        },
        [
            enrollments,
            search,
            statusFilter,
        ],
    );

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredEnrollments.length /
                ROWS_PER_PAGE,
        ),
    );

    const activePage = Math.min(
        currentPage,
        totalPages,
    );

    const paginatedEnrollments = useMemo(
        () => {
            const startIndex =
                (activePage - 1) *
                ROWS_PER_PAGE;

            return filteredEnrollments.slice(
                startIndex,
                startIndex + ROWS_PER_PAGE,
            );
        },
        [
            filteredEnrollments,
            activePage,
        ],
    );

    const selectedCourse = useMemo(
        () =>
            courses.find(
                (course) =>
                    String(course.id) ===
                    courseId,
            ) ?? null,
        [courses, courseId],
    );

    const selectedUser = useMemo(
        () =>
            users.find(
                (user) =>
                    String(user.id) ===
                    studentId,
            ) ?? null,
        [users, studentId],
    );

    function resetEnrollmentForm() {
        setCourseId("");
        setStudentId("");
        setCourseSearch("");
        setUserSearch("");
    }

    function openEnrollmentModal() {
        resetEnrollmentForm();
        setError("");
        setSuccess("");
        setEnrollmentModalOpen(true);
    }

    function closeEnrollmentModal(
        force = false,
    ) {
        if (isSaving && !force) return;

        setEnrollmentModalOpen(false);
        resetEnrollmentForm();
        setError("");
    }

    function openRejectModal(
        enrollment: Enrollment,
    ) {
        setSelectedEnrollment(enrollment);
        setRejectReason("");
        setError("");
        setRejectModalOpen(true);
    }

    function closeRejectModal(
        force = false,
    ) {
        if (isSaving && !force) return;

        setRejectModalOpen(false);
        setSelectedEnrollment(null);
        setRejectReason("");
        setError("");
    }

    function openVoucherModal(
        url: string,
        title: string,
    ) {
        setVoucherModalUrl(url);
        setVoucherModalTitle(title);
    }

    function closeVoucherModal() {
        setVoucherModalUrl(null);
        setVoucherModalTitle("Comprobante");
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!courseId || !studentId) {
            setError(
                "Debes seleccionar el curso y el usuario.",
            );

            return;
        }

        try {
            setIsSaving(true);

            await createEnrollment({
                accepted: true,
                reference_code: undefined,
                comment: "",
                user_id: Number(studentId),
                course_id: Number(courseId),
                role_id: STUDENT_ROLE_ID,
                image: null,
            });

            closeEnrollmentModal(true);

            setSuccess(
                "Matrícula creada correctamente.",
            );

            await loadEnrollments();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo matricular.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleApprove(
        enrollment: Enrollment,
    ) {
        try {
            setUpdatingId(enrollment.id);
            setError("");
            setSuccess("");

            const updated =
                await updateEnrollment(
                    enrollment.id,
                    {
                        accepted: true,
                        reference_code:
                            enrollment.reference_code,
                        comment:
                            enrollment.comment,
                        user_id:
                            enrollment.user.id,
                        course_id:
                            enrollment.course.id,
                        role_id:
                            enrollment.role.id,
                    },
                );

            setEnrollments((current) =>
                current.map((item) =>
                    item.id === updated.id
                        ? updated
                        : item,
                ),
            );

            setSuccess(
                "Matrícula aprobada correctamente.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo aprobar la matrícula.",
            );
        } finally {
            setUpdatingId(null);
        }
    }

    async function handleRevision(
        enrollment: Enrollment,
    ) {
        try {
            setUpdatingId(enrollment.id);
            setError("");
            setSuccess("");

            const updated =
                await updateEnrollment(
                    enrollment.id,
                    {
                        accepted: null,
                        reference_code:
                            enrollment.reference_code,
                        comment:
                            enrollment.comment,
                        user_id:
                            enrollment.user.id,
                        course_id:
                            enrollment.course.id,
                        role_id:
                            enrollment.role.id,
                    },
                );

            setEnrollments((current) =>
                current.map((item) =>
                    item.id === updated.id
                        ? updated
                        : item,
                ),
            );

            setSuccess(
                "Matrícula enviada a revisión correctamente.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo pasar la matrícula a revisión.",
            );
        } finally {
            setUpdatingId(null);
        }
    }

    async function handleNoApprove() {
        if (!selectedEnrollment) return;

        if (!rejectReason.trim()) {
            setError(
                "Debes ingresar el motivo de no aprobación.",
            );

            return;
        }

        try {
            setIsSaving(true);
            setError("");
            setSuccess("");

            const updated =
                await updateEnrollment(
                    selectedEnrollment.id,
                    {
                        accepted: false,
                        reference_code:
                            selectedEnrollment.reference_code,
                        comment:
                            rejectReason.trim(),
                        user_id:
                            selectedEnrollment.user
                                .id,
                        course_id:
                            selectedEnrollment.course
                                .id,
                        role_id:
                            selectedEnrollment.role
                                .id,
                    },
                );

            setEnrollments((current) =>
                current.map((item) =>
                    item.id === updated.id
                        ? updated
                        : item,
                ),
            );

            closeRejectModal(true);

            setSuccess(
                "Matrícula marcada como no aprobada.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo no aprobar la matrícula.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(
        enrollmentId: number,
    ) {
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar esta matrícula?",
        );

        if (!confirmed) return;

        try {
            setDeletingId(enrollmentId);
            setError("");
            setSuccess("");

            await deleteEnrollment(
                enrollmentId,
            );

            setEnrollments((current) =>
                current.filter(
                    (item) =>
                        item.id !== enrollmentId,
                ),
            );

            setSuccess(
                "Matrícula eliminada correctamente.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo eliminar la matrícula.",
            );
        } finally {
            setDeletingId(null);
        }
    }

    return {
        enrollments,
        courses,
        users,
        courseId,
        studentId,
        isLoading,
        isRefreshing,
        isSaving,
        updatingId,
        deletingId,
        error,
        success,
        search,
        statusFilter,
        currentPage,
        enrollmentModalOpen,
        voucherModalUrl,
        voucherModalTitle,
        rejectModalOpen,
        rejectReason,
        selectedEnrollment,
        courseSearch,
        userSearch,
        filteredCourses,
        filteredUsers,
        stats,
        filteredEnrollments,
        totalPages,
        activePage,
        paginatedEnrollments,
        selectedCourse,
        selectedUser,
        setCourseId,
        setStudentId,
        setSearch,
        setStatusFilter,
        setCurrentPage,
        setRejectReason,
        setCourseSearch,
        setUserSearch,
        loadEnrollments,
        openEnrollmentModal,
        closeEnrollmentModal,
        openRejectModal,
        closeRejectModal,
        openVoucherModal,
        closeVoucherModal,
        handleSubmit,
        handleApprove,
        handleRevision,
        handleNoApprove,
        handleDelete,
    };
}

export type EnrollmentsAdminPanelState =
    ReturnType<
        typeof useEnrollmentsAdminPanel
    >;
