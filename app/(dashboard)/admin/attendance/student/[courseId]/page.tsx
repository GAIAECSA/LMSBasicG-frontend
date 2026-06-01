import { TeacherAttendanceWorkspace } from "@/components/teacher/attendance/view";

type PageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function AdminStudentAttendanceCoursePage({
    params,
}: PageProps) {
    const { courseId } = await params;

    return (
        <TeacherAttendanceWorkspace
            isAdminRoute
            courseId={courseId}
            attendanceRoleId={4}
            basePath="/admin/attendance/student"
            moduleLabel="Asistencia estudiante"
            moduleTitle="Asistencia de estudiantes"
            moduleDescription="Crea sesiones de asistencia y consulta únicamente los registros de estudiantes matriculados."
        />
    );
}