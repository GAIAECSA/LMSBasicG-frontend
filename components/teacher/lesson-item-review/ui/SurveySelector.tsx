import Link from "next/link";
import {
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    ListChecks,
} from "lucide-react";
import type { LessonItemReviewState } from "../hook";
import { getBlockTitle } from "../utils";

type SurveySelectorProps = {
    review: LessonItemReviewState;
};

export function SurveySelector({
    review,
}: SurveySelectorProps) {
    if (
        review.itemType !== "survey" ||
        review.surveyBlocks.length === 0
    ) {
        return null;
    }

    return (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[24px]">
            <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:px-5 sm:py-4">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] sm:h-10 sm:w-10">
                        <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#172861] sm:text-xs sm:tracking-[0.15em]">
                            Encuestas del curso
                        </p>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                            Selecciona una encuesta para
                            revisar sus respuestas.
                        </p>
                    </div>
                </div>

                <span className="inline-flex w-fit shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-[#172861] sm:ml-auto sm:px-3 sm:text-xs">
                    {review.surveyBlocks.length}{" "}
                    {review.surveyBlocks.length === 1
                        ? "encuesta"
                        : "encuestas"}
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {review.surveyBlocks.map(
                    (surveyBlock, index) => {
                        const active =
                            surveyBlock.id ===
                            review.numericItemId;

                        return (
                            <Link
                                key={surveyBlock.id}
                                href={`/teacher/courses/${review.courseId}/modules/items/${surveyBlock.id}/review`}
                                className={`group flex min-w-0 items-center gap-2.5 px-4 py-3 transition sm:gap-4 sm:px-5 sm:py-4 ${
                                    active
                                        ? "bg-[#172861] text-white"
                                        : "bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                                        active
                                            ? "bg-white/15 text-white"
                                            : "bg-blue-50 text-[#172861]"
                                    }`}
                                >
                                    <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`text-[10px] font-black uppercase tracking-[0.1em] sm:text-[11px] sm:tracking-[0.12em] ${
                                            active
                                                ? "text-blue-100"
                                                : "text-blue-700"
                                        }`}
                                    >
                                        Encuesta{" "}
                                        {index + 1}
                                    </p>

                                    <p
                                        title={getBlockTitle(
                                            surveyBlock,
                                        )}
                                        className={`mt-1 truncate text-xs font-black sm:text-sm ${
                                            active
                                                ? "text-white"
                                                : "text-slate-950"
                                        }`}
                                    >
                                        {getBlockTitle(
                                            surveyBlock,
                                        )}
                                    </p>
                                </div>

                                {active ? (
                                    <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-black text-emerald-100 xs:inline-flex sm:px-3 sm:text-[11px]">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Seleccionada
                                    </span>
                                ) : (
                                    <span className="hidden shrink-0 text-xs font-bold text-slate-400 lg:inline">
                                        Ver respuestas
                                    </span>
                                )}

                                <ChevronRight
                                    className={`h-4 w-4 shrink-0 transition sm:h-5 sm:w-5 ${
                                        active
                                            ? "text-white"
                                            : "text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#172861]"
                                    }`}
                                />
                            </Link>
                        );
                    },
                )}
            </div>
        </section>
    );
}

export default SurveySelector;
