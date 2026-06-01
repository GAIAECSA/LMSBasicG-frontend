"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CalendarCheck,
    CheckCircle2,
    ClipboardCheck,
    Plus,
    UserCheck,
    Users,
} from "lucide-react";

import type { Course } from "@/services/courses.service";
import { getCourses } from "@/services/courses.service";

import type { TeacherAttendanceWorkspaceProps } from "./types";
import { useAttendance } from "./hook";
import { Loading } from "./ui/Loading";
import { Alerts } from "./ui/Alerts";
import { SessionsSidebar } from "./ui/SessionsSidebar";
import { AttendanceTable } from "./ui/AttendanceTable";
import { SessionModal } from "./ui/SessionModal";
import { DeleteModal } from "./ui/DeleteModal";
import { CourseSelect } from "./ui/CourseSelect";

type AnyRecord = Record<string, unknown>;

function cleanText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

function readBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (
            ["true", "1", "yes", "si", "sí", "active", "activo"].includes(
                normalized,
            )
        ) {
            return true;
        }

        if (
            ["false", "0", "no", "inactive", "inactivo"].includes(normalized)
        ) {
            return false;
        }
    }

    return fallback;
}

function getSessionIsActive(session: unknown) {
    if (!session || typeof session !== "object") return false;

    const currentSession = session as AnyRecord;

    return readBoolean(
        currentSession.is_active ??
        currentSession.isActive ??
        currentSession.active ??
        currentSession.enabled,
        true,
    );
}

function getAttendanceStatus(record: unknown) {
    if (!record || typeof record !== "object") return "PENDIENTE";

    const currentRecord = record as AnyRecord;

    const status = cleanText(
        currentRecord.attendance_state ??
        currentRecord.attendanceState ??
        currentRecord.state ??
        currentRecord.status ??
        currentRecord.attendance_status ??
        currentRecord.attendanceStatus,
    ).toUpperCase();

    if (status === "PRESENTE" || status === "PRESENT") return "PRESENTE";
    if (status === "FALTA" || status === "AUSENTE" || status === "ABSENT") return "FALTA";

    return "PENDIENTE";
}

function getAttendanceRoleId(record: unknown) {
    if (!record || typeof record !== "object") return null;

    const currentRecord = record as AnyRecord;

    const enrollment =
        currentRecord.enrollment && typeof currentRecord.enrollment === "object"
            ? (currentRecord.enrollment as AnyRecord)
            : null;

    const roleValue =
        currentRecord.role_id ??
        currentRecord.roleId ??
        enrollment?.role_id ??
        enrollment?.roleId;

    const roleId = Number(roleValue);

    return Number.isFinite(roleId) ? roleId : null;
}

function isAttendanceForRole(record: unknown, roleId: number) {
    return getAttendanceRoleId(record) === roleId;
}

function normalizeCoursesResponse(response: unknown): Course[] {
    if (Array.isArray(response)) {
        return response as Course[];
    }

    if (!response || typeof response !== "object") {
        return [];
    }

    const currentResponse = response as AnyRecord;

    const possibleCourses =
        currentResponse.data ??
        currentResponse.items ??
        currentResponse.results ??
        currentResponse.courses;

    if (Array.isArray(possibleCourses)) {
        return possibleCourses as Course[];
    }

    return [];
}

export function TeacherAttendanceWorkspace({
    courseId,
    isAdminRoute = false,
    attendanceRoleId = 4,
    moduleTitle,
    moduleDescription,
    moduleLabel,
    basePath,
}: TeacherAttendanceWorkspaceProps) {
    const router = useRouter();

    const [courseOptions, setCourseOptions] = useState<Course[]>([]);
    const [courseError, setCourseError] = useState("");
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);

    const currentCourseId = cleanText(courseId);
    const shouldSelectCourse = currentCourseId.length === 0;

    useEffect(() => {
        if (!shouldSelectCourse) return;

        let isMounted = true;

        async function loadCourses() {
            try {
                setIsLoadingCourses(true);
                setCourseError("");

                const response = await getCourses();
                const courses = normalizeCoursesResponse(response);

                if (!isMounted) return;

                setCourseOptions(courses);
            } catch (error) {
                console.error("Error al cargar cursos de asistencia:", error);

                if (!isMounted) return;

                setCourseError("No se pudieron cargar los cursos.");
            } finally {
                if (isMounted) {
                    setIsLoadingCourses(false);
                }
            }
        }

        void loadCourses();

        return () => {
            isMounted = false;
        };
    }, [shouldSelectCourse]);

    function handleSelectCourse(value: string) {
        const selectedCourseId = cleanText(value);

        if (!selectedCourseId) return;

        const currentBasePath =
            basePath ?? (isAdminRoute ? "/admin/attendance/student" : "/teacher/attendance");

        router.push(`${currentBasePath}/${selectedCourseId}`);
    }

    if (shouldSelectCourse) {
        if (isLoadingCourses) {
            return (
                <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 md:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-[1500px]">
                        <Loading />
                    </div>
                </div>
            );
        }

        return (
            <section className="min-h-screen bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 md:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
                    <CourseSelect
                        isAdminRoute={isAdminRoute}
                        courseOptions={courseOptions}
                        error={courseError}
                        onSelectCourse={handleSelectCourse}
                    />
                </div>
            </section>
        );
    }

    return (
        <AttendanceCourseWorkspace
            courseId={currentCourseId}
            isAdminRoute={isAdminRoute}
            attendanceRoleId={attendanceRoleId}
            moduleTitle={moduleTitle}
            moduleDescription={moduleDescription}
            moduleLabel={moduleLabel}
        />
    );
}

function AttendanceCourseWorkspace({
    courseId,
    isAdminRoute,
    attendanceRoleId,
    moduleTitle,
    moduleDescription,
    moduleLabel,
}: {
    courseId: string;
    isAdminRoute: boolean;
    attendanceRoleId: number;
    moduleTitle?: string;
    moduleDescription?: string;
    moduleLabel?: string;
}) {
    const attendance = useAttendance({ courseId });

    if (attendance.isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 md:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
                    <Loading />
                </div>
            </div>
        );
    }

    const totalSessions = attendance.sessions.length;

    const activeSessions = attendance.sessions.filter(getSessionIsActive).length;

    const visibleAttendances = attendance.filteredAttendances.filter((record) =>
        isAttendanceForRole(record, attendanceRoleId),
    );

    const totalRecords = visibleAttendances.length;

    const presentRecords = visibleAttendances.filter(
        (record) => getAttendanceStatus(record) === "PRESENTE",
    ).length;

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-5">
                <Alerts
                    errorMessage={attendance.errorMessage}
                    actionError={attendance.actionError}
                />

                <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem]">
                    <div className="bg-gradient-to-br from-[#07122f] via-[#172b78] to-orange-500 px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]">
                                    <ClipboardCheck className="h-4 w-4" />
                                    {moduleLabel ?? "Asistencia"}
                                </span>

                                <h1 className="mt-5 text-2xl font-black sm:text-3xl">
                                    {moduleTitle ??
                                        (isAdminRoute
                                            ? "Gestión de asistencia"
                                            : "Gestión de asistencia del profesor")}
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                                    {moduleDescription ??
                                        "Consulta, crea y administra las sesiones de asistencia del curso."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
                                <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                                        Sesiones
                                    </p>

                                    <p className="mt-1 text-3xl font-black">
                                        {totalSessions}
                                    </p>

                                    <p className="text-xs font-bold text-white/80">
                                        Registradas
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                                        Activas
                                    </p>

                                    <p className="mt-1 text-3xl font-black">
                                        {activeSessions}
                                    </p>

                                    <p className="text-xs font-bold text-white/80">
                                        Disponibles
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                                        Registros
                                    </p>

                                    <p className="mt-1 text-3xl font-black">
                                        {totalRecords}
                                    </p>

                                    <p className="text-xs font-bold text-white/80">
                                        Estudiantes
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                                        Presentes
                                    </p>

                                    <p className="mt-1 text-3xl font-black">
                                        {presentRecords}
                                    </p>

                                    <p className="text-xs font-bold text-white/80">
                                        Marcados
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-950">
                                        Sesiones de asistencia
                                    </h2>

                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Busque, consulte y administre las
                                        asistencias registradas del curso.
                                    </p>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap xl:justify-end">
                                    <button
                                        type="button"
                                        onClick={attendance.openCreateModal}
                                        disabled={attendance.isSaving}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nueva sesión
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#172861]">
                                            <CalendarCheck className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                                Sesiones
                                            </p>

                                            <p className="text-lg font-black text-slate-950">
                                                {totalSessions}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                                Activas
                                            </p>

                                            <p className="text-lg font-black text-slate-950">
                                                {activeSessions}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                                            <Users className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                                Registros
                                            </p>

                                            <p className="text-lg font-black text-slate-950">
                                                {totalRecords}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                                            <UserCheck className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                                Presentes
                                            </p>

                                            <p className="text-lg font-black text-slate-950">
                                                {presentRecords}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem]">
                            <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
                                <div className="border-b border-slate-200 xl:border-b-0 xl:border-r">
                                    <SessionsSidebar
                                        sessions={attendance.sessions}
                                        selectedSessionId={
                                            attendance.selectedSessionId
                                        }
                                        setSelectedSessionId={
                                            attendance.setSelectedSessionId
                                        }
                                        onCreate={attendance.openCreateModal}
                                    />
                                </div>

                                <div className="min-w-0 p-4 sm:p-5 md:p-6">
                                    <AttendanceTable
                                        selectedSession={attendance.selectedSession}
                                        filteredAttendances={visibleAttendances}
                                        searchTerm={attendance.searchTerm}
                                        isLoadingAttendances={attendance.isLoadingAttendances}
                                        updatingAttendanceId={attendance.updatingAttendanceId}
                                        setSearchTerm={attendance.setSearchTerm}
                                        onEditSession={attendance.openEditModal}
                                        onDeleteSession={attendance.setDeleteSession}
                                        onChangeAttendanceStatus={(
                                            currentAttendance,
                                            status,
                                        ) =>
                                            void attendance.handleChangeAttendanceStatus(
                                                currentAttendance,
                                                status,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {attendance.modalMode ? (
                <SessionModal
                    modalMode={attendance.modalMode}
                    formState={attendance.formState}
                    isSaving={attendance.isSaving}
                    setFormState={attendance.setFormState}
                    onClose={attendance.closeModal}
                    onSubmit={attendance.handleSubmitSession}
                />
            ) : null}

            {attendance.deleteSession ? (
                <DeleteModal
                    deleteSession={attendance.deleteSession}
                    isSaving={attendance.isSaving}
                    onClose={() => attendance.setDeleteSession(null)}
                    onConfirm={() => void attendance.handleDeleteSession()}
                />
            ) : null}
        </section>
    );
}

export default TeacherAttendanceWorkspace;