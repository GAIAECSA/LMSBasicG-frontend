import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

export function Loading() {
    return (
        <AthenaLoadingBackground
            className="max-w-[1680px] px-0 py-0 sm:px-0 sm:py-0 md:py-0 [@media(max-height:760px)]:py-0"
            contentClassName="flex min-h-[480px] items-center justify-center"
        >
            <div
                role="status"
                aria-live="polite"
                aria-label="Cargando certificados"
                className="w-full"
            >
                <span className="sr-only">
                    Cargando certificados...
                </span>

                <div className="mb-5 text-center">
                    <p className="text-sm font-black text-[var(--foreground)] sm:text-base">
                        Cargando tus certificados
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                        Estamos consultando tus
                        certificados emitidos...
                    </p>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    {[1, 2, 3, 4].map(
                        (item) => (
                            <div
                                key={
                                    item
                                }
                                className="h-[280px] animate-pulse rounded-[26px] border border-[var(--border)] bg-white/80 shadow-sm backdrop-blur-[3px]"
                            />
                        ),
                    )}
                </div>
            </div>
        </AthenaLoadingBackground>
    );
}

export default Loading;