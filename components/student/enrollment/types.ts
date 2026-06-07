import type { Enrollment } from "@/services/enrollments.service";

export type RawCourse = {
    id?: number | string;
    title?: string;
    name?: string;
    description?: string;
    image_url?: string | null;
    image?: string | null;
    thumbnail?: string | null;
    course_image_url?: string | null;
    price?: number | string | null;
    is_free?: boolean | null;
    status?: string | null;
    teacher_name?: string | null;
    instructor_name?: string | null;
    duration?: number | string | null;
    duration_hours?: number | string | null;
    duration_minutes?: number | string | null;
    total_lessons?: number | string | null;
    total_students?: number | string | null;
    category?: string | null;
    category_name?: string | null;
    subcategory?: string | null;
    subcategory_name?: string | null;
    has_discount?: boolean | null;
    discount?: boolean | null;
    discount_percentage?: number | string | null;
    discount_percent?: number | string | null;
    discount_rate?: number | string | null;
    discounted_price?: number | string | null;
    discount_price?: number | string | null;
    open_enrollment?: boolean | null;
};

export type CourseEnrollmentItem = {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    price: number;
    isFree: boolean;
    status: string;
    teacherName: string;
    durationLabel: string;
    totalLessons: number;
    totalStudents: number;
    category: string;
    openEnrollment: boolean;
    hasDiscount: boolean;
    discountPercentage: number;
    discountedPrice: number | null;
};

export type PaymentMethod = "transferencia" | "gratis";

export type ExistingEnrollmentState =
    | {
          type: "none";
          enrollment: null;
      }
    | {
          type: "approved" | "pending" | "rejected";
          enrollment: Enrollment;
      };

export type StudentEnrollmentViewProps = {
    courseId: string;
};
