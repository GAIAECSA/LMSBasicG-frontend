"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    AlertCircle,
    Bell,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    GraduationCap,
    ImageIcon,
    Loader2,
    RefreshCw,
    Search,
    Sparkles,
    XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";
import { getEffectiveRoleByPathname, roleLabels } from "@/lib/constants";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";

type DashboardCourse = Course & {
    image?: string | null;
    thumbnail?: string | null;
    progress?: number | string | null;
    progress_percentage?: number | string | null;
    completion_percentage?: number | string | null;
};

type Tone = "blue" | "green" | "orange" | "purple" | "red";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const toneStyles: Record<
    Tone,
    {
        bg: string;
        text: string;
        soft: string;
    }
> = {
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
    red: {
        bg: "bg-[var(--danger-soft)]",
        text: "text-[var(--danger)]",
        soft: "bg-[var(--danger-soft)] text-[var(--danger)]",
    },
};

function toNumber(value: unknown, fallback = 0) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string") {
        const parsed = Number(value.trim().replace(",", "."));
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
}

function clamp(value: number, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

function getUserId(user: unknown) {
    if (!user || typeof user !== "object") return null;

    const value = user as {
        id?: string | number;
        user_id?: string | number;
        userId?: string | number;
    };

    const userId = Number(value.id ?? value.user_id ?? value.userId);

    return Number.isFinite(userId) && userId > 0 ? userId : null;
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

function buildImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return "";

    const cleanImageUrl = imageUrl.trim();

    if (
        cleanImageUrl.startsWith("http://") ||
        cleanImageUrl.startsWith("https://") ||
        cleanImageUrl.startsWith("data:image/") ||
        cleanImageUrl.startsWith("blob:")
    ) {
        return cleanImageUrl;
    }

    if (cleanImageUrl.startsWith("/")) {
        return `${API_BASE_URL}${cleanImageUrl}`;
    }

    return `${API_BASE_URL}/${cleanImageUrl.replace(/^\/+/, "")}`;
}

function getCourseImage(course: DashboardCourse) {
    return buildImageUrl(
        course.image_url ?? course.image ?? course.thumbnail ?? null,
    );
}

function isCoursePublished(course: DashboardCourse) {
    if (typeof course.is_published === "boolean") {
        return course.is_published;
    }

    return true;
}

function isCourseOpen(course: DashboardCourse) {
    if (typeof course.open_enrollment === "boolean") {
        return course.open_enrollment;
    }

    return true;
}

function isFreeCourse(course: DashboardCourse) {
    return Boolean(course.is_free) || toNumber(course.price) <= 0;
}

function formatPrice(course: DashboardCourse) {
    if (isFreeCourse(course)) return "Gratis";

    const discountPrice = toNumber(course.discount_price);
    const price = toNumber(course.price);

    const finalPrice = discountPrice > 0 && discountPrice < price ? discountPrice : price;

    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: course.currency || "USD",
    }).format(finalPrice);
}

function getCourseProgress(course: DashboardCourse) {
    const progress = toNumber(
        course.progress_percentage ??
        course.completion_percentage ??
        course.progress ??
        0,
    );

    return clamp(Math.round(progress));
}

function formatLevel(level?: Course["level"] | string | null) {
    if (!level) return "Sin nivel";

    const normalizedLevel = String(level).trim().toUpperCase();

    if (normalizedLevel === "PRINCIPIANTE") return "Principiante";
    if (normalizedLevel === "INTERMEDIO") return "Intermedio";
    if (normalizedLevel === "AVANZADO") return "Avanzado";

    return String(level).trim() || "Sin nivel";
}

function getEnrollmentCourseId(enrollment: Enrollment) {
    return Number(enrollment.course?.id ?? 0);
}

function isStudentEnrollment(enrollment: Enrollment) {
    const roleId = Number(enrollment.role?.id ?? 0);
    const roleName = String(enrollment.role?.name ?? "").toLowerCase();

    if (!roleId && !roleName) return true;

    return (
        roleId === 4 ||
        roleName.includes("student") ||
        roleName.includes("estudiante")
    );
}

function mergeEnrollmentCourse(
    enrollment: Enrollment,
    courseMap: Map<number, DashboardCourse>,
): DashboardCourse {
    const courseId = getEnrollmentCourseId(enrollment);
    const foundCourse = courseMap.get(courseId);

    if (foundCourse) return foundCourse;

    return {
        id: courseId,
        name: enrollment.course?.name || "Curso",
        description: "",
        price: 0,
        is_free: true,
        level: "PRINCIPIANTE",
        is_published: true,
        open_enrollment: true,
        duration_hours: 0,
        total_lessons: 0,
        image_url: "",
        discount_price: 0,
        currency: "USD",
        rating: 0,
        total_students: 0,
    } as DashboardCourse;
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
        // eslint-disable-next-line @next/next/no-img-element
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
                    Continúa tus cursos, revisa matrículas pendientes y encuentra
                    nuevos cursos disponibles.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                    <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                    Rol: {roleLabel}
                </div>

                <StudentNotificationsBell />

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-white shadow-sm">
                    {initials}
                </div>

            </div>
        </div>
    );
}

function SummaryItem({
    title,
    value,
    detail,
    href,
    tone,
    icon,
}: {
    title: string;
    value: string;
    detail: string;
    href: string;
    tone: Tone;
    icon: ReactNode;
}) {
    const styles = toneStyles[tone];

    return (
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${styles.bg} ${styles.text}`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                        {title}
                    </p>

                    <p className="mt-1 text-3xl font-black text-[var(--foreground)]">
                        {value}
                    </p>
                </div>
            </div>

            <Link
                href={href}
                className={`mt-4 inline-flex items-center gap-2 text-sm font-black ${styles.text}`}
            >
                {detail}
                <ChevronRight className="h-4 w-4" />
            </Link>
        </div>
    );
}

function SummaryCards({
    activeCount,
    pendingCount,
    rejectedCount,
    newCount,
    averageProgress,
}: {
    activeCount: number;
    pendingCount: number;
    rejectedCount: number;
    newCount: number;
    averageProgress: number;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryItem
                title="Cursos activos"
                value={String(activeCount)}
                detail="Ver mis cursos"
                href="/student/courses"
                tone="blue"
                icon={<BookOpen className="h-7 w-7" />}
            />


            <SummaryItem
                title="Matrículas pendientes"
                value={String(pendingCount)}
                detail="Ver pendientes"
                href="/student/courses"
                tone="orange"
                icon={<Clock3 className="h-7 w-7" />}
            />

            <SummaryItem
                title="Nuevos cursos"
                value={String(newCount)}
                detail="Buscar cursos"
                href="/student/catalog"
                tone={rejectedCount > 0 ? "red" : "purple"}
                icon={<Sparkles className="h-7 w-7" />}
            />
        </div>
    );
}


function CourseMiniCard({ course }: { course: DashboardCourse }) {
    const progress = getCourseProgress(course);
    const imageUrl = getCourseImage(course);

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
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-black text-[var(--foreground)]">
                            {course.name}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                            {course.total_lessons && course.total_lessons > 0
                                ? `${course.total_lessons} lecciones`
                                : "Curso activo"}
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

                    <span className="rounded-lg bg-[var(--success-soft)] px-3 py-1 text-xs font-black text-[var(--success)]">
                        Aprobado
                    </span>
                </div>

                <Link
                    href={`/student/courses/${course.id}`}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                >
                    <BookOpen className="h-4 w-4" />
                    Entrar al aula
                </Link>
            </div>
        </article>
    );
}

function MyCoursesSection({ courses }: { courses: DashboardCourse[] }) {
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
                    Ver todos
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="rounded-2xl bg-[var(--muted)] p-6 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
                    <p className="mt-3 text-sm font-semibold text-[var(--muted-foreground)]">
                        No tienes cursos aprobados todavía.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {courses.slice(0, 2).map((course) => (
                        <CourseMiniCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PendingEnrollmentsPanel({
    pendingEnrollments,
    rejectedEnrollments,
    courseMap,
}: {
    pendingEnrollments: Enrollment[];
    rejectedEnrollments: Enrollment[];
    courseMap: Map<number, DashboardCourse>;
}) {
    const items = [...pendingEnrollments, ...rejectedEnrollments].slice(0, 5);

    return (
        <aside className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-[var(--warning)]" />
                    <h2 className="text-lg font-black text-[var(--foreground)]">
                        Matrículas pendientes
                    </h2>
                </div>

                <Link
                    href="/student/courses"
                    className="inline-flex items-center gap-1 text-sm font-black text-[var(--primary)]"
                >
                    Ver todo
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl bg-[var(--muted)] p-5 text-center">
                    <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--success)]" />
                    <p className="mt-3 text-sm font-semibold text-[var(--muted-foreground)]">
                        No tienes matrículas pendientes.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((enrollment) => {
                        const course = mergeEnrollmentCourse(enrollment, courseMap);
                        const isRejected = enrollment.accepted === false;

                        return (
                            <div
                                key={enrollment.id}
                                className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] p-4"
                            >
                                <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isRejected
                                        ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                                        : "bg-[var(--warning-soft)] text-[var(--warning)]"
                                        }`}
                                >
                                    {isRejected ? (
                                        <XCircle className="h-5 w-5" />
                                    ) : (
                                        <Clock3 className="h-5 w-5" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h3 className="line-clamp-1 text-sm font-black text-[var(--foreground)]">
                                        {course.name}
                                    </h3>

                                    <p
                                        className={`mt-1 text-xs font-black ${isRejected
                                            ? "text-[var(--danger)]"
                                            : "text-[var(--warning)]"
                                            }`}
                                    >
                                        {isRejected ? "No aprobado" : "En revisión"}
                                    </p>
                                </div>

                                <Link
                                    href={`/student/enrollment/${course.id}`}
                                    className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-[var(--primary)] shadow-sm transition hover:bg-[var(--secondary)]"
                                >
                                    Revisar
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </aside>
    );
}

function NewCourseCard({ course }: { course: DashboardCourse }) {
    const imageUrl = getCourseImage(course);

    return (
        <article className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white shadow-sm">
            <div className="relative h-[115px] bg-[var(--muted)]">
                <ImageWithFallback
                    src={imageUrl}
                    alt={course.name}
                    className="h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

                <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-3 py-1 text-[10px] font-black uppercase text-white">
                    {formatLevel(course.level)}
                </span>

                <span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-[var(--primary)]">
                    {formatPrice(course)}
                </span>
            </div>

            <div className="p-4">
                <h3 className="line-clamp-1 text-sm font-black text-[var(--foreground)]">
                    {course.name}
                </h3>

                <p className="mt-2 line-clamp-2 min-h-[40px] text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                    {course.description ||
                        "Curso disponible para iniciar tu aprendizaje."}
                </p>

                <Link
                    href={`/student/enrollment/${course.id}`}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-white transition hover:opacity-95"
                >
                    <BookOpen className="h-4 w-4" />
                    Matricularme
                </Link>
            </div>
        </article>
    );
}


export default function StudentPage() {
    const pathname = usePathname();
    const { user } = useAuth();

    const [courses, setCourses] = useState<DashboardCourse[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const effectiveRole = getEffectiveRoleByPathname(user?.role, pathname);
    const roleLabel = roleLabels[effectiveRole];

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);
    const userId = getUserId(user);

    const courseMap = useMemo(() => {
        return new Map(courses.map((course) => [Number(course.id), course]));
    }, [courses]);

    const studentEnrollments = useMemo(() => {
        return enrollments.filter(isStudentEnrollment);
    }, [enrollments]);

    const approvedEnrollments = useMemo(() => {
        return studentEnrollments.filter((enrollment) => enrollment.accepted === true);
    }, [studentEnrollments]);

    const pendingEnrollments = useMemo(() => {
        return studentEnrollments.filter((enrollment) => enrollment.accepted === null);
    }, [studentEnrollments]);

    const rejectedEnrollments = useMemo(() => {
        return studentEnrollments.filter((enrollment) => enrollment.accepted === false);
    }, [studentEnrollments]);

    const myCourses = useMemo(() => {
        return approvedEnrollments.map((enrollment) =>
            mergeEnrollmentCourse(enrollment, courseMap),
        );
    }, [approvedEnrollments, courseMap]);

    const enrolledCourseIds = useMemo(() => {
        return new Set(
            studentEnrollments
                .map((enrollment) => getEnrollmentCourseId(enrollment))
                .filter((courseId) => courseId > 0),
        );
    }, [studentEnrollments]);

    const newCourses = useMemo(() => {
        return courses.filter((course) => {
            const courseId = Number(course.id);

            return (
                isCoursePublished(course) &&
                isCourseOpen(course) &&
                !enrolledCourseIds.has(courseId)
            );
        });
    }, [courses, enrolledCourseIds]);

    const continueCourse = useMemo(() => {
        return (
            myCourses
                .slice()
                .sort((a, b) => getCourseProgress(b) - getCourseProgress(a))[0] ??
            null
        );
    }, [myCourses]);

    const averageProgress = useMemo(() => {
        if (myCourses.length === 0) return 0;

        const totalProgress = myCourses.reduce(
            (total, course) => total + getCourseProgress(course),
            0,
        );

        return Math.round(totalProgress / myCourses.length);
    }, [myCourses]);

    async function loadDashboardData(isRefresh = false) {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setErrorMessage("");

            const [coursesResponse, enrollmentsResponse] = await Promise.all([
                getAllCourses(),
                userId ? getEnrollmentsByUser(userId) : Promise.resolve([]),
            ]);

            const validCourses = Array.isArray(coursesResponse)
                ? (coursesResponse as DashboardCourse[]).filter(isCoursePublished)
                : [];

            const validEnrollments = Array.isArray(enrollmentsResponse)
                ? enrollmentsResponse
                : [];

            setCourses(validCourses);
            setEnrollments(validEnrollments);
        } catch (error) {
            setCourses([]);
            setEnrollments([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudo cargar la información del estudiante.",
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadDashboardData(false);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [userId]);

    return (
        <section className="min-h-screen space-y-5 bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:space-y-6 sm:px-5 md:px-6 md:pt-5 xl:px-8">
            <StudentTopArea
                displayName={displayName}
                roleLabel={roleLabel}
                initials={initials}
                isRefreshing={isRefreshing}
                onRefresh={() => void loadDashboardData(true)}
            />

            {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger)]">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-black">
                            No se pudo cargar el resumen.
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
                <SummaryCards
                    activeCount={myCourses.length}
                    pendingCount={pendingEnrollments.length}
                    rejectedCount={rejectedEnrollments.length}
                    newCount={newCourses.length}
                    averageProgress={averageProgress}
                />
            )}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
                <div className="space-y-5">
                    {isLoading ? (
                        <div className="h-[300px] animate-pulse rounded-[24px] border border-[var(--border)] bg-white" />
                    ) : (
                        <MyCoursesSection courses={myCourses} />
                    )}
                </div>

                <div className="space-y-5">
                    <PendingEnrollmentsPanel
                        pendingEnrollments={pendingEnrollments}
                        rejectedEnrollments={rejectedEnrollments}
                        courseMap={courseMap}
                    />

                    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                                <h2 className="text-lg font-black text-[var(--foreground)]">
                                    Recomendados
                                </h2>
                            </div>

                            <Link
                                href="/student/catalog"
                                className="inline-flex items-center gap-1 text-sm font-black text-[var(--primary)]"
                            >
                                Ver catálogo
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {newCourses.length === 0 ? (
                            <div className="rounded-2xl bg-[var(--muted)] p-5 text-center">
                                <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                    No hay cursos nuevos por ahora.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {newCourses.slice(0, 3).map((course) => (
                                    <Link
                                        key={course.id}
                                        href={`/student/enrollment/${course.id}`}
                                        className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] p-3 transition hover:bg-[var(--secondary)]"
                                    >
                                        <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                                            <ImageWithFallback
                                                src={getCourseImage(course)}
                                                alt={course.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="line-clamp-1 text-sm font-black text-[var(--foreground)]">
                                                {course.name}
                                            </h3>

                                            <p className="mt-1 text-xs font-black text-[var(--primary)]">
                                                {formatPrice(course)}
                                            </p>
                                        </div>

                                        <ChevronRight className="h-4 w-4 text-[var(--primary)]" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}