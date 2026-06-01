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

export function LessonItemReviewPage({
    courseId,
    itemId,
}: LessonItemReviewPageProps) {
    const review = useLessonItemReview({ courseId, itemId });

    if (review.loading) {
        return (
            <section className="min-h-screen w-full bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1480px] space-y-5">
                    <Toolbar
                        backHref={review.backHref}
                        editorHref={review.editorHref}
                        refreshing={review.refreshing}
                        onRefresh={review.loadData}
                    />
                    <Loading />
                </div>
            </section>
        );
    }

    if (review.error && !review.block) {
        return (
            <section className="min-h-screen w-full bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1480px] space-y-5">
                    <Toolbar
                        backHref={review.backHref}
                        editorHref={review.editorHref}
                        refreshing={review.refreshing}
                        onRefresh={review.loadData}
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
        <section className="min-h-screen w-full bg-slate-50 px-4 py-5 pb-10 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px] space-y-5">
                <Toolbar
                    backHref={review.backHref}
                    editorHref={review.editorHref}
                    refreshing={review.refreshing}
                    onRefresh={review.loadData}
                />

                <Header review={review} />

              {/*   {review.itemType === "survey" ? (
                    <SurveySelector review={review} />
                ) : null} */}

                {review.error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                        {review.error}
                    </div>
                ) : null}

                {review.notice ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                        {review.notice}
                    </div>
                ) : null}

                {review.rows.length === 0 ? (
                    <EmptyState />
                ) : review.itemType === "survey" ? (
                    <PreviewPanel review={review} />
                ) : (
                    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <PreviewPanel review={review} />

                        <aside className="xl:sticky xl:top-5">
                            <GradePanel review={review} />
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}

export default LessonItemReviewPage;