"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Clock3,
    FileText,
    GraduationCap,
    RefreshCcw,
    Sparkles,
    XCircle,
} from "lucide-react";
import { getAllCourses } from "@/services/courses.service";
import {
    Enrollment,
    getEnrollmentsByUser,
    resolveEnrollmentVoucherUrl,
    updateEnrollment,
} from "@/services/enrollments.service";
import { getAuthSession } from "@/lib/auth";

type RawCourse = {
    id?: number | string;
    image_url?: string | null;
    image?: string | null;
    thumbnail?: string | null;
};

type EnrollmentStatus = boolean | null;

type SessionUserWithRole = {
    id?: number | string;
    role?: string;
    role_id?: number | string;
    roleId?: number | string;
};

function getSessionRoleId(user?: SessionUserWithRole): number | null {
    const numericRoleId = Number(user?.role_id ?? user?.roleId);

    if (numericRoleId > 0 && !Number.isNaN(numericRoleId)) {
        return numericRoleId;
    }

    if (user?.role === "admin") return 1;
    if (user?.role === "teacher") return 3;
    if (user?.role === "student") return 4;

    return null;
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

function resolveCourseImageUrl(value?: string | null): string | null {
    if (!value || value.trim().length === 0) return null;

    const trimmed = value.trim();

    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function getEnrollmentStatus(enrollment: Enrollment): EnrollmentStatus {
    return enrollment.accepted as EnrollmentStatus;
}

function getStatusLabel(status: EnrollmentStatus) {
    if (status === true) return "Aprobado";
    if (status === false) return "No aprobado";
    return "En revisión";
}

function getStatusStyles(status: EnrollmentStatus) {
    if (status === true) {
        return {
            border: "border-emerald-200",
            bar: "bg-gradient-to-r from-emerald-400 to-green-600",
            badge: "bg-emerald-100 text-emerald-700",
            iconBox: "bg-emerald-50 text-emerald-700",
            text: "text-emerald-700",
            icon: CheckCircle2,
        };
    }

    if (status === false) {
        return {
            border: "border-red-200",
            bar: "bg-gradient-to-r from-red-400 to-rose-600",
            badge: "bg-red-100 text-red-700",
            iconBox: "bg-red-50 text-red-700",
            text: "text-red-700",
            icon: XCircle,
        };
    }

    return {
        border: "border-amber-200",
        bar: "bg-gradient-to-r from-amber-400 to-orange-500",
        badge: "bg-amber-100 text-amber-700",
        iconBox: "bg-amber-50 text-amber-700",
        text: "text-amber-700",
        icon: Clock3,
    };
}

export default function StudentCoursesPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
    const [courseImages, setCourseImages] = useState<Record<number, string | null>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [editReferenceCode, setEditReferenceCode] = useState("");
    const [editVoucherFile, setEditVoucherFile] = useState<File | null>(null);
    const [updating, setUpdating] = useState(false);

    const [statusFilter, setStatusFilter] = useState<
        "all" | "review" | "approved" | "rejected"
    >("all");

    const loadEnrollments = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const session = getAuthSession();
            const sessionUser = session?.user as SessionUserWithRole | undefined;

            const userId = Number(sessionUser?.id);
            const sessionRoleId = getSessionRoleId(sessionUser);

            if (!userId || Number.isNaN(userId)) {
                throw new Error("No se pudo identificar al usuario autenticado.");
            }

            const [enrollmentsResponse, coursesResponse] = await Promise.all([
                getEnrollmentsByUser(userId),
                getAllCourses(),
            ]);

            const validEnrollments = Array.isArray(enrollmentsResponse)
                ? enrollmentsResponse
                : [];

            const hasTeacherEnrollment = validEnrollments.some(
                (item) => Number(item.role?.id) === 3,
            );

            const hasStudentEnrollment = validEnrollments.some(
                (item) => Number(item.role?.id) === 4,
            );

            const detectedRoleId = hasTeacherEnrollment
                ? 3
                : hasStudentEnrollment
                    ? 4
                    : sessionRoleId;

            setCurrentRoleId(detectedRoleId);

            const courses = Array.isArray(coursesResponse)
                ? (coursesResponse as RawCourse[])
                : [];

            const imagesByCourseId = courses.reduce<Record<number, string | null>>(
                (acc, course) => {
                    const courseId = Number(course.id ?? 0);

                    if (courseId > 0) {
                        acc[courseId] = resolveCourseImageUrl(
                            course.image_url ?? course.image ?? course.thumbnail ?? null,
                        );
                    }

                    return acc;
                },
                {},
            );

            setEnrollments(validEnrollments);
            setCourseImages(imagesByCourseId);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar tus cursos.",
            );
        } finally {
            setLoading(false);
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

    const reviewEnrollments = useMemo(
        () => enrollments.filter((item) => getEnrollmentStatus(item) === null),
        [enrollments],
    );

    const rejectedEnrollments = useMemo(
        () => enrollments.filter((item) => getEnrollmentStatus(item) === false),
        [enrollments],
    );

    const approvedEnrollments = useMemo(
        () => enrollments.filter((item) => getEnrollmentStatus(item) === true),
        [enrollments],
    );

    const filteredEnrollments = useMemo(() => {
        if (statusFilter === "review") {
            return enrollments.filter((item) => getEnrollmentStatus(item) === null);
        }

        if (statusFilter === "approved") {
            return enrollments.filter((item) => getEnrollmentStatus(item) === true);
        }

        if (statusFilter === "rejected") {
            return enrollments.filter((item) => getEnrollmentStatus(item) === false);
        }

        return enrollments;
    }, [enrollments, statusFilter]);

    const currentStatus =
        reviewEnrollments.length > 0
            ? "En revisión"
            : rejectedEnrollments.length > 0
                ? "No aprobado"
                : approvedEnrollments.length > 0
                    ? "Aprobado"
                    : "Sin matrículas";

    const isTeacher = currentRoleId === 3;

    const areaLabel = isTeacher ? "Área del profesor" : "Área del estudiante";
    const pageTitle = isTeacher ? "Mis cursos asignados" : "Mis cursos";
    const pageDescription = isTeacher
        ? "Revisa los cursos asignados a tu perfil de profesor."
        : "Revisa tus cursos aprobados, solicitudes en revisión y matrículas no aprobadas.";

    const emptyTitle = isTeacher
        ? "Todavía no tienes cursos asignados"
        : "Todavía no tienes cursos matriculados";

    const emptyDescription = isTeacher
        ? "Cuando el administrador te asigne un curso como profesor, aparecerá aquí."
        : "Cuando registres una matrícula, aparecerá aquí con su estado.";

    const catalogHref = isTeacher ? "/teacher" : "/student";

    function openEditModal(enrollment: Enrollment) {
        setSelectedEnrollment(enrollment);
        setEditReferenceCode(enrollment.reference_code || "");
        setEditVoucherFile(null);
        setEditModalOpen(true);
    }

    function closeEditModal() {
        setEditModalOpen(false);
        setSelectedEnrollment(null);
        setEditReferenceCode("");
        setEditVoucherFile(null);
    }

    async function handleUpdateVoucher(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedEnrollment) return;

        if (!editVoucherFile) {
            setError("Debes subir un nuevo comprobante.");
            return;
        }

        try {
            setUpdating(true);
            setError("");

            const updated = await updateEnrollment(selectedEnrollment.id, {
                accepted: null,
                reference_code:
                    editReferenceCode.trim() || selectedEnrollment.reference_code,
                comment: null,
                user_id: selectedEnrollment.user.id,
                course_id: selectedEnrollment.course.id,
                role_id: selectedEnrollment.role.id,
                image: editVoucherFile,
            });

            setEnrollments((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );

            closeEditModal();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo actualizar el comprobante.",
            );
        } finally {
            setUpdating(false);
        }
    }

    function renderCourseCard(enrollment: Enrollment) {
        const status = getEnrollmentStatus(enrollment);
        const styles = getStatusStyles(status);
        const StatusIcon = styles.icon;
        const voucherUrl = resolveEnrollmentVoucherUrl(enrollment.voucher_url);
        const courseId = Number(enrollment.course?.id ?? 0);
        const courseImageUrl = courseImages[courseId] ?? null;
        const enrollmentRoleId = Number(enrollment.role?.id ?? 0);
        const isTeacherEnrollment = enrollmentRoleId === 3;

        return (
            <article
                key={enrollment.id}
                className={`overflow-hidden rounded-[26px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${styles.border}`}
            >
                <div className={`h-2 ${styles.bar}`} />

                <div className="relative h-44 w-full bg-slate-100">
                    {courseImageUrl ? (
                        <Image
                            src={courseImageUrl}
                            alt={enrollment.course?.name || "Imagen del curso"}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-semibold text-slate-500">
                            Sin imagen del curso
                        </div>
                    )}
                </div>

                <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${styles.badge}`}
                        >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {getStatusLabel(status)}
                        </span>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase text-blue-700">
                            {enrollment.role?.name || "Rol"}
                        </span>
                    </div>

                    <h3 className="mt-4 line-clamp-2 text-lg font-extrabold leading-6 text-slate-950">
                        {enrollment.course?.name || "Curso sin nombre"}
                    </h3>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">Código</span>
                                <span className="max-w-[58%] truncate text-right font-bold text-slate-900">
                                    {enrollment.reference_code || "Sin referencia"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">Comprobante</span>

                                {voucherUrl ? (
                                    <a
                                        href={voucherUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Ver archivo
                                    </a>
                                ) : (
                                    <span className="font-semibold text-slate-700">
                                        Sin archivo
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {enrollment.accepted === false && enrollment.comment ? (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            <span className="font-bold">Motivo:</span>{" "}
                            {enrollment.comment}
                        </div>
                    ) : null}

                    {status === true ? (
                        <Link
                            href={
                                isTeacherEnrollment
                                    ? `/teacher/courses/${enrollment.course.id}`
                                    : `/student/courses/${enrollment.course.id}`
                            }
                            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(16,185,129,0.24)] transition hover:bg-emerald-700"
                        >
                            {isTeacherEnrollment ? "Gestionar curso" : "Ingresar al curso"}
                        </Link>
                    ) : status === false ? (
                        isTeacherEnrollment ? (
                            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-700">
                                Esta asignación todavía no está aprobada.
                            </p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <button
                                    type="button"
                                    onClick={() => openEditModal(enrollment)}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.22)] transition hover:bg-red-700"
                                >
                                    Corregir comprobante
                                </button>
                            </div>
                        )
                    ) : (
                        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-700">
                            {isTeacherEnrollment
                                ? "La asignación está en revisión. El curso se habilitará cuando el administrador apruebe la solicitud."
                                : "Tu matrícula fue enviada correctamente. El acceso al curso se habilitará cuando el administrador apruebe la solicitud."}
                        </p>
                    )}
                </div>
            </article>
        );
    }

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-8 md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                                <Sparkles className="h-3.5 w-3.5" />
                                {areaLabel}
                            </div>

                            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                                {pageTitle}
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
                                {pageDescription}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:min-w-[480px]">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-blue-100">
                                    <Clock3 className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                        Revisión
                                    </span>
                                </div>
                                <p className="mt-2 text-2xl font-extrabold text-white">
                                    {reviewEnrollments.length}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-blue-100">
                                    <GraduationCap className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                        Aprobados
                                    </span>
                                </div>
                                <p className="mt-2 text-2xl font-extrabold text-white">
                                    {approvedEnrollments.length}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-blue-100">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                        No aprob.
                                    </span>
                                </div>
                                <p className="mt-2 text-2xl font-extrabold text-white">
                                    {rejectedEnrollments.length}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-blue-100">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                        Estado
                                    </span>
                                </div>
                                <p className="mt-2 text-base font-extrabold text-white">
                                    {currentStatus}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 p-6 md:p-8">
                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                            Cargando tus cursos...
                        </div>
                    ) : null}

                    {!loading && !error && enrollments.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                <AlertCircle className="h-6 w-6" />
                            </div>

                            <h3 className="mt-4 text-lg font-extrabold text-slate-950">
                                {emptyTitle}
                            </h3>

                            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                {emptyDescription}
                            </p>

                            <div className="mt-5">
                                <Link
                                    href={catalogHref}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,99,216,0.25)] transition hover:brightness-105"
                                >
                                    {isTeacher ? "Ir al panel" : "Ver catálogo"}
                                </Link>
                            </div>
                        </div>
                    ) : null}

                    {!loading && !error && enrollments.length > 0 ? (
                        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-extrabold text-slate-900">
                                    Filtrar matrículas
                                </p>
                                <p className="text-xs text-slate-500">
                                    Selecciona el estado que deseas visualizar.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value as
                                            | "all"
                                            | "review"
                                            | "approved"
                                            | "rejected",
                                        )
                                    }
                                    className="h-11 min-w-[190px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="all">Todos</option>
                                    <option value="review">En revisión</option>
                                    <option value="approved">Aprobados</option>
                                    <option value="rejected">No aprobados</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={loadEnrollments}
                                    disabled={loading}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {!loading && !error && enrollments.length > 0 ? (
                        <div>
                            <div className="mb-4 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-700" />
                                <h3 className="text-lg font-extrabold text-slate-950">
                                    {isTeacher ? "Cursos asignados" : "Mis matrículas"}
                                </h3>
                            </div>

                            {filteredEnrollments.length > 0 ? (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                    {filteredEnrollments.map(renderCourseCard)}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                    <p className="text-sm font-bold text-slate-700">
                                        No hay matrículas con este estado.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            {editModalOpen && selectedEnrollment ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h3 className="text-xl font-black text-slate-950">
                                    Corregir comprobante
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Sube un nuevo comprobante para que tu matrícula vuelva a revisión.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 transition hover:bg-slate-200"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdateVoucher} className="space-y-5 p-6">
                            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <p className="font-bold">Motivo de no aprobación:</p>
                                <p className="mt-1">
                                    {selectedEnrollment.comment || "No se registró un motivo."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                <p>
                                    <span className="font-bold">Curso:</span>{" "}
                                    {selectedEnrollment.course.name}
                                </p>
                                <p className="mt-1">
                                    <span className="font-bold">Estado actual:</span> No aprobado
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[13px] font-bold text-slate-700">
                                    Código de referencia
                                </label>

                                <input
                                    value={editReferenceCode}
                                    onChange={(event) => setEditReferenceCode(event.target.value)}
                                    placeholder="Ej: TRANSF-001"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[13px] font-bold text-slate-700">
                                    Nuevo comprobante
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(event) =>
                                        setEditVoucherFile(event.target.files?.[0] ?? null)
                                    }
                                    className="block h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm text-slate-600 file:mr-4 file:h-full file:border-0 file:bg-slate-100 file:px-4 file:text-sm file:font-bold file:text-slate-700"
                                />
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {updating ? "Actualizando..." : "Enviar a revisión"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    );
}