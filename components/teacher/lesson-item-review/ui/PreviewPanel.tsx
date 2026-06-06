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

export function PreviewPanel({
    review,
}: PreviewPanelProps) {
    const description =
        getBlockDescription(review.block);

    return (
        <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[30px] sm:p-5 lg:p-6 [@media(max-height:760px)]:p-4">
            {description ? (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mb-5 sm:rounded-3xl sm:p-4 [@media(max-height:760px)]:mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">
                        Instrucciones
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-xs font-semibold leading-5 text-slate-700 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                        {description}
                    </p>
                </div>
            ) : null}

            {review.itemType === "homework" ? (
                <HomeworkReviewPanel
                    row={review.selectedRow}
                />
            ) : null}

            {review.itemType === "quiz" ? (
                <QuizReviewPanel
                    row={review.selectedRow}
                    block={review.block}
                />
            ) : null}

            {review.itemType === "survey" ? (
                <SurveyReviewPanel rows={review.rows} />
            ) : null}

            {review.itemType === "forum" ? (
                <ForumReviewPanel
                    row={review.selectedRow}
                />
            ) : null}

            {![
                "homework",
                "quiz",
                "survey",
                "forum",
            ].includes(review.itemType) ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:rounded-2xl sm:p-8 [@media(max-height:760px)]:p-5">
                    <FileText className="mx-auto h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />

                    <p className="mt-3 text-xs font-black text-slate-700 sm:text-sm">
                        No hay contenido de revisión disponible.
                    </p>
                </div>
            ) : null}
        </main>
    );
}

export default PreviewPanel;
