import type { Course } from "@/services/courses.service";
import { Alert } from "./Alert";

type CourseSelectorProps = {
    courseOptions: Course[];
    errorMessage: string;
    onSelectCourse: (value: string) => void;
};

export function CourseSelector({
    courseOptions,
    errorMessage,
    onSelectCourse,
}: CourseSelectorProps) {
    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                        Panel del administrador
                    </p>

                    <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                        Gestión de calificaciones
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50">
                        Selecciona primero un curso para cargar sus
                        cuestionarios, tareas, matrículas, notas y certificados.
                    </p>
                </div>
            </div>

            <Alert type="error" message={errorMessage} />

            <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-950">
                    Seleccionar curso
                </h3>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Al seleccionar un curso se cargarán las calificaciones
                    agrupadas por matrícula.
                </p>

                <select
                    value=""
                    onChange={(event) => onSelectCourse(event.target.value)}
                    className="mt-5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                    <option value="">Selecciona un curso</option>
                    {courseOptions.map((courseItem) => (
                        <option key={courseItem.id} value={courseItem.id}>
                            {courseItem.name}
                        </option>
                    ))}
                </select>

                {courseOptions.length === 0 ? (
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                        No hay cursos registrados para mostrar.
                    </p>
                ) : null}
            </div>
        </section>
    );
}