import { Loader2 } from "lucide-react";

type LoadingProps = {
    currentCourseId: number;
};

export function Loading({ currentCourseId }: LoadingProps) {
    return (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#172861]" />

            <p className="mt-4 text-sm font-bold text-slate-600">
                {currentCourseId > 0
                    ? "Cargando calificaciones del curso..."
                    : "Cargando cursos disponibles..."}
            </p>
        </section>
    );
}