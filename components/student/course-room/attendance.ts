"use client";

import {
    getAttendancesByEnrollment,
    getCourseAttendancesByCourse,
    updateAttendance,
    type AttendanceWithEnrollmentResponse,
    type CourseAttendance,
} from "@/services/attendance.service";
import type {
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
} from "./types";

function getString(value: unknown) {
    return typeof value === "string" ? value : "";
}

function getNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
        const parsedValue = Number(value);

        if (Number.isFinite(parsedValue)) return parsedValue;
    }

    return 0;
}

function getBoolean(value: unknown) {
    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
        const normalizedValue = value.trim().toLowerCase();

        if (
            ["true", "1", "yes", "si", "sí", "active", "open", "abierta"].includes(
                normalizedValue,
            )
        ) {
            return true;
        }

        if (
            ["false", "0", "no", "inactive", "closed", "cerrada"].includes(
                normalizedValue,
            )
        ) {
            return false;
        }
    }

    if (typeof value === "number") return value === 1;

    return undefined;
}

function isDateOnly(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function cleanTime(value: string) {
    return value.trim().replace(/Z$/, "");
}

function joinDateAndTime(day: string, time: string) {
    const cleanDay = day.trim();
    const cleanTimeValue = cleanTime(time);

    if (!cleanDay && !cleanTimeValue) return "";

    if (cleanTimeValue.includes("T")) return cleanTimeValue;

    if (cleanDay.includes("T") && !cleanTimeValue) return cleanDay;

    if (cleanDay && cleanTimeValue) {
        const datePart = cleanDay.includes("T")
            ? cleanDay.split("T")[0]
            : cleanDay;

        return `${datePart}T${cleanTimeValue}`;
    }

    if (cleanDay) return cleanDay;

    return cleanTimeValue;
}

function getTimestamp(value?: string | null) {
    if (!value) return 0;

    const dateValue = isDateOnly(value) ? `${value}T00:00:00` : value;
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return 0;

    return date.getTime();
}

function formatShortDate(value: string) {
    if (!value) return "";

    const dateValue = isDateOnly(value) ? `${value}T00:00:00` : value;
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
    }).format(date);
}

function toBackendAttendanceState(status?: AttendanceStatus) {
    if (status === "absent") return "absent";
    if (status === ("pending" as AttendanceStatus)) return "pending";

    return "present";
}

export function normalizeAttendanceStatus(value: unknown): AttendanceStatus {
    const normalizedValue = String(value ?? "").trim().toLowerCase();

    if (
        [
            "pendiente",
            "pending",
            "sin registrar",
            "sin_registrar",
            "no registrado",
            "no_registrado",
        ].includes(normalizedValue)
    ) {
        return "pending" as AttendanceStatus;
    }

    if (
        [
            "presente",
            "present",
            "asistió",
            "asistio",
            "registrado",
            "registrada",
        ].includes(normalizedValue)
    ) {
        return "present";
    }

    if (
        [
            "ausente",
            "absent",
            "falta",
            "faltó",
            "falto",
        ].includes(normalizedValue)
    ) {
        return "absent";
    }

    return "pending" as AttendanceStatus;
}

export function normalizeAttendanceSession(value: unknown): AttendanceSession {
    const record =
        value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : {};

    const id =
        getNumber(record.id) ||
        getNumber(record.course_attendance_id) ||
        getNumber(record.courseAttendanceId) ||
        getNumber(record.session_id) ||
        getNumber(record.sessionId) ||
        getNumber(record.attendance_session_id) ||
        getNumber(record.attendanceSessionId);

    const day =
        getString(record.day) ||
        getString(record.date) ||
        getString(record.fecha) ||
        getString(record.starts_at) ||
        getString(record.start_at);

    const startTime =
        getString(record.start_time) ||
        getString(record.startTime) ||
        getString(record.starts_at) ||
        getString(record.start_at);

    const endTime =
        getString(record.end_time) ||
        getString(record.endTime) ||
        getString(record.ends_at) ||
        getString(record.end_at);

    const startsAt =
        getString(record.starts_at) ||
        getString(record.start_at) ||
        joinDateAndTime(day, startTime);

    const endsAt =
        getString(record.ends_at) ||
        getString(record.end_at) ||
        joinDateAndTime(day, endTime);

    const status =
        getString(record.status) ||
        getString(record.estado) ||
        getString(record.session_status) ||
        "abierta";

    const activeFlag =
        getBoolean(record.is_active) ??
        getBoolean(record.active) ??
        getBoolean(record.isOpen) ??
        getBoolean(record.is_open) ??
        getBoolean(record.open) ??
        getBoolean(status);

    const title =
        getString(record.title) ||
        getString(record.name) ||
        getString(record.topic) ||
        getString(record.titulo) ||
        `Asistencia ${formatShortDate(day) || id}`.trim();

    return {
        id,
        course_id: getNumber(record.course_id) || getNumber(record.courseId),
        title,
        description:
            getString(record.description) ||
            getString(record.descripcion) ||
            getString(record.detail) ||
            getString(record.details),
        starts_at: startsAt,
        ends_at: endsAt,
        status,
        is_active: activeFlag ?? true,
        requires_code:
            getBoolean(record.requires_code) ??
            getBoolean(record.requiresCode) ??
            getBoolean(record.code_required) ??
            false,
        attendance_code:
            getString(record.attendance_code) ||
            getString(record.code) ||
            getString(record.codigo),
        raw: record,
    };
}

export function normalizeAttendanceRecord(value: unknown): AttendanceRecord {
    const record =
        value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : {};

    const courseAttendance =
        record.course_attendance && typeof record.course_attendance === "object"
            ? (record.course_attendance as Record<string, unknown>)
            : null;

    const enrollment =
        record.enrollment && typeof record.enrollment === "object"
            ? (record.enrollment as Record<string, unknown>)
            : null;

    const user =
        enrollment?.user && typeof enrollment.user === "object"
            ? (enrollment.user as Record<string, unknown>)
            : null;

    return {
        id:
            getNumber(record.id) ||
            getNumber(record.attendance_id) ||
            getNumber(record.attendanceId),

        session_id:
            getNumber(record.course_attendance_id) ||
            getNumber(record.courseAttendanceId) ||
            getNumber(record.session_id) ||
            getNumber(record.sessionId) ||
            getNumber(record.attendance_session_id) ||
            getNumber(record.attendanceSessionId) ||
            getNumber(courseAttendance?.id),

        enrollment_id:
            getNumber(record.enrollment_id) ||
            getNumber(record.enrollmentId) ||
            getNumber(enrollment?.id),

        user_id:
            getNumber(record.user_id) ||
            getNumber(record.userId) ||
            getNumber(user?.id),

        status: normalizeAttendanceStatus(
            record.attendance_state ??
            record.attendanceState ??
            record.state ??
            record.status ??
            record.estado ??
            record.attendance_status ??
            record.attendanceStatus,
        ),
        checked_at:
            getString(record.updated_at) ||
            getString(record.created_at) ||
            getString(record.checked_at) ||
            getString(record.check_at) ||
            getString(record.marked_at),

        raw: record,
    };
}

export function isAttendanceSessionExpired(session: AttendanceSession) {
    const limitDate = session.ends_at || session.starts_at;

    if (!limitDate) return false;

    const date = new Date(limitDate);

    if (Number.isNaN(date.getTime())) return false;

    return Date.now() > date.getTime();
}

export function isAttendanceRecordMarked(record: AttendanceRecord | null) {
    if (!record) return false;

    return record.status !== ("pending" as AttendanceStatus);
}

export async function getAttendanceSessionsByCourse(courseId: number) {
    const sessions = await getCourseAttendancesByCourse(courseId);

    return sessions
        .map((session: CourseAttendance) => normalizeAttendanceSession(session))
        .filter((session) => session.id > 0)
        .sort((a, b) => getTimestamp(b.starts_at) - getTimestamp(a.starts_at));
}

export async function getAttendanceRecordsByEnrollment(enrollmentId: number) {
    const attendances = await getAttendancesByEnrollment(enrollmentId);

    return attendances
        .filter((attendance) => attendance.deleted !== true)
        .map((attendance: AttendanceWithEnrollmentResponse) =>
            normalizeAttendanceRecord(attendance),
        )
        .filter((record) => record.session_id > 0);
}

export async function saveStudentAttendance(payload: {
    course_id: number;
    enrollment_id: number;
    user_id?: number | null;
    session_id: number;
    code?: string;
    status?: AttendanceStatus;
}) {
    const attendances = await getAttendancesByEnrollment(payload.enrollment_id);

    const attendance = attendances.find(
        (item) =>
            Number(item.course_attendance_id) === Number(payload.session_id) &&
            item.deleted !== true,
    );

    if (!attendance?.id) {
        throw new Error(
            "No existe un registro de asistencia para esta sesión. Primero el docente debe generar la asistencia del curso.",
        );
    }

    const currentRecord = normalizeAttendanceRecord(attendance);

    if (currentRecord.status !== ("pending" as AttendanceStatus)) {
        return currentRecord;
    }

    const updatedAttendance = await updateAttendance(attendance.id, {
        enrollment_id: attendance.enrollment_id,
        course_attendance_id: attendance.course_attendance_id,
        attendance_state: "present",
        deleted: attendance.deleted ?? false,
    });

    return normalizeAttendanceRecord(updatedAttendance);
}

export function getAttendanceRecordForSession(
    records: AttendanceRecord[],
    sessionId: number,
) {
    return (
        records.find(
            (record) => Number(record.session_id) === Number(sessionId),
        ) ?? null
    );
}

export function upsertAttendanceRecord(
    records: AttendanceRecord[],
    nextRecord: AttendanceRecord,
) {
    const existsById =
        nextRecord.id > 0 &&
        records.some((record) => Number(record.id) === Number(nextRecord.id));

    if (existsById) {
        return records.map((record) =>
            Number(record.id) === Number(nextRecord.id) ? nextRecord : record,
        );
    }

    const existsBySession = records.some(
        (record) => Number(record.session_id) === Number(nextRecord.session_id),
    );

    if (existsBySession) {
        return records.map((record) =>
            Number(record.session_id) === Number(nextRecord.session_id)
                ? nextRecord
                : record,
        );
    }

    return [nextRecord, ...records];
}

export function formatAttendanceDate(value?: string | null) {
    if (!value) return "Sin fecha";

    const dateValue = isDateOnly(value) ? `${value}T00:00:00` : value;
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: value.includes("T") ? "short" : undefined,
    }).format(date);
}

export function getAttendanceStatusLabel(status: AttendanceStatus) {
    if (status === ("pending" as AttendanceStatus)) return "Pendiente";
    if (status === "absent") return "Ausente";

    return "Presente";
}

export function canMarkAttendance(
    session: AttendanceSession,
    record: AttendanceRecord | null,
) {
    if (isAttendanceSessionExpired(session)) return false;

    if (session.is_active === false) return false;

    const status = session.status.toLowerCase();

    if (
        ["closed", "cerrada", "finalizada", "inactive", "inactiva"].includes(
            status,
        )
    ) {
        return false;
    }

    if (!record) return true;

    return record.status === ("pending" as AttendanceStatus);
}