"use client";

import Link from "next/link";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AlertCircle,
    Bell,
    CalendarDays,
    Loader2,
    RefreshCw,
} from "lucide-react";
import {
    getLessonCalendarActivitiesByLessons,
    type LessonCalendarActivity,
} from "@/services/lessons.service";


const DEFAULT_LESSON_IDS = [2];

type StudentNotificationsBellProps = {
    lessonIds?: number[];
    courseId?: number;
    maxItems?: number;
};

function getActivityTimestamp(value: string) {
    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatNotificationDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
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

export function StudentNotificationsBell({
    lessonIds = DEFAULT_LESSON_IDS,
    courseId,
    maxItems = 5,
}: StudentNotificationsBellProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [activities, setActivities] = useState<LessonCalendarActivity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [nowTimestamp, setNowTimestamp] = useState(0);

    const lessonIdsKey = useMemo(
        () =>
            lessonIds
                .map((lessonId) => Number(lessonId))
                .filter((lessonId) => Number.isFinite(lessonId) && lessonId > 0)
                .join(","),
        [lessonIds],
    );

    const nextActivities = useMemo(
        () =>
            activities
                .filter((activity) => {
                    const activityTime = getActivityTimestamp(
                        activity.date_available,
                    );

                    return (
                        activityTime > 0 &&
                        nowTimestamp > 0 &&
                        activityTime >= nowTimestamp
                    );
                })
                .sort(
                    (a, b) =>
                        getActivityTimestamp(a.date_available) -
                        getActivityTimestamp(b.date_available),
                ),
        [activities, nowTimestamp],
    );

    const visibleActivities = nextActivities.slice(0, maxItems);
    const notificationCount = nextActivities.length;

    const loadNotifications = useCallback(async () => {
        const validLessonIds = lessonIdsKey
            .split(",")
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0);

        if (validLessonIds.length === 0) {
            setActivities([]);
            setNowTimestamp(Date.now());
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage("");

            const currentTimestamp = Date.now();

            const data = await getLessonCalendarActivitiesByLessons(
                validLessonIds,
                courseId,
            );

            setNowTimestamp(currentTimestamp);
            setActivities(data);
        } catch (error) {
            setActivities([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar las notificaciones.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [lessonIdsKey, courseId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadNotifications();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadNotifications]);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                aria-label="Notificaciones"
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Bell className="h-5 w-5" />
                )}

                {notificationCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-black text-[var(--primary-foreground)]">
                        {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                ) : null}
            </button>

            {isOpen ? (
                <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-xl">
                    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                        <div>
                            <h3 className="text-sm font-black text-[var(--foreground)]">
                                Actividades próximas
                            </h3>

                            <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                                Tienes {notificationCount} actividad(es)
                                pendiente(s).
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadNotifications()}
                            disabled={isLoading}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Actualizar notificaciones"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    {errorMessage ? (
                        <div className="m-3 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    ) : null}

                    {visibleActivities.length === 0 ? (
                        <div className="p-6 text-center">
                            <Bell className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />

                            <p className="mt-3 text-sm font-bold text-[var(--muted-foreground)]">
                                No tienes actividades próximas.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[360px] overflow-y-auto p-2">
                            {visibleActivities.map((activity) => (
                                <Link
                                    key={activity.id}
                                    href={
                                        activity.url && activity.url !== "#"
                                            ? activity.url
                                            : "/student/calendar"
                                    }
                                    onClick={() => setIsOpen(false)}
                                    className="block rounded-2xl px-3 py-3 transition hover:bg-[var(--muted)]"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--primary)]">
                                                    {getActivityTypeLabel(
                                                        activity.type_key,
                                                    )}
                                                </span>

                                                {/*  {activity.is_required ? (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                                                        Obligatoria
                                                    </span>
                                                ) : null} */}
                                            </div>

                                            <p className="mt-2 line-clamp-1 text-sm font-black text-[var(--foreground)]">
                                                {activity.title}
                                            </p>

                                            <p className="mt-1 text-xs font-bold text-[var(--muted-foreground)]">
                                                {formatNotificationDate(
                                                    activity.date_available,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-[var(--border)] p-3">
                        <Link
                            href="/student/calendar"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-sm font-black !text-white transition hover:opacity-95"
                        >
                            <span className="!text-white">Ver calendario completo</span>
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}