import { API_ORIGIN } from "./constants";
import type {
    ApiCourse,
    CourseSummary,
} from "./types";

export function buildFileUrl(
    url: string | null | undefined,
) {
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

export function toNumber(
    value: unknown,
    fallback = 0,
) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue)
        ? numericValue
        : fallback;
}

export function cleanText(
    value: unknown,
    fallback: string,
) {
    if (typeof value !== "string") {
        return fallback;
    }

    const cleanValue = value.trim();

    return cleanValue || fallback;
}

export function normalizeCourse(
    course: ApiCourse,
): CourseSummary {
    return {
        id: Number(course.id),
        name: cleanText(
            course.name ?? course.title,
            "Curso sin nombre",
        ),
        description: cleanText(
            course.description,
            "Este curso todavía no tiene una descripción registrada.",
        ),
        price:
            course.price === null ||
            course.price === undefined
                ? "0"
                : String(course.price),
        discountPrice:
            course.discount_price === null ||
            course.discount_price === undefined ||
            String(course.discount_price).toLowerCase() ===
                "null"
                ? ""
                : String(course.discount_price),
        isFree: Boolean(course.is_free),
        level: cleanText(
            course.level,
            "Sin nivel",
        ),
        isPublished: Boolean(
            course.is_published,
        ),
        openEnrollment: Boolean(
            course.open_enrollment,
        ),
        durationHours: toNumber(
            course.duration_hours,
            0,
        ),
        totalLessons: toNumber(
            course.total_lessons,
            0,
        ),
        imageUrl: buildFileUrl(
            course.image_url ??
                course.course_image_url ??
                course.image,
        ),
    };
}

export function formatMoney(value: string) {
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

export function hasDiscount(
    course: CourseSummary,
) {
    const price = Number(course.price);
    const discount = Number(
        course.discountPrice,
    );

    return (
        Number.isFinite(price) &&
        Number.isFinite(discount) &&
        discount > 0 &&
        discount < price
    );
}

export function toCssImageUrl(
    value: string,
) {
    return `url("${value.replace(
        /"/g,
        '\\"',
    )}")`;
}
