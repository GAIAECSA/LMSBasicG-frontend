import { Loader2 } from "lucide-react";

type LoadingProps = {
    currentCourseId: number;
};

export function Loading({ currentCourseId }: LoadingProps) {
    return (
        <section className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm sm:min-h-[300px] sm:rounded-3xl sm:p-8 [@media(max-height:760px)]:min-h-[200px]">
            <Loader2 className="h-7 w-7 animate-spin text-[#172861] sm:h-8 sm:w-8" />

            <p className="mt-3 text-xs font-bold text-slate-600 sm:mt-4 sm:text-sm">
                {currentCourseId > 0
                    ? "Cargando calificaciones del curso..."
                    : "Cargando cursos disponibles..."}
            </p>
        </section>
    );
}
