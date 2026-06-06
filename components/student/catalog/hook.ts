"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses } from "@/services/courses.service";
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

export function useStudentCatalog() {
    const { user } = useAuth();

    const userId = useMemo(() => getUserId(user), [user]);
    const studentName = useMemo(() => getUserFullName(user), [user]);
    const studentInitials = useMemo(
        () => getInitials(studentName),
        [studentName],
    );

    const [courses, setCourses] = useState<CatalogCourse[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingEnrollment, setSavingEnrollment] = useState(false);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [catalogFilter, setCatalogFilter] =
        useState<CatalogFilter>("all");
    const [levelFilter, setLevelFilter] =
        useState<LevelFilter>("all");

    const [selectedCourse, setSelectedCourse] =
        useState<CatalogCourse | null>(null);

    const [referenceCode, setReferenceCode] = useState("");
    const [comment, setComment] = useState("");
    const [voucherFile, setVoucherFile] = useState<File | null>(null);
    const [modalError, setModalError] = useState("");

    const loadCatalog = useCallback(
        async (manualRefresh = false) => {
            try {
                if (manualRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const coursesResponse = await getAllCourses();

                const enrollmentResponse =
                    userId > 0
                        ? await getEnrollmentsByUser(userId)
                        : [];

                setCourses(
                    Array.isArray(coursesResponse)
                        ? coursesResponse
                        : [],
                );

                setEnrollments(
                    Array.isArray(enrollmentResponse)
                        ? enrollmentResponse
                        : [],
                );

                if (manualRefresh) {
                    setNotice("Catálogo actualizado correctamente.");
                }
            } catch (currentError) {
                console.error(
                    "Error al cargar el catálogo del estudiante:",
                    currentError,
                );

                setError(
                    currentError instanceof Error
                        ? currentError.message
                        : "No se pudo cargar el catálogo de cursos.",
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [userId],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCatalog();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadCatalog]);

    useEffect(() => {
        if (!error && !notice) return;

        const timeoutId = window.setTimeout(() => {
            setError("");
            setNotice("");
        }, 4000);

        return () => window.clearTimeout(timeoutId);
    }, [error, notice]);

    const visibleCourses = useMemo(() => {
        return courses.filter((course) =>
            matchesCatalogFilters({
                course,
                searchTerm,
                catalogFilter,
                levelFilter,
            }),
        );
    }, [
        courses,
        searchTerm,
        catalogFilter,
        levelFilter,
    ]);

    const courseEnrollmentMap = useMemo(() => {
        return new Map(
            courses.map((course) => [
                course.id,
                getCourseEnrollmentInfo(course, enrollments),
            ]),
        );
    }, [courses, enrollments]);

    const stats = useMemo(() => {
        const publishedCourses = courses.filter((course) =>
            matchesCatalogFilters({
                course,
                searchTerm: "",
                catalogFilter: "all",
                levelFilter: "all",
            }),
        );

        return {
            total: publishedCourses.length,
            open: publishedCourses.filter(isCourseOpen).length,
            enrolled: publishedCourses.filter((course) => {
                const state =
                    courseEnrollmentMap.get(course.id)?.state;

                return state === "approved";
            }).length,
            pending: publishedCourses.filter((course) => {
                const state =
                    courseEnrollmentMap.get(course.id)?.state;

                return state === "pending";
            }).length,
        };
    }, [courses, courseEnrollmentMap]);

    function resetEnrollmentForm() {
        setSelectedCourse(null);
        setReferenceCode("");
        setComment("");
        setVoucherFile(null);
        setModalError("");
    }

    function openEnrollmentModal(course: CatalogCourse) {
        const state = courseEnrollmentMap.get(course.id)?.state;

        if (state === "approved" || state === "pending") return;
        if (!isCourseOpen(course)) return;

        setSelectedCourse(course);
        setReferenceCode("");
        setComment("");
        setVoucherFile(null);
        setModalError("");
    }

    function closeEnrollmentModal() {
        if (savingEnrollment) return;

        resetEnrollmentForm();
    }

    async function handleSubmitEnrollment(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!selectedCourse) return;

        if (!userId) {
            setModalError(
                "No se pudo identificar al estudiante. Inicia sesión nuevamente.",
            );

            return;
        }

        const isPaidCourse = !selectedCourse.is_free;

        if (isPaidCourse && !referenceCode.trim()) {
            setModalError(
                "Ingresa el código o referencia del comprobante.",
            );

            return;
        }

        if (isPaidCourse && !voucherFile) {
            setModalError(
                "Adjunta el comprobante de pago para continuar.",
            );

            return;
        }

        try {
            setSavingEnrollment(true);
            setModalError("");

            const createdEnrollment = await createEnrollment({
                accepted:
                    selectedCourse.is_free &&
                    AUTO_APPROVE_FREE_ENROLLMENTS
                        ? true
                        : null,
                reference_code: isPaidCourse
                    ? referenceCode.trim()
                    : null,
                comment: comment.trim() || null,
                user_id: userId,
                course_id: selectedCourse.id,
                role_id: STUDENT_ROLE_ID,
                image: isPaidCourse ? voucherFile : null,
            });

            setEnrollments((current) => [
                createdEnrollment,
                ...current,
            ]);

            const successMessage =
                selectedCourse.is_free &&
                AUTO_APPROVE_FREE_ENROLLMENTS
                    ? "Matrícula aprobada. Ya puedes ingresar al aula."
                    : "Solicitud enviada correctamente. La matrícula se encuentra en revisión.";

            resetEnrollmentForm();
            setNotice(successMessage);
        } catch (currentError) {
            console.error(
                "Error al crear la matrícula:",
                currentError,
            );

            setModalError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo enviar la solicitud de matrícula.",
            );
        } finally {
            setSavingEnrollment(false);
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
        notice,
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
    ReturnType<typeof useStudentCatalog>;
