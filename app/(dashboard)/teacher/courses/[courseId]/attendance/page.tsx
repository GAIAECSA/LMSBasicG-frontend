import TeacherAttendanceWorkspace from "@/components/teacher/teacher-attendance";

type AttendancePageProps = {
    params:
    | {
        courseId: string;
    }
    | Promise<{
        courseId: string;
    }>;
};

export default async function AttendancePage({ params }: AttendancePageProps) {
    const { courseId } = await params;

    return <TeacherAttendanceWorkspace courseId={courseId} />;
}