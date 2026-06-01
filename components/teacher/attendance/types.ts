import type {
    AttendanceState,
} from "@/services/attendance.service";

export type TeacherAttendanceWorkspaceProps = {
    courseId?: string | number | null;
    isAdminRoute?: boolean;
    attendanceRoleId?: number;
    moduleTitle?: string;
    moduleDescription?: string;
    moduleLabel?: string;
    basePath?: string;
};

export type AttendanceModalMode = "create" | "edit";

export type AttendanceFormState = {
    day: string;
    start_time: string;
    end_time: string;
};

export type StatusOption = {
    value: AttendanceState;
    label: string;
    className: string;
};

export type AttendanceSummary = {
    total: number;
    present: number;
    absent: number;
    late: number;
    pending: number;
    justified: number;
};