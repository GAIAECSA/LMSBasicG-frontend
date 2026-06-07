import {
    LoaderCircle,
} from "lucide-react";

import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

export function Loading() {
    return (
        <AthenaLoadingBackground
            className="max-w-[1450px]"
            contentClassName="flex min-h-[calc(100dvh-150px)] items-center justify-center"
        >
            <div
                role="status"
                aria-live="polite"
                aria-label="Cargando gestión de cursos"
                className="flex min-h-[240px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-6 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[300px] sm:rounded-[28px] sm:px-7 sm:py-8"
            >
                <LoaderCircle className="h-8 w-8 animate-spin text-[var(--primary)] sm:h-9 sm:w-9" />

                <p className="mt-4 text-sm font-black text-[var(--foreground)] sm:text-base">
                    Cargando gestión de cursos
                </p>

                <p className="mt-1.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                    Estamos preparando los cursos, categorías y subcategorías...
                </p>
            </div>
        </AthenaLoadingBackground>
    );
}

export default Loading;
