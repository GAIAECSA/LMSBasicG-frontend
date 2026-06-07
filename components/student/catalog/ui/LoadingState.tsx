import {
    Loader2,
} from "lucide-react";

import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

export function LoadingState() {
    return (
        <AthenaLoadingBackground
            contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
        >
            <div
                role="status"
                aria-live="polite"
                aria-label="Cargando catálogo de cursos"
                className="flex min-h-[260px] w-full max-w-md flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur-[3px]"
            >
                <Loader2
                    aria-hidden="true"
                    className="h-8 w-8 animate-spin text-[#172861]"
                />

                <p className="mt-3 text-sm font-black text-slate-700 sm:text-base">
                    Cargando catálogo de cursos
                </p>

                <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                    Estamos preparando los cursos
                    disponibles para ti...
                </p>
            </div>
        </AthenaLoadingBackground>
    );
}

export default LoadingState;