"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    getEnrollmentsByRole,
    type Enrollment,
} from "@/services/enrollments.service";
import { getAllUsers, type User } from "@/services/users.service";

const ROLE_IDS = {
    DOCENTE: 3,
    ESTUDIANTE: 4,
};

interface DashboardData {
    users: User[];
    courses: Course[];
    teacherEnrollments: Enrollment[];
    studentEnrollments: Enrollment[];
}

const initialDashboardData: DashboardData = {
    users: [],
    courses: [],
    teacherEnrollments: [],
    studentEnrollments: [],
};

function getUniqueEnrollmentsByUser(
    enrollments: Enrollment[],
): Enrollment[] {
    const userIds = new Set<number>();

    return enrollments.filter((item) => {
        const userId = item.user.id;

        if (userIds.has(userId)) return false;

        userIds.add(userId);
        return true;
    });
}

export default function AdminPage() {
    const [dashboardData, setDashboardData] =
        useState<DashboardData>(initialDashboardData);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const loadDashboard = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setErrorMessage("");

            const [
                usersData,
                coursesData,
                teacherEnrollmentsData,
                studentEnrollmentsData,
            ] = await Promise.all([
                getAllUsers(),
                getAllCourses(),
                getEnrollmentsByRole(ROLE_IDS.DOCENTE),
                getEnrollmentsByRole(ROLE_IDS.ESTUDIANTE),
            ]);

            setDashboardData({
                users: Array.isArray(usersData) ? usersData : [],
                courses: Array.isArray(coursesData) ? coursesData : [],
                teacherEnrollments: Array.isArray(
                    teacherEnrollmentsData,
                )
                    ? teacherEnrollmentsData
                    : [],
                studentEnrollments: Array.isArray(
                    studentEnrollmentsData,
                )
                    ? studentEnrollmentsData
                    : [],
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo cargar la información del dashboard.";

            setErrorMessage(message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadDashboard();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadDashboard]);

    const registeredUsers = useMemo(
        () => dashboardData.users,
        [dashboardData.users],
    );

    const enrolledStudents = useMemo(
        () =>
            getUniqueEnrollmentsByUser(
                dashboardData.studentEnrollments.filter(
                    (item) => item.accepted === true,
                ),
            ),
        [dashboardData.studentEnrollments],
    );

    const uniqueTeachers = useMemo(
        () =>
            getUniqueEnrollmentsByUser(
                dashboardData.teacherEnrollments,
            ),
        [dashboardData.teacherEnrollments],
    );

    const approvedEnrollments = useMemo(
        () =>
            dashboardData.studentEnrollments.filter(
                (item) => item.accepted === true,
            ),
        [dashboardData.studentEnrollments],
    );

    const pendingEnrollments = useMemo(
        () =>
            dashboardData.studentEnrollments.filter(
                (item) => item.accepted !== true,
            ),
        [dashboardData.studentEnrollments],
    );

    const publishedCourses = useMemo(
        () =>
            dashboardData.courses.filter(
                (course) => course.is_published,
            ),
        [dashboardData.courses],
    );

    const openEnrollmentCourses = useMemo(
        () =>
            dashboardData.courses.filter(
                (course) => course.open_enrollment,
            ),
        [dashboardData.courses],
    );

    const modules = [
        {
            title: "Usuarios registrados",
            description: "Total de usuarios creados en el sistema.",
            href: "/admin/users",
            count: registeredUsers.length,
        },
        {
            title: "Estudiantes matriculados",
            description: "Estudiantes con matrícula aprobada.",
            href: "/admin/enrollments",
            count: enrolledStudents.length,
        },
        {
            title: "Docentes",
            description:
                "Docentes asignados mediante matrículas por rol.",
            href: "/admin/teachers",
            count: uniqueTeachers.length,
        },
        {
            title: "Cursos",
            description: "Cursos registrados dentro del LMS.",
            href: "/admin/courses",
            count: dashboardData.courses.length,
        },
        {
            title: "Calificaciones",
            description:
                "Revisión y gestión de notas por curso y matrícula.",
            href: "/admin/grades",
            count: approvedEnrollments.length,
        },
        {
            title: "Certificados",
            description:
                "Gestión de plantillas y emisión de certificados.",
            href: "/admin/certificates",
            count: publishedCourses.length,
        },
    ];

    const quickActions = [
        {
            title: "Gestionar usuarios",
            description:
                "Ver usuarios registrados en el sistema.",
            href: "/admin/users",
        },
        {
            title: "Gestionar docentes",
            description:
                "Revisar docentes asignados a cursos.",
            href: "/admin/teachers",
        },
        {
            title: "Administrar cursos",
            description: "Crear, editar y publicar cursos.",
            href: "/admin/courses",
        },
        {
            title: "Revisar matrículas",
            description:
                "Aprobar solicitudes y revisar comprobantes.",
            href: "/admin/enrollments",
        },
        {
            title: "Gestionar calificaciones",
            description:
                "Revisar notas, intentos y resultados por estudiante.",
            href: "/admin/grades",
        },
        {
            title: "Gestionar certificados",
            description:
                "Administrar plantillas y emisión de certificados.",
            href: "/admin/certificates",
        },
    ];

    return (
        <section className="min-w-0 space-y-4 sm:space-y-5 lg:space-y-6 [@media(max-height:760px)]:space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B163F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                            Panel administrativo
                        </p>

                        <h2 className="mt-2 text-xl font-bold leading-tight sm:mt-3 sm:text-2xl lg:text-3xl [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:text-xl">
                            Dashboard de administrador
                        </h2>

                        <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6 [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-5">
                            Controla usuarios registrados, estudiantes
                            matriculados, docentes y cursos desde tus
                            servicios reales del backend.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadDashboard(true)}
                        disabled={isRefreshing}
                        className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-white px-4 text-xs font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:rounded-2xl sm:text-sm"
                    >
                        {isRefreshing
                            ? "Actualizando..."
                            : "Actualizar"}
                    </button>
                </div>
            </div>

            {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs leading-5 text-red-700 sm:rounded-2xl sm:px-4 sm:text-sm">
                    {errorMessage}
                </div>
            ) : null}

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6 [@media(max-height:760px)]:gap-3">
                {modules.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="group min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-5 [@media(max-height:760px)]:p-4"
                    >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="break-words text-xs font-medium leading-5 text-[var(--muted-foreground)] sm:text-sm">
                                    {item.title}
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-950 sm:mt-3 sm:text-3xl [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:text-2xl">
                                    {isLoading ? "..." : item.count}
                                </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white sm:px-3 sm:text-xs">
                                Ver
                            </span>
                        </div>

                        <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)] sm:mt-4 sm:text-sm sm:leading-6 [@media(max-height:760px)]:mt-2">
                            {item.description}
                        </p>
                    </Link>
                ))}
            </div>

            <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] 2xl:gap-5">
                <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                    <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                        Resumen de matrículas y cursos
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Procesos principales que debe revisar el
                        administrador.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:gap-3">
                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 sm:rounded-2xl sm:p-4">
                            <p className="text-xs font-medium text-orange-700 sm:text-sm">
                                Matrículas pendientes
                            </p>

                            <p className="mt-1.5 text-xl font-bold text-orange-900 sm:mt-2 sm:text-2xl">
                                {isLoading
                                    ? "..."
                                    : pendingEnrollments.length}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-orange-700 sm:text-xs">
                                Solicitudes aún no aprobadas.
                            </p>
                        </div>

                        <div className="rounded-xl border border-green-100 bg-green-50 p-3 sm:rounded-2xl sm:p-4">
                            <p className="text-xs font-medium text-green-700 sm:text-sm">
                                Matrículas aprobadas
                            </p>

                            <p className="mt-1.5 text-xl font-bold text-green-900 sm:mt-2 sm:text-2xl">
                                {isLoading
                                    ? "..."
                                    : approvedEnrollments.length}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-green-700 sm:text-xs">
                                Matrículas activas en cursos.
                            </p>
                        </div>

                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 sm:rounded-2xl sm:p-4">
                            <p className="text-xs font-medium text-blue-700 sm:text-sm">
                                Cursos publicados
                            </p>

                            <p className="mt-1.5 text-xl font-bold text-blue-900 sm:mt-2 sm:text-2xl">
                                {isLoading
                                    ? "..."
                                    : publishedCourses.length}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-blue-700 sm:text-xs">
                                Cursos visibles en la plataforma.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                            <p className="text-xs font-medium text-slate-700 sm:text-sm">
                                Cursos con matrícula abierta
                            </p>

                            <p className="mt-1.5 text-xl font-bold text-slate-950 sm:mt-2 sm:text-2xl">
                                {isLoading
                                    ? "..."
                                    : openEnrollmentCourses.length}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-600 sm:text-xs">
                                Cursos disponibles para inscripción.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                    <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                        Acciones rápidas
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Accesos directos a las tareas principales.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1 [@media(min-width:1800px)]:grid-cols-2 [@media(max-height:760px)]:mt-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="block min-w-0 rounded-xl border border-[var(--border)] p-3 transition hover:border-blue-200 hover:bg-blue-50 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3"
                            >
                                <p className="break-words text-sm font-semibold leading-5 text-slate-950">
                                    {action.title}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm sm:leading-6 [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-5">
                                    {action.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}