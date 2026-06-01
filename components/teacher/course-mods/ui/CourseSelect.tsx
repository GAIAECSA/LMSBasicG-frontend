import { AlertCircle, Layers3 } from "lucide-react";
import type { Course } from "@/services/courses.service";

type CourseSelectProps = {
    courseOptions: Course[];
    errorMessage: string;
    onSelectCourse: (value: string) => void;
};

export function CourseSelect({
    courseOptions,
    errorMessage,
    onSelectCourse,
}: CourseSelectProps) {
    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] px-6 py-8 text-white md:px-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                        <Layers3 className="h-3.5 w-3.5" />
                        Gestión de módulos
                    </div>

                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                        Selecciona un curso
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50 md:text-base">
                        Primero selecciona el curso para cargar sus módulos,
                        lecciones y contenido.
                    </p>
                </div>

                <div className="p-6 md:p-8">
                    {errorMessage ? (
                        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    ) : null}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            Curso
                        </label>

                        <select
                            value=""
                            onChange={(event) =>
                                onSelectCourse(event.target.value)
                            }
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            <option value="">Selecciona un curso</option>
                            {courseOptions.map((courseItem) => (
                                <option
                                    key={courseItem.id}
                                    value={courseItem.id}
                                >
                                    {courseItem.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </section>
    );
}