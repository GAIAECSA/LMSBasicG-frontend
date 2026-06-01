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

export function SurveySelector({ review }: SurveySelectorProps) {
    if (
        review.itemType !== "survey" ||
        review.surveyBlocks.length === 0
    ) {
        return null;
    }

    return (
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861]">
                    <ClipboardList className="h-5 w-5" />
                </div>

                <div>
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-[#172861]">
                        Encuestas del curso
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Selecciona una encuesta para revisar sus respuestas.
                    </p>
                </div>

                <span className="ml-auto inline-flex shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#172861]">
                    {review.surveyBlocks.length}{" "}
                    {review.surveyBlocks.length === 1
                        ? "encuesta"
                        : "encuestas"}
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {review.surveyBlocks.map((surveyBlock, index) => {
                    const active =
                        surveyBlock.id === review.numericItemId;

                    return (
                        <Link
                            key={surveyBlock.id}
                            href={`/teacher/courses/${review.courseId}/modules/items/${surveyBlock.id}/review`}
                            className={`group flex items-center gap-4 px-5 py-4 transition ${active
                                    ? "bg-[#172861] text-white"
                                    : "bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active
                                        ? "bg-white/15 text-white"
                                        : "bg-blue-50 text-[#172861]"
                                    }`}
                            >
                                <ListChecks className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-[11px] font-black uppercase tracking-[0.12em] ${active
                                            ? "text-blue-100"
                                            : "text-blue-700"
                                        }`}
                                >
                                    Encuesta {index + 1}
                                </p>

                                <p
                                    className={`mt-1 truncate text-sm font-black ${active
                                            ? "text-white"
                                            : "text-slate-950"
                                        }`}
                                >
                                    {getBlockTitle(surveyBlock)}
                                </p>
                            </div>

                            {active ? (
                                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-black text-emerald-100">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Seleccionada
                                </span>
                            ) : (
                                <span className="hidden shrink-0 text-xs font-bold text-slate-400 sm:inline">
                                    Ver respuestas
                                </span>
                            )}

                            <ChevronRight
                                className={`h-5 w-5 shrink-0 transition ${active
                                        ? "text-white"
                                        : "text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#172861]"
                                    }`}
                            />
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

export default SurveySelector;