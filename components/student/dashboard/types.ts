import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";

export type DashboardCourse = Course & {
    image?: string | null;
    thumbnail?: string | null;
    progress?: number | string | null;
    progress_percentage?: number | string | null;
    completion_percentage?: number | string | null;
};

export type StudentDashboardSummary = {
    enrolled: number;
    approved: number;
    pending: number;
    certificatesHref: string;
};

export type CourseCardMode =
    | "enrolled"
    | "recommended";

export type StudentEnrollment = Enrollment;
