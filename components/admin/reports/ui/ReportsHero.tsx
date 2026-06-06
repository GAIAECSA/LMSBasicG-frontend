import { RefreshCcw } from "lucide-react";

type ReportsHeroProps = {
    isLoadingCourses: boolean;
    onRefreshCourses: () => void;
};

export function ReportsHero({
    isLoadingCourses,
    onRefreshCourses,
}: ReportsHeroProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                        Administración
                    </p>

                    <h1 className="mt-1.5 text-xl font-black sm:mt-2 sm:text-2xl lg:text-3xl">
                        Reportes
                    </h1>

                    <p className="mt-1.5 text-xs font-semibold leading-5 text-blue-50 sm:mt-2 sm:text-sm">
                        Selecciona el reporte que deseas consultar.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onRefreshCourses}
                    disabled={isLoadingCourses}
                    className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-white/15 px-3 text-xs font-black text-white backdrop-blur transition hover:bg-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <RefreshCcw
                        className={`h-4 w-4 ${
                            isLoadingCourses
                                ? "animate-spin"
                                : ""
                        }`}
                    />

                    Actualizar cursos
                </button>
            </div>
        </div>
    );
}
