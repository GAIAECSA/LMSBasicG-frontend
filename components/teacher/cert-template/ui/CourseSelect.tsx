import type { Course } from "@/services/courses.service";
import { Alerts } from "./Alerts";

type CourseSelectProps = {
    isAdminRoute: boolean;
    courseOptions: Course[];
    error: string;
    onSelectCourse: (value: string) => void;
};

export function CourseSelect({
    isAdminRoute,
    courseOptions,
    error,
    onSelectCourse,
}: CourseSelectProps) {
    return (
        <section className="min-w-0 space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                    {isAdminRoute
                        ? "Panel del administrador"
                        : "Panel del profesor"}
                </p>

                <h2 className="mt-2 text-xl font-bold sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                    Gestión de certificados
                </h2>

                <p className="mt-2 max-w-3xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                    Selecciona primero un curso para cargar o crear la
                    plantilla del certificado.
                </p>
            </div>

            <Alerts error={error} />

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
                <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                    Seleccionar curso
                </h3>

                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                    Al seleccionar un curso se cargará su plantilla de
                    certificado.
                </p>

                <select
                    value=""
                    onChange={(event) =>
                        onSelectCourse(event.target.value)
                    }
                    className="mt-4 h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:mt-5 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:mt-3"
                >
                    <option value="">
                        Selecciona un curso
                    </option>

                    {courseOptions.map((courseItem) => (
                        <option
                            key={courseItem.id}
                            value={courseItem.id}
                        >
                            {courseItem.name}
                        </option>
                    ))}
                </select>

                {courseOptions.length === 0 ? (
                    <p className="mt-3 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        No hay cursos registrados para mostrar.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
