"use client";

/* eslint-disable @next/next/no-img-element */

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import { getAllCourses, type Course } from "@/services/courses.service";
import { getAllUsers, type User } from "@/services/users.service";

import {
    createEnrollment,
    deleteEnrollment,
    getEnrollmentsByRole,
    resolveEnrollmentVoucherUrl,
    updateEnrollment,
    type Enrollment,
} from "@/services/enrollments.service";

const STUDENT_ROLE_ID = 4;
const ROWS_PER_PAGE = 7;

type StatusFilter = "all" | "approved" | "pending" | "rejected";

function getCourseName(course: Course): string {
    const item = course as Course & { name?: string; title?: string };

    return item.name || item.title || `Curso #${course.id}`;
}

function getUserName(user: User): string {
    return (
        `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
        user.username ||
        `Usuario #${user.id}`
    );
}

function getEnrollmentStudentName(enrollment: Enrollment): string {
    return (
        `${enrollment.user.firstname || ""} ${enrollment.user.lastname || ""
            }`.trim() || `Usuario #${enrollment.user.id}`
    );
}

function getEnrollmentInitials(enrollment: Enrollment): string {
    const first = enrollment.user.firstname?.charAt(0) ?? "";
    const last = enrollment.user.lastname?.charAt(0) ?? "";
    const initials = `${first}${last}`.trim();

    return initials || "ES";
}

function getStatusText(accepted: boolean | null) {
    if (accepted === true) return "Aprobado";
    if (accepted === false) return "No aprobado";

    return "Pendiente";
}

function getStatusBadgeClass(accepted: boolean | null) {
    if (accepted === true) {
        return "bg-emerald-100 text-emerald-700";
    }

    if (accepted === false) {
        return "bg-red-100 text-red-700";
    }

    return "bg-orange-100 text-orange-700";
}

export function EnrollmentsAdminPanel() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [courseId, setCourseId] = useState("");
    const [studentId, setStudentId] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
    const [voucherModalUrl, setVoucherModalUrl] = useState<string | null>(null);
    const [voucherModalTitle, setVoucherModalTitle] = useState("Comprobante");

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedEnrollment, setSelectedEnrollment] =
        useState<Enrollment | null>(null);

    const [courseSearch, setCourseSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    const loadEnrollments = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setError("");

            const [enrollmentsData, coursesData, usersData] =
                await Promise.all([
                    getEnrollmentsByRole(STUDENT_ROLE_ID),
                    getAllCourses(),
                    getAllUsers(),
                ]);

            setEnrollments(
                Array.isArray(enrollmentsData) ? enrollmentsData : [],
            );
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setUsers(Array.isArray(usersData) ? usersData : []);

            if (showRefresh) {
                setSuccess("Lista de matrículas actualizada correctamente.");
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
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadEnrollments();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadEnrollments]);

    useEffect(() => {
        if (!error && !success) return;

        const timeoutId = window.setTimeout(() => {
            setError("");
            setSuccess("");
        }, 3000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [error, success]);

    const filteredCourses = useMemo(() => {
        const query = courseSearch.trim().toLowerCase();

        if (!query) return courses;

        return courses.filter((course) =>
            getCourseName(course).toLowerCase().includes(query),
        );
    }, [courses, courseSearch]);

    const filteredUsers = useMemo(() => {
        const query = userSearch.trim().toLowerCase();

        return users
            .filter((user) => user.role_id === 2 || user.role_id === 4)
            .filter((user) => {
                if (!query) return true;

                const fullName = getUserName(user).toLowerCase();
                const email = user.email?.toLowerCase() || "";
                const username = user.username?.toLowerCase() || "";

                return (
                    fullName.includes(query) ||
                    email.includes(query) ||
                    username.includes(query)
                );
            });
    }, [users, userSearch]);

    const stats = useMemo(() => {
        const approved = enrollments.filter(
            (item) => item.accepted === true,
        ).length;

        const rejected = enrollments.filter(
            (item) => item.accepted === false,
        ).length;

        const pending = enrollments.filter(
            (item) => item.accepted === null,
        ).length;

        return {
            total: enrollments.length,
            approved,
            pending,
            rejected,
        };
    }, [enrollments]);

    const filteredEnrollments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return enrollments.filter((enrollment) => {
            const courseName = enrollment.course.name?.toLowerCase() || "";
            const studentName = getEnrollmentStudentName(
                enrollment,
            ).toLowerCase();
            const reference = enrollment.reference_code?.toLowerCase() || "";
            const comment = enrollment.comment?.toLowerCase() || "";
            const status = getStatusText(enrollment.accepted).toLowerCase();

            const matchesSearch =
                !query ||
                courseName.includes(query) ||
                studentName.includes(query) ||
                reference.includes(query) ||
                comment.includes(query) ||
                status.includes(query) ||
                String(enrollment.id).includes(query) ||
                String(enrollment.user.id).includes(query) ||
                String(enrollment.course.id).includes(query);

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "approved" &&
                    enrollment.accepted === true) ||
                (statusFilter === "pending" &&
                    enrollment.accepted === null) ||
                (statusFilter === "rejected" &&
                    enrollment.accepted === false);

            return matchesSearch && matchesStatus;
        });
    }, [enrollments, search, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredEnrollments.length / ROWS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedEnrollments = useMemo(() => {
        const startIndex = (activePage - 1) * ROWS_PER_PAGE;

        return filteredEnrollments.slice(
            startIndex,
            startIndex + ROWS_PER_PAGE,
        );
    }, [filteredEnrollments, activePage]);

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

    function closeEnrollmentModal() {
        if (isSaving) return;

        setEnrollmentModalOpen(false);
        resetEnrollmentForm();
        setError("");
    }

    function closeRejectModal() {
        if (isSaving) return;

        setRejectModalOpen(false);
        setSelectedEnrollment(null);
        setRejectReason("");
        setError("");
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!courseId || !studentId) {
            setError("Debes seleccionar el curso y el usuario.");
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

            resetEnrollmentForm();
            setEnrollmentModalOpen(false);
            setSuccess("Matrícula creada correctamente.");

            await loadEnrollments();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "No se pudo matricular.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleApprove(enrollment: Enrollment) {
        try {
            setError("");
            setSuccess("");

            const updated = await updateEnrollment(enrollment.id, {
                accepted: true,
                reference_code: enrollment.reference_code,
                comment: enrollment.comment,
                user_id: enrollment.user.id,
                course_id: enrollment.course.id,
                role_id: enrollment.role.id,
            });

            setEnrollments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );

            setSuccess("Matrícula aprobada correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo aprobar la matrícula.",
            );
        }
    }

    async function handleRevision(enrollment: Enrollment) {
        try {
            setError("");
            setSuccess("");

            const updated = await updateEnrollment(enrollment.id, {
                accepted: null,
                reference_code: enrollment.reference_code,
                comment: enrollment.comment,
                user_id: enrollment.user.id,
                course_id: enrollment.course.id,
                role_id: enrollment.role.id,
            });

            setEnrollments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );

            setSuccess("Matrícula enviada a revisión correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo pasar la matrícula a revisión.",
            );
        }
    }

    async function handleNoApprove() {
        if (!selectedEnrollment) return;

        if (!rejectReason.trim()) {
            setError("Debes ingresar el motivo de no aprobación.");
            return;
        }

        try {
            setIsSaving(true);
            setError("");
            setSuccess("");

            const updated = await updateEnrollment(selectedEnrollment.id, {
                accepted: false,
                reference_code: selectedEnrollment.reference_code,
                comment: rejectReason.trim(),
                user_id: selectedEnrollment.user.id,
                course_id: selectedEnrollment.course.id,
                role_id: selectedEnrollment.role.id,
            });

            setEnrollments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );

            setRejectModalOpen(false);
            setSelectedEnrollment(null);
            setRejectReason("");
            setSuccess("Matrícula marcada como no aprobada.");
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

    async function handleDelete(enrollmentId: number) {
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar esta matrícula?",
        );

        if (!confirmed) return;

        try {
            setDeletingId(enrollmentId);
            setError("");
            setSuccess("");

            await deleteEnrollment(enrollmentId);

            setEnrollments((current) =>
                current.filter((item) => item.id !== enrollmentId),
            );

            setSuccess("Matrícula eliminada correctamente.");
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

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                            Administración
                        </p>

                        <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                            Gestión de matrículas
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                            Administra las matrículas de estudiantes, revisa
                            comprobantes y actualiza el estado de aprobación de
                            cada solicitud.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[620px]">
                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Total
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.total}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Aprobadas
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.approved}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Pendientes
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.pending}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                No aprobadas
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.rejected}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {(error || success) && !enrollmentModalOpen && !rejectModalOpen ? (
                <div
                    className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${error
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                >
                    {error || success}
                </div>
            ) : null}

            <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-950">
                            Lista de matrículas
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            Busca por curso, estudiante, código, estado o ID.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={openEnrollmentModal}
                            className="h-12 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]"
                        >
                            Matricular estudiante
                        </button>

                        <button
                            type="button"
                            onClick={() => void loadEnrollments(true)}
                            disabled={isRefreshing || isLoading}
                            className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRefreshing ? "Actualizando..." : "Actualizar"}
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_240px]">
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar matrícula, curso, estudiante, código o ID"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value as StatusFilter);
                            setCurrentPage(1);
                        }}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="approved">Aprobadas</option>
                        <option value="pending">Pendientes</option>
                        <option value="rejected">No aprobadas</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Curso
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Estudiante
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Código
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Estado
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Comprobante
                                </th>

                                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                    >
                                        Cargando matrículas...
                                    </td>
                                </tr>
                            ) : filteredEnrollments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center"
                                    >
                                        <p className="text-sm font-bold text-slate-800">
                                            No hay matrículas para mostrar.
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {enrollments.length === 0
                                                ? "Registra una matrícula desde el botón superior."
                                                : "No se encontraron matrículas con ese criterio de búsqueda."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEnrollments.map((enrollment) => {
                                    const voucherUrl =
                                        resolveEnrollmentVoucherUrl(
                                            enrollment.voucher_url,
                                        );

                                    return (
                                        <tr
                                            key={enrollment.id}
                                            className="align-top transition hover:bg-blue-50/40"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="min-w-[240px]">
                                                    <p className="text-sm font-bold text-slate-950">
                                                        {enrollment.course.name}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex min-w-[220px] items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                        {getEnrollmentInitials(
                                                            enrollment,
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-bold text-slate-950">
                                                            {getEnrollmentStudentName(
                                                                enrollment,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                {enrollment.reference_code ||
                                                    "Sin código"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                                                        enrollment.accepted,
                                                    )}`}
                                                >
                                                    {getStatusText(
                                                        enrollment.accepted,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {voucherUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVoucherModalUrl(
                                                                voucherUrl,
                                                            );
                                                            setVoucherModalTitle(
                                                                `Comprobante - ${getEnrollmentStudentName(
                                                                    enrollment,
                                                                )}`,
                                                            );
                                                        }}
                                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Ver comprobante
                                                    </button>
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-400">
                                                        Sin comprobante
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex min-w-[310px] justify-end gap-2">
                                                    {enrollment.accepted ===
                                                        true ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleRevision(
                                                                    enrollment,
                                                                )
                                                            }
                                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-orange-200 px-3 text-xs font-bold text-orange-700 transition hover:bg-orange-50"
                                                        >
                                                            A revisión
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleApprove(
                                                                    enrollment,
                                                                )
                                                            }
                                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                                                        >
                                                            Aprobar
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedEnrollment(
                                                                enrollment,
                                                            );
                                                            setRejectReason("");
                                                            setError("");
                                                            setRejectModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50"
                                                    >
                                                        No aprobar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleDelete(
                                                                enrollment.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            enrollment.id
                                                        }
                                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {deletingId ===
                                                            enrollment.id
                                                            ? "Eliminando..."
                                                            : "Eliminar"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                        Mostrando {paginatedEnrollments.length} de{" "}
                        {filteredEnrollments.length} matrículas
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.max(1, page - 1),
                                )
                            }
                            disabled={activePage === 1}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Anterior
                        </button>

                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                            Página {activePage} de {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1),
                                )
                            }
                            disabled={activePage === totalPages}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {enrollmentModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        Matrícula
                                    </p>

                                    <h3 className="mt-2 text-xl font-bold">
                                        Matricular estudiante
                                    </h3>

                                    <p className="mt-1 text-sm text-blue-50">
                                        Busca el curso y el usuario. La
                                        matrícula se registrará sin referencia ni
                                        comprobante.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeEnrollmentModal}
                                    disabled={isSaving}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-1 flex-col overflow-hidden"
                        >
                            <div className="space-y-5 overflow-y-auto p-6">
                                {error ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                        {error}
                                    </div>
                                ) : null}

                                <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
                                    Estado inicial:{" "}
                                    <span className="font-bold">Aprobado</span>.
                                    Referencia:{" "}
                                    <span className="font-bold">
                                        Sin referencia
                                    </span>
                                    . Comprobante:{" "}
                                    <span className="font-bold">
                                        Sin archivo
                                    </span>
                                    .
                                </div>

                                <div className="grid gap-5 lg:grid-cols-2">
                                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                Buscar curso
                                            </label>

                                            <input
                                                value={courseSearch}
                                                onChange={(event) =>
                                                    setCourseSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Escribe el nombre del curso..."
                                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                            {filteredCourses.map((course) => {
                                                const selected =
                                                    courseId ===
                                                    String(course.id);

                                                return (
                                                    <button
                                                        key={course.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setCourseId(
                                                                String(
                                                                    course.id,
                                                                ),
                                                            )
                                                        }
                                                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selected
                                                                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <p className="text-sm font-bold text-slate-950">
                                                            {getCourseName(
                                                                course,
                                                            )}
                                                        </p>

                                                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                            Curso #{course.id}
                                                        </p>
                                                    </button>
                                                );
                                            })}

                                            {filteredCourses.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                                    No se encontraron cursos.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700">
                                                Buscar usuario
                                            </label>

                                            <input
                                                value={userSearch}
                                                onChange={(event) =>
                                                    setUserSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Nombre, usuario o correo..."
                                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                            {filteredUsers.map((user) => {
                                                const selected =
                                                    studentId ===
                                                    String(user.id);

                                                return (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setStudentId(
                                                                String(user.id),
                                                            )
                                                        }
                                                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selected
                                                                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                                {user.firstname?.charAt(
                                                                    0,
                                                                )}
                                                                {user.lastname?.charAt(
                                                                    0,
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-bold text-slate-950">
                                                                    {getUserName(
                                                                        user,
                                                                    )}
                                                                </p>
                                                                <p className="truncate text-xs font-medium text-slate-500">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            {filteredUsers.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                                    No se encontraron usuarios.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm md:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                            Curso seleccionado
                                        </p>

                                        <p className="mt-1 font-bold text-slate-950">
                                            {courses.find(
                                                (course) =>
                                                    String(course.id) ===
                                                    courseId,
                                            )
                                                ? getCourseName(
                                                    courses.find(
                                                        (course) =>
                                                            String(
                                                                course.id,
                                                            ) === courseId,
                                                    ) as Course,
                                                )
                                                : "Ninguno"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                            Usuario seleccionado
                                        </p>

                                        <p className="mt-1 font-bold text-slate-950">
                                            {users.find(
                                                (user) =>
                                                    String(user.id) ===
                                                    studentId,
                                            )
                                                ? getUserName(
                                                    users.find(
                                                        (user) =>
                                                            String(
                                                                user.id,
                                                            ) === studentId,
                                                    ) as User,
                                                )
                                                : "Ninguno"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-6 py-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeEnrollmentModal}
                                    disabled={isSaving}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving || !courseId || !studentId}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? "Guardando..." : "Matricular"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {voucherModalUrl ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-5 py-4 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        Vista previa
                                    </p>

                                    <h3 className="mt-2 text-lg font-bold">
                                        {voucherModalTitle}
                                    </h3>

                                    <p className="mt-1 text-sm text-blue-50">
                                        Comprobante registrado en la matrícula
                                        del estudiante.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setVoucherModalUrl(null)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="h-[75vh] bg-slate-100 p-4">
                            {voucherModalUrl.toLowerCase().includes(".pdf") ? (
                                <iframe
                                    src={voucherModalUrl}
                                    title={voucherModalTitle}
                                    className="h-full w-full rounded-2xl border border-slate-200 bg-white"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <img
                                        src={voucherModalUrl}
                                        alt={voucherModalTitle}
                                        className="max-h-full max-w-full rounded-2xl object-contain shadow-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
                            <a
                                href={voucherModalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                Abrir en otra pestaña
                            </a>

                            <button
                                type="button"
                                onClick={() => setVoucherModalUrl(null)}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#172861] px-4 text-sm font-bold text-white transition hover:bg-[#0B163F]"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {rejectModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                        Revisión de matrícula
                                    </p>

                                    <h3 className="mt-2 text-xl font-bold">
                                        No aprobar matrícula
                                    </h3>

                                    <p className="mt-1 text-sm text-blue-50">
                                        Agrega el motivo por el cual esta
                                        matrícula no será aprobada.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeRejectModal}
                                    disabled={isSaving}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 p-6">
                            {error ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Estudiante:{" "}
                                <span className="font-bold">
                                    {selectedEnrollment
                                        ? getEnrollmentStudentName(
                                            selectedEnrollment,
                                        )
                                        : "Sin estudiante seleccionado"}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[13px] font-bold text-slate-700">
                                    Motivo
                                </label>

                                <textarea
                                    value={rejectReason}
                                    onChange={(event) =>
                                        setRejectReason(event.target.value)
                                    }
                                    rows={4}
                                    placeholder="Ej: Comprobante ilegible, datos incorrectos, pago no identificado..."
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeRejectModal}
                                    disabled={isSaving}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void handleNoApprove()}
                                    disabled={isSaving}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving
                                        ? "Guardando..."
                                        : "Confirmar no aprobación"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}