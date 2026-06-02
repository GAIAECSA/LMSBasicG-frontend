import type { ReactNode } from "react";
import {
    AlertTriangle,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    Loader2,
} from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import {
    canMarkAttendance,
    formatAttendanceDate,
    getAttendanceRecordForSession,
    isAttendanceSessionExpired,
} from "../../attendance";

type AttendanceTabProps = {
    room: CourseRoomHook;
};

type AttendanceVisualStatus = "present" | "pending" | "absent";

function getAttendanceVisualStatus(
    isExpired: boolean,
    record: ReturnType<typeof getAttendanceRecordForSession>,
): AttendanceVisualStatus {
    if (record?.status === "present") return "present";
    if (record?.status === "absent") return "absent";

    if (isExpired) return "absent";

    return "pending";
}

function getAttendanceVisualLabel(status: AttendanceVisualStatus) {
    if (status === "present") return "Presente";
    if (status === "absent") return "Ausente";

    return "Pendiente";
}

function getAttendanceCardClass(status: AttendanceVisualStatus) {
    if (status === "present") {
        return "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white";
    }

    if (status === "absent") {
        return "border-red-200 bg-gradient-to-br from-red-50 via-white to-white";
    }

    return "border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white";
}

function getAttendanceIconClass(status: AttendanceVisualStatus) {
    if (status === "present") {
        return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (status === "absent") {
        return "bg-red-100 text-red-700 ring-1 ring-red-200";
    }

    return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
}

function getAttendanceBadgeClass(status: AttendanceVisualStatus) {
    if (status === "present") {
        return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (status === "absent") {
        return "bg-red-100 text-red-700 ring-1 ring-red-200";
    }

    return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
}

function getAttendanceTextClass(status: AttendanceVisualStatus) {
    if (status === "present") return "text-emerald-800";
    if (status === "absent") return "text-red-800";

    return "text-blue-800";
}

function getAttendanceButtonClass(status: AttendanceVisualStatus) {
    if (status === "present") {
        return "bg-emerald-600 text-white";
    }

    if (status === "absent") {
        return "bg-red-600 text-white";
    }

    return "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95";
}

function getAttendanceIcon(status: AttendanceVisualStatus) {
    if (status === "present") return <CheckCircle2 className="h-5 w-5" />;
    if (status === "absent") return <AlertTriangle className="h-5 w-5" />;

    return <Clock3 className="h-5 w-5" />;
}

export function AttendanceTab({ room }: AttendanceTabProps) {
    const attendanceSessions = room.attendanceSessions;

    const attendanceStats = attendanceSessions.reduce<
        Record<AttendanceVisualStatus, number>
    >(
        (stats, session) => {
            const record = getAttendanceRecordForSession(
                room.attendanceRecords,
                session.id,
            );

            const visualStatus = getAttendanceVisualStatus(
                isAttendanceSessionExpired(session),
                record,
            );

            stats[visualStatus] += 1;

            return stats;
        },
        {
            present: 0,
            pending: 0,
            absent: 0,
        },
    );

    const attendanceProgress =
        attendanceSessions.length > 0
            ? Math.round(
                (attendanceStats.present / attendanceSessions.length) * 100,
            )
            : 0;

    return (
        <div className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4 sm:space-y-5">
                <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                                <CalendarCheck className="h-6 w-6" />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-lg font-black text-[var(--foreground)]">
                                    Asistencia del curso
                                </h2>

                                <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                    Revisa tus sesiones de asistencia. Si la
                                    sesión finalizó y no registraste asistencia,
                                    el estado se mostrará automáticamente como
                                    ausente.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
                        <SummaryBox
                            label="Presentes"
                            value={String(attendanceStats.present)}
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            status="present"
                        />

                        <SummaryBox
                            label="Pendientes"
                            value={String(attendanceStats.pending)}
                            icon={<Clock3 className="h-5 w-5" />}
                            status="pending"
                        />

                        <SummaryBox
                            label="Ausentes"
                            value={String(attendanceStats.absent)}
                            icon={<AlertTriangle className="h-5 w-5" />}
                            status="absent"
                        />
                    </div>

                    {room.attendanceMessage ? (
                        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                            {room.attendanceMessage}
                        </div>
                    ) : null}
                </section>

                <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                    <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3 sm:mb-5">
                        <h3 className="text-base font-black text-[var(--foreground)]">
                            Sesiones de asistencia
                        </h3>

                        <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black uppercase text-[var(--primary)]">
                            {attendanceStats.present}/{attendanceSessions.length}
                        </span>
                    </div>

                    {room.attendanceLoading ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-6 text-center">
                            <Loader2 className="h-7 w-7 animate-spin text-[var(--primary)]" />

                            <p className="mt-3 text-sm font-bold text-[var(--muted-foreground)]">
                                Cargando sesiones de asistencia...
                            </p>
                        </div>
                    ) : attendanceSessions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-8 text-center">
                            <CalendarCheck className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />

                            <h3 className="mt-3 text-base font-black text-[var(--foreground)]">
                                No hay sesiones de asistencia
                            </h3>

                            <p className="mt-2 break-words text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                Cuando el docente cree sesiones de asistencia,
                                aparecerán en esta sección.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {attendanceSessions.map((session) => {
                                const record = getAttendanceRecordForSession(
                                    room.attendanceRecords,
                                    session.id,
                                );

                                const isExpired =
                                    isAttendanceSessionExpired(session);

                                const visualStatus = getAttendanceVisualStatus(
                                    isExpired,
                                    record,
                                );

                                const visualLabel =
                                    getAttendanceVisualLabel(visualStatus);

                                const isPresent = visualStatus === "present";
                                const isPending = visualStatus === "pending";
                                const isAbsent = visualStatus === "absent";

                                const isSaving =
                                    room.attendanceSavingSessionId ===
                                    session.id;

                                const canMark =
                                    isPending &&
                                    canMarkAttendance(session, record);

                                return (
                                    <article
                                        key={session.id}
                                        className={`min-w-0 rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-4 ${getAttendanceCardClass(
                                            visualStatus,
                                        )}`}
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex min-w-0 flex-1 gap-3">
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${getAttendanceIconClass(
                                                        visualStatus,
                                                    )}`}
                                                >
                                                    {getAttendanceIcon(
                                                        visualStatus,
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <h4
                                                                className={`break-words text-sm font-black ${getAttendanceTextClass(
                                                                    visualStatus,
                                                                )}`}
                                                            >
                                                                {session.title}
                                                            </h4>

                                                            <p className="mt-1 break-words text-xs font-bold leading-5 text-[var(--muted-foreground)]">
                                                                {formatAttendanceDate(
                                                                    session.starts_at,
                                                                )}
                                                                {session.ends_at
                                                                    ? ` - ${formatAttendanceDate(
                                                                        session.ends_at,
                                                                    )}`
                                                                    : ""}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getAttendanceBadgeClass(
                                                                visualStatus,
                                                            )}`}
                                                        >
                                                            {visualLabel}
                                                        </span>
                                                    </div>

                                                    {session.description ? (
                                                        <p className="mt-2 break-words text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                                            {
                                                                session.description
                                                            }
                                                        </p>
                                                    ) : null}

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {isPresent ? (
                                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-700 ring-1 ring-emerald-200">
                                                                Asistencia
                                                                registrada
                                                            </span>
                                                        ) : null}

                                                        {isPending ? (
                                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase text-blue-700 ring-1 ring-blue-200">
                                                                Disponible para
                                                                registrar
                                                            </span>
                                                        ) : null}

                                                        {isAbsent ? (
                                                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase text-red-700 ring-1 ring-red-200">
                                                                No registró
                                                                asistencia
                                                            </span>
                                                        ) : null}

                                                        {session.requires_code &&
                                                            isPending ? (
                                                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700 ring-1 ring-amber-100">
                                                                Requiere código
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full shrink-0 space-y-3 lg:w-72">
                                                {session.requires_code &&
                                                    isPending ? (
                                                    <input
                                                        value={
                                                            room
                                                                .attendanceCodeBySession[
                                                            session.id
                                                            ] ?? ""
                                                        }
                                                        onChange={(event) =>
                                                            room.handleAttendanceCodeChange(
                                                                session.id,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Código del docente"
                                                        disabled={
                                                            !canMark || isSaving
                                                        }
                                                        className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    />
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void room.handleMarkAttendance(
                                                            session.id,
                                                        )
                                                    }
                                                    disabled={
                                                        !canMark || isSaving
                                                    }
                                                    className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-70 ${getAttendanceButtonClass(
                                                        visualStatus,
                                                    )}`}
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : isAbsent ? (
                                                        <AlertTriangle className="h-4 w-4" />
                                                    ) : isPresent ? (
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    ) : (
                                                        <CalendarCheck className="h-4 w-4" />
                                                    )}

                                                    {isAbsent
                                                        ? "Asistencia ausente"
                                                        : isPresent
                                                            ? "Asistencia registrada"
                                                            : "Marcar presente"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <aside className="min-w-0">
                <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                    <h3 className="text-base font-black text-[var(--foreground)]">
                        Resumen
                    </h3>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                        <div
                            className="h-2 rounded-full bg-[var(--primary)] transition-all"
                            style={{ width: `${attendanceProgress}%` }}
                        />
                    </div>

                    <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                        Has registrado {attendanceStats.present} de{" "}
                        {attendanceSessions.length} asistencia(s).
                    </p>

                    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                        <p className="text-xs font-black uppercase text-[var(--muted-foreground)]">
                            Porcentaje de asistencia
                        </p>

                        <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
                            {attendanceProgress}%
                        </p>
                    </div>
                </section>
            </aside>
        </div>
    );
}

function SummaryBox({
    label,
    value,
    icon,
    status,
}: {
    label: string;
    value: string;
    icon: ReactNode;
    status: AttendanceVisualStatus;
}) {
    const classNameByStatus: Record<AttendanceVisualStatus, string> = {
        present: "border-emerald-200 bg-emerald-50 text-emerald-700",
        pending: "border-blue-200 bg-blue-50 text-blue-700",
        absent: "border-red-200 bg-red-50 text-red-700",
    };

    const valueClassNameByStatus: Record<AttendanceVisualStatus, string> = {
        present: "text-emerald-800",
        pending: "text-blue-800",
        absent: "text-red-800",
    };

    return (
        <div
            className={`min-w-0 rounded-2xl border p-3 shadow-sm sm:p-4 ${classNameByStatus[status]}`}
        >
            <div className="flex items-center gap-3">
                {icon}

                <p className="text-xs font-black uppercase">{label}</p>
            </div>

            <p
                className={`mt-3 text-3xl font-black ${valueClassNameByStatus[status]}`}
            >
                {value}
            </p>
        </div>
    );
}