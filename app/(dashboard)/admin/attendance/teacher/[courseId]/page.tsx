import { TeacherAttendanceWorkspace } from "@/components/teacher/attendance/view";

type PageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function AdminTeacherAttendanceCoursePage({
    params,
}: PageProps) {
    const { courseId } = await params;

    return (
        <TeacherAttendanceWorkspace
            isAdminRoute
            courseId={courseId}
            attendanceRoleId={3}
            basePath="/admin/attendance/teacher"
            moduleLabel="Asistencia profesor"
            moduleTitle="Asistencia de profesores"
            moduleDescription="Crea sesiones de asistencia para docentes y consulta únicamente los registros con rol de profesor."
        />
    );
}