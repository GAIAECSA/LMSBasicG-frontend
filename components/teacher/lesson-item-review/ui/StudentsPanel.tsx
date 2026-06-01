import { Users } from "lucide-react";
import type { LessonItemReviewState } from "../hook";
import { StudentSubmissionCard } from "./StudentSubmissionCard";

type StudentsPanelProps = {
    review: LessonItemReviewState;
    compact?: boolean;
};

export function StudentsPanel({ review, compact = false }: StudentsPanelProps) {
    return (
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#172861]">
                    <Users className="h-5 w-5" />
                </div>

                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                        Estudiantes
                    </p>

                    <h2 className="mt-1 text-lg font-black text-slate-950">
                        Lista de revisión
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Selecciona un estudiante.
                    </p>
                </div>
            </div>

            <div
                className={`mt-5 space-y-3 overflow-y-auto pr-1 ${compact ? "max-h-[310px]" : "max-h-[680px]"
                    }`}
            >
                {review.rows.map((row) => (
                    <StudentSubmissionCard
                        key={row.id}
                        row={row}
                        selected={review.selectedRow?.enrollmentId === row.enrollmentId}
                        onSelect={() => review.setSelectedEnrollmentId(row.enrollmentId)}
                    />
                ))}
            </div>
        </div>
    );
}

export default StudentsPanel;