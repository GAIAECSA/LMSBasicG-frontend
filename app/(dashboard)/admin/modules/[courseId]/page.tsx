import { TeacherCourseModulesPage } from "@/components/teacher/course-modules-workspace";

export default async function AdminModulesByCoursePage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;

    return <TeacherCourseModulesPage courseId={courseId} />;
}