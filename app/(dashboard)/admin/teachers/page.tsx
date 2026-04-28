"use client";

import { useEffect, useMemo, useState } from "react";

type TeacherEnrollment = {
    id: number;
    accepted: boolean | null;
    reference_code: string | null;
    comment: string | null;
    voucher_url: string | null;
    user: {
        id: number;
        firstname: string;
        lastname: string;
        role_id: number;
    };
    course: {
        id: number;
        name: string;
    };
    role: {
        id: number;
        name: string;
    };
};

type Notice =
    | { type: "success"; text: string }
    | { type: "error"; text: string }
    | null;

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const TEACHERS_BY_ROLE_ENDPOINT = `${API_BASE_URL}/api/v1/enrollments/enrollments/by-role?role_id=3`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

function clearAuthSession() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function decodeJwtPayload(token: string): { exp?: number } | null {
    try {
        const payload = token.split(".")[1];

        if (!payload) return null;

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(
            normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
            "=",
        );

        return JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);

    if (!payload?.exp) return false;

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    return payload.exp <= currentTimeInSeconds;
}

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) return null;

    try {
        const parsed = JSON.parse(rawSession);

        const token =
            parsed?.accessToken ??
            parsed?.token ??
            parsed?.access_token ??
            parsed?.data?.accessToken ??
            parsed?.data?.token ??
            parsed?.data?.access_token ??
            parsed?.session?.accessToken ??
            parsed?.session?.token ??
            parsed?.session?.access_token;

        if (typeof token !== "string" || !token.trim()) {
            clearAuthSession();
            return null;
        }

        if (isTokenExpired(token)) {
            clearAuthSession();
            return null;
        }

        return token;
    } catch {
        if (rawSession.includes(".") && isTokenExpired(rawSession)) {
            clearAuthSession();
            return null;
        }

        return rawSession;
    }
}

function buildAuthHeaders(): HeadersInit {
    const token = getAuthToken();

    if (!token) {
        throw new Error("No se encontró un token válido. Inicia sesión nuevamente.");
    }

    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function parseTeacherErrorResponse(response: Response): Promise<never> {
    if (response.status === 401) {
        clearAuthSession();

        throw new Error("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
    }

    let rawText = "";

    try {
        rawText = await response.text();
    } catch {
        throw new Error("No se pudo leer la respuesta del servidor.");
    }

    if (!rawText) {
        throw new Error("Ocurrió un error al consultar los docentes.");
    }

    try {
        const parsed = JSON.parse(rawText) as
            | { detail?: string | Array<{ msg?: string }> }
            | undefined;

        if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
            throw new Error(
                parsed.detail.map((item) => item.msg).filter(Boolean).join(", ") ||
                "Error de validación al consultar docentes.",
            );
        }

        if (typeof parsed?.detail === "string") {
            throw new Error(parsed.detail);
        }

        throw new Error(rawText);
    } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error(rawText);
    }
}

async function getTeacherEnrollments(): Promise<TeacherEnrollment[]> {
    const response = await fetch(TEACHERS_BY_ROLE_ENDPOINT, {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
    });

    if (!response.ok) {
        await parseTeacherErrorResponse(response);
    }

    const data = (await response.json()) as TeacherEnrollment[];

    return Array.isArray(data) ? data : [];
}

function getTeacherName(item: TeacherEnrollment) {
    const fullName = `${item.user.firstname ?? ""} ${item.user.lastname ?? ""}`.trim();

    return fullName || `Usuario #${item.user.id}`;
}

export default function TeachersPage() {
    const [teacherEnrollments, setTeacherEnrollments] = useState<TeacherEnrollment[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 7;

    function showNotice(type: "success" | "error", text: string) {
        setNotice({ type, text });

        window.setTimeout(() => {
            setNotice((current) => (current?.text === text ? null : current));
        }, 2800);
    }

    async function loadTeachers(showSuccess = false) {
        try {
            setRefreshing(true);

            const data = await getTeacherEnrollments();

            setTeacherEnrollments(data);

            if (showSuccess) {
                showNotice("success", "Lista de docentes actualizada correctamente");
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los docentes";

            setTeacherEnrollments([]);
            showNotice("error", message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        let mounted = true;

        const timer = window.setTimeout(() => {
            const bootstrap = async () => {
                try {
                    const data = await getTeacherEnrollments();

                    if (!mounted) return;

                    setTeacherEnrollments(data);
                } catch (error) {
                    if (!mounted) return;

                    const message =
                        error instanceof Error
                            ? error.message
                            : "No se pudieron cargar los docentes";

                    setTeacherEnrollments([]);
                    showNotice("error", message);
                } finally {
                    if (!mounted) return;

                    setLoading(false);
                }
            };

            void bootstrap();
        }, 0);

        return () => {
            mounted = false;
            window.clearTimeout(timer);
        };
    }, []);

    const filteredTeachers = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return teacherEnrollments;

        return teacherEnrollments.filter((item) => {
            const teacherName = getTeacherName(item).toLowerCase();
            const courseName = item.course.name.toLowerCase();
            const roleName = item.role.name.toLowerCase();

            return (
                teacherName.includes(term) ||
                courseName.includes(term) ||
                roleName.includes(term) ||
                String(item.user.id).includes(term) ||
                String(item.course.id).includes(term) ||
                String(item.id).includes(term)
            );
        });
    }, [teacherEnrollments, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTeachers.length / itemsPerPage),
    );

    const effectivePage = Math.min(currentPage, totalPages);

    const paginatedTeachers = useMemo(() => {
        const start = (effectivePage - 1) * itemsPerPage;

        return filteredTeachers.slice(start, start + itemsPerPage);
    }, [filteredTeachers, effectivePage]);

    const uniqueTeachersCount = useMemo(() => {
        return new Set(teacherEnrollments.map((item) => item.user.id)).size;
    }, [teacherEnrollments]);

    const acceptedEnrollmentsCount = teacherEnrollments.filter(
        (item) => item.accepted === true,
    ).length;

    return (
        <section className="space-y-6 p-4 md:p-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-blue-700 via-blue-500 to-orange-500 px-5 py-6 md:px-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                                Gestión de docentes
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                                Docentes asignados
                            </h1>

                            <p className="mt-2 text-sm text-slate-100 md:text-base">
                                Lista de usuarios que tienen rol de profesor dentro de una matrícula.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-100">
                                    Registros
                                </p>
                                <p className="mt-1 text-2xl font-bold text-white">
                                    {teacherEnrollments.length}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-100">
                                    Docentes
                                </p>
                                <p className="mt-1 text-2xl font-bold text-blue-100">
                                    {uniqueTeachersCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-100">
                                    Aceptados
                                </p>
                                <p className="mt-1 text-2xl font-bold text-emerald-200">
                                    {acceptedEnrollmentsCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 md:px-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar por docente, curso, rol o ID"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 lg:w-96"
                        />

                        <button
                            type="button"
                            onClick={() => void loadTeachers(true)}
                            disabled={refreshing}
                            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {refreshing ? "Actualizando..." : "Actualizar lista"}
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
                    Cargando docentes...
                </div>
            ) : filteredTeachers.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                    <p className="text-base font-semibold text-slate-700">
                        No hay docentes para mostrar
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Los docentes aparecerán aquí cuando exista una matrícula con rol profesor.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="px-4 py-4 text-left font-semibold">
                                        Docente
                                    </th>
                                    <th className="px-4 py-4 text-left font-semibold">
                                        Curso asignado
                                    </th>
                                    <th className="px-4 py-4 text-center font-semibold">
                                        Rol matrícula
                                    </th>
                                    <th className="px-4 py-4 text-center font-semibold">
                                        Estado
                                    </th>
                                    <th className="px-4 py-4 text-left font-semibold">
                                        Comentario
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedTeachers.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-200 align-top transition hover:bg-slate-50/80"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="min-w-[220px]">
                                                <p className="font-semibold text-slate-900">
                                                    {getTeacherName(item)}
                                                </p>
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

                                        <td className="px-4 py-4 text-center">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accepted === true
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-amber-100 text-amber-700"
                                                    }`}
                                            >
                                                {item.accepted === true ? "Aceptado" : "Pendiente"}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-slate-600">
                                            {item.comment || "Sin comentario"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{" "}
                            <span className="font-semibold text-slate-700">
                                {paginatedTeachers.length}
                            </span>{" "}
                            de{" "}
                            <span className="font-semibold text-slate-700">
                                {filteredTeachers.length}
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
        </section>
    );
}