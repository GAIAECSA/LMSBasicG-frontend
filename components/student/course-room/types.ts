import type { CourseModule } from "@/services/modules.service";
import type { Lesson, LessonBlock } from "@/services/lessons.service";
import type { Certificate } from "@/services/certificates.service";
import type { Course } from "@/services/courses.service";

export type StudentMoocCourseViewProps = {
    courseId: string;
};

export type LessonItemType =
    | "text"
    | "image"
    | "pdf"
    | "video"
    | "quiz"
    | "homework"
    | "survey"
    | "forum";

export type CourseTab =
    | "summary"
    | "content"
    | "activities"
    | "forum"
    | "survey"
    | "grades"
    | "attendance"
    | "certificate"
    | "mdtcertificate"
    | "mdtrequiredfiles";

    
export type CourseTabItem = {
    key: CourseTab;
    label: string;
};

export type QuizQuestion = {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    points: number;
};

export type LessonBlockWithOptionalType = LessonBlock & {
    block_type_id?: number;
    lesson_block_type?: {
        id?: number;
        key?: string;
    };
};

export type LessonBlockRoot = LessonBlock & Record<string, unknown>;

export type LessonView = Lesson & {
    blocks: LessonBlock[];
};

export type ModuleView = CourseModule & {
    lessons: LessonView[];
};

export type QuizAnswers = Record<number, number>;

export type SessionUserWithRole = {
    id?: number | string;
    role?: string;
    role_id?: number | string;
    roleId?: number | string;
    firstname?: string | null;
    lastname?: string | null;
    email?: string | null;
    idnumber?: string | null;
    id_number?: string | null;
    identification?: string | null;
    cedula?: string | null;
};

export type CertificateWithFileFields = Certificate & {
    pdf_url?: string | null;
    file_url?: string | null;
    fileUrl?: string | null;
    url?: string | null;
    certificate_url?: string | null;
    certificateUrl?: string | null;
    path?: string | null;
};

export type CourseWithImageFields = Course & {
    image?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    course_image_url?: string | null;
    courseImageUrl?: string | null;
    thumbnail?: string | null;
    duration_hours?: number | string | null;
    durationHours?: number | string | null;
    level?: string | null;

    /**
     * Campo usado para identificar si el curso pertenece a MDT.
     * Puede venir del backend como is_mdt o con variantes según el servicio.
     */
    is_mdt?: boolean | number | string | null;
    isMdt?: boolean | number | string | null;
    isMdtCourse?: boolean | number | string | null;
    mdt?: boolean | number | string | null;
    course_is_mdt?: boolean | number | string | null;
};

export type AsyncServiceFunction = (...args: unknown[]) => Promise<unknown>;

export type ServiceModule = Record<string, unknown>;

export type StudentBlockResponse = {
    id?: number;
    enrollment_id?: number;
    enrollmentId?: number;
    lesson_block_id?: number;
    lessonBlockId?: number;
    user_id?: number;
    userId?: number;

    homework?: string | null;
    survey?: string | null;
    forum?: string | null;

    response?: string | Record<string, unknown> | null;
    answer?: string | null;
    content?: string | null;
    message?: string | null;

    file_url?: string | null;
    fileUrl?: string | null;

    score?: number | string | null;
    is_passed?: boolean | null;
    isPassed?: boolean | null;

    created_at?: string | null;
    createdAt?: string | null;
    updated_at?: string | null;
    updatedAt?: string | null;

    enrollment?: {
        id?: number;
        user?: {
            id?: number;
            firstname?: string | null;
            lastname?: string | null;
            email?: string | null;
            idnumber?: string | null;
            id_number?: string | null;
            identification?: string | null;
            cedula?: string | null;
        } | null;
    } | null;

    user?: {
        id?: number;
        firstname?: string | null;
        lastname?: string | null;
        email?: string | null;
        idnumber?: string | null;
        id_number?: string | null;
        identification?: string | null;
        cedula?: string | null;
    } | null;
};

export type StudentResponseMaps = {
    homework: Record<number, StudentBlockResponse | null>;
    survey: Record<number, StudentBlockResponse | null>;
    forum: Record<number, StudentBlockResponse[]>;
};

export type SurveyQuestion = {
    id: string;
    question: string;
    type: "text" | "single";
    options: string[];
    required: boolean;
};

export type AttendanceStatus =
    | "present"
    | "absent"
    | "late"
    | "justified";

export type AttendanceSession = {
    id: number;
    course_id: number;
    courseId?: number;
    title: string;
    description: string;
    starts_at: string;
    startsAt?: string;
    ends_at: string;
    endsAt?: string;
    status: string;
    is_active: boolean;
    isActive?: boolean;
    requires_code: boolean;
    requiresCode?: boolean;
    attendance_code?: string;
    attendanceCode?: string;
    raw?: Record<string, unknown>;
};

export type AttendanceRecord = {
    id: number;
    session_id: number;
    sessionId?: number;
    enrollment_id: number;
    enrollmentId?: number;
    user_id: number;
    userId?: number;
    status: AttendanceStatus;
    checked_at: string;
    checkedAt?: string;
    raw?: Record<string, unknown>;
};

export type VideoPreview =
    | {
        type: "iframe";
        url: string;
    }
    | {
        type: "video";
        url: string;
    }
    | null;

export type MdtCertificate = {
    id: number;
    course_id: number;
    courseId?: number;
    file_url: string;
    fileUrl?: string;
    file_name: string;
    fileName?: string;
    id_number: string;
    idNumber?: string;
    certificate_type: string;
    certificateType?: string;
    deleted: boolean;
    created_at: string;
    createdAt?: string;
    updated_at: string;
    updatedAt?: string;
};

export type StudentCourseRoom = {
    numericCourseId: number;
    course?: CourseWithImageFields | null;
    selectedCourse?: CourseWithImageFields | null;
    currentCourse?: CourseWithImageFields | null;
    courseData?: CourseWithImageFields | null;

    courseName: string;
    studentInitials: string;

    loading: boolean;
    errorMessage: string;

    activeTab: CourseTab;
    setActiveTab: (tab: CourseTab) => void;

    modules: ModuleView[];
    selectedBlock: LessonBlock | null;

    openModules: Record<number, boolean>;
    openLessons: Record<number, boolean>;

    certificate?: CertificateWithFileFields | null;
    mdtCertificate?: MdtCertificate | null;

    is_mdt?: boolean | number | string | null;
    isMdt?: boolean | number | string | null;
    isMdtCourse?: boolean | number | string | null;

    user?: SessionUserWithRole | null;
    student?: SessionUserWithRole | null;
    profile?: SessionUserWithRole | null;

    refreshAttendance?: () => Promise<unknown>;

    [key: string]: unknown;
};