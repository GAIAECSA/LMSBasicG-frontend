import type { CourseFormState } from "./types";

export const EMPTY_IMAGE =
    "https://placehold.co/1200x700/e5e7eb/64748b?text=Sin+imagen";

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

export const ROWS_PER_PAGE = 7;
export const USERS_PER_PAGE = 5;

export const TEACHER_ROLE_ID = 3;
export const STUDENT_ROLE_ID = 4;

export const initialFormState: CourseFormState = {
    name: "",
    description: "",
    price: "0",
    is_free: false,
    level: "PRINCIPIANTE",
    is_published: false,
    open_enrollment: true,
    duration_hours: "0",
    total_lessons: "0",
    image_url: "",
    discount_price: "0",
    currency: "USD",
    rating: "5",
    total_students: "0",
    category_id: "",
    subcategory_id: "",
    is_mdt: false,
};
