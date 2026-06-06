import type { ReactNode } from "react";
import {
    FileCheck2,
    Layers3,
    ShieldCheck,
} from "lucide-react";

type HeroProps = {
    isAdminRoute: boolean;
    filesCount: number;
    lessonsCount: number;
};

export function Hero({
    isAdminRoute,
    filesCount,
    lessonsCount,
}: HeroProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 sm:text-xs">
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Archivos MDT
                    </div>

                    <h1 className="mt-3 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-2xl">
                        Gestión de archivos obligatorios
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-blue-50 sm:text-sm sm:leading-6">
                        {isAdminRoute
                            ? "Administra los documentos MDT requeridos para los estudiantes del curso."
                            : "Administra los documentos MDT que deberán subir los estudiantes del curso."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:w-[360px] lg:shrink-0">
                    <Metric
                        icon={<FileCheck2 className="h-4 w-4" />}
                        label="Archivos"
                        value={filesCount}
                    />

                    <Metric
                        icon={<Layers3 className="h-4 w-4" />}
                        label="Lecciones"
                        value={lessonsCount}
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
            <div className="flex items-center gap-2 text-blue-100">
                {icon}

                <p className="text-[10px] font-black uppercase tracking-wide sm:text-xs">
                    {label}
                </p>
            </div>

            <p className="mt-2 text-2xl font-black text-white sm:text-3xl [@media(max-height:760px)]:text-2xl">
                {value}
            </p>
        </div>
    );
}
