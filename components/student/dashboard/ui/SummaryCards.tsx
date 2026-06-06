import Link from "next/link";
import {
    BookOpen,
    CheckCircle2,
    Clock3,
    GraduationCap,
} from "lucide-react";
import type { ReactNode } from "react";
import type { StudentDashboardSummary } from "../types";
import { STUDENT_LINKS } from "../constants";

type SummaryCardsProps = {
    summary: StudentDashboardSummary;
};

export function SummaryCards({
    summary,
}: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 sm:gap-3">
            <SummaryCard
                icon={<BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Matrículas"
                value={summary.enrolled}
                helper="Total registradas"
                href={STUDENT_LINKS.courses}
            />

            <SummaryCard
                icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Cursos activos"
                value={summary.approved}
                helper="Listos para ingresar"
                href={STUDENT_LINKS.courses}
            />

            <SummaryCard
                icon={<Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Pendientes"
                value={summary.pending}
                helper="En revisión"
                href={STUDENT_LINKS.courses}
            />

            <SummaryCard
                icon={<GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Certificados"
                value="Ver"
                helper="Mis certificados"
                href={summary.certificatesHref}
            />
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    helper,
    href,
}: {
    icon: ReactNode;
    label: string;
    value: number | string;
    helper: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md active:scale-[0.98] sm:rounded-2xl sm:p-4"
        >
            <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] transition group-hover:bg-[#172861] group-hover:text-white sm:h-10 sm:w-10 sm:rounded-2xl">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 sm:text-xs">
                        {label}
                    </p>

                    <p className="mt-0.5 text-lg font-black text-slate-950 sm:text-xl">
                        {value}
                    </p>

                    <p className="truncate text-[10px] font-semibold text-slate-400 sm:text-xs">
                        {helper}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default SummaryCards;
