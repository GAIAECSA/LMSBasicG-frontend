import { Loader2 } from "lucide-react";

type LoadingProps = {
    numericCourseId: number;
};

export function Loading({
    numericCourseId,
}: LoadingProps) {
    return (
        <section>
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:min-h-[300px] sm:rounded-[28px] sm:p-8 lg:min-h-[360px] [@media(max-height:760px)]:min-h-[220px]">
                <Loader2 className="h-7 w-7 animate-spin text-[#172861] sm:h-8 sm:w-8" />

                <p className="mt-3 text-xs font-bold text-slate-600 sm:mt-4 sm:text-sm">
                    {numericCourseId > 0
                        ? "Cargando módulos del curso..."
                        : "Cargando cursos disponibles..."}
                </p>
            </div>
        </section>
    );
}
