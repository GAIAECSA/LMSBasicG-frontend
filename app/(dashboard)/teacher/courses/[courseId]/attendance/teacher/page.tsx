import { TeacherAttendanceWorkspace } from "@/components/teacher/attendance/view";

type PageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function TeacherTeacherAttendancePage({
    params,
}: PageProps) {
    const { courseId } = await params;

    return (
        <TeacherAttendanceWorkspace
            courseId={courseId}
            attendanceRoleId={3}
            basePath={`/teacher/courses/${courseId}/attendance/teacher`}
            moduleLabel="Asistencia Docente"
            moduleTitle="Asistencia de docentes"
            moduleDescription="Crea sesiones de asistencia para docentes y consulta únicamente los registros con rol de profesor."
        />
    );
}