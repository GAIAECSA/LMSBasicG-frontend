"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    LoaderCircle,
    RefreshCw,
    X,
} from "lucide-react";
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

    const openVoucherModal = (item: Enrollment, voucherUrl: string) => {
        setVoucherModalUrl(voucherUrl);
        setVoucherModalTitle(`Comprobante - ${getStudentName(item)}`);
    };

    return (
        <section className="min-w-0 space-y-4 sm:space-y-5 [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled)]:select-none [&_button:not(:disabled)]:transition-all [&_button:not(:disabled)]:duration-150 [&_button:not(:disabled)]:ease-out [&_button:not(:disabled):active]:translate-y-px [&_button:not(:disabled):active]:scale-[0.97] [&_button:not(:disabled):active]:brightness-95 [&_button:not(:disabled):active]:shadow-inner">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.22em] lg:text-sm">
                            Gestión de estudiantes
                        </p>

                        <h2 className="mt-2 text-xl font-bold sm:text-2xl md:text-3xl [@media(max-height:760px)]:text-xl">
                            Estudiantes matriculados
                        </h2>

                        <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                            Consulta las matrículas con rol de estudiante,
                            revisa el curso asociado, verifica el estado de la
                            solicitud y visualiza los comprobantes registrados.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 xl:min-w-[570px]">
                        <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                Registros
                            </p>
                            <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                                {isLoading ? "..." : stats.total}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                Estudiantes
                            </p>
                            <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                                {isLoading ? "..." : stats.uniqueStudents}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                Aprobados
                            </p>
                            <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                                {isLoading ? "..." : stats.acceptedStudents}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                Pendientes
                            </p>
                            <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                                {isLoading ? "..." : stats.pendingStudents}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {notice ? (
                <div
                    className={`rounded-xl border px-3 py-3 text-xs font-semibold leading-5 sm:rounded-2xl sm:px-4 sm:text-sm ${notice.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    {notice.text}
                </div>
            ) : null}

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                            Lista de estudiantes
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                            Busca por estudiante, curso, código, comentario, rol
                            o identificadores.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadStudents(true)}
                        disabled={isRefreshing}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-sm"
                    >
                        {isRefreshing ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(190px,0.9fr)_180px] [@media(max-height:760px)]:mt-3">
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar por estudiante, curso, código, comentario o ID"
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm md:col-span-2 lg:col-span-1"
                    />

                    <select
                        value={courseFilterId}
                        onChange={(event) => {
                            setCourseFilterId(Number(event.target.value));
                            setCurrentPage(1);
                        }}
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm"
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
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="accepted">Aprobados</option>
                        <option value="pending">Pendientes</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                {/* Tarjetas únicamente para celulares muy estrechos */}
                <div className="divide-y divide-slate-100 md:hidden">
                    {isLoading ? (
                        <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                            Cargando estudiantes...
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                            <p className="text-sm font-bold text-slate-800">
                                No hay estudiantes para mostrar.
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                No se encontraron matrículas con rol estudiante
                                para los filtros seleccionados.
                            </p>
                        </div>
                    ) : (
                        paginatedItems.map((item) => {
                            const voucherUrl = resolveEnrollmentVoucherUrl(
                                item.voucher_url,
                            );

                            return (
                                <article
                                    key={item.id}
                                    className="space-y-3 p-4 transition hover:bg-blue-50/30"
                                >
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-xs font-bold uppercase text-white">
                                                {getStudentInitials(item)}
                                            </div>

                                            <div className="min-w-0">
                                                <p
                                                    className="truncate text-sm font-bold text-slate-950"
                                                    title={getStudentName(item)}
                                                >
                                                    {getStudentName(item)}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusBadgeClass(
                                                item.accepted,
                                            )}`}
                                        >
                                            {item.accepted === true
                                                ? "Aprobado"
                                                : "Pendiente"}
                                        </span>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Curso
                                        </p>
                                        <p
                                            className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800"
                                            title={item.course.name}
                                        >
                                            {item.course.name}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Rol
                                            </p>
                                            <p className="mt-1 truncate text-xs font-bold text-blue-700">
                                                {item.role.name}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Código
                                            </p>
                                            <p
                                                className="mt-1 truncate text-xs font-semibold text-slate-700"
                                                title={item.reference_code || "Sin código"}
                                            >
                                                {item.reference_code || "Sin código"}
                                            </p>
                                        </div>
                                    </div>

                                    {voucherUrl ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openVoucherModal(item, voucherUrl)
                                            }
                                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Ver comprobante
                                        </button>
                                    ) : (
                                        <div className="flex h-10 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-400">
                                            Sin comprobante
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                </div>

                {/* Tabla desde tablet y escritorio. En laptops evita tarjetas con espacios vacíos. */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[820px] table-fixed divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="w-[25%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600 lg:px-4">
                                    Estudiante
                                </th>

                                <th className="w-[28%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600 lg:px-4">
                                    Curso
                                </th>

                                <th className="w-[18%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600 lg:px-4">
                                    Código
                                </th>

                                <th className="w-[13%] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-600 lg:px-4">
                                    Estado
                                </th>

                                <th className="w-[16%] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-600 lg:px-4">
                                    Comprobante
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center text-sm font-semibold text-slate-500"
                                    >
                                        Cargando estudiantes...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center"
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
                                            className="align-middle transition hover:bg-blue-50/40"
                                        >
                                            <td className="px-3 py-2.5 lg:px-4">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-xs font-bold uppercase text-white">
                                                        {getStudentInitials(item)}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p
                                                            className="truncate text-xs font-bold text-slate-950 lg:text-sm"
                                                            title={getStudentName(item)}
                                                        >
                                                            {getStudentName(item)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5 lg:px-4">
                                                <div className="min-w-0">
                                                    <p
                                                        className="line-clamp-2 text-xs font-semibold leading-5 text-slate-800 lg:text-sm"
                                                        title={item.course.name}
                                                    >
                                                        {item.course.name}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5 lg:px-4">
                                                <p
                                                    className="truncate text-xs font-semibold text-slate-700 lg:text-sm"
                                                    title={item.reference_code || "Sin código"}
                                                >
                                                    {item.reference_code || "Sin código"}
                                                </p>
                                            </td>

                                            <td className="px-3 py-2.5 text-center lg:px-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold lg:text-xs ${getStatusBadgeClass(
                                                        item.accepted,
                                                    )}`}
                                                >
                                                    {item.accepted === true
                                                        ? "Aprobado"
                                                        : "Pendiente"}
                                                </span>
                                            </td>

                                            <td className="px-3 py-2.5 text-center lg:px-4">
                                                {voucherUrl ? (
                                                    <button
                                                        type="button"
                                                        title="Ver comprobante"
                                                        aria-label={`Ver comprobante de ${getStudentName(
                                                            item,
                                                        )}`}
                                                        onClick={() =>
                                                            openVoucherModal(
                                                                item,
                                                                voucherUrl,
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 lg:px-3 lg:text-xs"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" />
                                                        <span className="hidden lg:inline">
                                                            Ver
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-400">
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

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-center text-xs font-semibold text-slate-500 sm:text-sm lg:text-left">
                        Mostrando {startItem} a {endItem} de {filteredItems.length}{" "}
                        registros
                    </p>

                    <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 sm:flex sm:justify-center">
                        <button
                            type="button"
                            aria-label="Página anterior"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.max(1, page - 1),
                                )
                            }
                            disabled={activePage === 1}
                            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Anterior</span>
                        </button>

                        <span className="flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3 text-center text-xs font-bold text-slate-700 sm:text-sm">
                            Página {activePage} de {totalPages}
                        </span>

                        <button
                            type="button"
                            aria-label="Página siguiente"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1),
                                )
                            }
                            disabled={activePage === totalPages}
                            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
                        >
                            <span className="hidden sm:inline">Siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {voucherModalUrl ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={() => setVoucherModalUrl(null)}
                >
                    <div
                        className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5">
                            <div className="flex items-start justify-between gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                        Vista previa
                                    </p>

                                    <h3
                                        className="mt-2 truncate text-base font-bold sm:text-lg"
                                        title={voucherModalTitle}
                                    >
                                        {voucherModalTitle}
                                    </h3>

                                    <p className="mt-1 hidden text-sm text-blue-50 sm:block">
                                        Comprobante registrado en la matrícula
                                        del estudiante.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Cerrar comprobante"
                                    onClick={() => setVoucherModalUrl(null)}
                                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-3 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 sm:px-4"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Cerrar
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 bg-slate-100 p-2 sm:p-4">
                            {voucherModalUrl.toLowerCase().includes(".pdf") ? (
                                <iframe
                                    src={voucherModalUrl}
                                    title={voucherModalTitle}
                                    className="h-full w-full rounded-xl border border-slate-200 bg-white sm:rounded-2xl"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <img
                                        src={voucherModalUrl}
                                        alt={voucherModalTitle}
                                        className="max-h-full max-w-full rounded-xl object-contain shadow-sm sm:rounded-2xl"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-5 sm:py-4">
                            <a
                                href={voucherModalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Abrir en otra pestaña
                            </a>

                            <button
                                type="button"
                                onClick={() => setVoucherModalUrl(null)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-sm font-bold text-white hover:bg-[#0B163F]"
                            >
                                <X className="h-4 w-4" />
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
