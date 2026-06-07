export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

export const STUDENT_ROLE_ID = 4;

export const STUDENT_ENROLLMENT_LINKS = {
    catalog: "/student/catalog",
    courses: "/student/courses",
} as const;
