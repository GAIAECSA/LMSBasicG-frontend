"use client";

import type { LessonItemReviewPageProps } from "./types";
import { useLessonItemReview } from "./hook";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { GradePanel } from "./ui/GradePanel";
import { Header } from "./ui/Header";
import { Loading } from "./ui/Loading";
import { PreviewPanel } from "./ui/PreviewPanel";
import { SurveySelector } from "./ui/SurveySelector";
import { Toolbar } from "./ui/Toolbar";

const PAGE_CLASS =
    "min-h-screen w-full bg-slate-50 px-3 py-3 pb-8 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3";

const CONTAINER_CLASS =
    "mx-auto w-full max-w-[1480px] min-w-0 space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3";

export function LessonItemReviewPage({
    courseId,
    itemId,
}: LessonItemReviewPageProps) {
    const review = useLessonItemReview({ courseId, itemId });

    if (review.loading) {
        return <Loading />;
    }

    if (review.error && !review.block) {
        return (
            <section className={PAGE_CLASS}>
                <div className={CONTAINER_CLASS}>
                    <Toolbar
                        backHref={review.backHref}
                        editorHref={review.editorHref}
                        refreshing={review.refreshing}
                        onRefresh={review.handleRefresh}
                    />

                    <ErrorState
                        title="No se pudo cargar la revisión"
                        message={review.error}
                    />
                </div>
            </section>
        );
    }

    return (
        <section className={PAGE_CLASS}>
            <div className={CONTAINER_CLASS}>
                <Toolbar
                    backHref={review.backHref}
                    editorHref={review.editorHref}
                    refreshing={review.refreshing}
                    onRefresh={review.handleRefresh}
                />

                <Header review={review} />

                <SurveySelector review={review} />

                {review.error ? (
                    <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                        {review.error}
                    </div>
                ) : null}

                {review.rows.length === 0 ? (
                    <EmptyState />
                ) : review.itemType === "survey" ? (
                    <PreviewPanel review={review} />
                ) : (
                    <div className="grid min-w-0 items-start gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
                        <PreviewPanel review={review} />

                        <aside className="min-w-0 xl:sticky xl:top-3">
                            <GradePanel review={review} />
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}

export default LessonItemReviewPage;
