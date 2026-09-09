"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    getAllCourses,
    type Course,
} from "@/services/courses.service";

import {
    CourseSelectMdtEvidence,
} from "./ui/CourseSelectMdtEvidence";

export function AdminMdtEvidenceLanding() {
    const router = useRouter();

    const [
        courseOptions,
        setCourseOptions,
    ] = useState<Course[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const loadCourses =
        useCallback(
            async () => {
                try {
                    setLoading(true);
                    setError("");

                    const courses =
                        await getAllCourses();

                    setCourseOptions(
                        Array.isArray(courses)
                            ? courses
                            : [],
                    );
                } catch (err) {
                    console.error(
                        "Error cargando cursos MDT:",
                        err,
                    );

                    setCourseOptions([]);

                    setError(
                        err instanceof Error
                            ? err.message
                            : "No se pudieron cargar los cursos.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    useEffect(() => {
        const timeoutId =
            window.setTimeout(
                () => {
                    void loadCourses();
                },
                0,
            );

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [
        loadCourses,
    ]);

    function handleSelectCourse(
        value: string,
    ) {
        const courseId =
            Number(value);

        if (
            !Number.isFinite(courseId) ||
            courseId <= 0
        ) {
            return;
        }

        router.push(
            `/admin/mdt-evidence/${courseId}`,
        );
    }

    if (loading) {
        return (
            <section className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
                <div className="mx-auto max-w-[1500px]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500 shadow-sm">
                        Cargando cursos MDT...
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
            <div className="mx-auto w-full max-w-[1500px]">
                <CourseSelectMdtEvidence
                    courseOptions={
                        courseOptions
                    }
                    error={error}
                    onSelectCourse={
                        handleSelectCourse
                    }
                />
            </div>
        </section>
    );
}

export default AdminMdtEvidenceLanding;