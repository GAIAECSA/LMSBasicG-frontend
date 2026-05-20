"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getEnrollmentsByRole,
    resolveEnrollmentVoucherUrl,
    type Enrollment,
} from "@/services/enrollments.service";
import { getAllCourses, type Course } from "@/services/courses.service";

const STUDENT_ROLE_ID = 4;
const ROWS_PER_PAGE = 7;

type Notice =
    | { type: "success"; text: string }
    | { type: "error"; text: string }
    | null;

type StatusFilter = "all" | "accepted" | "pending";

function getStudentName(item: Enrollment) {
    const fullName = `${item.user.firstname ?? ""} ${item.user.lastname ?? ""
        }`.trim();

    return fullName || `Usuario #${item.user.id}`;
}

function getStudentInitials(item: Enrollment) {
    const first = item.user.firstname?.charAt(0) ?? "";
    const last = item.user.lastname?.charAt(0) ?? "";
    const initials = `${first}${last}`.trim();

    return initials || "ES";
}

function getStatusBadgeClass(accepted: boolean | null) {
    if (accepted === true) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-orange-100 text-orange-700";
}

export default function StudentsPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [items, setItems] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);

    const [search, setSearch] = useState("");
    const [courseFilterId, setCourseFilterId] = useState(0);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [currentPage, setCurrentPage] = useState(1);
    const [voucherModalUrl, setVoucherModalUrl] = useState<string | null>(null);
    const [voucherModalTitle, setVoucherModalTitle] = useState("Comprobante");

    const showNotice = useCallback((type: "success" | "error", text: string) => {
        setNotice({ type, text });

        window.setTimeout(() => {
            setNotice((current) => (current?.text === text ? null : current));
        }, 2800);
    }, []);

    const loadStudents = useCallback(
        async (showSuccess = false) => {
            try {
                if (showSuccess) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                const [coursesData, enrollmentsData] = await Promise.all([
                    getAllCourses(),
                    getEnrollmentsByRole(STUDENT_ROLE_ID),
                ]);

                setCourses(Array.isArray(coursesData) ? coursesData : []);
                setItems(
                    Array.isArray(enrollmentsData) ? enrollmentsData : [],
                );
                setCurrentPage(1);

                if (showSuccess) {
                    showNotice(
                        "success",
                        "Lista de estudiantes actualizada correctamente.",
                    );
                }
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "No se pudieron cargar los estudiantes.";

                setCourses([]);
                setItems([]);
                showNotice("error", message);
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [showNotice],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadStudents();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadStudents]);

    const stats = useMemo(() => {
        const uniqueStudents = new Set(items.map((item) => item.user.id)).size;

        const acceptedStudents = items.filter(
            (item) => item.accepted === true,
        ).length;

        const pendingStudents = items.filter(
            (item) => item.accepted !== true,
        ).length;

        return {
            total: items.length,
            uniqueStudents,
            acceptedStudents,
            pendingStudents,
        };
    }, [items]);

    const filteredItems = useMemo(() => {
        const term = search.trim().toLowerCase();

        return items.filter((item) => {
            const studentName = getStudentName(item).toLowerCase();
            const courseName = item.course.name.toLowerCase();
            const roleName = item.role.name.toLowerCase();
            const referenceCode = item.reference_code?.toLowerCase() ?? "";
            const comment = item.comment?.toLowerCase() ?? "";

            const matchesSearch =
                !term ||
                studentName.includes(term) ||
                courseName.includes(term) ||
                roleName.includes(term) ||
                referenceCode.includes(term) ||
                comment.includes(term) ||
                String(item.id).includes(term) ||
                String(item.user.id).includes(term) ||
                String(item.course.id).includes(term);

            const matchesCourse =
                courseFilterId === 0 || item.course.id === courseFilterId;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "accepted" && item.accepted === true) ||
                (statusFilter === "pending" && item.accepted !== true);

            return matchesSearch && matchesCourse && matchesStatus;
        });
    }, [items, search, courseFilterId, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / ROWS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedItems = useMemo(() => {
        const startIndex = (activePage - 1) * ROWS_PER_PAGE;

        return filteredItems.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [filteredItems, activePage]);

    const startItem =
        filteredItems.length === 0 ? 0 : (activePage - 1) * ROWS_PER_PAGE + 1;

    const endItem = Math.min(activePage * ROWS_PER_PAGE, filteredItems.length);

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                            Gestión de estudiantes
                        </p>

                        <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                            Estudiantes matriculados
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                            Consulta las matrículas con rol de estudiante,
                            revisa el curso asociado, verifica el estado de la
                            solicitud y visualiza los comprobantes registrados.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[620px]">
                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Registros
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.total}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Estudiantes
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.uniqueStudents}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Aprobados
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.acceptedStudents}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Pendientes
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.pendingStudents}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {notice ? (
                <div
                    className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${notice.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    {notice.text}
                </div>
            ) : null}

            <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-950">
                            Lista de estudiantes
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            Busca por estudiante, curso, código, comentario, rol
                            o identificadores.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadStudents(true)}
                        disabled={isRefreshing}
                        className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-[1.2fr_1fr_220px]">
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar por estudiante, curso, código, comentario o ID"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <select
                        value={courseFilterId}
                        onChange={(event) => {
                            setCourseFilterId(Number(event.target.value));
                            setCurrentPage(1);
                        }}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option value={0}>Todos los cursos</option>

                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value as StatusFilter);
                            setCurrentPage(1);
                        }}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="accepted">Aprobados</option>
                        <option value="pending">Pendientes</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Estudiante
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Curso
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Rol matrícula
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Código
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Estado
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Comprobante
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
                                        Cargando estudiantes...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center"
                                    >
                                        <p className="text-sm font-bold text-slate-800">
                                            No hay estudiantes para mostrar.
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            No se encontraron matrículas con rol
                                            estudiante para los filtros
                                            seleccionados.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => {
                                    const voucherUrl =
                                        resolveEnrollmentVoucherUrl(
                                            item.voucher_url,
                                        );

                                    return (
                                        <tr
                                            key={item.id}
                                            className="align-top transition hover:bg-blue-50/40"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex min-w-[230px] items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold uppercase text-white">
                                                        {getStudentInitials(
                                                            item,
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-bold text-slate-950">
                                                            {getStudentName(
                                                                item,
                                                            )}
                                                        </p>
                                                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                            Usuario #
                                                            {item.user.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="min-w-[260px]">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {item.course.name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                        Curso #{item.course.id}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                    {item.role.name}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {item.reference_code ||
                                                        "Sin código"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                                                        item.accepted,
                                                    )}`}
                                                >
                                                    {item.accepted === true
                                                        ? "Aprobado"
                                                        : "Pendiente"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                {voucherUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVoucherModalUrl(
                                                                voucherUrl,
                                                            );
                                                            setVoucherModalTitle(
                                                                `Comprobante - ${getStudentName(
                                                                    item,
                                                                )}`,
                                                            );
                                                        }}
                                                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Ver comprobante
                                                    </button>
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-400">
                                                        Sin comprobante
                                                    </span>
                                                )}
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
                        Mostrando {startItem} a {endItem} de{" "}
                        {filteredItems.length} registros
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

            {voucherModalUrl ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    onClick={() => setVoucherModalUrl(null)}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
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
                                    className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="h-[72vh] bg-slate-100 p-4">
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
                                className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                Abrir en otra pestaña
                            </a>

                            <button
                                type="button"
                                onClick={() => setVoucherModalUrl(null)}
                                className="rounded-xl bg-[#172861] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0B163F]"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}