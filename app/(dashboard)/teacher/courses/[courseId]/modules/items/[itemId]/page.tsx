import { LessonItemEditorPage } from "@/components/teacher/lesson-item-editor";

export default async function TeacherLessonItemEditorRoutePage({
    params,
}: {
    params: Promise<{ courseId: string; itemId: string }>;
}) {
    const { courseId, itemId } = await params;

    return <LessonItemEditorPage courseId={courseId} itemId={itemId} />;
}