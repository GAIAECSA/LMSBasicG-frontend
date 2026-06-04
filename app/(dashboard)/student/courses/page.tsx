"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Filter,
    Folder,
    GraduationCap,
    ImageIcon,
    Search,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";
import {
    getProgressByEnrollment,
    type BlockProgress,
} from "@/services/progress.service";
import { getAuthSession } from "@/lib/auth";
import { getEffectiveRoleByPathname, roleLabels } from "@/lib/constants";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";

type CourseFilter = "all" | "progress" | "completed";
type CourseAccessRole = "student" | "teacher";

type SessionUserWithRole = {
    id?: number | string;
    role?: string;
    role_id?: number | string;
    roleId?: number | string;
};

type CourseWithExtraFields = Course & {
    [key: string]: unknown;
    image?: string | null;
    image_url?: string | null;
    course_image_url?: string | null;
    thumbnail?: string | null;
    category?: string | null;
    subcategory?: string | null;
    category_name?: string | null;
    subcategory_name?: string | null;
    description?: string | null;
    modules?: unknown[] | null;
};

type EnrollmentWithExtraFields = Enrollment & {
    [key: string]: unknown;
    course_id?: number | string | null;
    role_id?: number | string | null;
    role?: string | null;
    user_role_id?: number | string | null;
    user_role?: string | null;
    is_teacher?: boolean | null;
    teacher_id?: number | string | null;
    teacher_user_id?: number | string | null;
    docente_id?: number | string | null;
    course?: CourseWithExtraFields | null;
    user?: {
        id?: number | string;
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
        role_id?: number | string;
        role?: string;
    } | null;
};

type CourseProgressMap = Record<number, number>;

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const ROLE_ID_TEACHER = 3;
const ROLE_ID_STUDENT = 4;

function readRecord(value: unknown) {
    if (!value || typeof value !== "object") return null;

    return value as Record<string, unknown>;
}

function toNumericId(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string") {
        const cleanValue = value.replace("%", "").trim();

        if (!cleanValue) return null;

        const numericValue = Number(cleanValue);

        return Number.isFinite(numericValue) ? numericValue : null;
    }

    return null;
}

function toText(value: unknown): string {
    if (value === null || value === undefined) return "";

    if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
    }

    if (typeof value === "object") {
        const record = value as Record<string, unknown>;

        return (
            toText(record.name) ||
            toText(record.title) ||
            toText(record.label)
        );
    }

    return "";
}

function cleanText(value: unknown) {
    return toText(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function clampProgress(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Usuario";

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
        "Usuario"
    );
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "US";

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
        cleanText(course.subcategory_name) ||
        cleanText(course.category_name) ||
        cleanText(course.subcategory) ||
        cleanText(course.category) ||
        "Curso académico"
    );
}

function getEnrollmentCourseId(enrollment: Enrollment) {
    const value = enrollment as EnrollmentWithExtraFields;

    return Number(value.course?.id ?? value.course_id ?? 0);
}

function getCourseTitle(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
) {
    const value = enrollment as EnrollmentWithExtraFields;

    return cleanText(value.course?.name) || cleanText(course?.name) || "Curso";
}

function getCourseDescription(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
) {
    const value = enrollment as EnrollmentWithExtraFields;

    return (
        cleanText(value.course?.description) ||
        cleanText(course?.description) ||
        "Curso disponible en tu aula virtual."
    );
}

function getCourseAccessRole(
    enrollment: Enrollment,
    sessionUser: SessionUserWithRole | undefined,
    currentUserId: number,
): CourseAccessRole {
    const enrollmentRecord = readRecord(enrollment);

    const userRecord = readRecord(
        (enrollment as EnrollmentWithExtraFields).user,
    );

    const sessionRecord = readRecord(sessionUser);

    const teacherIds = [
        enrollmentRecord?.teacher_id,
        enrollmentRecord?.teacher_user_id,
        enrollmentRecord?.docente_id,
    ];

    const isTeacherById =
        currentUserId > 0 &&
        teacherIds.some((value) => toNumericId(value) === currentUserId);

    if ((enrollment as EnrollmentWithExtraFields).is_teacher === true) {
        return "teacher";
    }

    if (isTeacherById) {
        return "teacher";
    }

    const roleId =
        toNumericId(enrollmentRecord?.course_role_id) ??
        toNumericId(enrollmentRecord?.user_course_role_id) ??
        toNumericId(enrollmentRecord?.role_id) ??
        toNumericId(enrollmentRecord?.user_role_id) ??
        toNumericId(userRecord?.role_id) ??
        toNumericId(sessionRecord?.role_id) ??
        toNumericId(sessionRecord?.roleId);

    const roleText = [
        toText(enrollmentRecord?.course_role),
        toText(enrollmentRecord?.user_course_role),
        toText(enrollmentRecord?.role),
        toText(enrollmentRecord?.user_role),
        toText(userRecord?.role),
        toText(sessionRecord?.role),
    ]
        .join(" ")
        .toLowerCase();

    if (
        roleId === ROLE_ID_TEACHER ||
        roleText.includes("docente") ||
        roleText.includes("teacher") ||
        roleText.includes("profesor")
    ) {
        return "teacher";
    }

    if (
        roleId === ROLE_ID_STUDENT ||
        roleText.includes("estudiante") ||
        roleText.includes("student")
    ) {
        return "student";
    }

    return "student";
}

function isActiveUserCourseEnrollment(
    enrollment: Enrollment,
    sessionUser: SessionUserWithRole | undefined,
    currentUserId: number,
) {
    const courseId = getEnrollmentCourseId(enrollment);

    if (courseId <= 0) return false;

    const accessRole = getCourseAccessRole(
        enrollment,
        sessionUser,
        currentUserId,
    );

    const accepted = (enrollment as EnrollmentWithExtraFields).accepted;

    if (accessRole === "teacher") {
        return accepted !== false;
    }

    return accepted === true;
}

function getUniqueActiveCourseEnrollments(
    enrollments: Enrollment[],
    sessionUser: SessionUserWithRole | undefined,
    currentUserId: number,
) {
    const result: Enrollment[] = [];
    const seen = new Set<string>();

    enrollments.forEach((enrollment) => {
        if (
            !isActiveUserCourseEnrollment(
                enrollment,
                sessionUser,
                currentUserId,
            )
        ) {
            return;
        }

        const courseId = getEnrollmentCourseId(enrollment);

        const accessRole = getCourseAccessRole(
            enrollment,
            sessionUser,
            currentUserId,
        );

        const key = `${courseId}-${accessRole}`;

        if (seen.has(key)) return;

        seen.add(key);
        result.push(enrollment);
    });

    return result;
}

/*
 * Obtiene los IDs de los bloques que existan dentro del curso.
 *
 * La función recorre objetos anidados para soportar estructuras como:
 *
 * modules -> lessons -> blocks
 * modules -> lesson_items -> lesson_blocks
 * lessons -> lessonBlocks
 */
function getCourseBlockIds(course: CourseWithExtraFields | null) {
    const blockIds = new Set<number>();
    const visitedObjects = new Set<object>();

    const blockCollectionKeys = new Set([
        "blocks",
        "lesson_blocks",
        "lessonBlocks",
        "content_blocks",
        "contentBlocks",
    ]);

    function visit(value: unknown, parentKey = "") {
        if (!value || typeof value !== "object") return;

        if (visitedObjects.has(value as object)) return;

        visitedObjects.add(value as object);

        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (
                    blockCollectionKeys.has(parentKey) &&
                    item &&
                    typeof item === "object"
                ) {
                    const record = item as Record<string, unknown>;

                    const blockId =
                        toNumericId(record.id) ??
                        toNumericId(record.lesson_block_id) ??
                        toNumericId(record.block_id);

                    if (blockId !== null && blockId > 0) {
                        blockIds.add(blockId);
                    }
                }

                visit(item, parentKey);
            });

            return;
        }

        Object.entries(value as Record<string, unknown>).forEach(
            ([key, nestedValue]) => {
                visit(nestedValue, key);
            },
        );
    }

    visit(course);

    return blockIds;
}

function getStoredProgressFallback(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
) {
    const enrollmentRecord = readRecord(enrollment);
    const courseRecord = readRecord(course);

    const candidates = [
        enrollmentRecord?.progress_percent,
        enrollmentRecord?.progress,
        enrollmentRecord?.percentage,
        enrollmentRecord?.course_progress,
        enrollmentRecord?.completed_percentage,
        courseRecord?.progress_percent,
        courseRecord?.progress,
        courseRecord?.percentage,
        courseRecord?.course_progress,
    ]
        .map(toNumericId)
        .filter((value): value is number => value !== null);

    if (candidates.length > 0) {
        return clampProgress(candidates[0]);
    }

    const statusText = [
        toText(enrollmentRecord?.status),
        toText(courseRecord?.status),
    ]
        .join(" ")
        .toLowerCase();

    if (
        enrollmentRecord?.completed === true ||
        enrollmentRecord?.is_completed === true ||
        statusText.includes("completado") ||
        statusText.includes("completed")
    ) {
        return 100;
    }

    return 0;
}

function calculateCourseProgress(
    progressRecords: BlockProgress[],
    course: CourseWithExtraFields | null,
    fallbackProgress: number,
) {
    if (!Array.isArray(progressRecords) || progressRecords.length === 0) {
        return fallbackProgress;
    }

    const courseBlockIds = getCourseBlockIds(course);

    const trackedBlockIds = new Set(
        progressRecords
            .map((progress) => Number(progress.lesson_block_id))
            .filter((blockId) => Number.isFinite(blockId) && blockId > 0),
    );

    const completedBlockIds = new Set(
        progressRecords
            .filter((progress) => progress.is_completed === true)
            .map((progress) => Number(progress.lesson_block_id))
            .filter((blockId) => Number.isFinite(blockId) && blockId > 0),
    );

    /*
     * Se prioriza la cantidad real de bloques del curso.
     *
     * Si getAllCourses() no devuelve los módulos y bloques anidados,
     * se utiliza como respaldo la cantidad de bloques encontrados en
     * los registros del endpoint de progreso.
     */
    const totalBlocks =
        courseBlockIds.size > 0 ? courseBlockIds.size : trackedBlockIds.size;

    if (totalBlocks <= 0) {
        return fallbackProgress;
    }

    const completedBlocks =
        courseBlockIds.size > 0
            ? Array.from(completedBlockIds).filter((blockId) =>
                courseBlockIds.has(blockId),
            ).length
            : completedBlockIds.size;

    return clampProgress((completedBlocks / totalBlocks) * 100);
}

async function getProgressMapForEnrollments(
    enrollments: Enrollment[],
    coursesById: Record<number, CourseWithExtraFields>,
    sessionUser: SessionUserWithRole | undefined,
    currentUserId: number,
) {
    const entries = await Promise.all(
        enrollments.map(async (enrollment) => {
            const enrollmentId = Number(enrollment.id);

            const courseId = getEnrollmentCourseId(enrollment);

            const course =
                coursesById[courseId] ??
                ((enrollment as EnrollmentWithExtraFields).course ?? null);

            const fallbackProgress = getStoredProgressFallback(
                enrollment,
                course,
            );

            const accessRole = getCourseAccessRole(
                enrollment,
                sessionUser,
                currentUserId,
            );

            /*
             * El progreso corresponde únicamente al acceso del estudiante.
             * En las tarjetas de docentes no se muestra una barra.
             */
            if (
                accessRole === "teacher" ||
                !Number.isFinite(enrollmentId) ||
                enrollmentId <= 0
            ) {
                return [enrollmentId, fallbackProgress] as const;
            }

            try {
                const progressRecords =
                    await getProgressByEnrollment(enrollmentId);

                const progress = calculateCourseProgress(
                    progressRecords,
                    course,
                    fallbackProgress,
                );

                return [enrollmentId, progress] as const;
            } catch {
                /*
                 * Si el endpoint falla para una matrícula concreta,
                 * la página continúa funcionando con el valor disponible
                 * dentro de la matrícula o del curso.
                 */
                return [enrollmentId, fallbackProgress] as const;
            }
        }),
    );

    return entries.reduce<CourseProgressMap>(
        (accumulator, [enrollmentId, progress]) => {
            if (Number.isFinite(enrollmentId) && enrollmentId > 0) {
                accumulator[enrollmentId] = progress;
            }

            return accumulator;
        },
        {},
    );
}

function getResolvedProgress(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
    progressByEnrollment: CourseProgressMap,
) {
    const enrollmentId = Number(enrollment.id);

    const loadedProgress = progressByEnrollment[enrollmentId];

    if (typeof loadedProgress === "number") {
        return loadedProgress;
    }

    return getStoredProgressFallback(enrollment, course);
}

function getStatusLabel(progress: number, accessRole: CourseAccessRole) {
    if (accessRole === "teacher") return "Docente asignado";
    if (progress >= 100) return "Completado";
    if (progress > 0) return "En progreso";

    return "Matrícula aprobada";
}

function getAccessRoleLabel(accessRole: CourseAccessRole) {
    return accessRole === "teacher" ? "Docente" : "Estudiante";
}

function getCourseWorkspaceHref(
    courseId: number,
    accessRole: CourseAccessRole,
) {
    if (accessRole === "teacher") {
        return `/teacher/courses/${courseId}`;
    }

    return `/student/courses/${courseId}?tab=summary`;
}

function getFilteredEnrollments(
    enrollments: Enrollment[],
    coursesById: Record<number, CourseWithExtraFields>,
    progressByEnrollment: CourseProgressMap,
    filter: CourseFilter,
    searchTerm: string,
) {
    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    return enrollments.filter((enrollment) => {
        const courseId = getEnrollmentCourseId(enrollment);

        const course =
            coursesById[courseId] ??
            ((enrollment as EnrollmentWithExtraFields).course ?? null);

        const progress = getResolvedProgress(
            enrollment,
            course,
            progressByEnrollment,
        );

        const matchesFilter =
            filter === "all" ||
            (filter === "progress" && progress < 100) ||
            (filter === "completed" && progress >= 100);

        const searchContent = [
            getCourseTitle(enrollment, course),
            getCourseDescription(enrollment, course),
            getCourseCategory(course),
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            cleanSearchTerm.length === 0 ||
            searchContent.includes(cleanSearchTerm);

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
}: {
    roleLabel: string;
    initials: string;
}) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                Rol: {roleLabel}
            </span>

            <StudentNotificationsBell />

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-white shadow-sm">
                {initials}
            </div>
        </div>
    );
}

function CourseCard({
    enrollment,
    course,
    accessRole,
    progress,
}: {
    enrollment: Enrollment;
    course: CourseWithExtraFields | null;
    accessRole: CourseAccessRole;
    progress: number;
}) {
    const displayCourse =
        course ?? ((enrollment as EnrollmentWithExtraFields).course ?? null);

    const completed = progress >= 100;
    const courseId = getEnrollmentCourseId(enrollment);
    const courseName = getCourseTitle(enrollment, displayCourse);
    const description = getCourseDescription(enrollment, displayCourse);
    const imageUrl = getCourseImage(displayCourse);
    const category = getCourseCategory(displayCourse);
    const accessRoleLabel = getAccessRoleLabel(accessRole);
    const href = getCourseWorkspaceHref(courseId, accessRole);

    const isTeacher = accessRole === "teacher";
    const showProgress = !isTeacher;

    return (
        <article
            className={`group overflow-hidden rounded-[26px] border bg-[var(--card)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isTeacher
                    ? "border-green-200"
                    : "border-[var(--border)]"
                }`}
        >
            <div className="grid gap-0 xl:h-[220px] xl:grid-cols-[285px_minmax(0,1fr)_245px]">
                <div className="relative h-[190px] overflow-hidden bg-[var(--muted)] xl:h-[220px]">
                    <ImageWithFallback
                        src={imageUrl}
                        alt={courseName}
                        className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 to-transparent" />

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span
                            className={`rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm ${isTeacher
                                    ? "bg-green-600"
                                    : "bg-[var(--primary)]"
                                }`}
                        >
                            {accessRoleLabel}
                        </span>

                        {!isTeacher ? (
                            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[var(--foreground)] shadow-sm">
                                {progress}%
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="flex min-w-0 flex-col justify-center p-5 xl:h-[220px]">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wide ${isTeacher
                                    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                    : completed
                                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                                        : "bg-[var(--secondary)] text-[var(--primary)]"
                                }`}
                        >
                            {isTeacher
                                ? "Docente asignado"
                                : getStatusLabel(progress, accessRole)}
                        </span>

                        <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-full bg-[var(--muted)] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--muted-foreground)]">
                            <Folder className="h-3.5 w-3.5 shrink-0" />

                            <span className="truncate">{category}</span>
                        </span>
                    </div>

                    <h2 className="mt-3 line-clamp-1 text-2xl font-black tracking-tight text-[var(--foreground)]">
                        {courseName}
                    </h2>

                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                        {description}
                    </p>

                    {showProgress ? (
                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black uppercase tracking-wide text-[var(--muted-foreground)]">
                                    Progreso del curso
                                </span>

                                <span
                                    className={`text-sm font-black ${completed
                                            ? "text-[var(--success)]"
                                            : "text-[var(--primary)]"
                                        }`}
                                >
                                    {progress}%
                                </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${completed
                                            ? "bg-[var(--success)]"
                                            : "bg-[var(--primary)]"
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-2xl bg-[var(--muted)]/70 px-4 py-3">
                            <p className="text-xs font-bold text-[var(--muted-foreground)]">
                                Acceso docente
                            </p>

                            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
                                Puedes administrar módulos, actividades y
                                estudiantes del curso.
                            </p>
                        </div>
                    )}
                </div>

                <aside className="flex h-full flex-col justify-between gap-3 border-t border-[var(--border)] bg-[var(--background)]/60 p-4 xl:h-[220px] xl:border-l xl:border-t-0">
                    <div
                        className={`rounded-[18px] border px-4 py-3 ${isTeacher
                                ? "border-green-200 bg-green-50"
                                : "border-[var(--border)] bg-[var(--card)]"
                            }`}
                    >
                        <p
                            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide ${isTeacher
                                    ? "text-green-700"
                                    : "text-[var(--primary)]"
                                }`}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Acceso
                        </p>

                        <p className="mt-2 text-[18px] font-black leading-tight text-[var(--foreground)]">
                            {accessRoleLabel}
                        </p>

                        <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-5 text-[var(--muted-foreground)]">
                            {isTeacher
                                ? "Administrar módulos, actividades y estudiantes."
                                : "Continuar desde el resumen del aula."}
                        </p>
                    </div>

                    <Link
                        href={href}
                        className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black !text-white shadow-sm transition hover:opacity-95 [&_svg]:!text-white ${isTeacher ? "bg-green-600" : "bg-[var(--primary)]"
                            }`}
                    >
                        Ir al curso
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </aside>
            </div>
        </article>
    );
}

export default function StudentCoursesPage() {
    const pathname = usePathname();
    const { user } = useAuth();

    const authSession = getAuthSession();
    const sessionUser = authSession?.user as SessionUserWithRole | undefined;
    const currentUserId = toNumericId(user?.id ?? sessionUser?.id) ?? 0;

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

    const [coursesById, setCoursesById] = useState<
        Record<number, CourseWithExtraFields>
    >({});

    const [progressByEnrollment, setProgressByEnrollment] =
        useState<CourseProgressMap>({});

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<CourseFilter>("all");

    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);
    const effectiveRole = getEffectiveRoleByPathname(user?.role, pathname);
    const roleLabel = roleLabels[effectiveRole];

    const inProgressCount = useMemo(
        () =>
            enrollments.filter((enrollment) => {
                const courseId = getEnrollmentCourseId(enrollment);

                const course =
                    coursesById[courseId] ??
                    ((enrollment as EnrollmentWithExtraFields).course ?? null);

                return (
                    getResolvedProgress(
                        enrollment,
                        course,
                        progressByEnrollment,
                    ) < 100
                );
            }).length,
        [enrollments, coursesById, progressByEnrollment],
    );

    const completedCount = useMemo(
        () =>
            enrollments.filter((enrollment) => {
                const courseId = getEnrollmentCourseId(enrollment);

                const course =
                    coursesById[courseId] ??
                    ((enrollment as EnrollmentWithExtraFields).course ?? null);

                return (
                    getResolvedProgress(
                        enrollment,
                        course,
                        progressByEnrollment,
                    ) >= 100
                );
            }).length,
        [enrollments, coursesById, progressByEnrollment],
    );

    const filteredEnrollments = useMemo(
        () =>
            getFilteredEnrollments(
                enrollments,
                coursesById,
                progressByEnrollment,
                activeFilter,
                searchTerm,
            ),
        [
            enrollments,
            coursesById,
            progressByEnrollment,
            activeFilter,
            searchTerm,
        ],
    );

    const loadMyCourses = useCallback(async () => {
        const session = getAuthSession();

        const localSessionUser = session?.user as
            | SessionUserWithRole
            | undefined;

        const userId = Number(user?.id ?? localSessionUser?.id);

        if (!userId || Number.isNaN(userId)) {
            throw new Error("No se pudo identificar al usuario autenticado.");
        }

        const enrollmentsResponse = await getEnrollmentsByUser(userId);

        let coursesResponse: Course[] = [];

        try {
            const data = await getAllCourses();

            coursesResponse = Array.isArray(data) ? data : [];
        } catch {
            coursesResponse = [];
        }

        const myCourseEnrollments = Array.isArray(enrollmentsResponse)
            ? getUniqueActiveCourseEnrollments(
                enrollmentsResponse,
                localSessionUser,
                userId,
            )
            : [];

        const coursesMap = coursesResponse.reduce<
            Record<number, CourseWithExtraFields>
        >((accumulator, course) => {
            const courseId = Number(course.id);

            if (courseId > 0) {
                accumulator[courseId] = course as CourseWithExtraFields;
            }

            return accumulator;
        }, {});

        const progressMap = await getProgressMapForEnrollments(
            myCourseEnrollments,
            coursesMap,
            localSessionUser,
            userId,
        );

        return {
            myCourseEnrollments,
            coursesMap,
            progressMap,
        };
    }, [user?.id]);

    async function handleRefreshCourses() {
        try {
            setIsRefreshing(true);
            setErrorMessage("");

            const data = await loadMyCourses();

            setEnrollments(data.myCourseEnrollments);
            setCoursesById(data.coursesMap);
            setProgressByEnrollment(data.progressMap);
        } catch (error) {
            setEnrollments([]);
            setCoursesById({});
            setProgressByEnrollment({});

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar tus cursos.",
            );
        } finally {
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const timer = window.setTimeout(() => {
            loadMyCourses()
                .then((data) => {
                    if (!isMounted) return;

                    setEnrollments(data.myCourseEnrollments);
                    setCoursesById(data.coursesMap);
                    setProgressByEnrollment(data.progressMap);
                    setErrorMessage("");
                })
                .catch((error) => {
                    if (!isMounted) return;

                    setEnrollments([]);
                    setCoursesById({});
                    setProgressByEnrollment({});

                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "No se pudieron cargar tus cursos.",
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
    }, [loadMyCourses]);

    return (
        <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                        Mis cursos
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                        Aquí aparecen tus cursos activos. En cada curso se
                        indica si tu acceso es como estudiante o como docente.
                    </p>
                </div>

                <PageTopBar roleLabel={roleLabel} initials={initials} />
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
                        onClick={() => void handleRefreshCourses()}
                        disabled={isRefreshing}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Filter className="h-4 w-4" />

                        {isRefreshing ? "Actualizando..." : "Actualizar"}
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
                        No tienes cursos activos
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
                        Para acceder a un aula como estudiante, primero debes
                        matricularte desde el catálogo y esperar la aprobación.
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
                    {filteredEnrollments.map((enrollment) => {
                        const courseId = getEnrollmentCourseId(enrollment);

                        const course =
                            coursesById[courseId] ??
                            ((enrollment as EnrollmentWithExtraFields).course ??
                                null);

                        const accessRole = getCourseAccessRole(
                            enrollment,
                            sessionUser,
                            currentUserId,
                        );

                        const progress = getResolvedProgress(
                            enrollment,
                            course,
                            progressByEnrollment,
                        );

                        return (
                            <CourseCard
                                key={`${enrollment.id}-${courseId}-${accessRole}`}
                                enrollment={enrollment}
                                course={course}
                                accessRole={accessRole}
                                progress={progress}
                            />
                        );
                    })}

                    <p className="pb-4 text-center text-sm font-semibold text-[var(--muted-foreground)]">
                        Mostrando {filteredEnrollments.length} de{" "}
                        {enrollments.length} cursos activos
                    </p>
                </div>
            )}
        </section>
    );
}