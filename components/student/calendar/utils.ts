import {
    AlertCircle,
    CheckCircle2,
    Clock3,
} from "lucide-react";
import type { LessonCalendarActivity } from "@/services/lessons.service";
import type {
    AnyRecord,
    CalendarActivityStatus,
    CalendarDay,
} from "./types";

export function toRecord(
    value: unknown,
): AnyRecord | null {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return null;
    }

    return value as AnyRecord;
}

export function readPositiveNumber(
    ...values: unknown[]
): number | null {
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

function pad2(value: number) {
    return String(value).padStart(2, "0");
}

export function getDateKeyFromTimestamp(
    timestamp: number,
) {
    const date = new Date(timestamp);

    return `${date.getFullYear()}-${pad2(
        date.getMonth() + 1,
    )}-${pad2(date.getDate())}`;
}

export function getMonthKeyFromTimestamp(
    timestamp: number,
) {
    const date = new Date(timestamp);

    return `${date.getFullYear()}-${pad2(
        date.getMonth() + 1,
    )}`;
}

export function getActivityTimestamp(
    value: string,
) {
    const date = new Date(value);
    const timestamp = date.getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getActivityDayKey(
    activity: LessonCalendarActivity,
) {
    const timestamp = getActivityTimestamp(
        activity.date_available,
    );

    if (!timestamp) return "";

    return getDateKeyFromTimestamp(timestamp);
}

export function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "full",
        timeStyle: "short",
    }).format(date);
}

export function formatShortTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function formatMonthLabel(monthKey: string) {
    if (!monthKey) return "Calendario";

    const [year, month] = monthKey
        .split("-")
        .map(Number);

    const date = new Date(year, month - 1, 1);

    return new Intl.DateTimeFormat("es-EC", {
        month: "long",
        year: "numeric",
    }).format(date);
}

export function addMonths(
    monthKey: string,
    amount: number,
) {
    if (!monthKey) return monthKey;

    const [year, month] = monthKey
        .split("-")
        .map(Number);

    const date = new Date(
        year,
        month - 1 + amount,
        1,
    );

    return `${date.getFullYear()}-${pad2(
        date.getMonth() + 1,
    )}`;
}

export function getActivityTypeLabel(
    typeKey: string,
) {
    const normalizedType = typeKey
        .trim()
        .toLowerCase();

    if (normalizedType === "survey") return "Encuesta";
    if (normalizedType === "quiz") return "Evaluación";
    if (normalizedType === "homework") return "Tarea";
    if (normalizedType === "video") return "Video";
    if (normalizedType === "resource") return "Recurso";
    if (normalizedType === "text") return "Contenido";
    if (normalizedType === "pdf") return "PDF";
    if (normalizedType === "image") return "Imagen";
    if (normalizedType === "forum") return "Foro";

    return "Actividad";
}

export function getActivityStatus(
    activity: LessonCalendarActivity,
    nowTimestamp: number,
): CalendarActivityStatus {
    const activityTime = getActivityTimestamp(
        activity.date_available,
    );

    if (!activityTime) {
        return {
            label: "Sin fecha válida",
            className: "bg-slate-100 text-slate-700",
            dotClassName: "bg-slate-500",
            icon: AlertCircle,
        };
    }

    if (
        nowTimestamp > 0 &&
        activityTime < nowTimestamp
    ) {
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
        activityDate.getFullYear() ===
            nowDate.getFullYear() &&
        activityDate.getMonth() ===
            nowDate.getMonth() &&
        activityDate.getDate() ===
            nowDate.getDate();

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

export function getUserFullName(user: unknown) {
    const value = toRecord(user);

    if (!value) return "Estudiante";

    const fullName = `${String(
        value.firstname ?? "",
    )} ${String(value.lastname ?? "")}`.trim();

    return (
        String(value.fullName ?? "").trim() ||
        fullName ||
        String(value.name ?? "").trim() ||
        String(value.username ?? "").trim() ||
        String(value.email ?? "").split("@")[0] ||
        "Estudiante"
    );
}

export function getInitials(name: string) {
    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) return "ES";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function buildCalendarDays({
    monthKey,
    activities,
    todayKey,
}: {
    monthKey: string;
    activities: LessonCalendarActivity[];
    todayKey: string;
}): CalendarDay[] {
    const [year, month] = monthKey
        .split("-")
        .map(Number);

    const firstDayOfMonth = new Date(
        year,
        month - 1,
        1,
    );

    const lastDayOfMonth = new Date(
        year,
        month,
        0,
    );

    const firstDayWeekIndex =
        (firstDayOfMonth.getDay() + 6) % 7;

    const totalDaysInMonth =
        lastDayOfMonth.getDate();

    const previousMonthLastDay = new Date(
        year,
        month - 1,
        0,
    ).getDate();

    const activitiesByDay = activities.reduce<
        Record<string, LessonCalendarActivity[]>
    >((accumulator, activity) => {
        const key = getActivityDayKey(activity);

        if (!key) return accumulator;

        accumulator[key] = [
            ...(accumulator[key] ?? []),
            activity,
        ];

        return accumulator;
    }, {});

    const days: CalendarDay[] = [];

    for (
        let index = firstDayWeekIndex - 1;
        index >= 0;
        index -= 1
    ) {
        const dayNumber =
            previousMonthLastDay - index;

        const date = new Date(
            year,
            month - 2,
            dayNumber,
        );

        const key = getDateKeyFromTimestamp(
            date.getTime(),
        );

        days.push({
            key,
            dayNumber,
            inCurrentMonth: false,
            isToday: key === todayKey,
            activities: activitiesByDay[key] ?? [],
        });
    }

    for (
        let dayNumber = 1;
        dayNumber <= totalDaysInMonth;
        dayNumber += 1
    ) {
        const date = new Date(
            year,
            month - 1,
            dayNumber,
        );

        const key = getDateKeyFromTimestamp(
            date.getTime(),
        );

        days.push({
            key,
            dayNumber,
            inCurrentMonth: true,
            isToday: key === todayKey,
            activities: activitiesByDay[key] ?? [],
        });
    }

    let nextMonthDay = 1;

    while (
        days.length % 7 !== 0 ||
        days.length < 42
    ) {
        const date = new Date(
            year,
            month,
            nextMonthDay,
        );

        const key = getDateKeyFromTimestamp(
            date.getTime(),
        );

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
