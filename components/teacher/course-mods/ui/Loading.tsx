import { Loader2 } from "lucide-react";

type LoadingProps = {
    numericCourseId: number;
};

export function Loading({ numericCourseId }: LoadingProps) {
    return (
        <section className="space-y-6">
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-[#172861]" />
                <p className="mt-4 text-sm font-bold text-slate-600">
                    {numericCourseId > 0
                        ? "Cargando módulos del curso..."
                        : "Cargando cursos disponibles..."}
                </p>
            </div>
        </section>
    );
}