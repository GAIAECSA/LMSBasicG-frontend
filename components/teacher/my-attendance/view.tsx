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
            <div className="flex min-h-[260px] w-full min-w-0 items-center justify-center px-3 py-4 sm:min-h-[320px] sm:px-4">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm sm:px-5 sm:py-4 sm:text-sm">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#07499a]" />

                    <span className="min-w-0 break-words">
                        Cargando mi asistencia...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-0 space-y-5 overflow-x-hidden px-3 py-4 sm:space-y-6 sm:px-4 sm:py-5 lg:px-5 lg:py-5 xl:px-6">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-70% to-[#F97316] p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:p-6 [@media(max-height:760px)]:lg:p-4">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100 sm:text-xs sm:tracking-[0.22em]">
                            Panel docente
                        </p>

                        <h1 className="mt-2 break-words text-xl font-black sm:text-2xl lg:text-3xl [@media(max-height:760px)]:lg:text-2xl">
                            Mi asistencia
                        </h1>

                        <p className="mt-1.5 max-w-2xl break-words text-xs font-semibold leading-5 text-blue-50 sm:mt-2 sm:text-sm sm:leading-6">
                            Registra tu asistencia en las sesiones habilitadas
                            por el administrador.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 text-xs font-black text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-auto sm:rounded-2xl sm:text-sm"
                    >
                        <RefreshCcw
                            className={`h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""
                                }`}
                        />

                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>
            </section>

            <section className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <SummaryCard
                    icon={
                        <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    }
                    label="Sesiones"
                    value={rows.length}
                    cardClassName="border-slate-200 bg-white"
                    iconClassName="bg-blue-50 text-[#07499a]"
                    labelClassName="text-slate-500"
                    valueClassName="text-slate-950"
                />

                <SummaryCard
                    icon={
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    }
                    label="Registradas"
                    value={registeredCount}
                    cardClassName="border-emerald-100 bg-emerald-50"
                    iconClassName="bg-white text-emerald-700"
                    labelClassName="text-emerald-700"
                    valueClassName="text-emerald-900"
                />

                <SummaryCard
                    icon={
                        <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    }
                    label="Pendientes"
                    value={pendingCount}
                    cardClassName="border-amber-100 bg-amber-50"
                    iconClassName="bg-white text-amber-700"
                    labelClassName="text-amber-700"
                    valueClassName="text-amber-900"
                />
            </section>

            {message ? (
                <div className="min-w-0 break-words rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-bold leading-5 text-[#07499a] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {message}
                </div>
            ) : null}

            {error ? (
                <div className="flex min-w-0 items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                    <span className="min-w-0 break-words">
                        {error}
                    </span>
                </div>
            ) : null}

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5 [@media(max-height:760px)]:lg:p-4">
                <div className="mb-4 flex min-w-0 items-start justify-between gap-3 sm:mb-5 sm:items-center">
                    <div className="min-w-0">
                        <h2 className="break-words text-base font-black text-slate-950 sm:text-lg">
                            Sesiones de asistencia
                        </h2>

                        <p className="mt-0.5 break-words text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                            Solo se muestran los registros con rol de docente.
                        </p>
                    </div>

                    <span className="inline-flex shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-[#07499a] sm:px-3 sm:text-xs">
                        {registeredCount}/{rows.length}
                    </span>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-2xl sm:p-6">
                        <UserCheck className="mx-auto h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />

                        <p className="mx-auto mt-3 max-w-xl break-words text-xs font-black leading-5 text-slate-700 sm:text-sm">
                            Todavía no existen sesiones de asistencia para
                            docentes.
                        </p>
                    </div>
                ) : (
                    <div className="min-w-0 space-y-2.5 sm:space-y-3">
                        {rows.map((row) => {
                            const state = getAttendanceState(row.attendance);
                            const isPresent = state === "PRESENTE";

                            const isUpdating =
                                updatingAttendanceId === row.attendance?.id;

                            return (
                                <article
                                    key={row.session.id}
                                    className={`min-w-0 rounded-xl border p-3 transition sm:rounded-2xl sm:p-4 ${isPresent
                                        ? "border-emerald-200 bg-emerald-50"
                                        : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                                        }`}
                                >
                                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${isPresent
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

                                            <div className="min-w-0 flex-1">
                                                <h3 className="break-words text-sm font-black text-slate-950 sm:text-base">
                                                    Asistencia{" "}
                                                    {formatDate(
                                                        row.session.day,
                                                    )}
                                                </h3>

                                                <p className="mt-1 break-words text-xs font-semibold text-slate-500 sm:text-sm">
                                                    {formatTime(
                                                        row.session.start_time,
                                                    )}{" "}
                                                    -{" "}
                                                    {formatTime(
                                                        row.session.end_time,
                                                    )}
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase sm:px-3 sm:text-xs ${isPresent
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-amber-100 text-amber-700"
                                                            }`}
                                                    >
                                                        {isPresent
                                                            ? "Registrado: presente"
                                                            : "Pendiente"}
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
                                            className={`inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition active:scale-[0.97] sm:h-11 sm:w-auto sm:min-w-[205px] sm:rounded-2xl sm:text-sm ${isPresent
                                                ? "cursor-not-allowed bg-slate-100 text-slate-500"
                                                : "bg-[#07499a] text-white shadow-sm hover:bg-[#063b7d]"
                                                } disabled:opacity-70`}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                            ) : isPresent ? (
                                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            ) : (
                                                <CalendarCheck className="h-4 w-4 shrink-0" />
                                            )}

                                            <span>
                                                {isUpdating
                                                    ? "Registrando..."
                                                    : isPresent
                                                        ? "Asistencia registrada"
                                                        : "Marcar mi asistencia"}
                                            </span>
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

type SummaryCardProps = {
    icon: React.ReactNode;
    label: string;
    value: number;
    cardClassName: string;
    iconClassName: string;
    labelClassName: string;
    valueClassName: string;
};

function SummaryCard({
    icon,
    label,
    value,
    cardClassName,
    iconClassName,
    labelClassName,
    valueClassName,
}: SummaryCardProps) {
    return (
        <div
            className={`min-w-0 rounded-xl border p-2.5 shadow-sm sm:rounded-2xl sm:p-4 lg:p-5 [@media(max-height:760px)]:lg:p-3.5 ${cardClassName}`}
        >
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl lg:h-11 lg:w-11 lg:rounded-2xl ${iconClassName}`}
                >
                    {icon}
                </div>

                <div className="min-w-0">
                    <p
                        className={`truncate text-[9px] font-black uppercase tracking-[0.06em] sm:text-[10px] lg:text-xs ${labelClassName}`}
                        title={label}
                    >
                        {label}
                    </p>

                    <p
                        className={`mt-0.5 text-xl font-black sm:text-2xl ${valueClassName}`}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}