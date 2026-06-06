import {
    CheckCircle2,
    Headphones,
    UserRound,
} from "lucide-react";

const heroMetrics = [
    {
        label: "Cuenta",
        value: "Usuario activo",
        icon: UserRound,
    },
    {
        label: "Atención",
        value: "Soporte LMS",
        icon: Headphones,
    },
    {
        label: "Estado",
        value: "Disponible",
        icon: CheckCircle2,
    },
];

export function HelpHero() {
    return (
        <div
            className="overflow-hidden rounded-2xl text-white shadow-lg sm:rounded-3xl"
            style={{
                background:
                    "var(--gradient-admin)",
            }}
        >
            <div className="relative p-4 sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
                <div className="absolute bottom-0 right-0 h-28 w-72 rounded-full bg-orange-400/25 blur-3xl" />

                <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 max-w-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/75 sm:text-xs sm:tracking-[0.3em]">
                            Centro de ayuda
                        </p>

                        <h1 className="mt-1.5 text-xl font-black tracking-tight text-white sm:mt-2 sm:text-2xl lg:text-3xl">
                            Ayuda y asistencia
                        </h1>

                        <p className="mt-1.5 max-w-3xl text-xs font-semibold leading-5 text-white/80 sm:mt-2 sm:text-sm sm:leading-6">
                            Gestiona solicitudes de soporte, reporta problemas técnicos y encuentra información rápida sobre el uso de la plataforma.
                        </p>
                    </div>

                    <div className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:min-w-[390px]">
                        {heroMetrics.map(
                            (metric) => {
                                const Icon =
                                    metric.icon;

                                return (
                                    <div
                                        key={
                                            metric.label
                                        }
                                        className="min-w-0 rounded-xl bg-white/15 px-2.5 py-2.5 shadow-sm backdrop-blur sm:rounded-2xl sm:px-3 sm:py-3"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Icon className="h-3.5 w-3.5 shrink-0 text-white/75" />

                                            <p className="truncate text-[9px] font-black uppercase text-white/70 sm:text-[10px]">
                                                {
                                                    metric.label
                                                }
                                            </p>
                                        </div>

                                        <p className="mt-1 truncate text-[11px] font-black text-white sm:text-xs">
                                            {
                                                metric.value
                                            }
                                        </p>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HelpHero;
