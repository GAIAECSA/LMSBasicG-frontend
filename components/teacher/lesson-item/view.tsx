"use client";

import type { LessonItemEditorPageProps } from "./types";
import { useLessonItem } from "./hook";
import { Loading } from "./ui/Loading";
import { ErrorState } from "./ui/ErrorState";
import { Toolbar } from "./ui/Toolbar";
import { Header } from "./ui/Header";
import { Alerts } from "./ui/Alerts";
import { GeneralSection } from "./ui/GeneralSection";
import { TextSection } from "./ui/TextSection";
import { FileSection } from "./ui/FileSection";
import { VideoSection } from "./ui/VideoSection";
import { QuizSection } from "./ui/QuizSection";
import { SurveySection } from "./ui/SurveySection";
import { ForumSection } from "./ui/ForumSection";
import { SidePanel } from "./ui/SidePanel";

export function LessonItemEditorPage({
    courseId,
    itemId,
}: LessonItemEditorPageProps) {
    const item = useLessonItem({ courseId, itemId });

    const reviewHref = `${item.backHref}/items/${itemId}/review`;
    const formId = "lesson-item-editor-form";

    if (item.loading) {
        return (
            <section className="space-y-6">
                <Toolbar
                    backHref={item.backHref}
                    reviewHref={reviewHref}
                    itemType={item.itemType}
                    formId={formId}
                    saving={item.saving}
                />
            </section>
        );
    }

    if (!item.loading && item.error && !item.block) {
        return <ErrorState error={item.error} backHref={item.backHref} />;
    }

    if (!item.block) {
        return (
            <ErrorState
                error="No se encontró el bloque seleccionado."
                backHref={item.backHref}
            />
        );
    }

    return (
        <section className="space-y-6">
            <Toolbar
                backHref={item.backHref}
                reviewHref={reviewHref}
                itemType={item.itemType}
            />

            <Header
                block={item.block}
                form={item.form}
                itemType={item.itemType}
                itemTypeLabel={item.itemTypeLabel}
                reviewHref={reviewHref}
            />

            <Alerts error={item.error} notice={item.notice} />

            <form
                id={formId}
                onSubmit={item.handleSubmit}
                className="grid gap-6 xl:grid-cols-[1fr_330px]"
            >
                <div className="space-y-6">
                    <GeneralSection item={item} />
                    <TextSection item={item} />
                    <FileSection item={item} />
                    <VideoSection item={item} />
                    <QuizSection item={item} />
                    <SurveySection item={item} />
                    <ForumSection item={item} />
                </div>

                <SidePanel
                    item={item}
                    block={item.block}
                    reviewHref={reviewHref}
                />
            </form>
        </section>
    );
}

export default LessonItemEditorPage;