import type { CourseSummary } from "../types";

type CourseQuickSummaryProps = {
    course: CourseSummary;
};

export function CourseQuickSummary({
    course,
}: CourseQuickSummaryProps) {
    return (
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 xl:sticky xl:top-4">
            <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                Resumen rápido
            </h2>

            <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryItem
                    label="ID del curso"
                    value={`#${course.id}`}
                />

                <SummaryItem
                    label="Publicación"
                    value={
                        course.isPublished
                            ? "Visible"
                            : "Oculto"
                    }
                />

                <SummaryItem
                    label="Matrícula"
                    value={
                        course.openEnrollment
                            ? "Disponible"
                            : "No disponible"
                    }
                />

                <SummaryItem
                    label="Tipo"
                    value={
                        course.isFree
                            ? "Gratuito"
                            : "Pagado"
                    }
                />
            </div>
        </aside>
    );
}

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <span className="min-w-0 break-words text-xs font-bold text-[var(--muted-foreground)] sm:text-sm">
                {label}
            </span>

            <span className="shrink-0 text-xs font-black text-slate-900 sm:text-sm">
                {value}
            </span>
        </div>
    );
}

export default CourseQuickSummary;
