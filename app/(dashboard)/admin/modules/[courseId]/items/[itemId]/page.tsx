import { LessonItemEditorPage } from "@/components/teacher/lesson-item";

export default async function AdminModuleLessonItemEditorRoutePage({
    params,
}: {
    params: Promise<{
        courseId: string;
        itemId: string;
    }>;
}) {
    const { courseId, itemId } = await params;

    return <LessonItemEditorPage courseId={courseId} itemId={itemId} />;
}