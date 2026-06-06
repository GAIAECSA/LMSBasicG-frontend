"use client";

import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/services/courses.service";
import { getCourses } from "@/services/courses.service";
import { CourseSelectMdtCertificates } from "@/components/teacher/mdt-certificados";
import { Loading } from "@/components/teacher/mdt-certificados/ui/Loading";

type AnyRecord = Record<string, unknown>;

function normalizeCoursesResponse(
    response: unknown,
): Course[] {
    if (Array.isArray(response)) {
        return response as Course[];
    }

    if (
        !response ||
        typeof response !== "object"
    ) {
        return [];
    }

    const currentResponse =
        response as AnyRecord;

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

export function AdminMdtCertificatesLanding() {
    const router = useRouter();

    const [courseOptions, setCourseOptions] =
        useState<Course[]>([]);

    const [error, setError] = useState("");

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadCourses() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getCourses();

                const courses =
                    normalizeCoursesResponse(
                        response,
                    );

                if (!mounted) return;

                setCourseOptions(courses);
            } catch (currentError) {
                console.error(
                    "Error al cargar cursos para certificados MDT:",
                    currentError,
                );

                if (!mounted) return;

                setError(
                    "No se pudieron cargar los cursos.",
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        void loadCourses();

        return () => {
            mounted = false;
        };
    }, []);

    function handleSelectCourse(value: string) {
        const courseId = value.trim();

        if (!courseId) return;

        router.push(
            `/admin/mdt-certificados/${courseId}`,
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1480px]">
                {loading ? (
                    <Loading label="Cargando cursos..." />
                ) : (
                    <CourseSelectMdtCertificates
                        isAdminRoute
                        courseOptions={
                            courseOptions
                        }
                        error={error}
                        onSelectCourse={
                            handleSelectCourse
                        }
                    />
                )}
            </div>
        </section>
    );
}

export default AdminMdtCertificatesLanding;
