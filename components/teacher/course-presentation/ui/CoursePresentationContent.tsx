"use client";

import {
    useEffect,
    useState,
} from "react";
import {
    getModulesByCourse,
} from "@/services/modules.service";
import type {
    CourseModule,
    CourseSummary,
} from "../types";
import { CourseHero } from "./CourseHero";
import { CourseModulesSummary } from "./CourseModulesSummary";
import { CourseQuickSummary } from "./CourseQuickSummary";

type CoursePresentationContentProps = {
    course: CourseSummary;
    viewLabel: string;
};

function getErrorMessage(
    error: unknown,
) {
    if (error instanceof Error) {
        return error.message;
    }

    return "No se pudieron cargar los módulos del curso.";
}

export function CoursePresentationContent({
    course,
    viewLabel,
}: CoursePresentationContentProps) {
    const [
        modules,
        setModules,
    ] = useState<CourseModule[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadModules() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getModulesByCourse(
                        course.id,
                    );

                if (!isMounted) return;

                setModules(response);
            } catch (loadError) {
                if (!isMounted) return;

                setModules([]);
                setError(
                    getErrorMessage(
                        loadError,
                    ),
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        void loadModules();

        return () => {
            isMounted = false;
        };
    }, [course.id]);

    return (
        <>
            <CourseHero
                course={course}
                modules={modules}
                viewLabel={viewLabel}
            />

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                {loading ? (
                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 w-28 rounded-full bg-slate-200" />

                            <div className="h-7 w-52 rounded-lg bg-slate-200" />

                            <div className="space-y-3">
                                <div className="h-16 rounded-2xl bg-slate-100" />
                                <div className="h-16 rounded-2xl bg-slate-100" />
                            </div>
                        </div>

                        <p className="mt-4 text-sm font-bold text-slate-500">
                            Cargando módulos del curso...
                        </p>
                    </section>
                ) : (
                    <CourseModulesSummary
                        modules={modules}
                    />
                )}

                <CourseQuickSummary
                    course={course}
                />
            </div>
        </>
    );
}

export default CoursePresentationContent;