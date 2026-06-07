import { Loader2 } from "lucide-react";
import { AthenaLoadingBackground } from "@/components/ui/AthenaLoadingBackground";

type LoadingProps = {
    numericCourseId: number;
};

export function Loading({
    numericCourseId,
}: LoadingProps) {
    return (
        <AthenaLoadingBackground
            className="max-w-[1480px]"
            contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
        >
            <div className="flex min-h-[240px] w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/85 p-6 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[300px] sm:rounded-[28px] sm:p-8 lg:min-h-[340px] [@media(max-height:760px)]:min-h-[220px]">
                <Loader2 className="h-7 w-7 animate-spin text-[#172861] sm:h-8 sm:w-8" />

                <p className="mt-3 text-xs font-black text-slate-700 sm:mt-4 sm:text-sm">
                    {numericCourseId > 0
                        ? "Cargando módulos del curso..."
                        : "Cargando cursos disponibles..."}
                </p>

                <p className="mt-1.5 max-w-md text-[11px] font-semibold leading-5 text-slate-500 sm:text-xs">
                    Estamos preparando la estructura de contenidos de ATHENA.
                </p>
            </div>
        </AthenaLoadingBackground>
    );
}

export default Loading;
