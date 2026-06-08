"use client";

import type { LessonItemEditorPageProps } from "./types";
import { useLessonItem } from "./hook";
import { ErrorState } from "./ui/ErrorState";
import { Loading } from "./ui/Loading";
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

const PAGE_CONTAINER_CLASS =
    "mx-auto w-full max-w-[1480px] min-w-0 space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3";

export function LessonItemEditorPage({
    courseId,
    itemId,
}: LessonItemEditorPageProps) {
    const item = useLessonItem({ courseId, itemId });

    const reviewHref = `${item.backHref}/items/${itemId}/review`;
    const formId = "lesson-item-editor-form";

    /*
     * Para el contenido informativo, el botón de guardado se muestra
     * dentro de su propia sección.
     */
    const saveInsideContentSection = [
        "text",
        "image",
        "pdf",
        "video",
        "forum",
        "homework",
    ].includes(item.itemType);

    const isInformativeContent = [
        "text",
        "image",
        "pdf",
        "video",
    ].includes(item.itemType);

    const hideToolbarSaveButton = [
        "quiz",
        "survey",
    ].includes(item.itemType);

    if (item.loading) {
        return <Loading />;
    }

    if (!item.loading && item.error && !item.block) {
        return (
            <ErrorState
                error={item.error}
                backHref={item.backHref}
            />
        );
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
        <section className={PAGE_CONTAINER_CLASS}>
            <Toolbar
                backHref={item.backHref}
                reviewHref={reviewHref}
                itemType={item.itemType}
                formId={
                    saveInsideContentSection ||
                        hideToolbarSaveButton
                        ? undefined
                        : formId
                }
                saving={item.saving}
            />

            <Header
                block={item.block}
                form={item.form}
                itemType={item.itemType}
                itemTypeLabel={item.itemTypeLabel}
            />

            <Alerts error={item.error} />

            <form
                id={formId}
                onSubmit={item.handleSubmit}
                className={
                    isInformativeContent
                        ? "grid min-w-0 gap-3 sm:gap-4 lg:gap-5"
                        : "grid min-w-0 gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_320px]"
                }
            >
                <div className="min-w-0 space-y-3 sm:space-y-4 lg:space-y-5">
                    <GeneralSection item={item} />
                    <TextSection item={item} />
                    <FileSection item={item} />
                    <VideoSection item={item} />
                    <QuizSection item={item} />
                    <SurveySection item={item} />
                    <ForumSection item={item} />
                </div>

                {!isInformativeContent ? (
                    <SidePanel
                        item={item}
                        block={item.block}
                        reviewHref={reviewHref}
                    />
                ) : null}
            </form>
        </section>
    );
}

export default LessonItemEditorPage;
