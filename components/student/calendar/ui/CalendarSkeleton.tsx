import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";

export function CalendarSkeleton() {
    return (
        <AthenaLoadingBackground
            className="max-w-[1500px] px-0 py-0 sm:px-0 sm:py-0 md:py-0 [@media(max-height:760px)]:py-0"
            contentClassName="flex min-h-[calc(100dvh-250px)] items-center justify-center"
        >
            <div
                role="status"
                aria-live="polite"
                aria-label="Cargando calendario académico"
                className="w-full overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)]/80 p-3 shadow-sm backdrop-blur-[3px] sm:rounded-[26px] sm:p-4"
            >
                <span className="sr-only">
                    Cargando calendario académico...
                </span>

                <div className="mb-4 text-center">
                    <p className="text-sm font-black text-[var(--foreground)] sm:text-base">
                        Cargando calendario académico
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                        Estamos preparando tus actividades...
                    </p>
                </div>

                <div className="mb-3 h-9 w-52 animate-pulse rounded-xl bg-[var(--muted)]" />

                <div className="overflow-x-auto">
                    <div className="grid min-w-[700px] grid-cols-7 gap-1.5 sm:gap-2">
                        {Array.from({
                            length: 42,
                        }).map(
                            (
                                _,
                                index,
                            ) => (
                                <div
                                    key={
                                        index
                                    }
                                    className="h-[88px] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--card)]/85 shadow-sm sm:h-[104px]"
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>
        </AthenaLoadingBackground>
    );
}

export default CalendarSkeleton;