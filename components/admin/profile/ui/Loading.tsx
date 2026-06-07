import {
    Loader2,
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
                aria-label="Cargando información del usuario"
                className="flex min-h-[220px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-6 text-center shadow-sm backdrop-blur-[3px] sm:min-h-[280px] sm:rounded-[28px] sm:px-7 sm:py-8"
            >
                <Loader2
                    aria-hidden="true"
                    className="h-8 w-8 animate-spin text-[var(--primary)] sm:h-9 sm:w-9"
                />

                <p className="mt-4 text-xs font-black text-[var(--foreground)] sm:text-sm">
                    Cargando información del usuario
                </p>

                <p className="mt-1.5 text-[11px] font-semibold leading-5 text-[var(--muted-foreground)] sm:text-xs">
                    Estamos preparando los datos de tu perfil...
                </p>
            </div>
        </AthenaLoadingBackground>
    );
}

export default Loading;