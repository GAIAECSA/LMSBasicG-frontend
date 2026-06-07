import {
    StudentEnrollmentView,
} from "@/components/student/enrollment";

type StudentEnrollmentPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function StudentEnrollmentPage({
    params,
}: StudentEnrollmentPageProps) {
    const { courseId } = await params;

    return (
        <StudentEnrollmentView
            courseId={courseId}
        />
    );
}
