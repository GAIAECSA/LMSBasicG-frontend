import type { ReactNode } from "react";

import {
    CheckCircle2,
    FileCheck2,
    Files,
} from "lucide-react";

type EvidenceHeroProps = {
    total: number;
    submitted: number;
    approved: number;
};

export function EvidenceHero({
    total,
    submitted,
    approved,
}: EvidenceHeroProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* =========================
                    INFORMACIÓN
                ========================= */}
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 sm:text-xs">
                        <FileCheck2 className="h-3.5 w-3.5" />

                        Evidencia MDT
                    </div>

                    <h1 className="mt-3 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-2xl">
                        Entrega de evidencias
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-blue-50 sm:text-sm sm:leading-6">
                        Adjunta los documentos solicitados para completar
                        las evidencias requeridas del curso.
                    </p>
                </div>

                {/* =========================
                    MÉTRICAS
                ========================= */}
                <div className="grid grid-cols-1 gap-2 xs:grid-cols-3 sm:grid-cols-3 sm:gap-3 lg:w-[540px] lg:shrink-0">
                    <Summary
                        icon={
                            <Files className="h-4 w-4" />
                        }
                        label="Evidencias"
                        value={total}
                    />

                    <Summary
                        icon={
                            <FileCheck2 className="h-4 w-4" />
                        }
                        label="Entregadas"
                        value={submitted}
                    />

                    <Summary
                        icon={
                            <CheckCircle2 className="h-4 w-4" />
                        }
                        label="Aprobadas"
                        value={approved}
                    />
                </div>
            </div>
        </section>
    );
}

function Summary({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="min-w-0 rounded-xl bg-white/15 p-3 ring-1 ring-white/20 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 sm:rounded-2xl sm:p-4 [@media(max-height:760px)]:p-3">
            <div className="flex min-w-0 items-center gap-2 text-blue-100">
                <span className="shrink-0">
                    {icon}
                </span>

                <p className="truncate text-[10px] font-black uppercase tracking-wide sm:text-xs">
                    {label}
                </p>
            </div>

            <p className="mt-2 text-2xl font-black leading-none text-white sm:text-3xl [@media(max-height:760px)]:text-2xl">
                {value}
            </p>
        </div>
    );
}

export default EvidenceHero;