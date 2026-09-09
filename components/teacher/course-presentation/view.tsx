"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    getCourseById,
} from "./api";

import type {
    CourseSummary,
    TeacherCoursePresentationViewProps,
} from "./types";

import {
    CourseNotFound,
} from "./ui/CourseNotFound";

import {
    CoursePresentationContent,
} from "./ui/CoursePresentationContent";

import {
    CourseToolbar,
} from "./ui/CourseToolbar";

export function TeacherCoursePresentationView({
    courseId,
    backHref = "/student/courses",
    backLabel = "Volver a mis cursos",
    viewLabel = "Vista docente",
}: TeacherCoursePresentationViewProps) {
    const [course, setCourse] =
        useState<CourseSummary | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let active = true;

        async function loadCourse() {
            try {
                setLoading(true);
                setError("");

                const result =
                    await getCourseById(
                        courseId,
                    );

                if (!active) {
                    return;
                }

                if (!result) {
                    setCourse(null);
                    setError(
                        "No se pudo obtener la información del curso.",
                    );
                    return;
                }

                setCourse(result);
            } catch (err) {
                console.error(
                    "Error cargando curso:",
                    err,
                );

                if (!active) {
                    return;
                }

                setCourse(null);
                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudo cargar el curso.",
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadCourse();

        return () => {
            active = false;
        };
    }, [courseId]);

    if (loading) {
        return (
            <section className="min-h-screen bg-slate-50 px-4 py-6">
                <div className="mx-auto max-w-[1500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-600">
                        Cargando información del curso...
                    </p>
                </div>
            </section>
        );
    }

    if (!course) {
        return (
            <>
                {error ? (
                    <div className="mx-auto mt-4 max-w-[1500px] px-4">
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {error}
                        </div>
                    </div>
                ) : null}

                <CourseNotFound
                    backHref={backHref}
                    backLabel={backLabel}
                />
            </>
        );
    }

    return (
        <section className="min-h-screen w-full overflow-x-hidden bg-slate-50 px-3 py-4 pb-8 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 sm:space-y-5">
                <CourseToolbar
                    course={course}
                    backHref={backHref}
                    backLabel={backLabel}
                />

                <CoursePresentationContent
                    course={course}
                    viewLabel={viewLabel}
                />
            </div>
        </section>
    );
}

export default TeacherCoursePresentationView;