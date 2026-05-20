"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Award,
    Bell,
    BookOpen,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    GraduationCap,
    ImageIcon,
    LineChart,
    Loader2,
    MoreHorizontal,
    RefreshCw,
    Star,
    UserRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses, type Course } from "@/services/courses.service";
import { getEffectiveRoleByPathname, roleLabels } from "@/lib/constants";
import { usePathname } from "next/navigation";

type Tone = "blue" | "green" | "orange" | "purple";

type SummaryCard = {
    title: string;
    value: string;
    detail: string;
    href: string;
    tone: Tone;
};

type Activity = {
    type: string;
    title: string;
    course: string;
    date: string;
    time: string;
    tone: Tone;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const summaryCardsBase: Omit<SummaryCard, "value">[] = [
    {
        title: "Cursos activos",
        detail: "Ver mis cursos",
        href: "/student/courses",
        tone: "blue",
    },
    {
        title: "Progreso promedio",
        detail: "+12% vs. mes pasado",
        href: "/student/courses",
        tone: "green",
    },
    {
        title: "Evaluaciones pendientes",
        detail: "Ver pendientes",
        href: "/student/courses",
        tone: "orange",
    },
    {
        title: "Certificados obtenidos",
        detail: "Ver certificados",
        href: "/student/certificates",
        tone: "purple",
    },
];

const activities: Activity[] = [
    {
        type: "Evaluación",
        title: "Evaluación Final",
        course: "Programación Orientada a Objetos",
        date: "24 may",
        time: "23:59",
        tone: "orange",
    },
    {
        type: "Tarea",
        title: "Actividad 2: Herencia y Polimorfismo",
        course: "Programación Orientada a Objetos",
        date: "27 may",
        time: "23:59",
        tone: "blue",
    },
    {
        type: "Foro",
        title: "Foro: Buenas prácticas de código",
        course: "Tejido Stitch",
        date: "30 may",
        time: "23:59",
        tone: "green",
    },
    {
        type: "Recurso",
        title: "Lectura: Patrones de diseño",
        course: "Programación Orientada a Objetos",
        date: "02 jun",
        time: "23:59",
        tone: "purple",
    },
];

const toneStyles = {
    blue: {
        bg: "bg-[var(--secondary)]",
        text: "text-[var(--primary)]",
        soft: "bg-[var(--secondary)] text-[var(--primary)]",
    },
    green: {
        bg: "bg-[var(--success-soft)]",
        text: "text-[var(--success)]",
        soft: "bg-[var(--success-soft)] text-[var(--success)]",
    },
    orange: {
        bg: "bg-[var(--warning-soft)]",
        text: "text-[var(--warning)]",
        soft: "bg-[var(--warning-soft)] text-[var(--warning)]",
    },
    purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        soft: "bg-purple-50 text-purple-600",
    },
};

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Estudiante";

    const value = user as {
        firstname?: string;
        lastname?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName = `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
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

function buildImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return "";

    const cleanImageUrl = imageUrl.trim();

    if (
        cleanImageUrl.startsWith("http://") ||
        cleanImageUrl.startsWith("https://") ||
        cleanImageUrl.startsWith("data:image/")
    ) {
        return cleanImageUrl;
    }

    if (cleanImageUrl.startsWith("/")) {
        return `${API_BASE_URL}${cleanImageUrl}`;
    }

    return `${API_BASE_URL}/${cleanImageUrl}`;
}

function isCoursePublished(course: Course) {
    if (typeof course.is_published === "boolean") {
        return course.is_published;
    }

    return true;
}

function formatLevel(level?: Course["level"] | string | null) {
    if (!level) return "Sin nivel";

    const normalizedLevel = String(level).trim().toUpperCase();

    if (normalizedLevel === "PRINCIPIANTE") return "Principiante";
    if (normalizedLevel === "INTERMEDIO") return "Intermedio";
    if (normalizedLevel === "AVANZADO") return "Avanzado";

    return String(level).trim() || "Sin nivel";
}

function formatCourseModule(course: Course, index: number) {
    if (course.total_lessons && course.total_lessons > 0) {
        return `${course.total_lessons} lecciones`;
    }

    return `Módulo ${index + 1}`;
}

function getCourseProgress(index: number) {
    const values = [25, 68, 40, 85, 15, 55];
    return values[index % values.length];
}

function getContinueCourse(courses: Course[]) {
    if (courses.length === 0) return null;

    const openCourse = courses.find((course) => course.open_enrollment);

    return openCourse ?? courses[0];
}

function renderSummaryIcon(title: string, tone: Tone) {
    const className = "h-7 w-7";
    const toneClass = `${toneStyles[tone].bg} ${toneStyles[tone].text}`;

    if (title.includes("Cursos")) {
        return (
            <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}
            >
                <BookOpen className={className} />
            </div>
        );
    }

    if (title.includes("Progreso")) {
        return (
            <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}
            >
                <LineChart className={className} />
            </div>
        );
    }

    if (title.includes("Evaluaciones")) {
        return (
            <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}
            >
                <ClipboardList className={className} />
            </div>
        );
    }

    return (
        <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}
        >
            <Award className={className} />
        </div>
    );
}

function renderActivityIcon(type: string, tone: Tone) {
    const className = "h-5 w-5";
    const toneClass = `${toneStyles[tone].bg} ${toneStyles[tone].text}`;

    if (type === "Evaluación") {
        return (
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneClass}`}
            >
                <ClipboardList className={className} />
            </div>
        );
    }

    if (type === "Foro") {
        return (
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneClass}`}
            >
                <UserRound className={className} />
            </div>
        );
    }

    return (
        <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneClass}`}
        >
            <BookOpen className={className} />
        </div>
    );
}

function ImageWithFallback({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)] ${className}`}
            >
                <ImageIcon className="h-9 w-9" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
}

function StudentTopArea({
    displayName,
    roleLabel,
    initials,
    isRefreshing,
    onRefresh,
}: {
    displayName: string;
    roleLabel: string;
    initials: string;
    isRefreshing: boolean;
    onRefresh: () => void;
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                    Bienvenido de nuevo,
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl xl:text-5xl">
                    {displayName} <span className="inline-block">👋</span>
                </h1>

                <p className="mt-3 text-sm font-semibold text-[var(--muted-foreground)] sm:text-base">
                    Continúa tu aprendizaje y alcanza tus metas académicas.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                    <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                    Rol: {roleLabel}
                </div>

                <button
                    type="button"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                    aria-label="Notificaciones"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-white">
                        3
                    </span>
                </button>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-white shadow-sm">
                    {initials}
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Actualizar cursos</span>
                    <span className="sm:hidden">Actualizar</span>
                </button>
            </div>
        </div>
    );
}

function SummaryCards({ coursesCount }: { coursesCount: number }) {
    const summaryCards: SummaryCard[] = [
        {
            ...summaryCardsBase[0],
            value: String(coursesCount),
        },
        {
            ...summaryCardsBase[1],
            value: coursesCount > 0 ? "47%" : "0%",
        },
        {
            ...summaryCardsBase[2],
            value: "1",
        },
        {
            ...summaryCardsBase[3],
            value: "0",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
                <div
                    key={item.title}
                    className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        {renderSummaryIcon(item.title, item.tone)}

                        <div>
                            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                {item.title}
                            </p>

                            <p className="mt-1 text-3xl font-black text-[var(--foreground)]">
                                {item.value}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={item.href}
                        className={`mt-4 inline-flex items-center gap-2 text-sm font-black ${item.tone === "green"
                            ? "text-[var(--success)]"
                            : "text-[var(--primary)]"
                            }`}
                    >
                        {item.detail}
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            ))}
        </div>
    );
}

function ContinueLearningCard({ course }: { course: Course | null }) {
    if (!course) {
        return (
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <h2 className="text-lg font-black text-[var(--foreground)]">
                    Continuar aprendiendo
                </h2>

                <div className="mt-4 rounded-2xl bg-[var(--muted)] p-6 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
                    <p className="mt-3 text-sm font-semibold text-[var(--muted-foreground)]">
                        Todavía no hay cursos disponibles para continuar.
                    </p>
                </div>
            </div>
        );
    }

    const progress = getCourseProgress(0);
    const imageUrl = buildImageUrl(course.image_url);

    return (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-[var(--foreground)]">
                    Continuar aprendiendo
                </h2>

                <button
                    type="button"
                    className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            <div className="grid gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
                <div className="h-[145px] overflow-hidden rounded-2xl bg-[var(--muted)] sm:h-[160px]">
                    <ImageWithFallback
                        src={imageUrl}
                        alt={course.name}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="flex min-w-0 flex-col justify-center">
                    <span className="mb-3 inline-flex w-fit rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black uppercase tracking-wide text-[var(--primary)]">
                        En progreso
                    </span>

                    <h3 className="line-clamp-1 text-xl font-black uppercase text-[var(--foreground)] sm:text-2xl">
                        {course.name}
                    </h3>

                    <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                            {course.total_lessons && course.total_lessons > 0
                                ? `Lección 1 de ${course.total_lessons}`
                                : "Lección 1"}
                        </p>

                        <p className="text-sm font-black text-[var(--primary)]">
                            {progress}%
                        </p>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-[var(--muted)]">
                        <div
                            className="h-2 rounded-full bg-[var(--primary)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                            href={`/student/courses/${course.id}`}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-black text-white shadow-sm transition hover:opacity-95"
                        >
                            <ChevronRight className="h-4 w-4" />
                            Entrar al aula
                        </Link>

                        <Link
                            href={`/student/courses/${course.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                        >
                            Ver detalles del curso
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CourseMiniCard({
    course,
    index,
}: {
    course: Course;
    index: number;
}) {
    const progress = getCourseProgress(index);
    const imageUrl = buildImageUrl(course.image_url);

    return (
        <article className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white shadow-sm">
            <div className="relative h-[110px] bg-[var(--muted)]">
                <ImageWithFallback
                    src={imageUrl}
                    alt={course.name}
                    className="h-full w-full object-cover"
                />

                <span className="absolute left-3 top-3 rounded-md bg-white px-3 py-1 text-[11px] font-black uppercase text-[var(--primary)] shadow-sm">
                    {formatLevel(course.level)}
                </span>

                <button
                    type="button"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[var(--foreground)] shadow-sm"
                >
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-black text-[var(--foreground)]">
                            {course.name}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                            {formatCourseModule(course, index)}
                        </p>
                    </div>

                    <span className="shrink-0 text-sm font-black text-[var(--primary)]">
                        {progress}%
                    </span>
                </div>

                <div className="mt-3 h-2 rounded-full bg-[var(--muted)]">
                    <div
                        className="h-2 rounded-full bg-[var(--primary)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)]">
                        <CalendarDays className="h-4 w-4" />
                        {course.duration_hours && course.duration_hours > 0
                            ? `${course.duration_hours} horas`
                            : "Sin duración"}
                    </div>

                    <span
                        className={`rounded-lg px-3 py-1 text-xs font-black ${course.open_enrollment
                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                            }`}
                    >
                        {course.open_enrollment ? "En progreso" : "Cerrado"}
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_48px] gap-2">
                    <Link
                        href={`/student/courses/${course.id}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                    >
                        <BookOpen className="h-4 w-4" />
                        Entrar al aula
                    </Link>

                    <button
                        type="button"
                        className="flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                    >
                        <Star className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}

function MyCoursesSection({ courses }: { courses: Course[] }) {
    return (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-black text-[var(--foreground)]">
                    Mis cursos
                </h2>

                <Link
                    href="/student/courses"
                    className="inline-flex items-center gap-1 text-sm font-black text-[var(--primary)]"
                >
                    Ver todos mis cursos
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="rounded-2xl bg-[var(--muted)] p-6 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
                    <p className="mt-3 text-sm font-semibold text-[var(--muted-foreground)]">
                        No se encontraron cursos para mostrar.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {courses.slice(0, 2).map((course, index) => (
                        <CourseMiniCard
                            key={course.id}
                            course={course}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function UpcomingActivities() {
    return (
        <aside className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm xl:h-full">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-black text-[var(--foreground)]">
                        Próximas actividades
                    </h2>
                </div>

                <Link
                    href="/student/calendar"
                    className="inline-flex items-center gap-1 text-sm font-black text-[var(--primary)]"
                >
                    Ver calendario
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="divide-y divide-[var(--border)]">
                {activities.map((activity) => {
                    const tone = toneStyles[activity.tone];

                    return (
                        <div
                            key={`${activity.type}-${activity.title}`}
                            className="flex gap-4 py-4 first:pt-0 last:pb-0"
                        >
                            {renderActivityIcon(activity.type, activity.tone)}

                            <div className="min-w-0 flex-1">
                                <span
                                    className={`inline-flex rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tone.soft}`}
                                >
                                    {activity.type}
                                </span>

                                <h3 className="mt-2 line-clamp-1 text-sm font-black text-[var(--foreground)] sm:text-base">
                                    {activity.title}
                                </h3>

                                <p className="mt-1 line-clamp-1 text-sm font-semibold text-[var(--muted-foreground)]">
                                    {activity.course}
                                </p>
                            </div>

                            <div className="shrink-0 text-right text-xs font-bold text-[var(--muted-foreground)] sm:text-sm">
                                <p>{activity.date}</p>
                                <p>{activity.time}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Link
                href="/student/calendar"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
            >
                Ver todas las actividades
                <ChevronRight className="h-4 w-4" />
            </Link>
        </aside>
    );
}

async function getVisibleCoursesFromApi() {
    const response = await getAllCourses();

    const courses = Array.isArray(response) ? response : [];

    const visibleCourses = courses.filter((course) => {
        if (isCoursePublished(course)) return true;
        if (course.open_enrollment) return true;
        return false;
    });

    return visibleCourses.length > 0 ? visibleCourses : courses;
}

export default function StudentPage() {
    const pathname = usePathname();
    const { user } = useAuth();

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const effectiveRole = getEffectiveRoleByPathname(user?.role, pathname);
    const roleLabel = roleLabels[effectiveRole];

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    function handleRefreshCourses() {
        setIsRefreshing(true);
        setErrorMessage("");

        getVisibleCoursesFromApi()
            .then((data) => {
                setCourses(data);
            })
            .catch((error) => {
                const message =
                    error instanceof Error
                        ? error.message
                        : "No se pudo cargar la lista de cursos.";

                setErrorMessage(message);
                setCourses([]);
            })
            .finally(() => {
                setIsRefreshing(false);
            });
    }

    useEffect(() => {
        let isMounted = true;

        const timer = window.setTimeout(() => {
            getVisibleCoursesFromApi()
                .then((data) => {
                    if (!isMounted) return;

                    setCourses(data);
                    setErrorMessage("");
                })
                .catch((error) => {
                    if (!isMounted) return;

                    const message =
                        error instanceof Error
                            ? error.message
                            : "No se pudo cargar la lista de cursos.";

                    setErrorMessage(message);
                    setCourses([]);
                })
                .finally(() => {
                    if (!isMounted) return;

                    setIsLoading(false);
                });
        }, 0);

        return () => {
            isMounted = false;
            window.clearTimeout(timer);
        };
    }, []);

    const continueCourse = useMemo(() => getContinueCourse(courses), [courses]);

    return (
        <section className="min-h-screen space-y-5 bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:space-y-6 sm:px-5 md:px-6 md:pt-5 xl:px-8">
            <StudentTopArea
                displayName={displayName}
                roleLabel={roleLabel}
                initials={initials}
                isRefreshing={isRefreshing}
                onRefresh={handleRefreshCourses}
            />

            {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger)]">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-black">
                            No se pudieron cargar los cursos.
                        </p>
                        <p className="mt-1">{errorMessage}</p>
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="h-[135px] animate-pulse rounded-[22px] border border-[var(--border)] bg-white"
                        />
                    ))}
                </div>
            ) : (
                <SummaryCards coursesCount={courses.length} />
            )}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_500px] 2xl:grid-cols-[minmax(0,1fr)_560px]">
                <div className="space-y-5">
                    {isLoading ? (
                        <div className="h-[250px] animate-pulse rounded-[24px] border border-[var(--border)] bg-white" />
                    ) : (
                        <ContinueLearningCard course={continueCourse} />
                    )}

                    {isLoading ? (
                        <div className="h-[300px] animate-pulse rounded-[24px] border border-[var(--border)] bg-white" />
                    ) : (
                        <MyCoursesSection courses={courses} />
                    )}
                </div>

                <UpcomingActivities />
            </div>
        </section>
    );
}