import {
    TeacherCoursePresentationView,
} from "@/components/teacher/course-presentation";

export const dynamic = "force-dynamic";

type TeacherCoursePresentationPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function TeacherCoursePresentationPage({
    params,
}: TeacherCoursePresentationPageProps) {
    const { courseId } = await params;

    return (
        <TeacherCoursePresentationView
            courseId={courseId}
        />
    );
}
