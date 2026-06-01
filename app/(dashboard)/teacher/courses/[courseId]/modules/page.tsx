import { TeacherCourseModulesPage } from "@/components/teacher/course-modules";

export default async function TeacherCourseModulesRoutePage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;

    return <TeacherCourseModulesPage courseId={courseId} />;
}