import {
    CheckCircle2,
    Clock3,
    FileCheck2,
    UserRound,
} from "lucide-react";
import type { ReviewStudentRow } from "../types";
import { formatDate } from "../utils";

type StudentSubmissionCardProps = {
    row: ReviewStudentRow;
    selected: boolean;
    onSelect: () => void;
};

function getStatusClass(
    status: ReviewStudentRow["status"],
) {
    if (status === "calificado") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    }

    if (
        status === "entregado" ||
        status === "revisado"
    ) {
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
            className={`w-full min-w-0 rounded-xl border p-3 text-left shadow-sm transition active:scale-[0.99] sm:rounded-2xl sm:p-4 ${
                selected
                    ? "border-[#172861] bg-blue-50 ring-2 ring-blue-100 sm:ring-4"
                    : "border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50"
            }`}
        >
            <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${
                        row.hasSubmission
                            ? "bg-blue-100 text-[#172861]"
                            : "bg-slate-100 text-slate-500"
                    }`}
                >
                    {row.hasSubmission ? (
                        <FileCheck2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                        <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p
                        title={row.studentName}
                        className="break-words text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere] sm:text-sm"
                    >
                        {row.studentName}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                        <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ring-1 sm:px-2.5 sm:py-1 sm:text-[10px] ${getStatusClass(
                                row.status,
                            )}`}
                        >
                            {row.statusLabel}
                        </span>

                        {row.score !== null &&
                        row.score !== undefined &&
                        row.score !== "" ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 ring-1 ring-amber-100 sm:px-2.5 sm:py-1 sm:text-[10px]">
                                Nota: {row.score}
                            </span>
                        ) : null}
                    </div>

                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold leading-4 text-slate-500 sm:mt-2 sm:text-xs">
                        {row.hasSubmission ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />
                        )}

                        <span className="break-words [overflow-wrap:anywhere]">
                            {row.submittedAt
                                ? formatDate(row.submittedAt)
                                : "Sin fecha de entrega"}
                        </span>
                    </p>
                </div>
            </div>
        </button>
    );
}

export default StudentSubmissionCard;
