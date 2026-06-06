import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";
import type { DashboardCourse } from "./types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

export function toNumber(
    value: unknown,
    fallback = 0,
) {
    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : fallback;
    }

    if (typeof value === "string") {
        const parsed = Number(
            value
                .trim()
                .replace(",", "."),
        );

        return Number.isFinite(parsed)
            ? parsed
            : fallback;
    }

    return fallback;
}

export function clamp(
    value: number,
    min = 0,
    max = 100,
) {
    return Math.min(
        max,
        Math.max(min, value),
    );
}

export function getUserId(
    user: unknown,
) {
    if (
        !user ||
        typeof user !== "object"
    ) {
        return null;
    }

    const value = user as {
        id?: string | number;
        user_id?: string | number;
        userId?: string | number;
    };

    const userId = Number(
        value.id ??
            value.user_id ??
            value.userId,
    );

    return Number.isFinite(userId) &&
        userId > 0
        ? userId
        : null;
}

export function getUserFullName(
    user: unknown,
) {
    if (
        !user ||
        typeof user !== "object"
    ) {
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
        `${value.firstname ?? ""} ${
            value.lastname ?? ""
        }`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Estudiante"
    );
}

export function getInitials(
    name: string,
) {
    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return "ES";
    }

    if (words.length === 1) {
        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function buildImageUrl(
    imageUrl?: string | null,
) {
    if (!imageUrl) return "";

    const cleanImageUrl =
        imageUrl.trim();

    if (
        cleanImageUrl.startsWith(
            "http://",
        ) ||
        cleanImageUrl.startsWith(
            "https://",
        ) ||
        cleanImageUrl.startsWith(
            "data:image/",
        ) ||
        cleanImageUrl.startsWith(
            "blob:",
        )
    ) {
        return cleanImageUrl;
    }

    if (
        cleanImageUrl.startsWith("/")
    ) {
        return `${API_BASE_URL}${cleanImageUrl}`;
    }

    return `${API_BASE_URL}/${cleanImageUrl.replace(
        /^\/+/, 
        "",
    )}`;
}

export function getCourseImage(
    course: DashboardCourse,
) {
    return buildImageUrl(
        course.image_url ??
            course.course_image_url ??
            course.image ??
            course.thumbnail ??
            null,
    );
}

export function isCoursePublished(
    course: DashboardCourse,
) {
    if (
        typeof course.is_published ===
        "boolean"
    ) {
        return course.is_published;
    }

    return true;
}

export function isCourseOpen(
    course: DashboardCourse,
) {
    if (
        typeof course.open_enrollment ===
        "boolean"
    ) {
        return course.open_enrollment;
    }

    return true;
}

export function isFreeCourse(
    course: DashboardCourse,
) {
    return (
        Boolean(course.is_free) ||
        toNumber(course.price) <= 0
    );
}

export function formatPrice(
    course: DashboardCourse,
) {
    if (isFreeCourse(course)) {
        return "Gratis";
    }

    const price = toNumber(
        course.price,
    );

    const discountPrice = toNumber(
        course.discount_price,
    );

    const finalPrice =
        discountPrice > 0 &&
        discountPrice < price
            ? discountPrice
            : price;

    return new Intl.NumberFormat(
        "es-EC",
        {
            style: "currency",
            currency:
                course.currency ||
                "USD",
        },
    ).format(finalPrice);
}

export function getCourseProgress(
    course: DashboardCourse,
) {
    const progress = toNumber(
        course.progress_percentage ??
            course.completion_percentage ??
            course.progress ??
            0,
    );

    return clamp(
        Math.round(progress),
    );
}

export function formatLevel(
    level?: Course["level"] |
        string |
        null,
) {
    if (!level) return "Sin nivel";

    const normalizedLevel = String(
        level,
    )
        .trim()
        .toUpperCase();

    if (
        normalizedLevel ===
        "PRINCIPIANTE"
    ) {
        return "Principiante";
    }

    if (
        normalizedLevel ===
        "INTERMEDIO"
    ) {
        return "Intermedio";
    }

    if (
        normalizedLevel ===
        "AVANZADO"
    ) {
        return "Avanzado";
    }

    return (
        String(level).trim() ||
        "Sin nivel"
    );
}

export function getEnrollmentCourseId(
    enrollment: Enrollment,
) {
    return Number(
        enrollment.course?.id ?? 0,
    );
}

export function isStudentEnrollment(
    enrollment: Enrollment,
) {
    const roleId = Number(
        enrollment.role?.id ?? 0,
    );

    const roleName = String(
        enrollment.role?.name ?? "",
    ).toLowerCase();

    if (!roleId && !roleName) {
        return true;
    }

    return (
        roleId === 4 ||
        roleName.includes("student") ||
        roleName.includes(
            "estudiante",
        )
    );
}

export function isApprovedEnrollment(
    enrollment: Enrollment,
) {
    return enrollment.accepted === true;
}

export function isPendingEnrollment(
    enrollment: Enrollment,
) {
    return (
        enrollment.accepted === null ||
        enrollment.accepted ===
            undefined
    );
}

function createFallbackCourse(
    enrollment: Enrollment,
): DashboardCourse {
    return {
        id: getEnrollmentCourseId(
            enrollment,
        ),
        name:
            enrollment.course?.name ||
            "Curso",
        description: "",
        price: 0,
        is_free: true,
        level: "PRINCIPIANTE",
        is_published: true,
        open_enrollment: true,
        duration_hours: 0,
        total_lessons: 0,
        subcategory_id: 0,
        is_mdt: false,
        image_url: null,
        course_image_url: null,
        image: null,
        thumbnail: null,
        discount_price: 0,
        currency: "USD",
        rating: 0,
        total_students: 0,
        progress: 0,
    };
}

export function mergeEnrollmentCourse(
    enrollment: Enrollment,
    courseMap: Map<
        number,
        DashboardCourse
    >,
) {
    const courseId =
        getEnrollmentCourseId(
            enrollment,
        );

    return (
        courseMap.get(courseId) ??
        createFallbackCourse(
            enrollment,
        )
    );
}

export function getCourseRoomHref(
    courseId: number,
) {
    return `/student/courses/${courseId}`;
}
