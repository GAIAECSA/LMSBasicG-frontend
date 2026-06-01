import { UserCheck } from "lucide-react";
import type { AttendanceSummary } from "../types";

type HeaderProps = {
    summary: AttendanceSummary;
};

export function Header({ summary }: HeaderProps) {
    return (
        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] px-6 py-8 text-white md:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                        <UserCheck className="h-3.5 w-3.5" />
                        Asistencia
                    </div>

                    <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
                        Asistencia del curso
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50 md:text-base">
                        Registra sesiones de asistencia y marca el estado de
                        cada estudiante matriculado.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    <HeaderMetric label="Total" value={summary.total} />
                    <HeaderMetric label="Presentes" value={summary.present} />
                    <HeaderMetric label="Ausentes" value={summary.absent} />
                    <HeaderMetric label="Atrasos" value={summary.late} />
                    <HeaderMetric label="Pendientes" value={summary.pending} />
                </div>
            </div>
        </div>
    );
}

function HeaderMetric({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20">
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-100">
                {label}
            </p>

            <p className="mt-1 text-2xl font-black text-white">{value}</p>
        </div>
    );
}