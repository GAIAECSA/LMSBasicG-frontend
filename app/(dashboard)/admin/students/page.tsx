"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
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

function getStudentName(item: Enrollment) {
    const fullName = `${item.user.firstname ?? ""} ${item.user.lastname ?? ""}`.trim();
    return fullName || `Usuario #${item.user.id}`;
}

function getStudentInitials(item: Enrollment) {
    const first = item.user.firstname?.charAt(0) ?? "";
    const last = item.user.lastname?.charAt(0) ?? "";
    const initials = `${first}${last}`.trim();

    return initials || "ES";
}

export default function StudentsPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [items, setItems] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);

    const [search, setSearch] = useState("");
    const [courseFilterId, setCourseFilterId] = useState(0);
    const [statusFilter, setStatusFilter] = useState<"all" | "accepted" | "pending">(
        "all",
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [voucherModalUrl, setVoucherModalUrl] = useState<string | null>(null);
    const [voucherModalTitle, setVoucherModalTitle] = useState("Comprobante");

    function showNotice(type: "success" | "error", text: string) {
        setNotice({ type, text });

        window.setTimeout(() => {
            setNotice((current) => (current?.text === text ? null : current));
        }, 2800);
    }

    async function loadStudents(showSuccess = false) {
        try {
            setRefreshing(true);

            const [coursesData, enrollmentsData] = await Promise.all([
                getAllCourses(),
                getEnrollmentsByRole(STUDENT_ROLE_ID),
            ]);

            setCourses(coursesData);
            setItems(enrollmentsData);
            setCurrentPage(1);

            if (showSuccess) {
                showNotice("success", "Lista de estudiantes actualizada correctamente");
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los estudiantes";

            setCourses([]);
            setItems([]);
            showNotice("error", message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const timer = window.setTimeout(() => {
            async function bootstrap() {
                try {
                    const [coursesData, enrollmentsData] = await Promise.all([
                        getAllCourses(),
                        getEnrollmentsByRole(STUDENT_ROLE_ID),
                    ]);

                    if (!isMounted) return;

                    setCourses(coursesData);
                    setItems(enrollmentsData);
                } catch (error) {
                    if (!isMounted) return;

                    const message =
                        error instanceof Error
                            ? error.message
                            : "No se pudieron cargar los estudiantes";

                    setCourses([]);
                    setItems([]);
                    showNotice("error", message);
                } finally {
                    if (!isMounted) return;
                    setLoading(false);
                }
            }

            void bootstrap();
        }, 0);

        return () => {
            isMounted = false;
            window.clearTimeout(timer);
        };
    }, []);

    const totalStudents = items.length;

    const uniqueStudentsCount = useMemo(() => {
        return new Set(items.map((item) => item.user.id)).size;
    }, [items]);

    const acceptedStudents = useMemo(() => {
        return items.filter((item) => item.accepted === true).length;
    }, [items]);

    const pendingStudents = useMemo(() => {
        return items.filter((item) => item.accepted !== true).length;
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

    const effectivePage = Math.min(currentPage, totalPages);

    const paginatedItems = useMemo(() => {
        const start = (effectivePage - 1) * ROWS_PER_PAGE;
        return filteredItems.slice(start, start + ROWS_PER_PAGE);
    }, [filteredItems, effectivePage]);

    const startItem =
        filteredItems.length === 0 ? 0 : (effectivePage - 1) * ROWS_PER_PAGE + 1;

    const endItem = Math.min(effectivePage * ROWS_PER_PAGE, filteredItems.length);

    return (
        <section className="space-y-6 p-4 md:p-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-blue-700 via-blue-500 to-orange-500 px-5 py-6 md:px-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                                Gestión de estudiantes
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                                Estudiantes matriculados
                            </h1>

                            <p className="mt-2 text-sm text-slate-100 md:text-base">
                                Lista general de estudiantes registrados en matrículas con rol estudiante.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-100">
                                    Registros
                                </p>
                                <p className="mt-1 text-2xl font-bold text-white">
                                    {totalStudents}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-100">
                                    Estudiantes
                                </p>
                                <p className="mt-1 text-2xl font-bold text-blue-100">
                                    {uniqueStudentsCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-100">
                                    Aprobados
                                </p>
                                <p className="mt-1 text-2xl font-bold text-emerald-200">
                                    {acceptedStudents}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-100">
                                    Pendientes
                                </p>
                                <p className="mt-1 text-2xl font-bold text-amber-200">
                                    {pendingStudents}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 md:px-6">
                    <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_220px_auto] xl:items-center">
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar por estudiante, curso, código, comentario o ID"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />

                        <select
                            value={courseFilterId}
                            onChange={(event) => {
                                setCourseFilterId(Number(event.target.value));
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
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
                                setStatusFilter(
                                    event.target.value as "all" | "accepted" | "pending",
                                );
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="accepted">Aprobados</option>
                            <option value="pending">Pendientes</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => void loadStudents(true)}
                            disabled={refreshing}
                            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {refreshing ? "Actualizando..." : "Actualizar"}
                        </button>
                    </div>
                </div>
            </div>

            {notice ? (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium ${notice.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    {notice.text}
                </div>
            ) : null}

            {loading ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    Cargando estudiantes...
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                    <p className="text-base font-semibold text-slate-700">
                        No hay estudiantes para mostrar
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        No se encontraron matrículas con rol estudiante para los filtros seleccionados.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="px-4 py-4 text-left font-semibold">
                                        Estudiante
                                    </th>
                                    <th className="px-4 py-4 text-left font-semibold">
                                        Curso
                                    </th>
                                    <th className="px-4 py-4 text-center font-semibold">
                                        Rol matrícula
                                    </th>
                                    <th className="px-4 py-4 text-left font-semibold">
                                        Código
                                    </th>
                                    <th className="px-4 py-4 text-center font-semibold">
                                        Estado
                                    </th>
                                    <th className="px-4 py-4 text-center font-semibold">
                                        Comprobante
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedItems.map((item) => {
                                    const voucherUrl = resolveEnrollmentVoucherUrl(
                                        item.voucher_url,
                                    );

                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-t border-slate-200 align-top transition hover:bg-slate-50/80"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex min-w-[230px] items-center gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black uppercase text-blue-700 ring-1 ring-blue-100">
                                                        {getStudentInitials(item)}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {getStudentName(item)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="min-w-[260px]">
                                                    <p className="font-medium text-slate-800">
                                                        {item.course.name}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                    {item.role.name}
                                                </span>
                                            </td>


                                            <td className="px-4 py-4">
                                                <span className="font-medium text-slate-700">
                                                    {item.reference_code || "Sin código"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accepted === true
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {item.accepted === true ? "Aprobado" : "Pendiente"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                {voucherUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVoucherModalUrl(voucherUrl);
                                                            setVoucherModalTitle(
                                                                `Comprobante - ${getStudentName(item)}`,
                                                            );
                                                        }}
                                                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Ver comprobante
                                                    </button>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        Sin comprobante
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{" "}
                            <span className="font-semibold text-slate-700">
                                {startItem}
                            </span>{" "}
                            a{" "}
                            <span className="font-semibold text-slate-700">
                                {endItem}
                            </span>{" "}
                            de{" "}
                            <span className="font-semibold text-slate-700">
                                {filteredItems.length}
                            </span>{" "}
                            registros
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) => Math.max(1, page - 1))
                                }
                                disabled={effectivePage === 1}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                                Página {effectivePage} de {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1),
                                    )
                                }
                                disabled={effectivePage === totalPages}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {voucherModalUrl ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    onClick={() => setVoucherModalUrl(null)}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-5 py-4 text-white">
                            <div>
                                <h3 className="text-lg font-bold">
                                    {voucherModalTitle}
                                </h3>
                                <p className="mt-1 text-sm text-slate-200">
                                    Vista previa del comprobante registrado.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setVoucherModalUrl(null)}
                                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                            >
                                Cerrar
                            </button>
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
                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
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