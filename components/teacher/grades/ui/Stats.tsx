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
        <div className="grid gap-4 md:grid-cols-4">
            <StatCard
                icon={<BookOpen className="h-5 w-5" />}
                iconClassName="bg-blue-50 text-[#172861]"
                label="Curso actual"
                value={course?.name || `Curso #${currentCourseId}`}
            />

            <StatCard
                icon={<Layers3 className="h-5 w-5" />}
                iconClassName="bg-emerald-50 text-emerald-700"
                label="Matrículas con respuestas"
                value={groupedGradesLength}
            />

            <StatCard
                icon={<ClipboardList className="h-5 w-5" />}
                iconClassName="bg-orange-50 text-orange-700"
                label="Respuestas recibidas"
                value={gradesLength}
                subtitle={`${quizBlocksLength} pruebas · ${homeworkBlocksLength} tareas`}
            />

            <StatCard
                icon={<FileCheck2 className="h-5 w-5" />}
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
    icon: React.ReactNode;
    iconClassName: string;
    label: string;
    value: string | number;
    subtitle?: string;
}) {
    return (
        <div className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconClassName}`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        {label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                        {value}
                    </p>

                    {subtitle ? (
                        <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}