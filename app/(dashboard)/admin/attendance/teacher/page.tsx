import { TeacherAttendanceWorkspace } from "@/components/teacher/attendance/view";

export default function AdminTeacherAttendancePage() {
    return (
        <TeacherAttendanceWorkspace
            isAdminRoute
            attendanceRoleId={3}
            basePath="/admin/attendance/teacher"
            moduleLabel="Asistencia profesor"
            moduleTitle="Asistencia de profesores"
            moduleDescription="Selecciona un curso para crear sesiones de asistencia para docentes y consultar únicamente los registros con rol de profesor."
        />
    );
}