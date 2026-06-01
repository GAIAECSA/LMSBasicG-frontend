"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    Loader2,
    RefreshCcw,
    UserCheck,
} from "lucide-react";
import {
    getCourseAttendancesByCourse,
    getAttendancesByCourseAttendance,
    updateAttendance,
    type Attendance,
    type CourseAttendance,
} from "@/services/attendance.service";

type TeacherMyAttendanceViewProps = {
    courseId: string;
};

type AttendanceRow = {
    session: CourseAttendance;
    attendance: Attendance | null;
};

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
    return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function getRecordValue(record: unknown, key: string): unknown {
    const current = asRecord(record);
    return current?.[key];
}

function getAttendanceState(attendance: Attendance | null) {
    const value = String(
        getRecordValue(attendance, "attendance_state") ??
        getRecordValue(attendance, "state") ??
        "PENDIENTE",
    )
        .trim()
        .toUpperCase();

    if (value === "PRESENTE" || value === "PRESENT") return "PRESENTE";
    if (value === "FALTA" || value === "AUSENTE" || value === "ABSENT") return "FALTA";

    return "PENDIENTE";
}

function getAttendanceRoleId(attendance: Attendance) {
    const current = asRecord(attendance);
    const enrollment = asRecord(current?.enrollment);

    const roleValue =
        current?.role_id ??
        current?.roleId ??
        enrollment?.role_id ??
        enrollment?.roleId;

    const roleId = Number(roleValue);

    return Number.isFinite(roleId) ? roleId : null;
}

function getAttendanceUserId(attendance: Attendance) {
    const current = asRecord(attendance);
    const enrollment = asRecord(current?.enrollment);
    const user = asRecord(enrollment?.user);

    const userId = Number(user?.id);

    return Number.isFinite(userId) ? userId : null;
}

function findDeepUserId(value: unknown): number | null {
    const record = asRecord(value);

    if (!record) return null;

    const directId = Number(record.id ?? record.user_id ?? record.userId);

    if (Number.isFinite(directId) && directId > 0) {
        return directId;
    }

    const userValue = record.user;

    if (userValue && typeof userValue === "object") {
        return findDeepUserId(userValue);
    }

    return null;
}

function getStoredUserId() {
    if (typeof window === "undefined") return null;

    const simpleKeys = ["user_id", "userId", "id"];

    for (const key of simpleKeys) {
        const value = Number(window.localStorage.getItem(key));

        if (Number.isFinite(value) && value > 0) {
            return value;
        }
    }

    const objectKeys = [
        "user",
        "auth_user",
        "authUser",
        "currentUser",
        "session",
        "auth",
    ];

    for (const key of objectKeys) {
        const rawValue = window.localStorage.getItem(key);

        if (!rawValue) continue;

        try {
            const parsedValue = JSON.parse(rawValue);
            const userId = findDeepUserId(parsedValue);

            if (userId) return userId;
        } catch {
            continue;
        }
    }

    return null;
}

function formatDate(value: string) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatTime(value: string) {
    if (!value) return "--:--";

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("es-EC", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return value;
}

export function TeacherMyAttendanceView({ courseId }: TeacherMyAttendanceViewProps) {
    const [rows, setRows] = useState<AttendanceRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updatingAttendanceId, setUpdatingAttendanceId] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const numericCourseId = Number(courseId);

    const loadAttendance = useCallback(async () => {
        if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
            setError("No se encontró el curso seleccionado.");
            setRows([]);
            setIsLoading(false);
            return;
        }

        const currentUserId = getStoredUserId();

        setError(null);

        try {
            const sessions = await getCourseAttendancesByCourse(numericCourseId);

            const loadedRows = await Promise.all(
                sessions.map(async (session) => {
                    const attendances = await getAttendancesByCourseAttendance(session.id);

                    const teacherAttendances = attendances.filter(
                        (attendance) => getAttendanceRoleId(attendance) === 3,
                    );

                    const myAttendance =
                        teacherAttendances.find((attendance) => {
                            const attendanceUserId = getAttendanceUserId(attendance);

                            if (!currentUserId) return true;

                            return attendanceUserId === currentUserId;
                        }) ?? null;

                    return {
                        session,
                        attendance: myAttendance,
                    };
                }),
            );

            setRows(loadedRows);
        } catch (currentError) {
            console.error(currentError);
            setError("No se pudo cargar tu asistencia.");
            setRows([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [numericCourseId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadAttendance();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadAttendance]);

    const registeredCount = useMemo(
        () =>
            rows.filter(
                (row) => getAttendanceState(row.attendance) === "PRESENTE",
            ).length,
        [rows],
    );

    const pendingCount = Math.max(rows.length - registeredCount, 0);

    async function handleMarkAttendance(attendance: Attendance | null) {
        if (!attendance) {
            setError("No existe un registro de asistencia asignado para este docente.");
            return;
        }

        setUpdatingAttendanceId(attendance.id);
        setError(null);
        setMessage(null);

        try {
            const updatedAttendance = await updateAttendance(attendance.id, {
                enrollment_id: attendance.enrollment_id,
                course_attendance_id: attendance.course_attendance_id,
                attendance_state: "PRESENTE",
                deleted: attendance.deleted ?? false,
            });

            setRows((currentRows) =>
                currentRows.map((row) =>
                    row.attendance?.id === updatedAttendance.id
                        ? {
                            ...row,
                            attendance: {
                                ...row.attendance,
                                ...updatedAttendance,
                            },
                        }
                        : row,
                ),
            );

            setMessage("Asistencia registrada correctamente.");
        } catch (currentError) {
            console.error(currentError);
            setError("No se pudo registrar tu asistencia.");
        } finally {
            setUpdatingAttendanceId(null);
        }
    }

    function handleRefresh() {
        setIsRefreshing(true);
        setMessage(null);
        setError(null);
        void loadAttendance();
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-[#07499a]" />
                    Cargando mi Asistencia...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-6 text-white shadow-lg">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                            Panel docente
                        </p>
                        <h1 className="mt-2 text-2xl font-black">
                            MI ASISTENCIA
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm font-medium text-blue-50">
                            Registra tu asistencia en las sesiones habilitadas por el administrador.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCcw
                            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                        />
                        Actualizar
                    </button>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#07499a]">
                            <CalendarCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-slate-500">
                                Sesiones
                            </p>
                            <p className="text-2xl font-black text-slate-950">
                                {rows.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-emerald-700">
                                Registradas
                            </p>
                            <p className="text-2xl font-black text-emerald-900">
                                {registeredCount}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-700">
                            <Clock3 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-amber-700">
                                Pendientes
                            </p>
                            <p className="text-2xl font-black text-amber-900">
                                {pendingCount}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {message ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-[#07499a]">
                    {message}
                </div>
            ) : null}

            {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    {error}
                </div>
            ) : null}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-slate-950">
                            Sesiones de asistencia
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            Solo se muestran los registros con rol de docente.
                        </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#07499a]">
                        {registeredCount}/{rows.length}
                    </span>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <UserCheck className="mx-auto h-10 w-10 text-slate-400" />
                        <p className="mt-3 text-sm font-black text-slate-700">
                            Todavía no existen sesiones de asistencia para docentes.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map((row) => {
                            const state = getAttendanceState(row.attendance);
                            const isPresent = state === "PRESENTE";
                            const isUpdating =
                                updatingAttendanceId === row.attendance?.id;

                            return (
                                <div
                                    key={row.session.id}
                                    className={`rounded-3xl border p-4 transition ${isPresent
                                        ? "border-emerald-200 bg-emerald-50"
                                        : "border-slate-200 bg-white hover:border-blue-200"
                                        }`}
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isPresent
                                                    ? "bg-white text-emerald-700"
                                                    : "bg-blue-50 text-[#07499a]"
                                                    }`}
                                            >
                                                {isPresent ? (
                                                    <CheckCircle2 className="h-5 w-5" />
                                                ) : (
                                                    <Clock3 className="h-5 w-5" />
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-black text-slate-950">
                                                    Asistencia {formatDate(row.session.day)}
                                                </h3>
                                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                                    {formatTime(row.session.start_time)} -{" "}
                                                    {formatTime(row.session.end_time)}
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-black ${isPresent
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-amber-100 text-amber-700"
                                                            }`}
                                                    >
                                                        {isPresent
                                                            ? "REGISTRADO: PRESENTE"
                                                            : "PENDIENTE"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={
                                                isPresent ||
                                                isUpdating ||
                                                !row.attendance
                                            }
                                            onClick={() =>
                                                void handleMarkAttendance(
                                                    row.attendance,
                                                )
                                            }
                                            className={`inline-flex h-11 min-w-[220px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition ${isPresent
                                                ? "cursor-not-allowed bg-slate-100 text-slate-500"
                                                : "bg-[#07499a] text-white shadow-sm hover:bg-[#063b7d]"
                                                } disabled:opacity-70`}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isPresent ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                                <CalendarCheck className="h-4 w-4" />
                                            )}

                                            {isPresent
                                                ? "Asistencia registrada"
                                                : "Marcar mi asistencia"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}