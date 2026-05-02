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

function getUniqueEnrollmentsByUser(enrollments: Enrollment[]): Enrollment[] {
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
                teacherEnrollments: Array.isArray(teacherEnrollmentsData)
                    ? teacherEnrollmentsData
                    : [],
                studentEnrollments: Array.isArray(studentEnrollmentsData)
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
        () => getUniqueEnrollmentsByUser(dashboardData.teacherEnrollments),
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
        () => dashboardData.courses.filter((course) => course.is_published),
        [dashboardData.courses],
    );

    const openEnrollmentCourses = useMemo(
        () => dashboardData.courses.filter((course) => course.open_enrollment),
        [dashboardData.courses],
    );

    const recentEnrollments = useMemo(
        () => dashboardData.studentEnrollments.slice(-5).reverse(),
        [dashboardData.studentEnrollments],
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
            description: "Docentes asignados mediante matrículas por rol.",
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
            description: "Revisión y gestión de notas por curso y matrícula.",
            href: "/admin/grades",
            count: approvedEnrollments.length,
        },
        {
            title: "Certificados",
            description: "Gestión de plantillas y emisión de certificados.",
            href: "/admin/certificates",
            count: publishedCourses.length,
        },
    ];

    const quickActions = [
        {
            title: "Gestionar usuarios",
            description: "Ver usuarios registrados en el sistema.",
            href: "/admin/users",
        },
        {
            title: "Gestionar docentes",
            description: "Revisar docentes asignados a cursos.",
            href: "/admin/teachers",
        },
        {
            title: "Administrar cursos",
            description: "Crear, editar y publicar cursos.",
            href: "/admin/courses",
        },
        {
            title: "Revisar matrículas",
            description: "Aprobar solicitudes y revisar comprobantes.",
            href: "/admin/enrollments",
        },
        {
            title: "Gestionar calificaciones",
            description: "Revisar notas, intentos y resultados por estudiante.",
            href: "/admin/grades",
        },
        {
            title: "Gestionar certificados",
            description: "Administrar plantillas y emisión de certificados.",
            href: "/admin/certificates",
        },
    ];

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-r from-blue-950 via-blue-900 to-orange-500 p-6 text-white shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                            Panel administrativo
                        </p>

                        <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                            Dashboard de administrador
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                            Controla usuarios registrados, estudiantes
                            matriculados, docentes y cursos desde tus servicios
                            reales del backend.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadDashboard(true)}
                        disabled={isRefreshing}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>
            </div>

            {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {modules.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                                    {item.title}
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-950">
                                    {isLoading ? "..." : item.count}
                                </p>
                            </div>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                                Ver
                            </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                            {item.description}
                        </p>
                    </Link>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-950">
                        Resumen de matrículas y cursos
                    </h3>

                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Procesos principales que debe revisar el administrador.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                            <p className="text-sm font-medium text-orange-700">
                                Matrículas pendientes
                            </p>
                            <p className="mt-2 text-2xl font-bold text-orange-900">
                                {isLoading ? "..." : pendingEnrollments.length}
                            </p>
                            <p className="mt-1 text-xs text-orange-700">
                                Solicitudes aún no aprobadas.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                            <p className="text-sm font-medium text-green-700">
                                Matrículas aprobadas
                            </p>
                            <p className="mt-2 text-2xl font-bold text-green-900">
                                {isLoading ? "..." : approvedEnrollments.length}
                            </p>
                            <p className="mt-1 text-xs text-green-700">
                                Matrículas activas en cursos.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-sm font-medium text-blue-700">
                                Cursos publicados
                            </p>
                            <p className="mt-2 text-2xl font-bold text-blue-900">
                                {isLoading ? "..." : publishedCourses.length}
                            </p>
                            <p className="mt-1 text-xs text-blue-700">
                                Cursos visibles en la plataforma.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-700">
                                Cursos con matrícula abierta
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-950">
                                {isLoading
                                    ? "..."
                                    : openEnrollmentCourses.length}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                                Cursos disponibles para inscripción.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-950">
                        Acciones rápidas
                    </h3>

                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Accesos directos a las tareas principales.
                    </p>

                    <div className="mt-5 space-y-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="block rounded-2xl border border-[var(--border)] p-4 transition hover:border-blue-200 hover:bg-blue-50"
                            >
                                <p className="font-semibold text-slate-950">
                                    {action.title}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
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