import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

export function LoadingState() {
    return (
        <AthenaLoadingBackground>
            <div
                role="status"
                aria-live="polite"
                aria-label="Cargando tus cursos"
                className="space-y-3"
            >
                <span className="sr-only">
                    Cargando tus cursos...
                </span>

                <div className="mb-4 text-center">
                    <p className="text-sm font-black text-[var(--foreground)] sm:text-base">
                        Cargando tus cursos
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                        Estamos preparando tu
                        información académica...
                    </p>
                </div>

                {[1, 2].map((item) => (
                    <div
                        key={item}
                        className="h-[178px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 shadow-sm backdrop-blur-[2px] sm:rounded-3xl"
                    />
                ))}
            </div>
        </AthenaLoadingBackground>
    );
}

export default LoadingState;