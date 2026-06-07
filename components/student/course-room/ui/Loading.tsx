import { Loader2 } from "lucide-react";

import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

export function Loading() {
    return (
        <AthenaLoadingBackground
            className="max-w-[1450px] px-0 py-0 sm:px-0 sm:py-0 md:py-0 [@media(max-height:760px)]:py-0"
            contentClassName="flex min-h-[calc(100dvh-180px)] items-center justify-center"
        >
            <div
                role="status"
                aria-live="polite"
                aria-label="Cargando aula virtual"
                className="flex min-h-[320px] w-full max-w-xl flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-[var(--card)]/80 p-8 text-center shadow-sm backdrop-blur-[3px]"
            >
                <Loader2
                    aria-hidden="true"
                    className="h-8 w-8 animate-spin text-[var(--primary)]"
                />

                <p className="mt-4 text-sm font-black text-[var(--foreground)] sm:text-base">
                    Cargando aula virtual
                </p>

                <p className="mt-1.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                    Estamos preparando tus contenidos,
                    actividades y progreso...
                </p>
            </div>
        </AthenaLoadingBackground>
    );
}

export default Loading;
