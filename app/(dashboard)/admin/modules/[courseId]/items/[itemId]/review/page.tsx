import { LessonItemReviewPage } from "@/components/teacher/lesson-item-review";

type AdminLessonItemReviewRouteProps = {
    params: Promise<{
        courseId: string;
        itemId: string;
    }>;
};

export default async function AdminLessonItemReviewRoute({
    params,
}: AdminLessonItemReviewRouteProps) {
    const { courseId, itemId } = await params;

    return <LessonItemReviewPage courseId={courseId} itemId={itemId} />;
}