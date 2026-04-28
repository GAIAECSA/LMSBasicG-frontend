"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    Eye,
    GraduationCap,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses, type Course } from "@/services/courses.service";

function getCourseTitle(course: Course) {
    return course.name || "Curso sin nombre";
}

function getCourseDescription(course: Course) {
    return course.description || "Sin descripción disponible.";
}

function getCourseImage(course: Course) {
    const courseWithImage = course as Course & {
        image_url?: string | null;
        image?: string | null;
    };

    return courseWithImage.image_url || courseWithImage.image || "";
}

function formatPrice(course: Course) {
    const courseWithPrice = course as Course & {
        price?: string | number | null;
        is_free?: boolean;
    };

    if (courseWithPrice.is_free) return "Gratis";

    const price = Number(courseWithPrice.price ?? 0);

    if (!Number.isFinite(price) || price <= 0) return "Sin precio";

    return `$${price.toFixed(2)}`;
}

export default function TeacherCoursesPage() {
    const { user } = useAuth();

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const teacherName = useMemo(() => {
        if (!user) return "Profesor";

        const firstname = user.firstname ?? "";
        const lastname = user.lastname ?? "";
        const fullName = `${firstname} ${lastname}`.trim();

        return fullName || user.username || "Profesor";
    }, [user]);

    async function loadCourses(showRefresh = false) {
        try {
            if (showRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setErrorMessage("");

            const data = await getAllCourses();

            setCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            setCourses([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los cursos.",
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCourses(false);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

    if (isLoading) {
        return (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-blue-700" />

                <p className="mt-4 text-sm font-bold text-slate-600">
                    Cargando cursos asignados...
                </p>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-7 text-white md:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                <GraduationCap className="h-4 w-4" />
                                Panel docente
                            </span>

                            <h1 className="mt-4 text-3xl font-black">
                                Mis cursos
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                Hola,{" "}
                                <span className="font-bold text-white">
                                    {teacherName}
                                </span>
                                . Selecciona un curso para administrarlo o
                                visualizarlo como estudiante.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                Cursos
                            </p>

                            <p className="mt-1 text-3xl font-black">
                                {courses.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 bg-white p-4">
                    <button
                        type="button"
                        onClick={() => void loadCourses(true)}
                        disabled={isRefreshing}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Actualizar
                    </button>
                </div>
            </div>

            {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}

            {courses.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                        <BookOpen className="h-7 w-7" />
                    </div>

                    <h2 className="mt-5 text-xl font-black text-slate-950">
                        No tienes cursos asignados
                    </h2>

                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Cuando tengas cursos disponibles, aparecerán en este
                        apartado para que puedas administrarlos.
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course) => {
                        const imageUrl = getCourseImage(course);

                        return (
                            <article
                                key={course.id}
                                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="relative h-44 bg-slate-100">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={getCourseTitle(course)}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
                                            <BookOpen className="h-12 w-12 text-blue-700" />
                                        </div>
                                    )}

                                    <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-blue-700 shadow-sm">
                                        {formatPrice(course)}
                                    </span>
                                </div>

                                <div className="p-5">
                                    <h2 className="line-clamp-2 text-lg font-black text-slate-950">
                                        {getCourseTitle(course)}
                                    </h2>

                                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                                        {getCourseDescription(course)}
                                    </p>

                                    <div className="mt-5 grid gap-2">
                                        <Link
                                            href={`/teacher/courses/${course.id}`}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            Administrar curso
                                        </Link>

                                        <Link
                                            href={`/student/courses/${course.id}`}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Ver como estudiante
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}