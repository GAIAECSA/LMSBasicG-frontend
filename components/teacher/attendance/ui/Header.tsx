import { UserCheck } from "lucide-react";
import type { AttendanceSummary } from "../types";

type HeaderProps = {
    summary: AttendanceSummary;
};

export function Header({ summary }: HeaderProps) {
    return (
        <div className="bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6 lg:py-6 [@media(max-height:760px)]:py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100 sm:px-3 sm:text-xs sm:tracking-[0.18em]">
                        <UserCheck className="h-3.5 w-3.5" />
                        Asistencia
                    </div>

                    <h1 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                        Asistencia del curso
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                        Registra sesiones de asistencia y marca el estado de
                        cada estudiante matriculado.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
        <div className="rounded-xl bg-white/15 px-3 py-2.5 ring-1 ring-white/20 sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[9px] font-black uppercase tracking-wide text-blue-100 sm:text-[10px]">
                {label}
            </p>

            <p className="mt-1 text-xl font-black text-white sm:text-2xl">
                {value}
            </p>
        </div>
    );
}
