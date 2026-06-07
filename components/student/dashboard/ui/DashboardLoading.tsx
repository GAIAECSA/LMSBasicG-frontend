import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

export function DashboardLoading() {
    return (
        <AthenaLoadingBackground>
            <div
                role="status"
                aria-live="polite"
                aria-label="Cargando panel del estudiante"
                className="space-y-4"
            >
                <span className="sr-only">
                    Cargando panel del
                    estudiante...
                </span>

                <div className="text-center">
                    <p className="text-sm font-black text-[var(--foreground)] sm:text-base">
                        Preparando tu panel
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                        Estamos cargando tus
                        cursos, matrículas y
                        recomendaciones...
                    </p>
                </div>

                <div className="h-[110px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 shadow-sm backdrop-blur-[2px] sm:rounded-3xl" />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(
                        (item) => (
                            <div
                                key={item}
                                className="h-[115px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 shadow-sm backdrop-blur-[2px] sm:rounded-3xl"
                            />
                        ),
                    )}
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
                    <div className="h-[250px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 shadow-sm backdrop-blur-[2px] sm:rounded-3xl" />

                    <div className="h-[250px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 shadow-sm backdrop-blur-[2px] sm:rounded-3xl" />
                </div>
            </div>
        </AthenaLoadingBackground>
    );
}

export default DashboardLoading;