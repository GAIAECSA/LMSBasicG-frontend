import type { ReactNode } from "react";
import {
    BookOpen,
    ClipboardList,
    FileCheck2,
    Layers3,
} from "lucide-react";
import type { Course } from "@/services/courses.service";

type StatsProps = {
    course: Course | null;
    currentCourseId: number;
    groupedGradesLength: number;
    gradesLength: number;
    quizBlocksLength: number;
    homeworkBlocksLength: number;
    generatedCertificatesCount: number;
};

export function Stats({
    course,
    currentCourseId,
    groupedGradesLength,
    gradesLength,
    quizBlocksLength,
    homeworkBlocksLength,
    generatedCertificatesCount,
}: StatsProps) {
    return (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 [@media(max-height:760px)]:hidden">
            <StatCard
                icon={<BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />}
                iconClassName="bg-blue-50 text-[#172861]"
                label="Curso actual"
                value={course?.name || `Curso #${currentCourseId}`}
            />

            <StatCard
                icon={<Layers3 className="h-4 w-4 sm:h-5 sm:w-5" />}
                iconClassName="bg-emerald-50 text-emerald-700"
                label="Matrículas con respuestas"
                value={groupedGradesLength}
            />

            <StatCard
                icon={<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />}
                iconClassName="bg-orange-50 text-orange-700"
                label="Respuestas recibidas"
                value={gradesLength}
                subtitle={`${quizBlocksLength} pruebas · ${homeworkBlocksLength} tareas`}
            />

            <StatCard
                icon={<FileCheck2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                iconClassName="bg-slate-100 text-slate-700"
                label="Certificados generados"
                value={generatedCertificatesCount}
            />
        </div>
    );
}

function StatCard({
    icon,
    iconClassName,
    label,
    value,
    subtitle,
}: {
    icon: ReactNode;
    iconClassName: string;
    label: string;
    value: string | number;
    subtitle?: string;
}) {
    return (
        <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl ${iconClassName}`}
                >
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 sm:text-xs sm:tracking-[0.12em]">
                        {label}
                    </p>

                    <p
                        title={String(value)}
                        className="mt-1 truncate text-xs font-bold text-slate-950 sm:text-sm"
                    >
                        {value}
                    </p>

                    {subtitle ? (
                        <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400 sm:text-[11px]">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
