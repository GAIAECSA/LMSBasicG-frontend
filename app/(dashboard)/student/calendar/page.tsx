"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    Award,
    Bell,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock3,
    Filter,
    GraduationCap,
    Layers3,
    MessageCircle,
    Search,
    Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type ActivityType = "evaluation" | "task" | "forum" | "resource" | "certificate";

type ActivityStatus = "pending" | "completed" | "today";

type StudentCalendarEvent = {
    id: number;
    title: string;
    course: string;
    type: ActivityType;
    status: ActivityStatus;
    date: string;
    time: string;
    description: string;
    href: string;
};

type ActivityFilter = "all" | ActivityType;

const activityTypeLabels: Record<ActivityType, string> = {
    evaluation: "Evaluación",
    task: "Tarea",
    forum: "Foro",
    resource: "Recurso",
    certificate: "Certificado",
};

const activityStatusLabels: Record<ActivityStatus, string> = {
    pending: "Pendiente",
    completed: "Completado",
    today: "Hoy",
};

const demoEvents: StudentCalendarEvent[] = [
    {
        id: 1,
        title: "Evaluación Final",
        course: "Programación Orientada a Objetos",
        type: "evaluation",
        status: "pending",
        date: "2026-05-24",
        time: "23:59",
        description: "Evaluación final del módulo con preguntas de opción múltiple.",
        href: "/student/courses/5",
    },
    {
        id: 2,
        title: "Actividad 2: Herencia y Polimorfismo",
        course: "Programación Orientada a Objetos",
        type: "task",
        status: "pending",
        date: "2026-05-27",
        time: "23:59",
        description: "Entrega de actividad práctica sobre clases, herencia y polimorfismo.",
        href: "/student/courses/5",
    },
    {
        id: 3,
        title: "Foro: Buenas prácticas de código",
        course: "Tejido Stitch",
        type: "forum",
        status: "pending",
        date: "2026-05-30",
        time: "23:59",
        description: "Participa en el foro y comenta tus recomendaciones.",
        href: "/student/courses/1",
    },
    {
        id: 4,
        title: "Lectura: Patrones de diseño",
        course: "Programación Orientada a Objetos",
        type: "resource",
        status: "pending",
        date: "2026-06-02",
        time: "23:59",
        description: "Recurso de lectura para reforzar patrones de diseño.",
        href: "/student/courses/5",
    },
    {
        id: 5,
        title: "Certificado del curso",
        course: "Tejido Stitch",
        type: "certificate",
        status: "completed",
        date: "2026-05-20",
        time: "10:00",
        description: "Certificado disponible al completar el curso.",
        href: "/student/certificates",
    },
];

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

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatMonthTitle(date: Date) {
    return new Intl.DateTimeFormat("es-EC", {
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatLongDate(value: string) {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function isSameDateKey(first: string, second: string) {
    return first === second;
}

function getCalendarDays(currentDate: Date) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalDays = lastDay.getDate();

    const days: Array<{
        key: string;
        day: number | null;
        date: Date | null;
        isCurrentMonth: boolean;
    }> = [];

    for (let index = 0; index < startDay; index += 1) {
        days.push({
            key: `empty-${index}`,
            day: null,
            date: null,
            isCurrentMonth: false,
        });
    }

    for (let day = 1; day <= totalDays; day += 1) {
        const date = new Date(year, month, day);

        days.push({
            key: toDateKey(date),
            day,
            date,
            isCurrentMonth: true,
        });
    }

    while (days.length % 7 !== 0) {
        days.push({
            key: `tail-${days.length}`,
            day: null,
            date: null,
            isCurrentMonth: false,
        });
    }

    return days;
}

function getActivityTone(type: ActivityType) {
    if (type === "evaluation") {
        return {
            bg: "bg-[var(--warning-soft)]",
            text: "text-[var(--warning)]",
            badge: "bg-[var(--warning-soft)] text-[var(--warning)]",
        };
    }

    if (type === "task") {
        return {
            bg: "bg-[var(--secondary)]",
            text: "text-[var(--primary)]",
            badge: "bg-[var(--secondary)] text-[var(--primary)]",
        };
    }

    if (type === "forum") {
        return {
            bg: "bg-[var(--success-soft)]",
            text: "text-[var(--success)]",
            badge: "bg-[var(--success-soft)] text-[var(--success)]",
        };
    }

    if (type === "certificate") {
        return {
            bg: "bg-purple-50",
            text: "text-purple-600",
            badge: "bg-purple-50 text-purple-600",
        };
    }

    return {
        bg: "bg-sky-50",
        text: "text-sky-600",
        badge: "bg-sky-50 text-sky-600",
    };
}

function renderActivityIcon(type: ActivityType, className = "h-5 w-5") {
    if (type === "evaluation") return <ClipboardList className={className} />;
    if (type === "task") return <BookOpen className={className} />;
    if (type === "forum") return <MessageCircle className={className} />;
    if (type === "certificate") return <Award className={className} />;

    return <Layers3 className={className} />;
}

function PageTopBar({ initials }: { initials: string }) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                Rol: Estudiante
            </span>

            <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                aria-label="Notificaciones"
            >
                <Bell className="h-5 w-5" />

                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
                    3
                </span>
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)] shadow-sm">
                {initials}
            </div>
        </div>
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
    tone: "blue" | "green" | "orange";
}) {
    const styles = {
        blue: {
            bg: "bg-[var(--secondary)] text-[var(--primary)]",
            line: "bg-[var(--primary)]",
            icon: <CalendarDays className="h-7 w-7" />,
        },
        green: {
            bg: "bg-[var(--success-soft)] text-[var(--success)]",
            line: "bg-[var(--success)]",
            icon: <CheckCircle2 className="h-7 w-7" />,
        },
        orange: {
            bg: "bg-[var(--warning-soft)] text-[var(--warning)]",
            line: "bg-[var(--warning)]",
            icon: <Clock3 className="h-7 w-7" />,
        },
    }[tone];

    return (
        <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${styles.bg}`}
                >
                    {styles.icon}
                </div>

                <div>
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
            </div>

            <div className="mt-5 h-1.5 rounded-full bg-[var(--muted)]">
                <div className={`h-1.5 w-4/5 rounded-full ${styles.line}`} />
            </div>
        </div>
    );
}

function ActivityCard({ event }: { event: StudentCalendarEvent }) {
    const tone = getActivityTone(event.type);

    return (
        <Link
            href={event.href}
            className="block rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="flex items-start gap-4">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.bg} ${tone.text}`}
                >
                    {renderActivityIcon(event.type)}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${tone.badge}`}
                        >
                            {activityTypeLabels[event.type]}
                        </span>

                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${event.status === "completed"
                                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                                    : event.status === "today"
                                        ? "bg-[var(--secondary)] text-[var(--primary)]"
                                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                }`}
                        >
                            {activityStatusLabels[event.status]}
                        </span>
                    </div>

                    <h3 className="mt-3 line-clamp-1 text-base font-black text-[var(--foreground)]">
                        {event.title}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-sm font-semibold text-[var(--muted-foreground)]">
                        {event.course}
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {event.description}
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-[var(--foreground)]">
                        {event.time}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                        {formatLongDate(event.date).split(",")[0]}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default function StudentCalendarPage() {
    const { user } = useAuth();

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    const todayKey = toDateKey(new Date());

    const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 4, 1));
    const [selectedDate, setSelectedDate] = useState(todayKey);
    const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
    const [searchTerm, setSearchTerm] = useState("");

    const calendarDays = useMemo(
        () => getCalendarDays(currentMonth),
        [currentMonth],
    );

    const eventsByDate = useMemo(() => {
        return demoEvents.reduce<Record<string, StudentCalendarEvent[]>>(
            (accumulator, event) => {
                if (!accumulator[event.date]) {
                    accumulator[event.date] = [];
                }

                accumulator[event.date].push(event);

                return accumulator;
            },
            {},
        );
    }, []);

    const selectedDateEvents = eventsByDate[selectedDate] ?? [];

    const filteredEvents = useMemo(() => {
        const cleanSearchTerm = searchTerm.trim().toLowerCase();

        return demoEvents.filter((event) => {
            const matchesFilter =
                activeFilter === "all" || event.type === activeFilter;

            const matchesSearch =
                cleanSearchTerm.length === 0 ||
                event.title.toLowerCase().includes(cleanSearchTerm) ||
                event.course.toLowerCase().includes(cleanSearchTerm) ||
                event.description.toLowerCase().includes(cleanSearchTerm);

            return matchesFilter && matchesSearch;
        });
    }, [activeFilter, searchTerm]);

    const pendingCount = demoEvents.filter(
        (event) => event.status !== "completed",
    ).length;

    const completedCount = demoEvents.filter(
        (event) => event.status === "completed",
    ).length;

    function goToPreviousMonth() {
        setCurrentMonth(
            (current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1),
        );
    }

    function goToNextMonth() {
        setCurrentMonth(
            (current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1),
        );
    }

    function goToToday() {
        const today = new Date();

        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(toDateKey(today));
    }

    return (
        <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                        Calendario académico
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                        Consulta tus evaluaciones, tareas, foros, recursos y
                        fechas importantes de tus cursos.
                    </p>
                </div>

                <PageTopBar initials={initials} />
            </div>

            <div className="mb-7 grid gap-4 lg:grid-cols-3">
                <SummaryCard
                    title="Actividades programadas"
                    value={String(demoEvents.length)}
                    detail="Eventos académicos"
                    tone="blue"
                />

                <SummaryCard
                    title="Pendientes"
                    value={String(pendingCount)}
                    detail="Por completar"
                    tone="orange"
                />

                <SummaryCard
                    title="Completadas"
                    value={String(completedCount)}
                    detail="Finalizadas"
                    tone="green"
                />
            </div>

            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-3">
                    {[
                        { value: "all", label: "Todos" },
                        { value: "evaluation", label: "Evaluaciones" },
                        { value: "task", label: "Tareas" },
                        { value: "forum", label: "Foros" },
                        { value: "resource", label: "Recursos" },
                    ].map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                                setActiveFilter(item.value as ActivityFilter)
                            }
                            className={`h-11 rounded-2xl px-5 text-sm font-black transition ${activeFilter === item.value
                                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="relative block w-full sm:w-[420px] xl:w-[520px]">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Buscar actividades..."
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-12 pr-4 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                        />
                    </label>

                    <button
                        type="button"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                    </button>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-black capitalize text-[var(--foreground)]">
                                {formatMonthTitle(currentMonth)}
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                                Selecciona un día para ver sus actividades.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={goToPreviousMonth}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                                aria-label="Mes anterior"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                onClick={goToToday}
                                className="h-10 rounded-2xl border border-[var(--border)] bg-white px-4 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                            >
                                Hoy
                            </button>

                            <button
                                type="button"
                                onClick={goToNextMonth}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                                aria-label="Mes siguiente"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                            (day) => (
                                <div
                                    key={day}
                                    className="rounded-2xl bg-[var(--muted)] px-2 py-3 text-center text-xs font-black uppercase tracking-wide text-[var(--muted-foreground)]"
                                >
                                    {day}
                                </div>
                            ),
                        )}

                        {calendarDays.map((day) => {
                            const dateKey = day.date ? toDateKey(day.date) : "";
                            const dayEvents = dateKey
                                ? eventsByDate[dateKey] ?? []
                                : [];
                            const isSelected =
                                dateKey && isSameDateKey(dateKey, selectedDate);
                            const isToday = dateKey && dateKey === todayKey;

                            return (
                                <button
                                    key={day.key}
                                    type="button"
                                    disabled={!day.date}
                                    onClick={() => {
                                        if (dateKey) setSelectedDate(dateKey);
                                    }}
                                    className={`min-h-[105px] rounded-[22px] border p-3 text-left transition disabled:cursor-default disabled:opacity-40 ${isSelected
                                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                            : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
                                        }`}
                                >
                                    {day.day ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${isToday && !isSelected
                                                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                                                            : isSelected
                                                                ? "bg-white/15 text-white"
                                                                : "bg-[var(--muted)] text-[var(--foreground)]"
                                                        }`}
                                                >
                                                    {day.day}
                                                </span>

                                                {dayEvents.length > 0 ? (
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-[10px] font-black ${isSelected
                                                                ? "bg-white/15 text-white"
                                                                : "bg-[var(--secondary)] text-[var(--primary)]"
                                                            }`}
                                                    >
                                                        {dayEvents.length}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-3 space-y-1">
                                                {dayEvents
                                                    .slice(0, 2)
                                                    .map((event) => {
                                                        const tone =
                                                            getActivityTone(
                                                                event.type,
                                                            );

                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className={`truncate rounded-lg px-2 py-1 text-[10px] font-black ${isSelected
                                                                        ? "bg-white/15 text-white"
                                                                        : `${tone.bg} ${tone.text}`
                                                                    }`}
                                                            >
                                                                {
                                                                    activityTypeLabels[
                                                                    event.type
                                                                    ]
                                                                }
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-[var(--foreground)]">
                                    Actividades del día
                                </h2>

                                <p className="mt-1 text-sm font-semibold capitalize text-[var(--muted-foreground)]">
                                    {formatLongDate(selectedDate)}
                                </p>
                            </div>

                            <CalendarDays className="h-6 w-6 text-[var(--primary)]" />
                        </div>

                        <div className="mt-5 space-y-3">
                            {selectedDateEvents.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-5 text-center">
                                    <CalendarDays className="mx-auto h-9 w-9 text-[var(--muted-foreground)]" />

                                    <p className="mt-3 text-sm font-black text-[var(--foreground)]">
                                        Sin actividades
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                                        No tienes actividades programadas para
                                        este día.
                                    </p>
                                </div>
                            ) : (
                                selectedDateEvents.map((event) => (
                                    <ActivityCard
                                        key={event.id}
                                        event={event}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-[var(--foreground)]">
                                    Próximas actividades
                                </h2>

                                <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                                    Según tus cursos activos
                                </p>
                            </div>

                            <Star className="h-6 w-6 text-[var(--primary)]" />
                        </div>

                        <div className="space-y-3">
                            {filteredEvents.map((event) => (
                                <ActivityCard key={event.id} event={event} />
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}