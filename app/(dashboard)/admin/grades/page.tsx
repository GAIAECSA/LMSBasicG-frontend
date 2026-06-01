import { TeacherQuizGradesView } from "@/components/teacher/teacher-grades";

type AdminCourseGradesPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function AdminCourseGradesPage({
    params,
}: AdminCourseGradesPageProps) {
    const { courseId } = await params;

    return <TeacherQuizGradesView courseId={courseId} />;
}