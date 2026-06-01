import { CalendarDays, Edit3, Loader2, Search, Trash2, Users } from "lucide-react";
import type {
    Attendance,
    AttendanceState,
    CourseAttendance,
} from "@/services/attendance.service";
import { ATTENDANCE_STATUS_OPTIONS } from "../constants";
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
    onEditSession: (session: CourseAttendance) => void;
    onDeleteSession: (session: CourseAttendance) => void;
    onChangeAttendanceStatus: (
        attendance: Attendance,
        status: AttendanceState,
    ) => void;
};

type AttendanceRowData = Attendance & {
    attendance_state?: AttendanceState | null;
    state?: AttendanceState | null;
};

function getAttendanceCurrentState(attendance: Attendance): AttendanceState {
    const row = attendance as AttendanceRowData;

    const normalized = String(
        row.attendance_state ?? row.state ?? "PENDIENTE",
    )
        .trim()
        .toUpperCase();

    if (normalized === "PRESENTE") return "PRESENTE";
    if (normalized === "AUSENTE") return "AUSENTE";

    return "PENDIENTE";
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
        <div className="p-5 md:p-6">
            {selectedSession ? (
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            {formatDate(selectedSession.day)}
                        </h2>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                            Horario: {formatTime(selectedSession.start_time)} -{" "}
                            {formatTime(selectedSession.end_time)}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => onEditSession(selectedSession)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                            <Edit3 className="h-4 w-4" />
                            Editar sesión
                        </button>

                        <button
                            type="button"
                            onClick={() => onDeleteSession(selectedSession)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative block w-full lg:max-w-md">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar estudiante..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </label>

                <div className="flex flex-wrap gap-2">
                    {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <span
                            key={option.value}
                            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${option.className}`}
                        >
                            {option.label}
                        </span>
                    ))}
                </div>
            </div>

            {isLoadingAttendances ? (
                <LoadingStudents />
            ) : !selectedSession ? (
                <EmptySession />
            ) : filteredAttendances.length === 0 ? (
                <EmptyStudents />
            ) : (
                <AttendanceRows
                    filteredAttendances={filteredAttendances}
                    updatingAttendanceId={updatingAttendanceId}
                    onChangeAttendanceStatus={onChangeAttendanceStatus}
                />
            )}
        </div>
    );
}

function LoadingStudents() {
    return (
        <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
            <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#172861]" />

                <p className="mt-3 text-sm font-bold text-slate-500">
                    Cargando estudiantes...
                </p>
            </div>
        </div>
    );
}

function EmptySession() {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />

            <h3 className="mt-4 text-lg font-black text-slate-950">
                Selecciona o crea una sesión
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-500">
                Para registrar asistencia, primero debes crear una sesión de
                asistencia del curso.
            </p>
        </div>
    );
}

function EmptyStudents() {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-400" />

            <h3 className="mt-4 text-lg font-black text-slate-950">
                No hay estudiantes para mostrar
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-500">
                Si acabas de crear la sesión y no aparecen estudiantes,
                verifica que existan matrículas aprobadas para este curso.
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
        <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                                Estudiante
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                                Matrícula
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                                Estado actual
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                                Cambiar estado
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredAttendances.map((attendance) => {
                            const currentState = getAttendanceCurrentState(attendance);
                            const statusOption = getStatusOption(currentState);
                            const studentName = getStudentName(attendance);

                            return (
                                <tr
                                    key={attendance.id}
                                    className="hover:bg-slate-50"
                                >
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-sm font-black text-white">
                                                {getInitials(studentName)}
                                            </div>

                                            <div>
                                                <p className="text-sm font-black text-slate-950">
                                                    {studentName}
                                                </p>

                                                <p className="text-xs font-bold text-slate-500">
                                                    Usuario #
                                                    {attendance.enrollment?.user
                                                        ?.id ?? "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                        #{attendance.enrollment_id}
                                    </td>

                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusOption.className}`}
                                        >
                                            {statusOption.label}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {ATTENDANCE_STATUS_OPTIONS.map(
                                                (option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        disabled={
                                                            updatingAttendanceId ===
                                                            attendance.id
                                                        }
                                                        onClick={() =>
                                                            onChangeAttendanceStatus(
                                                                attendance,
                                                                option.value,
                                                            )
                                                        }
                                                        className={`inline-flex h-8 items-center justify-center rounded-xl px-3 text-[11px] font-black uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 
                                                            ${currentState === option.value
                                                                ? option.className
                                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                            }`}
                                                    >
                                                        {updatingAttendanceId ===
                                                            attendance.id &&
                                                            currentState !== option.value ? (
                                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                        ) : null}

                                                        {option.label}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}