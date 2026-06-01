import { TeacherMyAttendanceView } from "@/components/teacher/my-attendance/view";

type PageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function TeacherMyAttendancePage({ params }: PageProps) {
    const { courseId } = await params;

    return <TeacherMyAttendanceView courseId={courseId} />;
}