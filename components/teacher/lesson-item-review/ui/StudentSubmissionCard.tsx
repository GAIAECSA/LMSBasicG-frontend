import { CheckCircle2, Clock3, FileCheck2, UserRound } from "lucide-react";
import type { ReviewStudentRow } from "../types";
import { formatDate } from "../utils";

type StudentSubmissionCardProps = {
    row: ReviewStudentRow;
    selected: boolean;
    onSelect: () => void;
};

function getStatusClass(status: ReviewStudentRow["status"]) {
    if (status === "calificado") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    }

    if (status === "entregado" || status === "revisado") {
        return "bg-blue-50 text-blue-700 ring-blue-100";
    }

    return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function StudentSubmissionCard({
    row,
    selected,
    onSelect,
}: StudentSubmissionCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${selected
                    ? "border-[#172861] bg-blue-50 ring-4 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50"
                }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${row.hasSubmission
                            ? "bg-blue-100 text-[#172861]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                >
                    {row.hasSubmission ? (
                        <FileCheck2 className="h-5 w-5" />
                    ) : (
                        <UserRound className="h-5 w-5" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">
                        {row.studentName}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] ring-1 ${getStatusClass(row.status)}`}
                        >
                            {row.statusLabel}
                        </span>

                        {row.score !== null && row.score !== undefined && row.score !== "" ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700 ring-1 ring-amber-100">
                                Nota: {row.score}
                            </span>
                        ) : null}
                    </div>

                    <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
                        {row.hasSubmission ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                        )}

                        {row.submittedAt
                            ? formatDate(row.submittedAt)
                            : "Sin fecha de entrega"}
                    </p>
                </div>
            </div>
        </button>
    );
}

export default StudentSubmissionCard;