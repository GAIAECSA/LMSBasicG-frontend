"use client";

import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    CalendarCheck,
    CheckCircle2,
    ClipboardCheck,
    Loader2,
    Plus,
    RefreshCw,
    UserCheck,
    Users,
} from "lucide-react";

import type {
    Course,
} from "@/services/courses.service";

import {
    getCourses,
} from "@/services/courses.service";

import type {
    TeacherAttendanceWorkspaceProps,
} from "./types";

import {
    useAttendance,
} from "./hook";

import {
    Loading,
} from "./ui/Loading";

import {
    Alerts,
} from "./ui/Alerts";

import {
    SessionsSidebar,
} from "./ui/SessionsSidebar";

import {
    AttendanceTable,
} from "./ui/AttendanceTable";

import {
    SessionModal,
} from "./ui/SessionModal";

import {
    DeleteModal,
} from "./ui/DeleteModal";

import {
    CourseSelect,
} from "./ui/CourseSelect";

type AnyRecord =
    Record<string, unknown>;

function cleanText(value: unknown) {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return "";
    }

    return String(value).trim();
}

function readBoolean(
    value: unknown,
    fallback = false,
) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalized =
            value.trim().toLowerCase();

        if (
            [
                "true",
                "1",
                "yes",
                "si",
                "sí",
                "active",
                "activo",
            ].includes(normalized)
        ) {
            return true;
        }

        if (
            [
                "false",
                "0",
                "no",
                "inactive",
                "inactivo",
            ].includes(normalized)
        ) {
            return false;
        }
    }

    return fallback;
}

function getSessionIsActive(
    session: unknown,
) {
    if (
        !session ||
        typeof session !== "object"
    ) {
        return false;
    }

    const currentSession =
        session as AnyRecord;

    return readBoolean(
        currentSession.is_active ??
        currentSession.isActive ??
        currentSession.active ??
        currentSession.enabled,
        true,
    );
}

function getAttendanceStatus(
    record: unknown,
) {
    if (
        !record ||
        typeof record !== "object"
    ) {
        return "PENDIENTE";
    }

    const currentRecord =
        record as AnyRecord;

    const status = cleanText(
        currentRecord.attendance_state ??
        currentRecord.attendanceState ??
        currentRecord.state ??
        currentRecord.status ??
        currentRecord.attendance_status ??
        currentRecord.attendanceStatus,
    ).toUpperCase();

    if (
        status === "PRESENTE" ||
        status === "PRESENT"
    ) {
        return "PRESENTE";
    }

    if (
        status === "FALTA" ||
        status === "AUSENTE" ||
        status === "ABSENT"
    ) {
        return "FALTA";
    }

    return "PENDIENTE";
}

function getAttendanceRoleId(
    record: unknown,
) {
    if (
        !record ||
        typeof record !== "object"
    ) {
        return null;
    }

    const currentRecord =
        record as AnyRecord;

    const enrollment =
        currentRecord.enrollment &&
            typeof currentRecord.enrollment ===
            "object"
            ? (currentRecord.enrollment as AnyRecord)
            : null;

    const enrollmentUser =
        enrollment?.user &&
            typeof enrollment.user === "object"
            ? (enrollment.user as AnyRecord)
            : null;

    const roleValue =
        currentRecord.role_id ??
        currentRecord.roleId ??
        enrollment?.role_id ??
        enrollment?.roleId ??
        enrollmentUser?.role_id ??
        enrollmentUser?.roleId;

    const roleId = Number(roleValue);

    return Number.isFinite(roleId)
        ? roleId
        : null;
}

function isAttendanceForRole(
    record: unknown,
    roleId: number,
) {
    return (
        getAttendanceRoleId(record) ===
        roleId
    );
}

function normalizeCoursesResponse(
    response: unknown,
): Course[] {
    if (Array.isArray(response)) {
        return response as Course[];
    }

    if (
        !response ||
        typeof response !== "object"
    ) {
        return [];
    }

    const currentResponse =
        response as AnyRecord;

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

    const [
        courseOptions,
        setCourseOptions,
    ] = useState<Course[]>([]);

    const [
        courseError,
        setCourseError,
    ] = useState("");

    const [
        isLoadingCourses,
        setIsLoadingCourses,
    ] = useState(false);

    const coursesRequestRef = useRef<Promise<Course[]> | null>(null);

    const currentCourseId =
        cleanText(courseId);

    const shouldSelectCourse =
        currentCourseId.length === 0;

    useEffect(() => {
        if (!shouldSelectCourse) return;

        let isActive = true;

        async function loadCourses() {
            try {
                setIsLoadingCourses(true);
                setCourseError("");

                if (!coursesRequestRef.current) {
                    coursesRequestRef.current = getCourses()
                        .then((response) =>
                            normalizeCoursesResponse(
                                response,
                            ),
                        )
                        .finally(() => {
                            coursesRequestRef.current =
                                null;
                        });
                }

                const courses =
                    await coursesRequestRef.current;

                if (!isActive) return;

                setCourseOptions(courses);
            } catch (error) {
                console.error(
                    "Error al cargar cursos de asistencia:",
                    error,
                );

                if (!isActive) return;

                setCourseError(
                    "No se pudieron cargar los cursos.",
                );
            } finally {
                if (isActive) {
                    setIsLoadingCourses(
                        false,
                    );
                }
            }
        }

        void loadCourses();

        return () => {
            isActive = false;
        };
    }, [shouldSelectCourse]);

    function handleSelectCourse(
        value: string,
    ) {
        const selectedCourseId =
            cleanText(value);

        if (!selectedCourseId) return;

        const currentBasePath =
            basePath ??
            (isAdminRoute
                ? "/admin/attendance/student"
                : "/teacher/attendance");

        router.push(
            `${currentBasePath}/${selectedCourseId}`,
        );
    }

    if (shouldSelectCourse) {
        if (isLoadingCourses) {
            return (
                <div className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                    <div className="mx-auto w-full max-w-[1480px]">
                        <Loading />
                    </div>
                </div>
            );
        }

        return (
            <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1480px]">
                    <CourseSelect
                        isAdminRoute={
                            isAdminRoute
                        }
                        courseOptions={
                            courseOptions
                        }
                        error={courseError}
                        onSelectCourse={
                            handleSelectCourse
                        }
                    />
                </div>
            </section>
        );
    }

    return (
        <AttendanceCourseWorkspace
            courseId={currentCourseId}
            isAdminRoute={isAdminRoute}
            attendanceRoleId={
                attendanceRoleId
            }
            moduleTitle={moduleTitle}
            moduleDescription={
                moduleDescription
            }
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
    const attendance =
        useAttendance({ courseId });

    if (attendance.isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1480px]">
                    <Loading />
                </div>
            </div>
        );
    }

    const totalSessions =
        attendance.sessions.length;

    const activeSessions =
        attendance.sessions.filter(
            getSessionIsActive,
        ).length;

    const visibleAttendances =
        attendance.filteredAttendances.filter(
            (record) =>
                isAttendanceForRole(
                    record,
                    attendanceRoleId,
                ),
        );

    const totalRecords =
        visibleAttendances.length;

    const presentRecords =
        visibleAttendances.filter(
            (record) =>
                getAttendanceStatus(record) ===
                "PRESENTE",
        ).length;

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1480px] space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3">
                <Alerts
                    errorMessage={
                        attendance.errorMessage
                    }
                    actionError=""
                />

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[2rem]">
                    <div className="bg-gradient-to-br from-[#07122f] via-[#172b78] to-orange-500 px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6 [@media(max-height:760px)]:py-4">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                            <div className="min-w-0">
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.16em]">
                                    <ClipboardCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                                    {moduleLabel ??
                                        "Asistencia"}
                                </span>

                                <h1 className="mt-3 break-words text-xl font-black leading-tight [overflow-wrap:anywhere] sm:mt-4 sm:text-2xl lg:text-3xl [@media(max-height:760px)]:text-xl">
                                    {moduleTitle ??
                                        (isAdminRoute
                                            ? "Gestión de asistencia"
                                            : "Gestión de asistencia del profesor")}
                                </h1>

                                <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-white/90 sm:text-sm sm:leading-6">
                                    {moduleDescription ??
                                        "Consulta, crea y administra las sesiones de asistencia del curso."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[500px]">
                                <HeroMetric
                                    label="Sesiones"
                                    value={
                                        totalSessions
                                    }
                                    caption="Registradas"
                                />

                                <HeroMetric
                                    label="Activas"
                                    value={
                                        activeSessions
                                    }
                                    caption="Disponibles"
                                />

                                <HeroMetric
                                    label="Registros"
                                    value={
                                        totalRecords
                                    }
                                    caption="Estudiantes"
                                />

                                <HeroMetric
                                    label="Presentes"
                                    value={
                                        presentRecords
                                    }
                                    caption="Marcados"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                <div className="min-w-0">
                                    <h2 className="text-base font-black text-slate-950 sm:text-lg">
                                        Sesiones de asistencia
                                    </h2>

                                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                        Busca, consulta y administra
                                        las asistencias registradas
                                        del curso.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 xs:flex">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void attendance.refreshAll(
                                                attendance.selectedSessionId ||
                                                undefined,
                                                true,
                                            )
                                        }
                                        disabled={
                                            attendance.isBusy
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                    >
                                        {attendance.isRefreshing ? (
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4 shrink-0" />
                                        )}

                                        Actualizar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            attendance.openCreateModal
                                        }
                                        disabled={
                                            attendance.isBusy
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white shadow-sm transition hover:opacity-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                    >
                                        <Plus className="h-4 w-4 shrink-0" />
                                        Nueva sesión
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4 [@media(max-height:760px)]:hidden">
                                <SummaryMetric
                                    icon={
                                        <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                    }
                                    label="Sesiones"
                                    value={
                                        totalSessions
                                    }
                                    iconClassName="bg-blue-50 text-[#172861]"
                                />

                                <SummaryMetric
                                    icon={
                                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    }
                                    label="Activas"
                                    value={
                                        activeSessions
                                    }
                                    iconClassName="bg-emerald-50 text-emerald-700"
                                />

                                <SummaryMetric
                                    icon={
                                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                    }
                                    label="Registros"
                                    value={
                                        totalRecords
                                    }
                                    iconClassName="bg-orange-50 text-orange-600"
                                />

                                <SummaryMetric
                                    icon={
                                        <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                    }
                                    label="Presentes"
                                    value={
                                        presentRecords
                                    }
                                    iconClassName="bg-purple-50 text-purple-700"
                                />
                            </div>
                        </div>

                        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-4 sm:rounded-[2rem] [@media(max-height:760px)]:mt-3">
                            <div className="flex min-w-0 flex-col">
                                <SessionsSidebar
                                    sessions={
                                        attendance.sessions
                                    }
                                    selectedSessionId={
                                        attendance.selectedSessionId
                                    }
                                    setSelectedSessionId={
                                        attendance.selectSessionId
                                    }
                                    isDisabled={
                                        attendance.isBusy
                                    }
                                />

                                <div className="min-w-0">
                                    <AttendanceTable
                                        selectedSession={
                                            attendance.selectedSession
                                        }
                                        filteredAttendances={
                                            visibleAttendances
                                        }
                                        searchTerm={
                                            attendance.searchTerm
                                        }
                                        isLoadingAttendances={
                                            attendance.isLoadingAttendances
                                        }
                                        updatingAttendanceId={
                                            attendance.updatingAttendanceId
                                        }
                                        isActionBusy={
                                            attendance.isBusy
                                        }
                                        setSearchTerm={
                                            attendance.setSearchTerm
                                        }
                                        onEditSession={
                                            attendance.openEditModal
                                        }
                                        onDeleteSession={
                                            attendance.openDeleteModal
                                        }
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
                    modalMode={
                        attendance.modalMode
                    }
                    formState={
                        attendance.formState
                    }
                    isSaving={
                        attendance.isSaving
                    }
                    errorMessage={
                        attendance.errorMessage
                    }
                    actionError={
                        attendance.actionError
                    }
                    setFormState={
                        attendance.setFormState
                    }
                    onClose={
                        attendance.closeModal
                    }
                    onSubmit={
                        attendance.handleSubmitSession
                    }
                />
            ) : null}

            {attendance.deleteSession ? (
                <DeleteModal
                    deleteSession={
                        attendance.deleteSession
                    }
                    isSaving={
                        attendance.isSaving
                    }
                    onClose={
                        attendance.closeDeleteModal
                    }
                    onConfirm={() =>
                        void attendance.handleDeleteSession()
                    }
                />
            ) : null}
        </section>
    );
}

function HeroMetric({
    label,
    value,
    caption,
}: {
    label: string;
    value: number;
    caption: string;
}) {
    return (
        <div className="rounded-xl bg-white/15 px-3 py-2.5 shadow-sm backdrop-blur sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/70 sm:text-[10px]">
                {label}
            </p>

            <p className="mt-1 text-xl font-black sm:text-2xl">
                {value}
            </p>

            <p className="text-[10px] font-bold text-white/80 sm:text-xs">
                {caption}
            </p>
        </div>
    );
}

function SummaryMetric({
    icon,
    label,
    value,
    iconClassName,
}: {
    icon: ReactNode;
    label: string;
    value: number;
    iconClassName: string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl ${iconClassName}`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs sm:tracking-[0.14em]">
                        {label}
                    </p>

                    <p className="text-base font-black text-slate-950 sm:text-lg">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TeacherAttendanceWorkspace;
