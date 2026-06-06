import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";
import type { User } from "@/services/users.service";

export function getCourseName(course: Course): string {
    const item = course as Course & {
        name?: string;
        title?: string;
    };

    return (
        item.name ||
        item.title ||
        `Curso #${course.id}`
    );
}

export function getUserName(user: User): string {
    return (
        `${user.firstname || ""} ${
            user.lastname || ""
        }`.trim() ||
        user.username ||
        `Usuario #${user.id}`
    );
}

export function getUserInitials(user: User): string {
    const first =
        user.firstname?.charAt(0) ?? "";

    const last =
        user.lastname?.charAt(0) ?? "";

    return (
        `${first}${last}`.trim().toUpperCase() ||
        "US"
    );
}

export function getEnrollmentStudentName(
    enrollment: Enrollment,
): string {
    return (
        `${enrollment.user.firstname || ""} ${
            enrollment.user.lastname || ""
        }`.trim() ||
        `Usuario #${enrollment.user.id}`
    );
}

export function getEnrollmentInitials(
    enrollment: Enrollment,
): string {
    const first =
        enrollment.user.firstname?.charAt(0) ??
        "";

    const last =
        enrollment.user.lastname?.charAt(0) ??
        "";

    return (
        `${first}${last}`.trim().toUpperCase() ||
        "ES"
    );
}

export function getStatusText(
    accepted: boolean | null,
) {
    if (accepted === true) {
        return "Aprobado";
    }

    if (accepted === false) {
        return "No aprobado";
    }

    return "Pendiente";
}

export function getStatusBadgeClass(
    accepted: boolean | null,
) {
    if (accepted === true) {
        return "bg-emerald-100 text-emerald-700";
    }

    if (accepted === false) {
        return "bg-red-100 text-red-700";
    }

    return "bg-orange-100 text-orange-700";
}
