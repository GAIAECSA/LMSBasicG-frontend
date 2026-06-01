import { TeacherAttendanceWorkspace } from "@/components/teacher/attendance/view";

export default function AdminStudentAttendancePage() {
    return (
        <TeacherAttendanceWorkspace
            isAdminRoute
            attendanceRoleId={4}
            basePath="/admin/attendance/student"
            moduleLabel="Asistencia estudiante"
            moduleTitle="Asistencia de estudiantes"
            moduleDescription="Selecciona un curso para crear sesiones de asistencia y consultar únicamente los registros de estudiantes matriculados."
        />
    );
}