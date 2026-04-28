import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Clock3,
    DollarSign,
    Eye,
    GraduationCap,
    Layers3,
    ListChecks,
    XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

function normalizeApiBaseUrl(url: string) {
    const cleanUrl = url.trim().replace(/\/+$/, "");

    if (cleanUrl.endsWith("/api/v1")) {
        return cleanUrl;
    }

    return `${cleanUrl}/api/v1`;
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_URL);
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, "");

type ApiCourse = {
    id: number;
    name?: string | null;
    title?: string | null;
    description?: string | null;
    price?: string | number | null;
    discount_price?: string | number | null;
    is_free?: boolean | null;
    level?: string | null;
    is_published?: boolean | null;
    open_enrollment?: boolean | null;
    duration_hours?: number | null;
    total_lessons?: number | null;
    image_url?: string | null;
    image?: string | null;
    course_image_url?: string | null;
};

type CourseModule = {
    id: number;
    name: string;
    order: number;
    course_id: number;
};

type CourseSummary = {
    id: number;
    name: string;
    description: string;
    price: string;
    discountPrice: string;
    isFree: boolean;
    level: string;
    isPublished: boolean;
    openEnrollment: boolean;
    durationHours: number;
    totalLessons: number;
    imageUrl: string;
};

type TeacherCoursePresentationPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

function buildFileUrl(url: string | null | undefined) {
    if (!url) return "";

    const cleanUrl = String(url).trim();

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("data:") ||
        cleanUrl.startsWith("blob:")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_ORIGIN}${cleanUrl}`;
    }

    return `${API_ORIGIN}/${cleanUrl}`;
}

function toNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function cleanText(value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback;

    const cleanValue = value.trim();

    return cleanValue ? cleanValue : fallback;
}

function normalizeCourse(course: ApiCourse): CourseSummary {
    return {
        id: Number(course.id),
        name: cleanText(course.name ?? course.title, "Curso sin nombre"),
        description: cleanText(
            course.description,
            "Este curso todavía no tiene una descripción registrada.",
        ),
        price:
            course.price === null || course.price === undefined
                ? "0"
                : String(course.price),
        discountPrice:
            course.discount_price === null ||
                course.discount_price === undefined ||
                String(course.discount_price).toLowerCase() === "null"
                ? ""
                : String(course.discount_price),
        isFree: Boolean(course.is_free),
        level: cleanText(course.level, "Sin nivel"),
        isPublished: Boolean(course.is_published),
        openEnrollment: Boolean(course.open_enrollment),
        durationHours: toNumber(course.duration_hours, 0),
        totalLessons: toNumber(course.total_lessons, 0),
        imageUrl: buildFileUrl(
            course.image_url ?? course.course_image_url ?? course.image,
        ),
    };
}

async function getCourseById(courseId: string) {
    const numericCourseId = Number(courseId);

    if (!Number.isFinite(numericCourseId)) {
        return null;
    }

    try {
        const responseById = await fetch(
            `${API_BASE_URL}/courses/${numericCourseId}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                cache: "no-store",
            },
        );

        if (responseById.ok) {
            const course = (await responseById.json()) as ApiCourse;

            return normalizeCourse(course);
        }
    } catch {
        // Si el endpoint individual no existe, se intenta con el listado.
    }

    try {
        const response = await fetch(`${API_BASE_URL}/courses/`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        const courses = (await response.json()) as ApiCourse[];

        const course = Array.isArray(courses)
            ? courses.find((item) => Number(item.id) === numericCourseId)
            : null;

        return course ? normalizeCourse(course) : null;
    } catch {
        return null;
    }
}

async function getModulesByCourse(courseId: string) {
    const numericCourseId = Number(courseId);

    if (!Number.isFinite(numericCourseId)) {
        return [];
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/modules/courses/${numericCourseId}/modules`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                cache: "no-store",
            },
        );

        if (!response.ok) {
            return [];
        }

        const modules = (await response.json()) as CourseModule[];

        return Array.isArray(modules)
            ? modules
                .map((module) => ({
                    id: Number(module.id),
                    name: cleanText(module.name, "Módulo sin nombre"),
                    order: toNumber(module.order, 0),
                    course_id: Number(module.course_id),
                }))
                .sort((a, b) => a.order - b.order)
            : [];
    } catch {
        return [];
    }
}

function formatMoney(value: string) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return value || "$0.00";
    }

    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(numericValue);
}

function hasDiscount(course: CourseSummary) {
    const price = Number(course.price);
    const discount = Number(course.discountPrice);

    return (
        Number.isFinite(price) &&
        Number.isFinite(discount) &&
        discount > 0 &&
        discount < price
    );
}

function StatusBadge({
    active,
    activeText,
    inactiveText,
}: {
    active: boolean;
    activeText: string;
    inactiveText: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
        >
            {active ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
                <XCircle className="h-3.5 w-3.5" />
            )}

            {active ? activeText : inactiveText}
        </span>
    );
}

export default async function TeacherCoursePresentationPage({
    params,
}: TeacherCoursePresentationPageProps) {
    const { courseId } = await params;

    const [course, modules] = await Promise.all([
        getCourseById(courseId),
        getModulesByCourse(courseId),
    ]);

    if (!course) {
        return (
            <section className="space-y-6">
                <Link
                    href="/student/courses"
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a mis cursos
                </Link>

                <div className="rounded-[30px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-black text-red-700">
                        Curso no encontrado
                    </h1>

                    <p className="mt-2 text-sm font-semibold text-red-600">
                        No se pudo cargar la información del curso seleccionado.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href="/student/courses"
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a mis cursos
                </Link>

                <div className="flex flex-wrap gap-2">
                    <StatusBadge
                        active={course.isPublished}
                        activeText="Publicado"
                        inactiveText="No publicado"
                    />

                    <StatusBadge
                        active={course.openEnrollment}
                        activeText="Matrícula abierta"
                        inactiveText="Matrícula cerrada"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-0 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <div className="relative min-h-[320px] bg-slate-100 xl:min-h-full">
                        {course.imageUrl ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                style={{
                                    backgroundImage: `url("${course.imageUrl.replace(
                                        /"/g,
                                        '\\"',
                                    )}")`,
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-blue-700">
                                <BookOpen className="h-20 w-20" />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

                        <div className="absolute bottom-5 left-5 right-5">
                            <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-blue-700 shadow-sm">
                                Vista docente
                            </span>

                            <h1 className="mt-3 line-clamp-2 text-2xl font-black leading-tight text-white">
                                {course.name}
                            </h1>
                        </div>
                    </div>

                    <div className="p-7 md:p-8">
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                            <Eye className="h-4 w-4" />
                            Presentación del curso
                        </span>

                        <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                            {course.name}
                        </h2>

                        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
                            {course.description}
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock3 className="h-4 w-4" />
                                    <p className="text-xs font-black uppercase tracking-[0.14em]">
                                        Duración
                                    </p>
                                </div>

                                <p className="mt-2 text-2xl font-black text-slate-950">
                                    {course.durationHours || 0} h
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Layers3 className="h-4 w-4" />
                                    <p className="text-xs font-black uppercase tracking-[0.14em]">
                                        Módulos
                                    </p>
                                </div>

                                <p className="mt-2 text-2xl font-black text-slate-950">
                                    {modules.length}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <GraduationCap className="h-4 w-4" />
                                    <p className="text-xs font-black uppercase tracking-[0.14em]">
                                        Nivel
                                    </p>
                                </div>

                                <p className="mt-2 text-lg font-black text-slate-950">
                                    {course.level}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                                <ListChecks className="h-4 w-4" />
                                Resumen
                            </span>

                            <h2 className="mt-4 text-xl font-black text-slate-950">
                                Estructura del curso
                            </h2>
                        </div>

                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {modules.length} módulo
                            {modules.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    {modules.length > 0 ? (
                        <div className="mt-6 space-y-3">
                            {modules.map((module) => (
                                <div
                                    key={module.id}
                                    className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-sm font-black text-white shadow-sm">
                                        {module.order || module.id}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                            Módulo {module.order || module.id}
                                        </p>

                                        <h3 className="mt-1 line-clamp-2 text-base font-black text-slate-950">
                                            {module.name}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                <Layers3 className="h-7 w-7" />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                Aún no hay módulos registrados
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Cuando agregues módulos, aparecerán aquí como un
                                resumen rápido de la estructura del curso.
                            </p>
                        </div>
                    )}
                </div>

                <aside className="space-y-5">
                    

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-black text-slate-950">
                            Resumen rápido
                        </h2>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="text-sm font-bold text-slate-500">
                                    ID del curso
                                </span>

                                <span className="font-black text-slate-900">
                                    #{course.id}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="text-sm font-bold text-slate-500">
                                    Publicación
                                </span>

                                <span className="font-black text-slate-900">
                                    {course.isPublished ? "Visible" : "Oculto"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="text-sm font-bold text-slate-500">
                                    Matrícula
                                </span>

                                <span className="font-black text-slate-900">
                                    {course.openEnrollment
                                        ? "Disponible"
                                        : "No disponible"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="text-sm font-bold text-slate-500">
                                    Tipo
                                </span>

                                <span className="font-black text-slate-900">
                                    {course.isFree ? "Gratuito" : "Pagado"}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}