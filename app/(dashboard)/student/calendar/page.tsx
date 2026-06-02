"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    GraduationCap,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
    getLessonCalendarActivitiesByLessons,
    getLessonsByModule,
    type LessonCalendarActivity,
} from "@/services/lessons.service";

import { getModulesByCourse } from "@/services/modules.service";

import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";

import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
}

function readPositiveNumber(...values: unknown[]): number | null {
    for (const value of values) {
        const numericValue = Number(value);

        if (
            Number.isFinite(numericValue) &&
            numericValue > 0
        ) {
            return numericValue;
        }
    }

    return null;
}

function getEnrollmentCourseId(
    enrollment: Enrollment,
): number | null {
    const record = toRecord(enrollment);
    const course = toRecord(record?.course);

    return readPositiveNumber(
        course?.id,
        record?.course_id,
        record?.courseId,
    );
}

function getEnrollmentRoleId(
    enrollment: Enrollment,
): number | null {
    const record = toRecord(enrollment);
    const role = toRecord(record?.role);

    return readPositiveNumber(
        role?.id,
        record?.role_id,
        record?.roleId,
    );
}

function isApprovedStudentEnrollment(
    enrollment: Enrollment,
) {
    const record = toRecord(enrollment);

    if (!record || record.accepted !== true) {
        return false;
    }

    const roleId = getEnrollmentRoleId(enrollment);

    /*
        role_id = 4 corresponde al estudiante.

        Si el backend no devuelve el rol dentro de la matrícula,
        permitimos la matrícula aprobada para mantener compatibilidad.
    */
    return roleId === null || roleId === 4;
}

async function getStudentCalendarActivities(
    userId: number,
): Promise<LessonCalendarActivity[]> {
    /*
        1. Consultar únicamente las matrículas del usuario autenticado.
    */
    const enrollments = await getEnrollmentsByUser(userId);

    /*
        2. Mantener únicamente cursos con matrícula aprobada
           para el rol de estudiante.
    */
    const courseIds = Array.from(
        new Set(
            enrollments
                .filter(isApprovedStudentEnrollment)
                .map(getEnrollmentCourseId)
                .filter(
                    (courseId): courseId is number =>
                        courseId !== null,
                ),
        ),
    );

    if (courseIds.length === 0) {
        return [];
    }

    /*
        3. Obtener módulos y lecciones de cada curso matriculado.
        4. Recuperar únicamente las actividades de esas lecciones.
    */
    const activitiesByCourse = await Promise.all(
        courseIds.map(async (courseId) => {
            const modules = await getModulesByCourse(courseId);

            const lessonsByModule = await Promise.all(
                modules.map(async (moduleItem) => {
                    const moduleRecord = toRecord(moduleItem);

                    const moduleId = readPositiveNumber(
                        moduleRecord?.id,
                    );

                    if (!moduleId) return [];

                    return getLessonsByModule(moduleId);
                }),
            );

            const lessonIds = Array.from(
                new Set(
                    lessonsByModule
                        .flat()
                        .map((lessonItem) =>
                            readPositiveNumber(lessonItem.id),
                        )
                        .filter(
                            (lessonId): lessonId is number =>
                                lessonId !== null,
                        ),
                ),
            );

            if (lessonIds.length === 0) {
                return [];
            }

            return getLessonCalendarActivitiesByLessons(
                lessonIds,
                courseId,
            );
        }),
    );

    /*
        Evita duplicados si una actividad llega repetida.
    */
    const activitiesByBlockId = new Map<
        number,
        LessonCalendarActivity
    >();

    activitiesByCourse
        .flat()
        .forEach((activity) => {
            activitiesByBlockId.set(
                activity.lesson_block_id,
                activity,
            );
        });

    return Array.from(activitiesByBlockId.values()).sort(
        (firstActivity, secondActivity) =>
            new Date(firstActivity.date_available).getTime() -
            new Date(secondActivity.date_available).getTime(),
    );
}

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type CalendarDay = {
    key: string;
    dayNumber: number;
    inCurrentMonth: boolean;
    isToday: boolean;
    activities: LessonCalendarActivity[];
};

function pad2(value: number) {
    return String(value).padStart(2, "0");
}

function getDateKeyFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
        date.getDate(),
    )}`;
}

function getMonthKeyFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function getActivityTimestamp(value: string) {
    const date = new Date(value);
    const timestamp = date.getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getActivityDayKey(activity: LessonCalendarActivity) {
    const timestamp = getActivityTimestamp(activity.date_available);

    if (!timestamp) return "";

    return getDateKeyFromTimestamp(timestamp);
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "full",
        timeStyle: "short",
    }).format(date);
}

function formatShortTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatMonthLabel(monthKey: string) {
    if (!monthKey) return "Calendario";

    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);

    return new Intl.DateTimeFormat("es-EC", {
        month: "long",
        year: "numeric",
    }).format(date);
}

function addMonths(monthKey: string, amount: number) {
    if (!monthKey) return monthKey;

    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1 + amount, 1);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function getActivityTypeLabel(typeKey: string) {
    const normalizedType = typeKey.trim().toLowerCase();

    if (normalizedType === "survey") return "Encuesta";
    if (normalizedType === "quiz") return "Evaluación";
    if (normalizedType === "homework") return "Tarea";
    if (normalizedType === "video") return "Video";
    if (normalizedType === "resource") return "Recurso";
    if (normalizedType === "text") return "Contenido";

    return "Actividad";
}

function getActivityStatus(
    activity: LessonCalendarActivity,
    nowTimestamp: number,
) {
    const activityTime = getActivityTimestamp(activity.date_available);

    if (!activityTime) {
        return {
            label: "Sin fecha válida",
            className: "bg-slate-100 text-slate-700",
            dotClassName: "bg-slate-500",
            icon: AlertCircle,
        };
    }

    if (nowTimestamp > 0 && activityTime < nowTimestamp) {
        return {
            label: "Fecha vencida",
            className: "bg-red-100 text-red-700",
            dotClassName: "bg-red-600",
            icon: AlertCircle,
        };
    }

    const activityDate = new Date(activityTime);
    const nowDate = new Date(nowTimestamp);

    const sameDay =
        nowTimestamp > 0 &&
        activityDate.getFullYear() === nowDate.getFullYear() &&
        activityDate.getMonth() === nowDate.getMonth() &&
        activityDate.getDate() === nowDate.getDate();

    if (sameDay) {
        return {
            label: "Disponible hoy",
            className: "bg-amber-100 text-amber-700",
            dotClassName: "bg-amber-500",
            icon: Clock3,
        };
    }

    return {
        label: "Próxima actividad",
        className: "bg-emerald-100 text-emerald-700",
        dotClassName: "bg-emerald-600",
        icon: CheckCircle2,
    };
}

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Estudiante";

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName = `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Estudiante"
    );
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "ES";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function buildCalendarDays({
    monthKey,
    activities,
    todayKey,
}: {
    monthKey: string;
    activities: LessonCalendarActivity[];
    todayKey: string;
}): CalendarDay[] {
    const [year, month] = monthKey.split("-").map(Number);

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    const firstDayWeekIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDaysInMonth = lastDayOfMonth.getDate();
    const previousMonthLastDay = new Date(year, month - 1, 0).getDate();

    const activitiesByDay = activities.reduce<
        Record<string, LessonCalendarActivity[]>
    >((acc, activity) => {
        const key = getActivityDayKey(activity);

        if (!key) return acc;

        acc[key] = [...(acc[key] ?? []), activity];

        return acc;
    }, {});

    const days: CalendarDay[] = [];

    for (let index = firstDayWeekIndex - 1; index >= 0; index -= 1) {
        const dayNumber = previousMonthLastDay - index;
        const date = new Date(year, month - 2, dayNumber);
        const key = getDateKeyFromTimestamp(date.getTime());

        days.push({
            key,
            dayNumber,
            inCurrentMonth: false,
            isToday: key === todayKey,
            activities: activitiesByDay[key] ?? [],
        });
    }

    for (let dayNumber = 1; dayNumber <= totalDaysInMonth; dayNumber += 1) {
        const date = new Date(year, month - 1, dayNumber);
        const key = getDateKeyFromTimestamp(date.getTime());

        days.push({
            key,
            dayNumber,
            inCurrentMonth: true,
            isToday: key === todayKey,
            activities: activitiesByDay[key] ?? [],
        });
    }

    let nextMonthDay = 1;

    while (days.length % 7 !== 0 || days.length < 42) {
        const date = new Date(year, month, nextMonthDay);
        const key = getDateKeyFromTimestamp(date.getTime());

        days.push({
            key,
            dayNumber: nextMonthDay,
            inCurrentMonth: false,
            isToday: key === todayKey,
            activities: activitiesByDay[key] ?? [],
        });

        nextMonthDay += 1;
    }

    return days;
}

function PageTopBar({
    initials,
    isRefreshing,
    onRefresh,
}: {
    initials: string;
    isRefreshing: boolean;
    onRefresh: () => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                Rol: Estudiante
            </span>

            <StudentNotificationsBell />

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)] shadow-sm">
                {initials}
            </div>

        </div>
    );
}

export default function StudentCalendarPage() {
    const { user } = useAuth();

    const studentUserId = useMemo(() => {
        const userRecord = toRecord(user);

        return readPositiveNumber(userRecord?.id);
    }, [user]);

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    const [activities, setActivities] = useState<LessonCalendarActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [nowTimestamp, setNowTimestamp] = useState(0);
    const [currentMonthKey, setCurrentMonthKey] = useState("");
    const [selectedDayKey, setSelectedDayKey] = useState("");

    const todayKey = useMemo(() => {
        if (!nowTimestamp) return "";

        return getDateKeyFromTimestamp(nowTimestamp);
    }, [nowTimestamp]);

    const nextActivities = useMemo(
        () =>
            activities.filter((activity) => {
                const activityTime = getActivityTimestamp(
                    activity.date_available,
                );

                return (
                    activityTime > 0 &&
                    nowTimestamp > 0 &&
                    activityTime >= nowTimestamp
                );
            }),
        [activities, nowTimestamp],
    );

    const expiredActivities = useMemo(
        () =>
            activities.filter((activity) => {
                const activityTime = getActivityTimestamp(
                    activity.date_available,
                );

                return (
                    activityTime > 0 &&
                    nowTimestamp > 0 &&
                    activityTime < nowTimestamp
                );
            }),
        [activities, nowTimestamp],
    );

    const calendarDays = useMemo(
        () =>
            currentMonthKey
                ? buildCalendarDays({
                    monthKey: currentMonthKey,
                    activities,
                    todayKey,
                })
                : [],
        [activities, currentMonthKey, todayKey],
    );

    const selectedDayActivities = useMemo(
        () =>
            activities.filter(
                (activity) => getActivityDayKey(activity) === selectedDayKey,
            ),
        [activities, selectedDayKey],
    );

    const loadCalendar = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const currentTimestamp = Date.now();

            if (!studentUserId) {
                throw new Error(
                    "No se pudo identificar al estudiante autenticado.",
                );
            }

            const data =
                await getStudentCalendarActivities(studentUserId);

            const firstActivityTimestamp =
                data.length > 0
                    ? getActivityTimestamp(data[0].date_available)
                    : currentTimestamp;

            const baseTimestamp = firstActivityTimestamp || currentTimestamp;

            setNowTimestamp(currentTimestamp);
            setActivities(data);
            setCurrentMonthKey(getMonthKeyFromTimestamp(baseTimestamp));
            setSelectedDayKey(getDateKeyFromTimestamp(baseTimestamp));
        } catch (error) {
            setActivities([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar las actividades del calendario.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [studentUserId]);

    const refreshCalendar = useCallback(async () => {
        try {
            setIsRefreshing(true);
            setErrorMessage("");

            const currentTimestamp = Date.now();

            if (!studentUserId) {
                throw new Error(
                    "No se pudo identificar al estudiante autenticado.",
                );
            }

            const data =
                await getStudentCalendarActivities(studentUserId);

            setNowTimestamp(currentTimestamp);
            setActivities(data);

            if (!currentMonthKey) {
                setCurrentMonthKey(getMonthKeyFromTimestamp(currentTimestamp));
            }

            if (!selectedDayKey) {
                setSelectedDayKey(getDateKeyFromTimestamp(currentTimestamp));
            }
        } catch (error) {
            setActivities([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron actualizar las actividades del calendario.",
            );
        } finally {
            setIsRefreshing(false);
        }
    }, [
        currentMonthKey,
        selectedDayKey,
        studentUserId,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCalendar();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCalendar]);

    return (
        <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                        Calendario académico
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                        Visualiza tus actividades por día según la fecha
                        configurada.
                    </p>
                </div>

                <PageTopBar
                    initials={initials}
                    isRefreshing={isRefreshing || isLoading}
                    onRefresh={() => void refreshCalendar()}
                />
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <SummaryCard
                    title="Actividades"
                    value={String(activities.length)}
                    detail="Con fecha disponible"
                    tone="blue"
                />

                <SummaryCard
                    title="Próximas"
                    value={String(nextActivities.length)}
                    detail="Pendientes por realizar"
                    tone="green"
                />

                <SummaryCard
                    title="Vencidas"
                    value={String(expiredActivities.length)}
                    detail="Ya pasaron su fecha"
                    tone="red"
                />
            </div>

            {errorMessage ? (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                        <p className="font-black">
                            No se pudo cargar el calendario.
                        </p>

                        <p className="mt-1">{errorMessage}</p>
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <CalendarSkeleton />
            ) : activities.length === 0 ? (
                <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
                    <CalendarDays className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />

                    <h2 className="mt-4 text-xl font-black text-[var(--foreground)]">
                        No hay actividades en el calendario
                    </h2>

                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                        Los bloques de lección existen, pero ninguno tiene una
                        fecha registrada en{" "}
                        <span className="font-black">date_available</span>.
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-black capitalize text-[var(--foreground)]">
                                    {formatMonthLabel(currentMonthKey)}
                                </h2>

                                <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                                    Haz clic en un día para ver sus actividades.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentMonthKey((value) =>
                                            addMonths(value, -1),
                                        )
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                                    aria-label="Mes anterior"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!nowTimestamp) return;

                                        setCurrentMonthKey(
                                            getMonthKeyFromTimestamp(
                                                nowTimestamp,
                                            ),
                                        );

                                        setSelectedDayKey(
                                            getDateKeyFromTimestamp(
                                                nowTimestamp,
                                            ),
                                        );
                                    }}
                                    className="h-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                                >
                                    Hoy
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentMonthKey((value) =>
                                            addMonths(value, 1),
                                        )
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                                    aria-label="Mes siguiente"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--muted)]">
                            {WEEK_DAYS.map((day) => (
                                <div
                                    key={day}
                                    className="px-3 py-3 text-center text-xs font-black uppercase text-[var(--muted-foreground)]"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarDays.map((day) => (
                                <button
                                    key={day.key}
                                    type="button"
                                    onClick={() => setSelectedDayKey(day.key)}
                                    className={`min-h-[130px] border-b border-r border-[var(--border)] p-2 text-left transition hover:bg-[var(--secondary)]/60 ${selectedDayKey === day.key
                                        ? "bg-[var(--secondary)]"
                                        : "bg-white"
                                        } ${!day.inCurrentMonth ? "opacity-45" : ""
                                        }`}
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${day.isToday
                                                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                                                : "text-[var(--foreground)]"
                                                }`}
                                        >
                                            {day.dayNumber}
                                        </span>

                                        {day.activities.length > 0 ? (
                                            <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-black text-[var(--primary-foreground)]">
                                                {day.activities.length}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="space-y-1">
                                        {day.activities
                                            .slice(0, 3)
                                            .map((activity) => {
                                                const status =
                                                    getActivityStatus(
                                                        activity,
                                                        nowTimestamp,
                                                    );

                                                const time = formatShortTime(
                                                    activity.date_available,
                                                );

                                                return (
                                                    <div
                                                        key={activity.id}
                                                        className="truncate rounded-xl bg-[var(--card)] px-2 py-1 text-[11px] font-black text-[var(--foreground)] shadow-sm"
                                                        title={activity.title}
                                                    >
                                                        <span
                                                            className={`mr-1 inline-block h-2 w-2 rounded-full ${status.dotClassName}`}
                                                        />
                                                        {time ? `${time} ` : ""}
                                                        {activity.title}
                                                    </div>
                                                );
                                            })}

                                        {day.activities.length > 3 ? (
                                            <div className="rounded-xl bg-[var(--muted)] px-2 py-1 text-[11px] font-black text-[var(--muted-foreground)]">
                                                +{day.activities.length - 3} más
                                            </div>
                                        ) : null}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-5">
                        <section className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                            <h3 className="text-base font-black text-[var(--foreground)]">
                                Actividades del día
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                                {selectedDayKey || "Selecciona un día"}
                            </p>

                            <div className="mt-5 space-y-3">
                                {selectedDayActivities.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-5 text-center">
                                        <CalendarDays className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />

                                        <p className="mt-2 text-sm font-bold text-[var(--muted-foreground)]">
                                            No hay actividades para este día.
                                        </p>
                                    </div>
                                ) : (
                                    selectedDayActivities.map((activity) => {
                                        const status = getActivityStatus(
                                            activity,
                                            nowTimestamp,
                                        );
                                        const StatusIcon = status.icon;

                                        return (
                                            <article
                                                key={activity.id}
                                                className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
                                            >
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black uppercase text-[var(--primary)]">
                                                        {getActivityTypeLabel(
                                                            activity.type_key,
                                                        )}
                                                    </span>

                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase ${status.className}`}
                                                    >
                                                        <StatusIcon className="h-3.5 w-3.5" />
                                                        {status.label}
                                                    </span>

                                                    {/*  {activity.is_required ? (
                                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-700">
                                                            Obligatoria
                                                        </span>
                                                    ) : null} */}
                                                </div>

                                                <h4 className="mt-3 text-sm font-black text-[var(--foreground)]">
                                                    {activity.title}
                                                </h4>

                                                <p className="mt-1 text-xs font-bold text-[var(--muted-foreground)]">
                                                    {formatDate(
                                                        activity.date_available,
                                                    )}
                                                </p>

                                                {/*  {activity.description ? (
                                                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                                                        {activity.description}
                                                    </p>
                                                ) : null} */}

                                                {activity.url !== "#" ? (
                                                    <Link
                                                        href={activity.url}
                                                        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-sm font-black !text-white transition hover:opacity-95"
                                                    >
                                                        Ver actividad
                                                    </Link>
                                                ) : null}
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            )}
        </section>
    );
}

function SummaryCard({
    title,
    value,
    detail,
    tone,
}: {
    title: string;
    value: string;
    detail: string;
    tone: "blue" | "green" | "red";
}) {
    const styles = {
        blue: "bg-[var(--secondary)] text-[var(--primary)]",
        green: "bg-[var(--success-soft)] text-[var(--success)]",
        red: "bg-red-50 text-red-700",
    }[tone];

    return (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${styles}`}
            >
                <CalendarDays className="h-6 w-6" />
            </div>

            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                {title}
            </p>

            <p className="mt-1 text-3xl font-black text-[var(--foreground)]">
                {value}
            </p>

            <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                {detail}
            </p>
        </div>
    );
}

function CalendarSkeleton() {
    return (
        <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="mb-4 h-10 w-64 animate-pulse rounded-2xl bg-[var(--muted)]" />

            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 42 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[120px] animate-pulse rounded-2xl bg-[var(--muted)]"
                    />
                ))}
            </div>
        </div>
    );
}