import type { Course, CourseLevel } from "@/services/courses.service";
import type { User } from "@/services/users.service";
import { API_BASE_URL, EMPTY_IMAGE } from "./constants";
import type { ApiCourseFields, CourseFormState } from "./types";

export function parseNumberInput(value: string, fallback = 0): number {
    const normalized = value.replace(",", ".").trim();

    if (!normalized) return fallback;

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatMoney(value: number, currency = "USD") {
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

export function resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return EMPTY_IMAGE;

    const trimmed = imageUrl.trim();

    if (!trimmed) return EMPTY_IMAGE;

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }

    if (trimmed.startsWith("/")) {
        return `${API_BASE_URL}${trimmed}`;
    }

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function asApiCourse(course: Course): Course & ApiCourseFields {
    return course as Course & ApiCourseFields;
}

export function getCourseName(course: Course): string {
    return asApiCourse(course).name ?? "";
}

export function getCourseDescription(course: Course): string {
    return asApiCourse(course).description ?? "";
}

export function getCoursePrice(course: Course): number {
    const raw = asApiCourse(course).price;

    if (typeof raw === "number") return raw;

    if (typeof raw === "string") {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

export function getCourseLevel(course: Course): CourseLevel {
    return asApiCourse(course).level ?? "PRINCIPIANTE";
}

export function getCourseOpenEnrollment(course: Course): boolean {
    return asApiCourse(course).open_enrollment ?? true;
}

export function getCourseIsPublished(course: Course): boolean {
    return asApiCourse(course).is_published ?? false;
}

export function getCourseIsFree(course: Course): boolean {
    return asApiCourse(course).is_free ?? false;
}

export function getCourseIsMdt(course: Course): boolean {
    return asApiCourse(course).is_mdt ?? false;
}

export function getCourseSubcategoryId(course: Course): number | null {
    const raw = asApiCourse(course).subcategory_id;

    return typeof raw === "number" ? raw : null;
}

export function getCourseDurationHours(course: Course): number {
    return asApiCourse(course).duration_hours ?? 0;
}

export function getCourseTotalLessons(course: Course): number {
    return asApiCourse(course).total_lessons ?? 0;
}

export function getCourseImageUrl(course: Course): string {
    return asApiCourse(course).image_url ?? "";
}

export function getCourseDiscountPrice(course: Course): number {
    const raw = asApiCourse(course).discount_price;

    if (typeof raw === "number") return raw;

    if (typeof raw === "string") {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

export function getCourseCurrency(course: Course): string {
    return asApiCourse(course).currency ?? "USD";
}

export function getCourseRating(course: Course): number {
    const raw = asApiCourse(course).rating;

    if (typeof raw === "number") return raw;

    if (typeof raw === "string") {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 5;
    }

    return 5;
}

export function getCourseTotalStudents(course: Course): number {
    return asApiCourse(course).total_students ?? 0;
}

export function buildFormFromCourse(course: Course): CourseFormState {
    return {
        name: getCourseName(course),
        description: getCourseDescription(course),
        price: String(getCoursePrice(course)),
        is_free: getCourseIsFree(course),
        level: getCourseLevel(course),
        is_published: getCourseIsPublished(course),
        open_enrollment: getCourseOpenEnrollment(course),
        duration_hours: String(getCourseDurationHours(course)),
        total_lessons: String(getCourseTotalLessons(course)),
        image_url: getCourseImageUrl(course),
        discount_price: String(getCourseDiscountPrice(course)),
        currency: getCourseCurrency(course),
        rating: String(getCourseRating(course)),
        total_students: String(getCourseTotalStudents(course)),
        category_id: "",
        subcategory_id: String(getCourseSubcategoryId(course) ?? ""),
        is_mdt: getCourseIsMdt(course),
    };
}

export function getPublishedBadgeClass(course: Course) {
    return getCourseIsPublished(course)
        ? "bg-emerald-100 text-emerald-700"
        : "bg-orange-100 text-orange-700";
}

export function getUserFullName(user: User) {
    const fullName = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

    return fullName || user.username || `Usuario #${user.id}`;
}
