import { Users } from "lucide-react";
import type { LessonItemReviewState } from "../hook";
import { StudentSubmissionCard } from "./StudentSubmissionCard";

type StudentsPanelProps = {
    review: LessonItemReviewState;
    compact?: boolean;
};

export function StudentsPanel({
    review,
    compact = false,
}: StudentsPanelProps) {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-5 [@media(max-height:760px)]:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 sm:text-xs sm:tracking-[0.16em]">
                        Estudiantes
                    </p>

                    <h2 className="mt-1 text-base font-black text-slate-950 sm:text-lg">
                        Lista de revisión
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        Selecciona un estudiante.
                    </p>
                </div>
            </div>

            <div
                className={`mt-4 space-y-2 overflow-y-auto pr-1 sm:mt-5 sm:space-y-3 ${
                    compact
                        ? "max-h-[240px] sm:max-h-[310px] [@media(max-height:760px)]:max-h-[220px]"
                        : "max-h-[520px] sm:max-h-[680px] [@media(max-height:760px)]:max-h-[360px]"
                }`}
            >
                {review.rows.map((row) => (
                    <StudentSubmissionCard
                        key={row.id}
                        row={row}
                        selected={
                            review.selectedRow?.enrollmentId ===
                            row.enrollmentId
                        }
                        onSelect={() =>
                            review.setSelectedEnrollmentId(
                                row.enrollmentId,
                            )
                        }
                    />
                ))}
            </div>
        </div>
    );
}

export default StudentsPanel;
