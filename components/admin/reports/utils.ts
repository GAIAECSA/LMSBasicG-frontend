import type { Course } from "@/services/courses.service";

export function getErrorMessage(
    error: unknown,
    fallbackMessage: string,
): string {
    return error instanceof Error
        ? error.message
        : fallbackMessage;
}

export function isMdtCourse(
    course: Course,
): boolean {
    return course.is_mdt === true;
}
