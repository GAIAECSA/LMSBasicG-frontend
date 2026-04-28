import { TeacherQuizGradesView } from "@/components/teacher/teacher-quiz-grades-view";

type TeacherCourseGradesPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function TeacherCourseGradesPage({
    params,
}: TeacherCourseGradesPageProps) {
    const { courseId } = await params;

    return <TeacherQuizGradesView courseId={courseId} />;
}