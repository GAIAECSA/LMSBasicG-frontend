"use client";

import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
} from "lucide-react";
import type { Course } from "@/services/courses.service";
import { getCourses } from "@/services/courses.service";
import { CourseSelectMdtFiles } from "@/components/teacher/mdt-required-files";

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

export function AdminMdtRequiredFilesLanding() {
    const router = useRouter();

    const [courseOptions, setCourseOptions] =
        useState<Course[]>([]);

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadCourses() {
            try {
                setIsLoading(true);
                setError("");

                const response =
                    await getCourses();

                const courses =
                    normalizeCoursesResponse(
                        response,
                    );

                if (!isMounted) return;

                setCourseOptions(courses);
            } catch (currentError) {
                console.error(
                    "Error al cargar cursos para archivos MDT:",
                    currentError,
                );

                if (!isMounted) return;

                setError(
                    "No se pudieron cargar los cursos.",
                );
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

        router.push(
            `/admin/mdt-required-files/${courseId}`,
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1480px]">
                {isLoading ? (
                    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:rounded-3xl">
                        <div>
                            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#172861]" />

                            <p className="mt-3 text-xs font-bold text-slate-600 sm:text-sm">
                                Cargando cursos...
                            </p>
                        </div>
                    </div>
                ) : (
                    <CourseSelectMdtFiles
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

export default AdminMdtRequiredFilesLanding;
