"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Bell,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    DollarSign,
    Filter,
    Flame,
    GraduationCap,
    ImageIcon,
    Layers3,
    Loader2,
    Percent,
    RefreshCw,
    Search,
    Sparkles,
    Star,
    Tag,
    UsersRound,
    Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses, type Course } from "@/services/courses.service";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";

type CatalogFilter = "all" | "free" | "paid" | "open" | "offers";
type LevelFilter = "all" | "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO";

type CourseWithExtraFields = Course & {
    image?: string | null;
    image_url?: string | null;
    course_image_url?: string | null;
    thumbnail?: string | null;
    category?: string | null;
    category_name?: string | null;
    subcategory?: string | null;
    subcategory_name?: string | null;

    is_mdt?: boolean | number | string | null;
    is_mdt_course?: boolean | number | string | null;
    mdt?: boolean | number | string | null;
    course_type?: string | null;
    type?: string | null;
    modality?: string | null;
    origin?: string | null;
    source?: string | null;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

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

function getCourseImage(course: CourseWithExtraFields) {
    return normalizeResourceUrl(
        course.image_url ||
        course.course_image_url ||
        course.image ||
        course.thumbnail ||
        "",
    );
}

function getCourseCategory(course: CourseWithExtraFields) {
    return (
        course.subcategory_name ||
        course.category_name ||
        course.subcategory ||
        course.category ||
        "Curso académico"
    );
}

function formatLevel(level?: Course["level"] | string | null) {
    if (!level) return "Sin nivel";

    const normalizedLevel = String(level).trim().toUpperCase();

    if (normalizedLevel === "PRINCIPIANTE") return "Principiante";
    if (normalizedLevel === "INTERMEDIO") return "Intermedio";
    if (normalizedLevel === "AVANZADO") return "Avanzado";

    return String(level).trim() || "Sin nivel";
}

function formatPrice(course: CourseWithExtraFields) {
    if (course.is_free) return "Gratis";

    const discountPrice = Number(course.discount_price || 0);
    const price = Number(course.price || 0);
    const finalPrice = discountPrice > 0 ? discountPrice : price;

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
        return "Consultar";
    }

    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: course.currency || "USD",
    }).format(finalPrice);
}

function getOriginalPrice(course: CourseWithExtraFields) {
    const discountPrice = Number(course.discount_price || 0);
    const price = Number(course.price || 0);

    if (course.is_free) return "";
    if (!discountPrice || discountPrice <= 0) return "";
    if (!price || price <= discountPrice) return "";

    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: course.currency || "USD",
    }).format(price);
}

function hasCourseOffer(course: CourseWithExtraFields) {
    const price = Number(course.price || 0);
    const discountPrice = Number(course.discount_price || 0);

    return (
        !course.is_free &&
        Number.isFinite(price) &&
        Number.isFinite(discountPrice) &&
        price > 0 &&
        discountPrice > 0 &&
        discountPrice < price
    );
}

function getDiscountPercentage(course: CourseWithExtraFields) {
    const price = Number(course.price || 0);
    const discountPrice = Number(course.discount_price || 0);

    if (!hasCourseOffer(course)) return 0;

    return Math.round(((price - discountPrice) / price) * 100);
}

function getBestOffer(courses: CourseWithExtraFields[]) {
    return courses
        .filter((course) => hasCourseOffer(course))
        .sort((a, b) => getDiscountPercentage(b) - getDiscountPercentage(a))[0];
}

function isCourseAvailable(course: CourseWithExtraFields) {
    if (typeof course.open_enrollment === "boolean") {
        return course.open_enrollment;
    }

    return true;
}

function isCoursePublished(course: CourseWithExtraFields) {
    if (typeof course.is_published === "boolean") {
        return course.is_published;
    }

    return true;
}

function isMdtCourse(course: CourseWithExtraFields) {
    const values = [
        course.is_mdt,
        course.is_mdt_course,
        course.mdt,
        course.course_type,
        course.type,
        course.modality,
        course.origin,
        course.source,
    ];

    return values.some((value) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value === 1;

        if (typeof value === "string") {
            const normalizedValue = value.trim().toLowerCase();

            return (
                normalizedValue === "1" ||
                normalizedValue === "true" ||
                normalizedValue.includes("mdt")
            );
        }

        return false;
    });
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

function getFilteredCourses({
    courses,
    searchTerm,
    catalogFilter,
    levelFilter,
}: {
    courses: CourseWithExtraFields[];
    searchTerm: string;
    catalogFilter: CatalogFilter;
    levelFilter: LevelFilter;
}) {
    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
        const price = Number(course.price || 0);
        const discountPrice = Number(course.discount_price || 0);
        const isFree = course.is_free || price <= 0;
        const isPaid = !isFree || discountPrice > 0;

        const matchesCatalogFilter =
            catalogFilter === "all" ||
            (catalogFilter === "free" && isFree) ||
            (catalogFilter === "paid" && isPaid) ||
            (catalogFilter === "open" && isCourseAvailable(course)) ||
            (catalogFilter === "offers" && hasCourseOffer(course));

        const normalizedLevel = String(course.level ?? "").trim().toUpperCase();

        const matchesLevel =
            levelFilter === "all" || normalizedLevel === levelFilter;

        const category = getCourseCategory(course).toLowerCase();
        const level = formatLevel(course.level).toLowerCase();

        const matchesSearch =
            cleanSearchTerm.length === 0 ||
            course.name?.toLowerCase().includes(cleanSearchTerm) ||
            course.description?.toLowerCase().includes(cleanSearchTerm) ||
            category.includes(cleanSearchTerm) ||
            level.includes(cleanSearchTerm);

        return matchesCatalogFilter && matchesLevel && matchesSearch;
    });
}

async function getAvailableCoursesFromApi() {
    const response = await getAllCourses();
    const courses = Array.isArray(response)
        ? (response as CourseWithExtraFields[])
        : [];

    return courses.filter((course) => {
        if (!isCoursePublished(course)) return false;

        return true;
    });
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

function SummaryCard({
    title,
    value,
    detail,
    tone,
    icon,
}: {
    title: string;
    value: string;
    detail: string;
    tone: "blue" | "green" | "orange";
    icon: React.ReactNode;
}) {
    const styles = {
        blue: {
            bg: "bg-[var(--secondary)] text-[var(--primary)]",
            line: "bg-[var(--primary)]",
        },
        green: {
            bg: "bg-[var(--success-soft)] text-[var(--success)]",
            line: "bg-[var(--success)]",
        },
        orange: {
            bg: "bg-[var(--warning-soft)] text-[var(--warning)]",
            line: "bg-[var(--warning)]",
        },
    }[tone];

    return (
        <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${styles.bg}`}
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

function OffersHero({
    courses,
    onViewOffers,
}: {
    courses: CourseWithExtraFields[];
    onViewOffers: () => void;
}) {

    const bestOffer = getBestOffer(courses);

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

function CourseCard({ course }: { course: CourseWithExtraFields }) {
    const imageUrl = getCourseImage(course);
    const category = getCourseCategory(course);
    const price = formatPrice(course);
    const originalPrice = getOriginalPrice(course);
    const available = isCourseAvailable(course);
    const level = formatLevel(course.level);
    const rating = Number(course.rating || 0);
    const totalStudents = Number(course.total_students || 0);
    const totalLessons = Number(course.total_lessons || 0);
    const durationHours = Number(course.duration_hours || 0);
    const hasOffer = hasCourseOffer(course);
    const discountPercentage = getDiscountPercentage(course);
    const isMdt = isMdtCourse(course);

    return (
        <article className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="relative h-[210px] overflow-hidden bg-[var(--muted)]">
                <ImageWithFallback
                    src={imageUrl}
                    alt={course.name}
                    className="h-full w-full object-cover object-center"
                />

                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />

                {hasOffer ? (
                    <div className="absolute right-4 top-4 z-10">
                        <div className="flex h-16 w-16 rotate-3 flex-col items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg ring-4 ring-white/30">
                            <span className="text-xs font-black">OFERTA</span>
                            <span className="text-lg font-black">
                                -{discountPercentage}%
                            </span>
                        </div>
                    </div>
                ) : null}

                <div className="absolute left-4 top-4 flex max-w-[78%] flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-black uppercase text-white shadow-sm">
                        {level}
                    </span>

                    {isMdt ? (
                        <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-black uppercase text-white shadow-sm">
                            MDT
                        </span>
                    ) : null}

                    {available ? (
                        <span className="rounded-full bg-[var(--success)] px-3 py-1 text-xs font-black uppercase text-white shadow-sm">
                            Matrícula abierta
                        </span>
                    ) : (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-black uppercase text-white shadow-sm">
                            Cerrado
                        </span>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                    <p className="line-clamp-1 text-sm font-bold text-white/85">
                        {category}
                    </p>

                    <h2 className="mt-1 line-clamp-1 text-xl font-black text-white">
                        {course.name}
                    </h2>
                </div>
            </div>

            <div className="p-5">
                <p className="line-clamp-2 min-h-[48px] text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                    {course.description ||
                        "Este curso está disponible para que puedas iniciar tu aprendizaje."}
                </p>


                <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                            Precio
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p
                                className={`text-2xl font-black ${course.is_free
                                    ? "text-[var(--success)]"
                                    : hasOffer
                                        ? "text-orange-600"
                                        : "text-[var(--foreground)]"
                                    }`}
                            >
                                {price}
                            </p>

                            {originalPrice ? (
                                <p className="text-sm font-bold text-[var(--muted-foreground)] line-through">
                                    {originalPrice}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {hasOffer ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                            <Zap className="h-3.5 w-3.5" />
                            -{discountPercentage}% OFF
                        </span>
                    ) : null}

                    {!hasOffer && course.discount_price > 0 && !course.is_free ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-soft)] px-3 py-1 text-xs font-black text-[var(--warning)]">
                            <Tag className="h-3.5 w-3.5" />
                            Oferta
                        </span>
                    ) : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Link
                        href={`/student/enrollment/${course.id}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black !text-white shadow-sm transition hover:opacity-95"
                    >
                        <BookOpen className="h-4 w-4 text-white" />
                        <span className="text-white">Matricularme</span>
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default function StudentCatalogPage() {
    const { user } = useAuth();

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    const [courses, setCourses] = useState<CourseWithExtraFields[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
    const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

    const filteredCourses = useMemo(
        () =>
            getFilteredCourses({
                courses,
                searchTerm,
                catalogFilter,
                levelFilter,
            }),
        [courses, searchTerm, catalogFilter, levelFilter],
    );

    const freeCount = courses.filter((course) => course.is_free).length;
    const paidCount = courses.filter((course) => !course.is_free).length;
    const openCount = courses.filter((course) => isCourseAvailable(course)).length;
    const offersCount = courses.filter((course) => hasCourseOffer(course)).length;

    async function loadCourses() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await getAvailableCoursesFromApi();

            setCourses(data);
        } catch (error) {
            setCourses([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los cursos disponibles.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function refreshCourses() {
        try {
            setIsRefreshing(true);
            setErrorMessage("");

            const data = await getAvailableCoursesFromApi();

            setCourses(data);
        } catch (error) {
            setCourses([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron actualizar los cursos disponibles.",
            );
        } finally {
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCourses();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

    return (
        <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                        Catálogo de cursos
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                        Explora los cursos disponibles, revisa sus precios,
                        descuentos y accede al aula para continuar tu
                        aprendizaje.
                    </p>
                </div>

                <PageTopBar
                    initials={initials}
                    isRefreshing={isRefreshing}
                    onRefresh={() => void refreshCourses()}
                />
            </div>



            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => setCatalogFilter("all")}
                        className={`h-12 rounded-2xl px-6 text-sm font-black transition ${catalogFilter === "all"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                            }`}
                    >
                        Todos ({courses.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setCatalogFilter("open")}
                        className={`h-12 rounded-2xl px-6 text-sm font-black transition ${catalogFilter === "open"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                            }`}
                    >
                        Matrícula abierta ({openCount})
                    </button>

                    <button
                        type="button"
                        onClick={() => setCatalogFilter("free")}
                        className={`h-12 rounded-2xl px-6 text-sm font-black transition ${catalogFilter === "free"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                            }`}
                    >
                        Gratis ({freeCount})
                    </button>

                    <button
                        type="button"
                        onClick={() => setCatalogFilter("paid")}
                        className={`h-12 rounded-2xl px-6 text-sm font-black transition ${catalogFilter === "paid"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                            }`}
                    >
                        Pagados ({paidCount})
                    </button>
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
                            placeholder="Buscar cursos disponibles..."
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-12 pr-4 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                        />
                    </label>

                    <select
                        value={levelFilter}
                        onChange={(event) =>
                            setLevelFilter(event.target.value as LevelFilter)
                        }
                        className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                    >
                        <option value="all">Todos los niveles</option>
                        <option value="PRINCIPIANTE">Principiante</option>
                        <option value="INTERMEDIO">Intermedio</option>
                        <option value="AVANZADO">Avanzado</option>
                    </select>

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
                            No se pudieron cargar los cursos.
                        </p>

                        <p className="mt-1">{errorMessage}</p>
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div
                            key={item}
                            className="h-[430px] animate-pulse rounded-[26px] border border-[var(--border)] bg-white"
                        />
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
                    <BookOpen className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />

                    <h2 className="mt-4 text-xl font-black text-[var(--foreground)]">
                        No se encontraron cursos
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
                        Intenta cambiar el filtro o buscar con otro término.
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm("");
                            setCatalogFilter("all");
                            setLevelFilter("all");
                        }}
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] transition hover:opacity-95"
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    <p className="py-6 text-center text-sm font-semibold text-[var(--muted-foreground)]">
                        Mostrando {filteredCourses.length} de {courses.length}{" "}
                        cursos disponibles
                    </p>
                </>
            )}
        </section>
    );
}