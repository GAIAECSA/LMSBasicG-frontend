import type { Certificate } from "@/services/certificates.service";
import type { Lesson, LessonBlock } from "@/services/lessons.service";
import type { CourseModule } from "@/services/modules.service";

export type TeacherQuizGradesViewProps = {
    courseId?: string;
    params?: {
        courseId?: string;
    };
};

export type LessonBlockWithType = LessonBlock & {
    block_type_id?: number;
    lesson_block_type?: {
        id?: number;
        key?: string;
    };
};

export type QuizQuestionView = {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    points: number;
};

export type GradeActivityKind = "quiz" | "homework";

export type GradeBlockInfo = {
    module: CourseModule;
    lesson: Lesson;
    block: LessonBlock;
    kind: GradeActivityKind;
};

export type GradeResponseUser = {
    id?: number | string | null;
    firstname?: string | null;
    lastname?: string | null;
    email?: string | null;
};

export type GradeResponseEnrollment = {
    id?: number | string | null;
    user?: GradeResponseUser | null;
};

export type GradeResponse = {
    id: number;
    enrollment_id?: number | string | null;
    enrollmentId?: number | string | null;
    lesson_block_id?: number | string | null;
    lessonBlockId?: number | string | null;
    user_id?: number | string | null;
    userId?: number | string | null;
    quizz?: string | null;
    homework?: string | null;
    response?: string | Record<string, unknown> | null;
    answer?: string | null;
    content?: string | null;
    message?: string | null;
    file_url?: string | null;
    score?: number | string | null;
    grade?: number | string | null;
    is_passed?: boolean | null;
    is_graded?: boolean | null;
    feedback?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    enrollment?: GradeResponseEnrollment | null;
    user?: GradeResponseUser | null;
};

export type GradeRow = {
    kind: GradeActivityKind;
    blockInfo: GradeBlockInfo;
    response: GradeResponse;
};

export type EnrollmentGroup = {
    enrollmentId: number;
    userId: number;
    studentName: string;
    rows: GradeRow[];
    averageScore: number;
    passedCount: number;
    failedCount: number;
    lastDate: string;
    certificate: Certificate | null;
};

export type GroupModalState = {
    group: EnrollmentGroup;
};

export type ServiceModule = Record<string, unknown>;

export type AsyncServiceFunction = (...args: unknown[]) => Promise<unknown>;