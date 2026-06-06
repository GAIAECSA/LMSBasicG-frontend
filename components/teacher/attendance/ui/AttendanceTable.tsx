import {
    CalendarDays,
    Edit3,
    Loader2,
    Search,
    Trash2,
    Users,
} from "lucide-react";

import type {
    Attendance,
    AttendanceState,
    CourseAttendance,
} from "@/services/attendance.service";

import {
    ATTENDANCE_STATUS_OPTIONS,
} from "../constants";

import {
    formatDate,
    formatTime,
    getInitials,
    getStatusOption,
    getStudentName,
} from "../utils";

type AttendanceTableProps = {
    selectedSession: CourseAttendance | null;
    filteredAttendances: Attendance[];
    searchTerm: string;
    isLoadingAttendances: boolean;
    updatingAttendanceId: number | null;
    setSearchTerm: (value: string) => void;
    onEditSession: (
        session: CourseAttendance,
    ) => void;
    onDeleteSession: (
        session: CourseAttendance,
    ) => void;
    onChangeAttendanceStatus: (
        attendance: Attendance,
        status: AttendanceState,
    ) => void;
};

type AttendanceRowData = Attendance & {
    attendance_state?: AttendanceState | null;
    state?: AttendanceState | null;
};

function getAttendanceCurrentState(
    attendance: Attendance,
): AttendanceState {
    const row =
        attendance as AttendanceRowData;

    const normalized = String(
        row.attendance_state ??
            row.state ??
            "PENDIENTE",
    )
        .trim()
        .toUpperCase();

    const exactMatch =
        ATTENDANCE_STATUS_OPTIONS.find(
            (option) =>
                String(option.value)
                    .trim()
                    .toUpperCase() ===
                normalized,
        );

    if (exactMatch) {
        return exactMatch.value;
    }

    /*
     * Compatibilidad con registros antiguos.
     * El backend actual utiliza FALTA, pero algunos datos
     * anteriores pueden venir como AUSENTE.
     */
    if (
        normalized === "FALTA" ||
        normalized === "AUSENTE" ||
        normalized === "ABSENT"
    ) {
        const absentMatch =
            ATTENDANCE_STATUS_OPTIONS.find(
                (option) => {
                    const value = String(
                        option.value,
                    )
                        .trim()
                        .toUpperCase();

                    return (
                        value === "FALTA" ||
                        value === "AUSENTE"
                    );
                },
            );

        if (absentMatch) {
            return absentMatch.value;
        }
    }

    const pendingMatch =
        ATTENDANCE_STATUS_OPTIONS.find(
            (option) =>
                String(option.value)
                    .trim()
                    .toUpperCase() ===
                "PENDIENTE",
        );

    return (
        pendingMatch?.value ??
        ("PENDIENTE" as AttendanceState)
    );
}

export function AttendanceTable({
    selectedSession,
    filteredAttendances,
    searchTerm,
    isLoadingAttendances,
    updatingAttendanceId,
    setSearchTerm,
    onEditSession,
    onDeleteSession,
    onChangeAttendanceStatus,
}: AttendanceTableProps) {
    return (
        <div className="min-w-0 p-3 sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
            {selectedSession ? (
                <div className="mb-3 flex min-w-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between lg:mb-5">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-black text-slate-950 sm:text-xl">
                            {formatDate(
                                selectedSession.day,
                            )}
                        </h2>

                        <p className="mt-1 text-xs font-bold leading-5 text-slate-500 sm:text-sm">
                            Horario:{" "}
                            {formatTime(
                                selectedSession.start_time,
                            )}{" "}
                            -{" "}
                            {formatTime(
                                selectedSession.end_time,
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                onEditSession(
                                    selectedSession,
                                )
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                        >
                            <Edit3 className="h-4 w-4 shrink-0" />

                            <span className="truncate">
                                Editar sesión
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onDeleteSession(
                                    selectedSession,
                                )
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-xs font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 active:scale-[0.97] sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
                        >
                            <Trash2 className="h-4 w-4 shrink-0" />

                            <span className="truncate">
                                Eliminar
                            </span>
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="mb-3 flex min-w-0 flex-col gap-2.5 sm:mb-4 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative block w-full lg:max-w-sm xl:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />

                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value,
                            )
                        }
                        placeholder="Buscar estudiante..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:pl-11 sm:pr-4 sm:text-sm [@media(max-height:760px)]:h-10"
                    />
                </label>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {ATTENDANCE_STATUS_OPTIONS.map(
                        (option) => (
                            <span
                                key={option.value}
                                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide sm:px-3 sm:py-1 sm:text-[10px] ${option.className}`}
                            >
                                {option.label}
                            </span>
                        ),
                    )}
                </div>
            </div>

            {isLoadingAttendances ? (
                <LoadingStudents />
            ) : !selectedSession ? (
                <EmptySession />
            ) : filteredAttendances.length ===
              0 ? (
                <EmptyStudents />
            ) : (
                <AttendanceRows
                    filteredAttendances={
                        filteredAttendances
                    }
                    updatingAttendanceId={
                        updatingAttendanceId
                    }
                    onChangeAttendanceStatus={
                        onChangeAttendanceStatus
                    }
                />
            )}
        </div>
    );
}

function LoadingStudents() {
    return (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 sm:min-h-[240px] sm:rounded-3xl [@media(max-height:760px)]:min-h-[160px]">
            <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#172861] sm:h-7 sm:w-7" />

                <p className="mt-3 text-xs font-bold text-slate-500 sm:text-sm">
                    Cargando estudiantes...
                </p>
            </div>
        </div>
    );
}

function EmptySession() {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-3xl sm:p-8 lg:p-10 [@media(max-height:760px)]:p-4">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />

            <h3 className="mt-3 text-base font-black text-slate-950 sm:mt-4 sm:text-lg">
                Selecciona o crea una sesión
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Para registrar asistencia, primero
                debes crear una sesión de asistencia
                del curso.
            </p>
        </div>
    );
}

function EmptyStudents() {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-3xl sm:p-8 lg:p-10 [@media(max-height:760px)]:p-4">
            <Users className="mx-auto h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />

            <h3 className="mt-3 text-base font-black text-slate-950 sm:mt-4 sm:text-lg">
                No hay estudiantes para mostrar
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Si acabas de crear la sesión y no
                aparecen estudiantes, verifica que
                existan matrículas aprobadas para este
                curso.
            </p>
        </div>
    );
}

function AttendanceRows({
    filteredAttendances,
    updatingAttendanceId,
    onChangeAttendanceStatus,
}: {
    filteredAttendances: Attendance[];
    updatingAttendanceId: number | null;
    onChangeAttendanceStatus: (
        attendance: Attendance,
        status: AttendanceState,
    ) => void;
}) {
    return (
        <>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block lg:rounded-3xl">
                <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="w-[30%] px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 xl:px-4">
                                Estudiante
                            </th>

                            <th className="w-[16%] px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 xl:px-4">
                                Estado actual
                            </th>

                            <th className="w-[42%] px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 xl:px-4">
                                Cambiar estado
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredAttendances.map(
                            (attendance) => (
                                <AttendanceDesktopRow
                                    key={
                                        attendance.id
                                    }
                                    attendance={
                                        attendance
                                    }
                                    updating={
                                        updatingAttendanceId ===
                                        attendance.id
                                    }
                                    onChangeAttendanceStatus={
                                        onChangeAttendanceStatus
                                    }
                                />
                            ),
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid gap-2.5 lg:hidden">
                {filteredAttendances.map(
                    (attendance) => (
                        <AttendanceMobileCard
                            key={attendance.id}
                            attendance={
                                attendance
                            }
                            updating={
                                updatingAttendanceId ===
                                attendance.id
                            }
                            onChangeAttendanceStatus={
                                onChangeAttendanceStatus
                            }
                        />
                    ),
                )}
            </div>
        </>
    );
}

function AttendanceDesktopRow({
    attendance,
    updating,
    onChangeAttendanceStatus,
}: {
    attendance: Attendance;
    updating: boolean;
    onChangeAttendanceStatus: (
        attendance: Attendance,
        status: AttendanceState,
    ) => void;
}) {
    const currentState =
        getAttendanceCurrentState(
            attendance,
        );

    const statusOption =
        getStatusOption(currentState);

    const studentName =
        getStudentName(attendance);

    return (
        <tr className="align-middle transition hover:bg-slate-50">
            <td className="px-3 py-3 xl:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-xs font-black text-white">
                        {getInitials(
                            studentName,
                        )}
                    </div>

                    <div className="min-w-0">
                        <p
                            title={studentName}
                            className="truncate text-xs font-black text-slate-950"
                        >
                            {studentName}
                        </p>

                    </div>
                </div>
            </td>

            <td className="px-3 py-3 xl:px-4">
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide xl:px-3 xl:py-1 xl:text-[10px] ${statusOption.className}`}
                >
                    {statusOption.label}
                </span>
            </td>

            <td className="px-3 py-3 xl:px-4">
                <StatusButtons
                    attendance={attendance}
                    currentState={
                        currentState
                    }
                    updating={updating}
                    onChangeAttendanceStatus={
                        onChangeAttendanceStatus
                    }
                    compact
                />
            </td>
        </tr>
    );
}

function AttendanceMobileCard({
    attendance,
    updating,
    onChangeAttendanceStatus,
}: {
    attendance: Attendance;
    updating: boolean;
    onChangeAttendanceStatus: (
        attendance: Attendance,
        status: AttendanceState,
    ) => void;
}) {
    const currentState =
        getAttendanceCurrentState(
            attendance,
        );

    const statusOption =
        getStatusOption(currentState);

    const studentName =
        getStudentName(attendance);

    return (
        <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex min-w-0 items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-xs font-black text-white">
                    {getInitials(studentName)}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="break-words text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere]">
                        {studentName}
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                        Matrícula #
                        {attendance.enrollment_id}
                        {" · "}
                        Usuario #
                        {attendance.enrollment?.user
                            ?.id ?? "-"}
                    </p>
                </div>

                <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${statusOption.className}`}
                >
                    {statusOption.label}
                </span>
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Cambiar estado
                </p>

                <StatusButtons
                    attendance={attendance}
                    currentState={
                        currentState
                    }
                    updating={updating}
                    onChangeAttendanceStatus={
                        onChangeAttendanceStatus
                    }
                />
            </div>
        </article>
    );
}

function StatusButtons({
    attendance,
    currentState,
    updating,
    onChangeAttendanceStatus,
    compact = false,
}: {
    attendance: Attendance;
    currentState: AttendanceState;
    updating: boolean;
    onChangeAttendanceStatus: (
        attendance: Attendance,
        status: AttendanceState,
    ) => void;
    compact?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {ATTENDANCE_STATUS_OPTIONS.map(
                (option) => (
                    <button
                        key={option.value}
                        type="button"
                        disabled={updating}
                        onClick={() =>
                            onChangeAttendanceStatus(
                                attendance,
                                option.value,
                            )
                        }
                        className={`inline-flex h-8 items-center justify-center rounded-lg px-2 text-[9px] font-black uppercase tracking-wide transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
                            compact
                                ? "xl:px-2.5 xl:text-[10px]"
                                : "px-2.5 text-[10px]"
                        } ${
                            currentState ===
                            option.value
                                ? option.className
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {updating &&
                        currentState !==
                            option.value ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : null}

                        {option.label}
                    </button>
                ),
            )}
        </div>
    );
}
