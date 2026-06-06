import type { ReactNode } from "react";
import {
    Award,
    CheckCircle2,
    EyeOff,
} from "lucide-react";

type HeroProps = {
    total: number;
    active: number;
    deleted: number;
};

export function Hero({
    total,
    active,
    deleted,
}: HeroProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 sm:text-xs">
                        <Award className="h-3.5 w-3.5" />
                        Certificados MDT
                    </div>

                    <h1 className="mt-3 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-2xl">
                        Gestión de certificados MDT
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-blue-50 sm:text-sm sm:leading-6">
                        Consulta, carga y administra los certificados asociados al curso.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[520px] lg:shrink-0">
                    <Metric
                        icon={<Award className="h-4 w-4" />}
                        label="Total"
                        value={total}
                    />

                    <Metric
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Activos"
                        value={active}
                    />

                    <Metric
                        icon={<EyeOff className="h-4 w-4" />}
                        label="Ocultos"
                        value={deleted}
                    />
                </div>
            </div>
        </section>
    );
}

function Metric({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
            <div className="flex items-center gap-1.5 text-blue-100">
                {icon}

                <p className="truncate text-[9px] font-black uppercase tracking-wide sm:text-[10px]">
                    {label}
                </p>
            </div>

            <p className="mt-2 text-xl font-black text-white sm:text-2xl [@media(max-height:760px)]:text-xl">
                {value}
            </p>
        </div>
    );
}
