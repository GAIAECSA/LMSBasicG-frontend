import type {
    Attendance,
    AttendanceState,
    CourseAttendance,
} from "@/services/attendance.service";
import { ATTENDANCE_STATUS_OPTIONS, DEFAULT_ATTENDANCE_STATE } from "./constants";
import type { AttendanceFormState } from "./types";

export function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

export function getCurrentTime() {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

export function getDefaultEndTime() {
    const date = new Date();

    date.setHours(date.getHours() + 1);

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

export function normalizeTimeForApi(value: string) {
    if (!value) return "00:00:00.000Z";

    if (value.includes("T")) {
        return value;
    }

    if (/^\d{2}:\d{2}$/.test(value)) {
        return `${value}:00.000Z`;
    }

    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
        return `${value}.000Z`;
    }

    return value;
}

export function normalizeTimeForInput(value: string) {
    if (!value) return "";

    const cleanValue = String(value).trim();

    if (/^\d{2}:\d{2}/.test(cleanValue)) {
        return cleanValue.slice(0, 5);
    }

    const date = new Date(cleanValue);

    if (!Number.isNaN(date.getTime())) {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${hours}:${minutes}`;
    }

    return "";
}

export function formatDate(value: string) {
    if (!value) return "Sin fecha";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

export function formatTime(value: string) {
    if (!value) return "--:--";

    const inputTime = normalizeTimeForInput(value);

    return inputTime || value;
}

export function getStudentName(attendance: Attendance) {
    const user = attendance.enrollment?.user;

    if (!user) return `Matrícula #${attendance.enrollment_id}`;

    const fullName = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

    return fullName || `Usuario #${user.id}`;
}

export function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "ES";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function getStatusOption(status: AttendanceState) {
    return (
        ATTENDANCE_STATUS_OPTIONS.find((option) => option.value === status) ??
        ATTENDANCE_STATUS_OPTIONS.find(
            (option) => option.value === DEFAULT_ATTENDANCE_STATE,
        ) ??
        ATTENDANCE_STATUS_OPTIONS[0]
    );
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

export function buildInitialForm(): AttendanceFormState {
    return {
        day: getTodayDate(),
        start_time: getCurrentTime(),
        end_time: getDefaultEndTime(),
    };
}

export function buildFormFromSession(
    session: CourseAttendance,
): AttendanceFormState {
    return {
        day: session.day,
        start_time: normalizeTimeForInput(session.start_time),
        end_time: normalizeTimeForInput(session.end_time),
    };
}

export function sortSessionsByDateDesc(sessions: CourseAttendance[]) {
    return [...sessions].sort((a, b) => {
        const dateA = `${a.day} ${a.start_time}`;
        const dateB = `${b.day} ${b.start_time}`;

        return dateB.localeCompare(dateA);
    });
}

export function sortAttendancesByStudent(attendances: Attendance[]) {
    return [...attendances].sort((a, b) =>
        getStudentName(a).localeCompare(getStudentName(b)),
    );
}