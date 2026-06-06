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
        <section className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm sm:rounded-3xl">
                <div className="bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] px-4 py-5 text-white sm:px-5 sm:py-6 md:px-6 lg:px-8 [@media(max-height:760px)]:py-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100 sm:text-xs sm:tracking-[0.18em]">
                        <Layers3 className="h-3.5 w-3.5" />
                        Gestión de módulos
                    </div>

                    <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl [@media(max-height:760px)]:text-2xl">
                        Selecciona un curso
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6 md:text-base">
                        Primero selecciona el curso para cargar sus módulos,
                        lecciones y contenido.
                    </p>
                </div>

                <div className="p-4 sm:p-5 md:p-6 lg:p-8 [@media(max-height:760px)]:p-4">
                    {errorMessage ? (
                        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:mb-4 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                            <span>{errorMessage}</span>
                        </div>
                    ) : null}

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4 lg:p-5">
                        <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                            Curso
                        </label>

                        <select
                            value=""
                            onChange={(event) =>
                                onSelectCourse(event.target.value)
                            }
                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
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
