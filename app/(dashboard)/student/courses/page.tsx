"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Bell,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Filter,
    Folder,
    GraduationCap,
    ImageIcon,
    Loader2,
    MoreVertical,
    RefreshCw,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";
import { getAuthSession } from "@/lib/auth";
import { getEffectiveRoleByPathname, roleLabels } from "@/lib/constants";

type CourseFilter = "all" | "progress" | "completed";

type SessionUserWithRole = {
    id?: number | string;
    role?: string;
    role_id?: number | string;
    roleId?: number | string;
};

type CourseWithExtraFields = Course & {
    image?: string | null;
    image_url?: string | null;
    course_image_url?: string | null;
    thumbnail?: string | null;
    category?: string | null;
    subcategory?: string | null;
    category_name?: string | null;
    subcategory_name?: string | null;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

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

function normalizeResourceUrl(url?: string | null) {
    if (!url) return "";

    const cleanUrl = String(url).trim();

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("data:image/")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_BASE_URL}${cleanUrl}`;
    }

    return `${API_BASE_URL}/${cleanUrl.replace(/^\/+/, "")}`;
}

function getCourseImage(course: CourseWithExtraFields | null) {
    if (!course) return "";

    return normalizeResourceUrl(
        course.image_url ||
        course.course_image_url ||
        course.image ||
        course.thumbnail ||
        "",
    );
}

function getCourseCategory(course: CourseWithExtraFields | null) {
    if (!course) return "Curso académico";

    return (
        course.subcategory_name ||
        course.category_name ||
        course.subcategory ||
        course.category ||
        "Curso académico"
    );
}

function getEnrollmentCourseId(enrollment: Enrollment) {
    const value = enrollment as Enrollment & {
        course_id?: number | string | null;
    };

    return Number(value.course?.id ?? value.course_id ?? 0);
}

function isApprovedStudentEnrollment(enrollment: Enrollment) {
    const courseId = getEnrollmentCourseId(enrollment);

    return enrollment.accepted === true && courseId > 0;
}

function getCourseProgress(index: number) {
    const values = [25, 68, 40, 85, 15, 55, 100];
    return values[index % values.length];
}

function getCourseLastActivity(index: number) {
    const dates = [
        "18 may 2024",
        "30 may 2024",
        "20 may 2024",
        "22 may 2024",
        "25 may 2024",
        "02 jun 2024",
    ];

    return dates[index % dates.length];
}

function getNextActivity(enrollment: Enrollment, progress: number) {
    if (progress >= 100) return "No hay actividades pendientes";

    const courseName = enrollment.course?.name?.toLowerCase() ?? "";

    if (courseName.includes("programación") || courseName.includes("programacion")) {
        return "Actividad 2: Herencia y Polimorfismo";
    }

    if (courseName.includes("stitch") || courseName.includes("tejido")) {
        return "Video: Puntadas básicas";
    }

    return "Continuar con el siguiente recurso";
}

function getLessonsLabel(course: CourseWithExtraFields | null, index: number) {
    const totalLessons = Number(course?.total_lessons || 0);

    if (totalLessons > 0) {
        return `${totalLessons} lecciones`;
    }

    return `Módulo ${index + 1}`;
}

function getStatusLabel(progress: number) {
    if (progress >= 100) return "Completado";
    return "En progreso";
}

function getFilteredEnrollments(
    enrollments: Enrollment[],
    filter: CourseFilter,
    searchTerm: string,
) {
    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    return enrollments.filter((enrollment, index) => {
        const progress = getCourseProgress(index);

        const matchesFilter =
            filter === "all" ||
            (filter === "progress" && progress < 100) ||
            (filter === "completed" && progress >= 100);

        const courseName = enrollment.course?.name?.toLowerCase() ?? "";

        const matchesSearch =
            cleanSearchTerm.length === 0 ||
            courseName.includes(cleanSearchTerm);

        return matchesFilter && matchesSearch;
    });
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
                <ImageIcon className="h-10 w-10" />
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
}

function PageTopBar({
    roleLabel,
    initials,
    isRefreshing,
    onRefresh,
}: {
    roleLabel: string;
    initials: string;
    isRefreshing: boolean;
    onRefresh: () => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                Rol: {roleLabel}
            </span>

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
                <span className="hidden sm:inline">Actualizar</span>
            </button>
        </div>
    );
}

function CourseCard({
    enrollment,
    course,
    index,
}: {
    enrollment: Enrollment;
    course: CourseWithExtraFields | null;
    index: number;
}) {
    const progress = getCourseProgress(index);
    const completed = progress >= 100;
    const courseId = getEnrollmentCourseId(enrollment);
    const courseName = enrollment.course?.name || course?.name || "Curso";
    const imageUrl = getCourseImage(course);
    const category = getCourseCategory(course);
    const lastActivity = getCourseLastActivity(index);

    return (
        <article className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="grid min-h-[260px] gap-0 lg:grid-cols-[380px_minmax(0,1fr)_280px]">
                <div className="h-[220px] overflow-hidden bg-[var(--muted)] lg:h-[260px]">
                    <ImageWithFallback
                        src={imageUrl}
                        alt={courseName}
                        className="h-full w-full object-cover object-center"
                    />
                </div>

                <div className="min-w-0 p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${completed
                                ? "bg-[var(--success-soft)] text-[var(--success)]"
                                : "bg-[var(--secondary)] text-[var(--primary)]"
                                }`}
                        >
                            {getStatusLabel(progress)}
                        </span>

                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
                            <Folder className="h-4 w-4" />
                            {category}
                        </span>
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-2xl font-black tracking-tight text-[var(--foreground)]">
                        {courseName}
                    </h2>

                    <div className="mt-4 border-t border-[var(--border)] pt-4">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                Progreso del curso
                            </p>

                            <p
                                className={`text-sm font-black ${completed
                                    ? "text-[var(--success)]"
                                    : "text-[var(--primary)]"
                                    }`}
                            >
                                {progress}%
                            </p>
                        </div>

                        <div className="mt-2 h-2 rounded-full bg-[var(--muted)]">
                            <div
                                className={`h-2 rounded-full ${completed
                                    ? "bg-[var(--success)]"
                                    : "bg-[var(--primary)]"
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
                                <CalendarDays className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                                    Última actividad
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
                                <SlidersHorizontal className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                                    Próxima actividad
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-5 border-t border-[var(--border)] p-5 lg:border-l lg:border-t-0 md:p-6">
                    <div className="flex items-center justify-between lg:justify-end">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--muted)] px-3 py-2 text-xs font-black text-[var(--muted-foreground)]">
                            <Clock3 className="h-4 w-4" />
                            {getLessonsLabel(course, index)}
                        </span>

                        <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
                            aria-label="Más opciones"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                    </div>

                    <Link
                        href={`/student/courses/${courseId}`}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black !text-white shadow-sm transition hover:opacity-95 [&_svg]:!text-white"
                    >
                        Detalles del curso
                        <ChevronRight className="h-4 w-4" />
                    </Link>

                    <Link
                        href={`/student/courses/${courseId}?tab=summary`}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                    >
                        Detalles del curso
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default function StudentCoursesPage() {
    const pathname = usePathname();
    const { user } = useAuth();

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [coursesById, setCoursesById] = useState<
        Record<number, CourseWithExtraFields>
    >({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<CourseFilter>("all");

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);
    const effectiveRole = getEffectiveRoleByPathname(user?.role, pathname);
    const roleLabel = roleLabels[effectiveRole];

    const inProgressCount = enrollments.filter(
        (_, index) => getCourseProgress(index) < 100,
    ).length;

    const completedCount = enrollments.filter(
        (_, index) => getCourseProgress(index) >= 100,
    ).length;

    const filteredEnrollments = useMemo(
        () => getFilteredEnrollments(enrollments, activeFilter, searchTerm),
        [enrollments, activeFilter, searchTerm],
    );

    const loadStudentCourses = useCallback(async () => {
        const session = getAuthSession();
        const sessionUser = session?.user as SessionUserWithRole | undefined;
        const userId = Number(user?.id ?? sessionUser?.id);

        if (!userId || Number.isNaN(userId)) {
            throw new Error("No se pudo identificar al estudiante autenticado.");
        }

        const [enrollmentsResponse, coursesResponse] = await Promise.all([
            getEnrollmentsByUser(userId),
            getAllCourses(),
        ]);

        const approvedStudentEnrollments = Array.isArray(enrollmentsResponse)
            ? enrollmentsResponse.filter(isApprovedStudentEnrollment)
            : [];

        const coursesMap = Array.isArray(coursesResponse)
            ? (coursesResponse as CourseWithExtraFields[]).reduce<
                Record<number, CourseWithExtraFields>
            >((accumulator, course) => {
                const courseId = Number(course.id);

                if (courseId > 0) {
                    accumulator[courseId] = course;
                }

                return accumulator;
            }, {})
            : {};

        return {
            approvedStudentEnrollments,
            coursesMap,
        };
    }, [user?.id]);

    async function handleRefreshCourses() {
        try {
            setIsRefreshing(true);
            setErrorMessage("");

            const data = await loadStudentCourses();

            setEnrollments(data.approvedStudentEnrollments);
            setCoursesById(data.coursesMap);
        } catch (error) {
            setEnrollments([]);
            setCoursesById({});
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar tus cursos matriculados.",
            );
        } finally {
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const timer = window.setTimeout(() => {
            loadStudentCourses()
                .then((data) => {
                    if (!isMounted) return;

                    setEnrollments(data.approvedStudentEnrollments);
                    setCoursesById(data.coursesMap);
                    setErrorMessage("");
                })
                .catch((error) => {
                    if (!isMounted) return;

                    setEnrollments([]);
                    setCoursesById({});
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "No se pudieron cargar tus cursos matriculados.",
                    );
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
    }, [loadStudentCourses]);

    return (
        <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                        Mis cursos
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                        Aquí aparecen únicamente los cursos donde tienes una
                        matrícula aprobada.
                    </p>
                </div>

                <PageTopBar
                    roleLabel={roleLabel}
                    initials={initials}
                    isRefreshing={isRefreshing}
                    onRefresh={() => void handleRefreshCourses()}
                />
            </div>

            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => setActiveFilter("all")}
                        className={`h-12 rounded-full px-7 text-sm font-black transition ${activeFilter === "all"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                            }`}
                    >
                        Todos ({enrollments.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter("progress")}
                        className={`h-12 rounded-full px-7 text-sm font-black transition ${activeFilter === "progress"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                            }`}
                    >
                        En progreso ({inProgressCount})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter("completed")}
                        className={`h-12 rounded-full px-7 text-sm font-black transition ${activeFilter === "completed"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                            }`}
                    >
                        Completados ({completedCount})
                    </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="relative block w-full sm:w-[360px] xl:w-[520px]">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Buscar mis cursos..."
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

            {errorMessage ? (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger)]">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-black">
                            No se pudieron cargar tus cursos.
                        </p>
                        <p className="mt-1">{errorMessage}</p>
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <div className="space-y-5">
                    {[1, 2].map((item) => (
                        <div
                            key={item}
                            className="h-[250px] animate-pulse rounded-[26px] border border-[var(--border)] bg-white"
                        />
                    ))}
                </div>
            ) : filteredEnrollments.length === 0 ? (
                <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
                    <BookOpen className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />

                    <h2 className="mt-4 text-xl font-black text-[var(--foreground)]">
                        No tienes cursos matriculados
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
                        Para acceder a un aula, primero debes matricularte desde
                        el catálogo y esperar la aprobación si corresponde.
                    </p>

                    <Link
                        href="/student/catalog"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] transition hover:opacity-95"
                    >
                        Ir al catálogo
                    </Link>
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredEnrollments.map((enrollment, index) => {
                        const courseId = getEnrollmentCourseId(enrollment);
                        const course = coursesById[courseId] ?? null;

                        return (
                            <CourseCard
                                key={enrollment.id}
                                enrollment={enrollment}
                                course={course}
                                index={index}
                            />
                        );
                    })}

                    <p className="pb-4 text-center text-sm font-semibold text-[var(--muted-foreground)]">
                        Mostrando {filteredEnrollments.length} de{" "}
                        {enrollments.length} cursos matriculados
                    </p>
                </div>
            )}
        </section>
    );
}