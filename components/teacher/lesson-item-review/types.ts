import type { Dispatch, SetStateAction } from "react";
import type { Enrollment } from "@/services/enrollments.service";
import type { ForumResponse } from "@/services/forum-response.service";
import type { HomeworkResponse } from "@/services/homework-response.service";
import type { LessonBlock } from "@/services/lessons.service";
import type { QuizzResponseByLessonBlock } from "@/services/quizz-response.service";
import type { SurveyResponse } from "@/services/survey-response.service";

export type LessonItemReviewPageProps = {
    courseId: string;
    itemId: string;
};

export type LessonReviewItemType =
    | "video"
    | "quiz"
    | "text"
    | "image"
    | "pdf"
    | "homework"
    | "survey"
    | "forum"
    | "unknown";

export type ReviewResponse =
    | HomeworkResponse
    | QuizzResponseByLessonBlock
    | SurveyResponse
    | ForumResponse;

export type ReviewStatus =
    | "sin_entrega"
    | "entregado"
    | "calificado"
    | "revisado"
    | "pendiente";

export type ReviewStudentRow = {
    id: string;
    enrollmentId: number;
    userId?: number | null;
    studentName: string;
    studentEmail?: string | null;
    status: ReviewStatus;
    statusLabel: string;
    hasSubmission: boolean;
    responseId?: number | null;
    score?: string | number | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    comment?: string | null;
    raw?: unknown;
};

export type GradeFormState = {
    score: string;
    comment: string;
};

export type LessonItemReviewState = {
    courseId: string;
    itemId: string;
    numericCourseId: number;
    numericItemId: number;
    backHref: string;
    editorHref: string;
    loading: boolean;
    refreshing: boolean;
    savingGrade: boolean;
    error: string;
    block: LessonBlock | null;
    surveyBlocks: LessonBlock[];
    itemType: LessonReviewItemType;
    itemTypeLabel: string;
    title: string;
    enrollments: Enrollment[];
    rows: ReviewStudentRow[];
    selectedEnrollmentId: number | null;
    selectedRow: ReviewStudentRow | null;
    gradeForm: GradeFormState;
    setGradeForm: Dispatch<SetStateAction<GradeFormState>>;
    setSelectedEnrollmentId: (enrollmentId: number | null) => void;
    loadData: (showFeedback?: boolean) => Promise<void>;
    handleRefresh: () => Promise<void>;
    handleSaveGrade: () => Promise<void>;
};
