import type { CourseLevel } from "@/services/courses.service";

export type Notice =
    | { type: "success"; text: string }
    | { type: "error"; text: string }
    | null;

export type CourseFormState = {
    name: string;
    description: string;
    price: string;
    is_free: boolean;
    level: CourseLevel;
    is_published: boolean;
    open_enrollment: boolean;
    duration_hours: string;
    total_lessons: string;
    image_url: string;
    discount_price: string;
    currency: string;
    rating: string;
    total_students: string;
    category_id: string;
    subcategory_id: string;
    is_mdt: boolean;
};

export type ApiCourseFields = {
    name?: string;
    description?: string;
    price?: number | string;
    is_free?: boolean;
    level?: CourseLevel;
    is_published?: boolean;
    open_enrollment?: boolean;
    duration_hours?: number;
    total_lessons?: number;
    subcategory_id?: number | null;
    image_url?: string | null;
    discount_price?: number | string;
    currency?: string;
    rating?: number | string;
    total_students?: number;
    is_mdt?: boolean;
};

export type CourseStats = {
    total: number;
    published: number;
    free: number;
    openEnrollment: number;
    mdt: number;
};
