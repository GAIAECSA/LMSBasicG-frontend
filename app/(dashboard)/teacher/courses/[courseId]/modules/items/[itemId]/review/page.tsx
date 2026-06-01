import { LessonItemReviewPage } from "@/components/teacher/lesson-item-review";

type TeacherLessonItemReviewRouteProps = {
    params: Promise<{
        courseId: string;
        itemId: string;
    }>;
};

export default async function TeacherLessonItemReviewRoute({
    params,
}: TeacherLessonItemReviewRouteProps) {
    const { courseId, itemId } = await params;

    return (
        <LessonItemReviewPage
            courseId={courseId}
            itemId={itemId}
        />
    );
}