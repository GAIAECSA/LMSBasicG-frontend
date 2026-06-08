import type { LessonBlock } from "@/services/lessons.service";

export type MdtRequiredFilesPageProps = {
    params:
    | {
        courseId: string;
    }
    | Promise<{
        courseId: string;
    }>;
};

export type AnyRecord = Record<string, unknown>;

export type FormModalState =
    | {
        mode: "create";
    }
    | {
        mode: "edit";
        block: LessonBlock;
    };

export type DeleteModalState = {
    block: LessonBlock;
};

export type VerifyModalState = {
    block: LessonBlock;
};

export type EnrollmentRecord = {
    id?: number | string;
    enrollment_id?: number | string;
    enrollmentId?: number | string;
    student_id?: number | string;
    studentId?: number | string;
    user_id?: number | string;
    userId?: number | string;
    status?: string;
    email?: string;
    correo?: string;
    student?: unknown;
    user?: unknown;
    [key: string]: unknown;
};

export type RequiredFileSubmission = {
    id?: number | string;
    response_id?: number | string;
    responseId?: number | string;
    enrollment_id?: number | string;
    enrollmentId?: number | string;
    lesson_block_id?: number | string;
    lessonBlockId?: number | string;
    student_id?: number | string;
    studentId?: number | string;
    user_id?: number | string;
    userId?: number | string;
    status?: string;
    comment?: string | null;
    submitted_file_url?: string | null;
    submittedFileUrl?: string | null;
    submitted_filename?: string | null;
    submittedFilename?: string | null;
    review_status?: string;
    teacher_status?: string;
    feedback?: string;
    teacher_feedback?: string;
    observations?: string;
    observation?: string;
    score?: number | string | null;
    grade?: number | string | null;
    file_url?: string;
    fileUrl?: string;
    document_url?: string;
    documentUrl?: string;
    submission_file_url?: string;
    submissionFileUrl?: string;
    url?: string;
    attachment_url?: string;
    attachmentUrl?: string;
    attachments?: unknown;
    files?: unknown;
    content?: unknown;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
    submitted_at?: string;
    submittedAt?: string;
    enrollment?: unknown;
    matricula?: unknown;
    student?: unknown;
    student_user?: unknown;
    studentUser?: unknown;
    user?: unknown;
    [key: string]: unknown;
};

export type ReviewFormState = {
    status: string;
    feedback: string;
    score: string;
};

export type StudentFileUploadState = {
    file: File | null;
    comment: string;
};

export type VerificationRow = {
    enrollment: EnrollmentRecord;
    submission: RequiredFileSubmission | null;
};

export type RequiredFileFormState = {
    lessonId: string;
    title: string;
    description: string;
    acceptedFileTypes: string;
    maxFileSizeMb: string;
    file: File | null;
};

export type VerificationSummary = {
    total: number;
    submitted: number;
    pending: number;
    approved: number;
    observed: number;
};
