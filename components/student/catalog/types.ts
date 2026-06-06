import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";

export type CatalogFilter =
    | "all"
    | "free"
    | "paid"
    | "open"
    | "offers";

export type LevelFilter =
    | "all"
    | "PRINCIPIANTE"
    | "INTERMEDIO"
    | "AVANZADO";

export type CatalogCourse = Course & {
    image?: string | null;
    image_url?: string | null;
    course_image_url?: string | null;
    thumbnail?: string | null;
    category?: string | null;
    category_name?: string | null;
    subcategory?: string | null;
    subcategory_name?: string | null;
    is_mdt?: boolean | number | string | null;
    is_mdt_course?: boolean | number | string | null;
    mdt?: boolean | number | string | null;
    course_type?: string | null;
    type?: string | null;
    modality?: string | null;
    origin?: string | null;
    source?: string | null;
};

export type CatalogEnrollmentState =
    | "available"
    | "approved"
    | "pending"
    | "rejected"
    | "closed";

export type CourseEnrollmentInfo = {
    enrollment: Enrollment | null;
    state: CatalogEnrollmentState;
};
