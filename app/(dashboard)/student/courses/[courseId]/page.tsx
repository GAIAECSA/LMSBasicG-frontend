import { StudentMoocCourseView } from "@/components/student/student-mooc-course-view";

type StudentCoursePageProps = {
    params: Promise<{
        courseId?: string;
        id?: string;
    }>;
};

export default async function StudentCoursePage({
    params,
}: StudentCoursePageProps) {
    const resolvedParams = await params;

    const courseId = resolvedParams.courseId ?? resolvedParams.id ?? "";

    return <StudentMoocCourseView courseId={courseId} />;
}