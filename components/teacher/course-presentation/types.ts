export type ApiCourse = {
    id: number;
    name?: string | null;
    title?: string | null;
    description?: string | null;
    price?: string | number | null;
    discount_price?: string | number | null;
    is_free?: boolean | null;
    level?: string | null;
    is_published?: boolean | null;
    open_enrollment?: boolean | null;
    duration_hours?: number | null;
    total_lessons?: number | null;
    image_url?: string | null;
    image?: string | null;
    course_image_url?: string | null;
};

export type CourseModule = {
    id: number;
    name: string;
    order: number;
    course_id: number;
};

export type CourseSummary = {
    id: number;
    name: string;
    description: string;
    price: string;
    discountPrice: string;
    isFree: boolean;
    level: string;
    isPublished: boolean;
    openEnrollment: boolean;
    durationHours: number;
    totalLessons: number;
    imageUrl: string;
};

export type TeacherCoursePresentationViewProps = {
    courseId: string;
    backHref?: string;
    backLabel?: string;
    viewLabel?: string;
};
