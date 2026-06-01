import { FileText } from "lucide-react";
import type { LessonItemReviewState } from "../hook";
import { getBlockDescription } from "../utils";
import { ForumReviewPanel } from "./ForumReviewPanel";
import { HomeworkReviewPanel } from "./HomeworkReviewPanel";
import { QuizReviewPanel } from "./QuizReviewPanel";
import { SurveyReviewPanel } from "./SurveyReviewPanel";

type PreviewPanelProps = {
    review: LessonItemReviewState;
};

export function PreviewPanel({ review }: PreviewPanelProps) {
    const description = getBlockDescription(review.block);

    return (
        <main className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {description ? (
                <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Instrucciones
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                        {description}
                    </p>
                </div>
            ) : null}

            {review.itemType === "homework" ? (
                <HomeworkReviewPanel row={review.selectedRow} />
            ) : null}

            {review.itemType === "quiz" ? (
                <QuizReviewPanel row={review.selectedRow} block={review.block} />
            ) : null}

            {review.itemType === "survey" ? (
                <SurveyReviewPanel rows={review.rows} />
            ) : null}

            {review.itemType === "forum" ? (
                <ForumReviewPanel row={review.selectedRow} />
            ) : null}

            {!["homework", "quiz", "survey", "forum"].includes(review.itemType) ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <FileText className="mx-auto h-10 w-10 text-slate-400" />

                    <p className="mt-3 text-sm font-black text-slate-700">
                        No hay contenido de revisión disponible.
                    </p>
                </div>
            ) : null}
        </main>
    );
}

export default PreviewPanel;