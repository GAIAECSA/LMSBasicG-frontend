import {
    Layers3,
    ListChecks,
} from "lucide-react";
import { COURSE_PRESENTATION_THEME as theme } from "../constants";
import type { CourseModule } from "../types";

type CourseModulesSummaryProps = {
    modules: CourseModule[];
};

export function CourseModulesSummary({
    modules,
}: CourseModulesSummaryProps) {
    return (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 lg:p-6">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700 sm:px-3 sm:text-xs sm:tracking-[0.14em]">
                        <ListChecks className="h-4 w-4" />
                        Resumen
                    </span>

                    <h2 className="mt-3 text-lg font-black text-[var(--foreground)] sm:text-xl">
                        Estructura del curso
                    </h2>
                </div>

                <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[var(--muted-foreground)]">
                    {modules.length} módulo
                    {modules.length === 1
                        ? ""
                        : "s"}
                </span>
            </div>

            {modules.length > 0 ? (
                <div className="mt-4 grid min-w-0 gap-2.5 md:grid-cols-2 xl:grid-cols-1 [@media(max-height:760px)]:xl:grid-cols-2">
                    {modules.map((module) => (
                        <article
                            key={module.id}
                            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/40 sm:rounded-2xl sm:p-4"
                        >
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl sm:text-sm ${theme.primaryBg}`}
                            >
                                {module.order ||
                                    module.id}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
                                    Módulo{" "}
                                    {module.order ||
                                        module.id}
                                </p>

                                <h3 className="mt-0.5 line-clamp-2 break-words text-sm font-black text-[var(--foreground)] sm:text-base">
                                    {module.name}
                                </h3>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-3xl sm:p-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 sm:h-14 sm:w-14">
                        <Layers3 className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>

                    <h3 className="mt-3 text-base font-black text-[var(--foreground)] sm:mt-4 sm:text-lg">
                        Aún no hay módulos registrados
                    </h3>

                    <p className="mt-2 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm sm:leading-6">
                        Cuando agregues módulos,
                        aparecerán aquí como un
                        resumen rápido de la
                        estructura del curso.
                    </p>
                </div>
            )}
        </section>
    );
}

export default CourseModulesSummary;
