import type { EnrollmentStats } from "../types";

type EnrollmentsHeroProps = {
    isLoading: boolean;
    stats: EnrollmentStats;
};

const statItems: Array<{
    key: keyof EnrollmentStats;
    label: string;
}> = [
    { key: "total", label: "Total" },
    { key: "approved", label: "Aprobadas" },
    { key: "pending", label: "Pendientes" },
    { key: "rejected", label: "No aprobadas" },
];

export function EnrollmentsHero({
    isLoading,
    stats,
}: EnrollmentsHeroProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em] lg:text-sm">
                        Administración
                    </p>

                    <h2 className="mt-2 text-xl font-bold sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                        Gestión de matrículas
                    </h2>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                        Administra las matrículas de estudiantes, revisa
                        comprobantes y actualiza el estado de aprobación de
                        cada solicitud.
                    </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:w-auto xl:min-w-[540px] xl:max-w-[620px] xl:shrink-0">
                    {statItems.map((item) => (
                        <div
                            key={item.key}
                            className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-xs">
                                {item.label}
                            </p>

                            <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl [@media(max-height:760px)]:text-2xl">
                                {isLoading
                                    ? "..."
                                    : stats[item.key]}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
