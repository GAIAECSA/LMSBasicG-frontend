"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
const ITEMS_PER_PAGE = 7;

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
    const fullName = `${item.user.firstname ?? ""} ${item.user.lastname ?? ""
        }`.trim();

    return fullName || `Usuario #${item.user.id}`;
}

function getAcceptedBadgeClass(accepted: boolean | null) {
    if (accepted === true) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-orange-100 text-orange-700";
}

export default function TeachersPage() {
    const [teacherEnrollments, setTeacherEnrollments] = useState<
        TeacherEnrollment[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const showNotice = useCallback((type: "success" | "error", text: string) => {
        setNotice({ type, text });

        window.setTimeout(() => {
            setNotice((current) => (current?.text === text ? null : current));
        }, 2800);
    }, []);

    const loadTeachers = useCallback(
        async (showSuccess = false) => {
            try {
                if (showSuccess) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                const data = await getTeacherEnrollments();

                setTeacherEnrollments(data);

                if (showSuccess) {
                    showNotice(
                        "success",
                        "Lista de docentes actualizada correctamente.",
                    );
                }
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "No se pudieron cargar los docentes.";

                setTeacherEnrollments([]);
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
            void loadTeachers();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadTeachers]);

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
        Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedTeachers = useMemo(() => {
        const startIndex = (activePage - 1) * ITEMS_PER_PAGE;

        return filteredTeachers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTeachers, activePage]);

    const stats = useMemo(() => {
        const uniqueTeachers = new Set(
            teacherEnrollments.map((item) => item.user.id),
        ).size;

        const acceptedEnrollments = teacherEnrollments.filter(
            (item) => item.accepted === true,
        ).length;

        const pendingEnrollments = teacherEnrollments.filter(
            (item) => item.accepted !== true,
        ).length;

        return {
            total: teacherEnrollments.length,
            uniqueTeachers,
            acceptedEnrollments,
            pendingEnrollments,
        };
    }, [teacherEnrollments]);

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                            Gestión de docentes
                        </p>

                        <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                            Docentes asignados
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                            Consulta los usuarios que tienen rol de docente
                            dentro de una matrícula, revisa el curso asignado y
                            verifica el estado de cada registro.
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
                                Docentes
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.uniqueTeachers}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Aceptados
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.acceptedEnrollments}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                                Pendientes
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {isLoading ? "..." : stats.pendingEnrollments}
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
                            Lista de docentes
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            Busca por docente, curso, rol, ID de usuario, ID de
                            curso o ID de matrícula.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadTeachers(true)}
                        disabled={isRefreshing}
                        className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>

                <div className="mt-5">
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar por docente, curso, rol o ID"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:max-w-[440px]"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Docente
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Curso asignado
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Rol matrícula
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Estado
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Comentario
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                                    >
                                        Cargando docentes...
                                    </td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-12 text-center"
                                    >
                                        <p className="text-sm font-bold text-slate-800">
                                            No hay docentes para mostrar.
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Los docentes aparecerán aquí cuando
                                            exista una matrícula con rol
                                            profesor.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTeachers.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="align-top transition hover:bg-blue-50/40"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex min-w-[220px] items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#172861] text-sm font-bold text-white">
                                                    {getTeacherName(item)
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-slate-950">
                                                        {getTeacherName(item)}
                                                    </p>
                                                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                        Usuario #{item.user.id}
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

                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getAcceptedBadgeClass(
                                                    item.accepted,
                                                )}`}
                                            >
                                                {item.accepted === true
                                                    ? "Aceptado"
                                                    : "Pendiente"}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm font-medium text-slate-500">
                                            {item.comment || "Sin comentario"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                        Mostrando {paginatedTeachers.length} de{" "}
                        {filteredTeachers.length} registros
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
        </section>
    );
}