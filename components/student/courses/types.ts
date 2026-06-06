import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";

export type CourseFilter =
    | "all"
    | "progress"
    | "completed";

export type CourseAccessRole =
    | "student"
    | "teacher";

export type SessionUserWithRole = {
    id?: number | string;
    role?: string;
    role_id?: number | string;
    roleId?: number | string;
};

export type CourseWithExtraFields =
    Course & {
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

export type EnrollmentWithExtraFields =
    Enrollment & {
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

export type CourseProgressMap =
    Record<number, number>;

export type CourseCardData = {
    enrollment: Enrollment;
    course: CourseWithExtraFields | null;
    accessRole: CourseAccessRole;
    progress: number;
};
