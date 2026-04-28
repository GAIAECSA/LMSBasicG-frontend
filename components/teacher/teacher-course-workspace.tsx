"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    FileText,
    GraduationCap,
    MessageSquareText,
    RefreshCcw,
    Sparkles,
    UsersRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAuthSession } from "@/lib/auth";
import { getAllCourses } from "@/services/courses.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";

type RawCourse = {
    id?: number | string;
    name?: string;
    description?: string | null;
    price?: string | number | null;
    is_free?: boolean | null;
    level?: string | null;
    is_published?: boolean | null;
    open_enrollment?: boolean | null;
    duration_hours?: number | string | null;
    total_lessons?: number | string | null;
    subcategory_id?: number | string | null;
    image_url?: string | null;
    image?: string | null;
    thumbnail?: string | null;
    discount_price?: string | number | null;
    currency?: string | null;
    rating?: number | string | null;
    total_students?: number | string | null;
};

type SessionUser = {
    id?: number | string;
    firstname?: string;
    lastname?: string;
    role?: string;
    role_id?: number | string;
    roleId?: number | string;
};

type TeacherCoursePageProps = {
    courseId: string;
};

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

function getUserId(user?: SessionUser | null): number {
    const authUserId = Number(user?.id);

    if (authUserId > 0 && !Number.isNaN(authUserId)) {
        return authUserId;
    }

    const session = getAuthSession();
    const sessionUser = session?.user as SessionUser | undefined;
    const sessionUserId = Number(sessionUser?.id);

    if (sessionUserId > 0 && !Number.isNaN(sessionUserId)) {
        return sessionUserId;
    }

    return 0;
}

export function TeacherCoursePage({ courseId }: TeacherCoursePageProps) {
    const { user } = useAuth();

    const numericCourseId = useMemo(() => Number(courseId), [courseId]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [course, setCourse] = useState<RawCourse | null>(null);
    const [teacherEnrollment, setTeacherEnrollment] =
        useState<Enrollment | null>(null);

    const loadCourse = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            if (!numericCourseId || Number.isNaN(numericCourseId)) {
                throw new Error("No se pudo identificar el curso solicitado.");
            }

            const userId = getUserId(user as SessionUser | null);

            if (!userId) {
                throw new Error("No se pudo identificar al usuario autenticado.");
            }

            const [enrollmentsResponse, coursesResponse] = await Promise.all([
                getEnrollmentsByUser(userId),
                getAllCourses(),
            ]);

            const validEnrollments = Array.isArray(enrollmentsResponse)
                ? enrollmentsResponse
                : [];

            const currentTeacherEnrollment = validEnrollments.find(
                (item) =>
                    Number(item.course?.id) === numericCourseId &&
                    Number(item.role?.id) === 3,
            );

            if (!currentTeacherEnrollment) {
                setTeacherEnrollment(null);
                setCourse(null);

                throw new Error(
                    "No tienes permiso para gestionar este curso o el curso no existe.",
                );
            }

            if (currentTeacherEnrollment.accepted !== true) {
                setTeacherEnrollment(currentTeacherEnrollment);
                setCourse(null);

                throw new Error(
                    "Tu asignación como profesor todavía no está aprobada por el administrador.",
                );
            }

            const courses = Array.isArray(coursesResponse)
                ? (coursesResponse as RawCourse[])
                : [];

            const currentCourse =
                courses.find((item) => Number(item.id) === numericCourseId) ?? null;

            setTeacherEnrollment(currentTeacherEnrollment);
            setCourse(
                currentCourse ?? {
                    id: currentTeacherEnrollment.course.id,
                    name: currentTeacherEnrollment.course.name,
                    description: null,
                    image_url: null,
                },
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo cargar la información del curso.",
            );
        } finally {
            setLoading(false);
        }
    }, [numericCourseId, user]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCourse();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCourse]);

    const courseImageUrl = resolveCourseImageUrl(
        course?.image_url ?? course?.image ?? course?.thumbnail ?? null,
    );

    const courseName =
        course?.name ||
        teacherEnrollment?.course?.name ||
        "Curso sin nombre";

    const courseDescription =
        course?.description ||
        "Desde este panel puedes gestionar los recursos principales del curso asignado.";

    const durationHours = Number(course?.duration_hours ?? 0);
    const totalLessons = Number(course?.total_lessons ?? 0);
    const totalStudents = Number(course?.total_students ?? 0);

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href="/student/courses"
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a mis cursos
                </Link>

                <button
                    type="button"
                    onClick={loadCourse}
                    disabled={loading}
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

                    <p className="mt-4 text-sm font-semibold text-slate-600">
                        Cargando información del curso...
                    </p>
                </div>
            ) : null}

            {!loading && error ? (
                <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                        <AlertCircle className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-xl font-black text-red-800">
                        No se pudo abrir el curso
                    </h2>

                    <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-red-700">
                        {error}
                    </p>

                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/teacher/courses"
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
                        >
                            Ir a mis cursos
                        </Link>

                        <button
                            type="button"
                            onClick={loadCourse}
                            className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-5 text-sm font-bold text-red-700 transition hover:bg-red-50"
                        >
                            Intentar nuevamente
                        </button>
                    </div>
                </div>
            ) : null}

            {!loading && !error && course ? (
                <>
                    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 p-6 md:p-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Área del profesor
                                </div>

                                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                                    {courseName}
                                </h1>

                                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                                    {courseDescription}
                                </p>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-blue-100">
                                            <CheckCircle2 className="h-4 w-4" />

                                            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                                Estado
                                            </span>
                                        </div>

                                        <p className="mt-2 text-lg font-extrabold text-white">
                                            Asignado
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-blue-100">
                                            <BookOpen className="h-4 w-4" />

                                            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                                Lecciones
                                            </span>
                                        </div>

                                        <p className="mt-2 text-lg font-extrabold text-white">
                                            {totalLessons > 0 ? totalLessons : "N/D"}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-blue-100">
                                            <GraduationCap className="h-4 w-4" />

                                            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                                Horas
                                            </span>
                                        </div>

                                        <p className="mt-2 text-lg font-extrabold text-white">
                                            {durationHours > 0 ? durationHours : "N/D"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative min-h-[260px] bg-slate-100 lg:min-h-full">
                                {courseImageUrl ? (
                                    <Image
                                        src={courseImageUrl}
                                        alt={courseName}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full min-h-[260px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-500">
                                        Sin imagen del curso
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <Link
                            href={`/teacher/courses/${courseId}/tasks`}
                            className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                                <ClipboardList className="h-6 w-6" />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                Tareas
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Crea, revisa y administra las actividades del curso.
                            </p>
                        </Link>

                        <Link
                            href={`/teacher/courses/${courseId}/forums`}
                            className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-700 group-hover:text-white">
                                <MessageSquareText className="h-6 w-6" />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                Foros
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Gestiona espacios de participación y comunicación.
                            </p>
                        </Link>

                        <Link
                            href={`/teacher/courses/${courseId}/students`}
                            className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
                                <UsersRound className="h-6 w-6" />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                Estudiantes
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Consulta los estudiantes vinculados al curso.
                            </p>
                        </Link>

                        <Link
                            href={`/teacher/courses/${courseId}/resources`}
                            className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-600 group-hover:text-white">
                                <FileText className="h-6 w-6" />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                Recursos
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Administra materiales, archivos o contenido de apoyo.
                            </p>
                        </Link>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Resumen de asignación
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Información tomada desde tu matrícula/asignación como profesor.
                                </p>
                            </div>

                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-extrabold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Profesor aprobado
                            </span>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Curso
                                </p>

                                <p className="mt-2 text-sm font-black text-slate-950">
                                    {courseName}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Rol asignado
                                </p>

                                <p className="mt-2 text-sm font-black text-slate-950">
                                    {teacherEnrollment?.role?.name || "PROFESOR"}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Estudiantes
                                </p>

                                <p className="mt-2 text-sm font-black text-slate-950">
                                    {totalStudents > 0 ? totalStudents : "Sin datos"}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </section>
    );
}

export const TeacherCourseWorkspace = TeacherCoursePage;