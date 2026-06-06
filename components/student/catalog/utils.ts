import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";
import { STUDENT_ROLE_ID } from "./constants";
import type {
    CatalogCourse,
    CatalogEnrollmentState,
    CatalogFilter,
    CourseEnrollmentInfo,
    LevelFilter,
} from "./types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AnyRecord;
}

function readNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value.trim().replace(",", "."));

        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function readBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}

export function normalizeText(value: unknown): string {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export function getUserId(user: unknown): number {
    const record = toRecord(user);

    if (!record) return 0;

    return (
        readNumber(record.id) ??
        readNumber(record.user_id) ??
        readNumber(record.userId) ??
        0
    );
}

export function getUserFullName(user: unknown): string {
    const record = toRecord(user);

    if (!record) return "Estudiante";

    const firstName = String(record.firstname ?? "").trim();
    const lastName = String(record.lastname ?? "").trim();
    const fullName = `${firstName} ${lastName}`.trim();

    return (
        String(record.fullName ?? "").trim() ||
        fullName ||
        String(record.name ?? "").trim() ||
        String(record.username ?? "").trim() ||
        String(record.email ?? "").split("@")[0] ||
        "Estudiante"
    );
}

export function getInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "ES";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function normalizeResourceUrl(url?: string | null): string {
    const cleanUrl = String(url ?? "").trim();

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("data:image/") ||
        cleanUrl.startsWith("blob:")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_BASE_URL}${cleanUrl}`;
    }

    return `${API_BASE_URL}/${cleanUrl.replace(/^\/+/, "")}`;
}

export function getCourseImage(course: CatalogCourse): string {
    return normalizeResourceUrl(
        course.image_url ||
            course.course_image_url ||
            course.image ||
            course.thumbnail ||
            "",
    );
}

export function getCourseCategory(course: CatalogCourse): string {
    return (
        course.subcategory_name ||
        course.category_name ||
        course.subcategory ||
        course.category ||
        "Curso académico"
    );
}

export function formatLevel(level?: Course["level"] | string | null): string {
    const normalized = String(level ?? "").trim().toUpperCase();

    if (normalized === "PRINCIPIANTE") return "Principiante";
    if (normalized === "INTERMEDIO") return "Intermedio";
    if (normalized === "AVANZADO") return "Avanzado";

    return String(level ?? "").trim() || "Sin nivel";
}

function formatMoney(value: number, currency = "USD"): string {
    try {
        return new Intl.NumberFormat("es-EC", {
            style: "currency",
            currency: currency || "USD",
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency || "USD"} ${value.toFixed(2)}`;
    }
}

export function hasCourseOffer(course: CatalogCourse): boolean {
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

export function getDiscountPercentage(course: CatalogCourse): number {
    const price = Number(course.price || 0);
    const discountPrice = Number(course.discount_price || 0);

    if (!hasCourseOffer(course)) return 0;

    return Math.round(((price - discountPrice) / price) * 100);
}

export function formatPrice(course: CatalogCourse): string {
    if (course.is_free) return "Gratis";

    const discountPrice = Number(course.discount_price || 0);
    const price = Number(course.price || 0);
    const finalPrice = discountPrice > 0 ? discountPrice : price;

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
        return "Consultar";
    }

    return formatMoney(finalPrice, course.currency || "USD");
}

export function getOriginalPrice(course: CatalogCourse): string {
    const discountPrice = Number(course.discount_price || 0);
    const price = Number(course.price || 0);

    if (!hasCourseOffer(course)) return "";

    return formatMoney(price, course.currency || "USD");
}

export function isCoursePublished(course: CatalogCourse): boolean {
    return readBoolean(course.is_published, true);
}

export function isCourseOpen(course: CatalogCourse): boolean {
    return readBoolean(course.open_enrollment, true);
}

export function isMdtCourse(course: CatalogCourse): boolean {
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

        return normalizeText(value).includes("mdt");
    });
}

export function isStudentEnrollment(enrollment: Enrollment): boolean {
    const roleId = Number(
        enrollment.role?.id ?? enrollment.user?.role_id ?? 0,
    );

    const roleName = normalizeText(enrollment.role?.name);

    return (
        roleId === STUDENT_ROLE_ID ||
        roleName === "estudiante" ||
        roleName === "student" ||
        roleName === "alumno" ||
        roleName === "alumna"
    );
}

export function getEnrollmentState(
    enrollment: Enrollment | null,
    course: CatalogCourse,
): CatalogEnrollmentState {
    if (!isCourseOpen(course) && !enrollment) return "closed";
    if (!enrollment) return "available";
    if (enrollment.accepted === true) return "approved";
    if (enrollment.accepted === false) return "rejected";

    return "pending";
}

export function getCourseEnrollmentInfo(
    course: CatalogCourse,
    enrollments: Enrollment[],
): CourseEnrollmentInfo {
    const possibleEnrollments = enrollments
        .filter(isStudentEnrollment)
        .filter(
            (enrollment) =>
                Number(enrollment.course?.id) === Number(course.id),
        )
        .sort((a, b) => Number(b.id) - Number(a.id));

    const enrollment = possibleEnrollments[0] ?? null;

    return {
        enrollment,
        state: getEnrollmentState(enrollment, course),
    };
}

export function matchesCatalogFilters({
    course,
    searchTerm,
    catalogFilter,
    levelFilter,
}: {
    course: CatalogCourse;
    searchTerm: string;
    catalogFilter: CatalogFilter;
    levelFilter: LevelFilter;
}): boolean {
    if (!isCoursePublished(course)) return false;

    const query = normalizeText(searchTerm);

    const searchText = normalizeText(
        [
            course.name,
            course.description,
            getCourseCategory(course),
            formatLevel(course.level),
            isMdtCourse(course) ? "MDT" : "",
        ].join(" "),
    );

    const matchesSearch = !query || searchText.includes(query);

    const matchesLevel =
        levelFilter === "all" || course.level === levelFilter;

    const matchesType =
        catalogFilter === "all" ||
        (catalogFilter === "free" && course.is_free) ||
        (catalogFilter === "paid" && !course.is_free) ||
        (catalogFilter === "open" && isCourseOpen(course)) ||
        (catalogFilter === "offers" && hasCourseOffer(course));

    return matchesSearch && matchesLevel && matchesType;
}
