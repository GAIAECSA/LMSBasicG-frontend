"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Course } from "@/services/courses.service";
import { getCourses } from "@/services/courses.service";
import { CourseSelectMdtCertificates } from "@/components/teacher/mdt-certificados/ui/CourseSelectMdtCertificates";

type AnyRecord = Record<string, unknown>;

function normalizeCoursesResponse(response: unknown): Course[] {
    if (Array.isArray(response)) {
        return response as Course[];
    }

    if (!response || typeof response !== "object") {
        return [];
    }

    const currentResponse = response as AnyRecord;

    const possibleCourses =
        currentResponse.data ??
        currentResponse.items ??
        currentResponse.results ??
        currentResponse.courses;

    if (Array.isArray(possibleCourses)) {
        return possibleCourses as Course[];
    }

    return [];
}

export default function AdminMdtCertificadosPage() {
    const router = useRouter();

    const [courseOptions, setCourseOptions] = useState<Course[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadCourses() {
            try {
                setIsLoading(true);
                setError("");

                const response = await getCourses();
                const courses = normalizeCoursesResponse(response);

                if (!isMounted) return;

                setCourseOptions(courses);
            } catch (currentError) {
                console.error(
                    "Error al cargar cursos para certificados MDT:",
                    currentError,
                );

                if (!isMounted) return;

                setError("No se pudieron cargar los cursos.");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadCourses();

        return () => {
            isMounted = false;
        };
    }, []);

    function handleSelectCourse(value: string) {
        const courseId = value.trim();

        if (!courseId) return;

        router.push(`/admin/mdt-certificados/${courseId}`);
    }

    if (isLoading) {
        return (
            <section className="min-h-screen bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 md:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-bold text-slate-600">
                            Cargando cursos...
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px]">
                <CourseSelectMdtCertificates
                    isAdminRoute
                    courseOptions={courseOptions}
                    error={error}
                    onSelectCourse={handleSelectCourse}
                />
            </div>
        </section>
    );
}