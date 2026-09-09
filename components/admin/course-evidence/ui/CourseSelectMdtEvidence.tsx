import {
    AlertCircle,
    FileCheck2,
    Layers3,
} from "lucide-react";

import type {
    Course,
} from "@/services/courses.service";

type CourseSelectMdtEvidenceProps = {
    courseOptions: Course[];
    error: string;
    onSelectCourse: (
        value: string,
    ) => void;
};

export function CourseSelectMdtEvidence({
    courseOptions,
    error,
    onSelectCourse,
}: CourseSelectMdtEvidenceProps) {
    const mdtCourseOptions =
        courseOptions.filter(
            (course) =>
                course.is_mdt === true,
        );

    return (
        <section className="space-y-3 sm:space-y-4">
            {/* =========================
                HERO
            ========================= */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 sm:text-xs">
                    <FileCheck2 className="h-3.5 w-3.5" />

                    Evidencias MDT
                </div>

                <h1 className="mt-3 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">
                    Selecciona un curso MDT
                </h1>

                <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-blue-50 sm:text-sm sm:leading-6">
                    Selecciona un curso MDT para
                    consultar y administrar las
                    evidencias entregadas por los
                    estudiantes.
                </p>
            </div>

            {/* =========================
                ERROR
            ========================= */}
            {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    {error}
                </div>
            ) : null}

            {/* =========================
                SELECTOR
            ========================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] sm:h-11 sm:w-11 sm:rounded-2xl">
                        <Layers3 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-base font-black text-slate-950 sm:text-lg">
                            Curso MDT
                        </h2>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                            Únicamente se muestran
                            cursos MDT. Al seleccionar
                            uno se abrirá el módulo de
                            evidencias correspondiente.
                        </p>
                    </div>
                </div>

                <select
                    value=""
                    onChange={(event) =>
                        onSelectCourse(
                            event.target.value,
                        )
                    }
                    className="mt-4 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <option value="">
                        Selecciona un curso MDT
                    </option>

                    {mdtCourseOptions.map(
                        (course) => (
                            <option
                                key={
                                    course.id
                                }
                                value={
                                    course.id
                                }
                            >
                                {
                                    course.name
                                }
                            </option>
                        ),
                    )}
                </select>

                {mdtCourseOptions.length ===
                    0 ? (
                    <p className="mt-3 text-xs font-semibold text-slate-500 sm:text-sm">
                        No hay cursos MDT
                        disponibles para mostrar.
                    </p>
                ) : null}
            </div>
        </section>
    );
}

export default CourseSelectMdtEvidence;