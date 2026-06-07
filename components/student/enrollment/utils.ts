import type { Enrollment } from "@/services/enrollments.service";
import { API_BASE_URL } from "./constants";
import type {
    CourseEnrollmentItem,
    ExistingEnrollmentState,
    RawCourse,
} from "./types";

export function resolveImageUrl(value?: string | null): string | null {
    if (!value || value.trim().length === 0) return null;

    const trimmed = value.trim();

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:image/")
    ) {
        return trimmed;
    }

    if (trimmed.startsWith("/")) {
        return `${API_BASE_URL}${trimmed}`;
    }

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

export function toNumber(value: unknown, fallback = 0): number {
    const parsed =
        typeof value === "number"
            ? value
            : Number(value ?? fallback);

    return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatPrice(value: number): string {
    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

export function formatDurationFromValues(
    duration?: unknown,
    hours?: unknown,
    minutes?: unknown,
): string {
    const durationValue = toNumber(duration, 0);
    const hoursValue = toNumber(hours, 0);
    const minutesValue = toNumber(minutes, 0);

    if (hoursValue > 0 || minutesValue > 0) {
        const parts: string[] = [];

        if (hoursValue > 0) {
            parts.push(`${hoursValue} h`);
        }

        if (minutesValue > 0) {
            parts.push(`${minutesValue} min`);
        }

        return parts.join(" ");
    }

    if (durationValue > 0) {
        if (durationValue >= 60) {
            const hourPart = Math.floor(durationValue / 60);
            const minutePart = durationValue % 60;

            return minutePart > 0
                ? `${hourPart} h ${minutePart} min`
                : `${hourPart} h`;
        }

        return `${durationValue} min`;
    }

    return "No definida";
}

export function getCourseCategory(course: RawCourse): string {
    return (
        course.subcategory_name ||
        course.category_name ||
        course.subcategory ||
        course.category ||
        "Curso académico"
    );
}

export function normalizeCourse(
    course: RawCourse,
): CourseEnrollmentItem {
    const price = toNumber(course.price, 0);

    const isFree =
        typeof course.is_free === "boolean"
            ? course.is_free
            : price <= 0;

    const rawDiscountPercentage = toNumber(
        course.discount_percentage ??
        course.discount_percent ??
        course.discount_rate,
        0,
    );

    const rawDiscountedPrice =
        course.discounted_price !== undefined &&
            course.discounted_price !== null
            ? toNumber(course.discounted_price, price)
            : course.discount_price !== undefined &&
                course.discount_price !== null
                ? toNumber(course.discount_price, price)
                : null;

    const hasDiscount =
        !isFree &&
        price > 0 &&
        (Boolean(course.has_discount) ||
            Boolean(course.discount) ||
            rawDiscountPercentage > 0 ||
            (rawDiscountedPrice !== null &&
                rawDiscountedPrice < price));

    const discountedPrice =
        hasDiscount && rawDiscountedPrice !== null
            ? rawDiscountedPrice
            : hasDiscount && rawDiscountPercentage > 0
                ? Math.max(
                    price -
                    price *
                    (rawDiscountPercentage / 100),
                    0,
                )
                : null;

    const discountPercentage =
        hasDiscount && rawDiscountPercentage > 0
            ? Math.round(rawDiscountPercentage)
            : hasDiscount &&
                discountedPrice !== null &&
                price > 0
                ? Math.round(
                    ((price - discountedPrice) / price) *
                    100,
                )
                : 0;

    return {
        id: Number(course.id ?? 0),
        title:
            course.title?.trim() ||
            course.name?.trim() ||
            "Curso sin título",
        description:
            course.description?.trim() ||
            "Este curso está disponible para iniciar tu aprendizaje.",
        imageUrl: resolveImageUrl(
            course.image_url ??
            course.course_image_url ??
            course.image ??
            course.thumbnail ??
            null,
        ),
        price,
        isFree,
        status: course.status?.trim() || "Disponible",
        teacherName:
            course.teacher_name?.trim() ||
            course.instructor_name?.trim() ||
            "Docente no asignado",
        durationLabel: formatDurationFromValues(
            course.duration,
            course.duration_hours,
            course.duration_minutes,
        ),
        totalLessons: toNumber(course.total_lessons, 0),
        totalStudents: toNumber(course.total_students, 0),
        category: getCourseCategory(course),
        openEnrollment:
            typeof course.open_enrollment === "boolean"
                ? course.open_enrollment
                : true,
        hasDiscount,
        discountPercentage,
        discountedPrice,
    };
}

export function generateVoucherNumber(courseId: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    const hours = `${now.getHours()}`.padStart(2, "0");
    const minutes = `${now.getMinutes()}`.padStart(2, "0");
    const random = Math.floor(Math.random() * 900 + 100);

    return `COMP-${courseId}-${year}${month}${day}-${hours}${minutes}-${random}`;
}

export function getUserFullName(user: unknown): string {
    if (!user || typeof user !== "object") {
        return "Estudiante";
    }

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName =
        `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Estudiante"
    );
}

export function getInitials(name: string): string {
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

export function getEnrollmentState(
    enrollments: Enrollment[],
    courseId: number,
): ExistingEnrollmentState {
    const enrollment =
        enrollments
            .filter(
                (item) =>
                    Number(
                        item.course?.id,
                    ) ===
                    courseId,
            )
            .sort(
                (a, b) =>
                    Number(b.id) -
                    Number(a.id),
            )[0] ??
        null;

    if (!enrollment) {
        return {
            type: "none",
            enrollment: null,
        };
    }

    if (
        enrollment.accepted ===
        true
    ) {
        return {
            type: "approved",
            enrollment,
        };
    }

    if (
        enrollment.accepted ===
        false
    ) {
        return {
            type: "rejected",
            enrollment,
        };
    }

    return {
        type: "pending",
        enrollment,
    };
}
