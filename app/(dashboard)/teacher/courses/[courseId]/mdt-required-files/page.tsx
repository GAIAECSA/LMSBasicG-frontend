"use client";

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Download,
    Edit3,
    ExternalLink,
    Eye,
    FileCheck2,
    FileText,
    FileUp,
    Loader2,
    MessageSquare,
    Plus,
    RefreshCcw,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    UploadCloud,
    UserRoundCheck,
    X,
    XCircle,
} from "lucide-react";
import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
} from "@/services/api-client.service";
import {
    getModulesByCourse,
    type CourseModule,
} from "@/services/modules.service";
import {
    createLessonBlock,
    deleteLessonBlock,
    getLessonBlocksByLesson,
    getLessonsByModule,
    updateLessonBlock,
    type Lesson,
    type LessonBlock,
    type LessonBlockPayload,
} from "@/services/lessons.service";
import {
    getEnrollmentsByCourseAndRole,
} from "@/services/enrollments.service";
import {
    createHomeworkResponse,
    getHomeworkResponsesByLessonBlock,
    gradeHomeworkResponse,
    updateHomeworkResponse,
} from "@/services/homework-response.service";

type PageProps = {
    params:
    | {
        courseId: string;
    }
    | Promise<{
        courseId: string;
    }>;
};

type AnyRecord = Record<string, unknown>;

type FormModalState =
    | {
        mode: "create";
    }
    | {
        mode: "edit";
        block: LessonBlock;
    };

type DeleteModalState = {
    block: LessonBlock;
};

type VerifyModalState = {
    block: LessonBlock;
};

type EnrollmentRecord = {
    id?: number | string;
    enrollment_id?: number | string;
    student_id?: number | string;
    user_id?: number | string;
    status?: string;
    student?: unknown;
    user?: unknown;
    [key: string]: unknown;
};

type RequiredFileSubmission = {
    id?: number | string;
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
    score?: number | string | null;
    grade?: number | string | null;
    file_url?: string;
    fileUrl?: string;
    content?: unknown;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
    [key: string]: unknown;
};

type ReviewFormState = {
    status: string;
    feedback: string;
    score: string;
};

type StudentFileUploadState = {
    file: File | null;
    comment: string;
};

type VerificationRow = {
    enrollment: EnrollmentRecord;
    submission: RequiredFileSubmission | null;
};

type RequiredFileFormState = {
    lessonId: string;
    title: string;
    description: string;
    acceptedFileTypes: string;
    maxFileSizeMb: string;
    file: File | null;
};

const REQUIRED_FILE_BLOCK_TYPE_ID = 6;

const REVIEW_STATUS_OPTIONS = [
    {
        value: "pending",
        label: "Pendiente",
    },
    {
        value: "approved",
        label: "Aprobado",
    },
    {
        value: "observed",
        label: "Observado",
    },
    {
        value: "rejected",
        label: "Rechazado",
    },
];

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AnyRecord;
}

function cleanText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

function readNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function readBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}

function normalizeSearch(value: unknown) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getValue(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        const value = currentRecord[key];

        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return value;
        }
    }

    return null;
}

function getContentRecord(value: unknown): AnyRecord {
    if (!value) return {};

    if (typeof value === "object" && !Array.isArray(value)) {
        return value as AnyRecord;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return parsed as AnyRecord;
            }
        } catch {
            return {};
        }
    }

    return {};
}

function getApiOrigin() {
    const fallbackUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const cleanApiUrl = String(API_URL || fallbackUrl)
        .trim()
        .replace(/\/+$/, "");

    if (cleanApiUrl.endsWith("/api/v1")) {
        return cleanApiUrl.replace(/\/api\/v1$/, "");
    }

    return cleanApiUrl;
}

function buildFileUrl(fileUrl: string | null | undefined) {
    const cleanUrl = cleanText(fileUrl);

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("blob:") ||
        cleanUrl.startsWith("data:")
    ) {
        return cleanUrl;
    }

    const apiOrigin = getApiOrigin();

    if (!apiOrigin) return cleanUrl;

    if (cleanUrl.startsWith("/")) {
        return `${apiOrigin}${cleanUrl}`;
    }

    return `${apiOrigin}/${cleanUrl}`;
}

function normalizeApiArray<T>(data: unknown, keys: string[] = []): T[] {
    if (Array.isArray(data)) return data as T[];

    const record = toRecord(data);

    if (!record) return [];

    const defaultKeys = [
        ...keys,
        "data",
        "items",
        "results",
        "records",
        "enrollments",
        "homework_responses",
        "homeworkResponses",
        "responses",
        "submissions",
    ];

    for (const key of defaultKeys) {
        const value = record[key];

        if (Array.isArray(value)) return value as T[];
    }

    return [];
}

async function fetchJsonCandidates<T>(
    urls: string[],
    options?: RequestInit,
): Promise<T> {
    let lastError: unknown = null;

    for (const url of urls) {
        try {
            const response = await fetch(url, {
                ...options,
                cache: "no-store",
            });

            if (!response.ok) {
                lastError = new Error(
                    `Servicio no disponible (${response.status})`,
                );
                continue;
            }

            return handleApiResponse<T>(response);
        } catch (currentError) {
            lastError = currentError;
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("No se pudo conectar con el servicio.");
}

function getFirstNestedRecord(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        const value = toRecord(currentRecord[key]);

        if (value) return value;
    }

    return null;
}

function getPersonName(record: unknown) {
    const person = toRecord(record);

    if (!person) return "";

    const firstName =
        cleanText(person.first_name) ||
        cleanText(person.firstName) ||
        cleanText(person.nombres) ||
        cleanText(person.name);

    const lastName =
        cleanText(person.last_name) ||
        cleanText(person.lastName) ||
        cleanText(person.apellidos) ||
        cleanText(person.lastname);

    const fullName =
        cleanText(person.full_name) ||
        cleanText(person.fullName) ||
        cleanText(person.nombre_completo) ||
        cleanText(person.display_name) ||
        cleanText(person.displayName);

    if (fullName) return fullName;

    return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function getStudentRecord(enrollment: EnrollmentRecord) {
    return (
        getFirstNestedRecord(enrollment, [
            "student",
            "student_user",
            "studentUser",
            "user",
            "profile",
            "participant",
        ]) ?? toRecord(enrollment)
    );
}

function getEnrollmentId(enrollment: EnrollmentRecord) {
    return (
        readNumber(enrollment.id, 0) ||
        readNumber(enrollment.enrollment_id, 0) ||
        readNumber(enrollment.enrollmentId, 0)
    );
}

function getEnrollmentStudentId(enrollment: EnrollmentRecord) {
    const studentRecord = getStudentRecord(enrollment);

    return (
        readNumber(enrollment.student_id, 0) ||
        readNumber(enrollment.studentId, 0) ||
        readNumber(enrollment.user_id, 0) ||
        readNumber(enrollment.userId, 0) ||
        readNumber(studentRecord?.id, 0) ||
        readNumber(studentRecord?.student_id, 0) ||
        readNumber(studentRecord?.user_id, 0)
    );
}

function getStudentName(enrollment: EnrollmentRecord) {
    const studentRecord = getStudentRecord(enrollment);
    const studentName = getPersonName(studentRecord);

    if (studentName) return studentName;

    const enrollmentId = getEnrollmentId(enrollment);

    return enrollmentId
        ? `Estudiante matrícula #${enrollmentId}`
        : "Estudiante sin identificar";
}

function getStudentEmail(enrollment: EnrollmentRecord) {
    const studentRecord = getStudentRecord(enrollment);

    return (
        cleanText(studentRecord?.email) ||
        cleanText(studentRecord?.correo) ||
        cleanText(studentRecord?.username) ||
        cleanText(enrollment.email) ||
        cleanText(enrollment.correo) ||
        "Sin correo"
    );
}

function getEnrollmentStatus(enrollment: EnrollmentRecord) {
    return (
        cleanText(enrollment.status) ||
        cleanText(enrollment.enrollment_status) ||
        cleanText(enrollment.enrollmentStatus) ||
        "matriculado"
    );
}

function getSubmissionId(submission: RequiredFileSubmission | null) {
    if (!submission) return 0;

    return (
        readNumber(submission.id, 0) ||
        readNumber(submission.response_id, 0) ||
        readNumber(submission.responseId, 0)
    );
}

function getSubmissionEnrollmentId(submission: RequiredFileSubmission | null) {
    if (!submission) return 0;

    const enrollmentRecord = getFirstNestedRecord(submission, [
        "enrollment",
        "matricula",
    ]);

    return (
        readNumber(submission.enrollment_id, 0) ||
        readNumber(submission.enrollmentId, 0) ||
        readNumber(enrollmentRecord?.id, 0) ||
        readNumber(enrollmentRecord?.enrollment_id, 0)
    );
}

function getSubmissionStudentId(submission: RequiredFileSubmission | null) {
    if (!submission) return 0;

    const studentRecord = getFirstNestedRecord(submission, [
        "student",
        "student_user",
        "studentUser",
        "user",
    ]);

    return (
        readNumber(submission.student_id, 0) ||
        readNumber(submission.studentId, 0) ||
        readNumber(submission.user_id, 0) ||
        readNumber(submission.userId, 0) ||
        readNumber(studentRecord?.id, 0) ||
        readNumber(studentRecord?.student_id, 0) ||
        readNumber(studentRecord?.user_id, 0)
    );
}

function getSubmissionForEnrollment(
    enrollment: EnrollmentRecord,
    submissions: RequiredFileSubmission[],
) {
    const enrollmentId = getEnrollmentId(enrollment);
    const studentId = getEnrollmentStudentId(enrollment);

    return (
        submissions.find((submission) => {
            const submissionEnrollmentId =
                getSubmissionEnrollmentId(submission);

            return (
                enrollmentId > 0 &&
                submissionEnrollmentId > 0 &&
                enrollmentId === submissionEnrollmentId
            );
        }) ??
        submissions.find((submission) => {
            const submissionStudentId = getSubmissionStudentId(submission);

            return (
                studentId > 0 &&
                submissionStudentId > 0 &&
                studentId === submissionStudentId
            );
        }) ??
        null
    );
}

function getFirstUrlFromArray(value: unknown) {
    if (!Array.isArray(value)) return "";

    for (const item of value) {
        if (typeof item === "string") {
            const url = buildFileUrl(item);

            if (url) return url;
        }

        const record = toRecord(item);

        if (!record) continue;

        const url = buildFileUrl(
            cleanText(record.file_url) ||
            cleanText(record.fileUrl) ||
            cleanText(record.url) ||
            cleanText(record.path) ||
            cleanText(record.attachment_url) ||
            cleanText(record.attachmentUrl),
        );

        if (url) return url;
    }

    return "";
}

function getSubmissionFileUrl(submission: RequiredFileSubmission | null) {
    if (!submission) return "";

    const content = getContentRecord(submission.content);

    return (
        buildFileUrl(
            cleanText(submission.submitted_file_url) ||
            cleanText(submission.submittedFileUrl) ||
            cleanText(submission.file_url) ||
            cleanText(submission.fileUrl) ||
            cleanText(submission.document_url) ||
            cleanText(submission.documentUrl) ||
            cleanText(submission.submission_file_url) ||
            cleanText(submission.submissionFileUrl) ||
            cleanText(submission.url) ||
            cleanText(submission.attachment_url) ||
            cleanText(submission.attachmentUrl) ||
            cleanText(content.file_url) ||
            cleanText(content.fileUrl) ||
            cleanText(content.document_url) ||
            cleanText(content.documentUrl) ||
            cleanText(content.submission_file_url) ||
            cleanText(content.submissionFileUrl) ||
            cleanText(content.url) ||
            cleanText(content.attachment_url) ||
            cleanText(content.attachmentUrl),
        ) ||
        getFirstUrlFromArray(submission.attachments) ||
        getFirstUrlFromArray(submission.files) ||
        getFirstUrlFromArray(content.attachments) ||
        getFirstUrlFromArray(content.files)
    );
}

function getSubmissionFileName(submission: RequiredFileSubmission | null) {
    if (!submission) return "";

    const content = getContentRecord(submission.content);
    const fileUrl = getSubmissionFileUrl(submission);

    return (
        cleanText(submission.submitted_filename) ||
        cleanText(submission.submittedFilename) ||
        cleanText(submission.file_name) ||
        cleanText(submission.fileName) ||
        cleanText(submission.original_name) ||
        cleanText(submission.originalName) ||
        cleanText(content.file_name) ||
        cleanText(content.fileName) ||
        cleanText(content.original_name) ||
        cleanText(content.originalName) ||
        decodeURIComponent(fileUrl.split("/").pop() || "")
    );
}

function getSubmissionStatus(submission: RequiredFileSubmission | null) {
    if (!submission) return "pending";

    const content = getContentRecord(submission.content);

    const rawStatus = normalizeSearch(
        cleanText(submission.review_status) ||
        cleanText(submission.teacher_status) ||
        cleanText(submission.status) ||
        cleanText(content.review_status) ||
        cleanText(content.teacher_status) ||
        cleanText(content.status),
    );

    if (
        [
            "approved",
            "aprobado",
            "accepted",
            "accept",
            "validado",
            "verificado",
        ].includes(rawStatus)
    ) {
        return "approved";
    }

    if (
        [
            "rejected",
            "rechazado",
            "denied",
            "observado rechazada",
            "no aprobado",
        ].includes(rawStatus)
    ) {
        return "rejected";
    }

    if (
        ["observed", "observado", "corregir", "revision", "en revision"].includes(
            rawStatus,
        )
    ) {
        return "observed";
    }

    return "pending";
}

function getSubmissionFeedback(submission: RequiredFileSubmission | null) {
    if (!submission) return "";

    const content = getContentRecord(submission.content);

    return (
        cleanText(submission.teacher_feedback) ||
        cleanText(submission.feedback) ||
        cleanText(submission.comment) ||
        cleanText(submission.observations) ||
        cleanText(submission.observation) ||
        cleanText(content.teacher_feedback) ||
        cleanText(content.feedback) ||
        cleanText(content.observations) ||
        cleanText(content.observation)
    );
}

function getSubmissionScore(submission: RequiredFileSubmission | null) {
    if (!submission) return "";

    const content = getContentRecord(submission.content);

    const score =
        cleanText(submission.score) ||
        cleanText(submission.grade) ||
        cleanText(content.score) ||
        cleanText(content.grade);

    return score;
}

function getSubmissionDate(submission: RequiredFileSubmission | null) {
    if (!submission) return null;

    return getValue(submission, [
        "submitted_at",
        "submittedAt",
        "updated_at",
        "updatedAt",
        "created_at",
        "createdAt",
    ]);
}

function getStatusLabel(status: string) {
    const normalized = getSubmissionStatus({ status });

    return (
        REVIEW_STATUS_OPTIONS.find((option) => option.value === normalized)
            ?.label ?? "Pendiente"
    );
}

function getStatusBadgeClass(status: string) {
    const normalized = getSubmissionStatus({ status });

    if (normalized === "approved") {
        return "bg-emerald-50 text-emerald-700";
    }

    if (normalized === "rejected") {
        return "bg-red-50 text-red-700";
    }

    if (normalized === "observed") {
        return "bg-amber-50 text-amber-700";
    }

    return "bg-slate-100 text-slate-700";
}

function getReviewInitialForm(submission: RequiredFileSubmission | null) {
    return {
        status: getSubmissionStatus(submission),
        feedback: getSubmissionFeedback(submission),
        score: getSubmissionScore(submission),
    };
}

function getUploadRowKey(row: VerificationRow) {
    const enrollmentId = getEnrollmentId(row.enrollment);
    const studentId = getEnrollmentStudentId(row.enrollment);
    const submissionId = getSubmissionId(row.submission);

    if (submissionId) return `submission-${submissionId}`;
    if (enrollmentId) return `enrollment-${enrollmentId}`;
    if (studentId) return `student-${studentId}`;

    return `row-${getStudentName(row.enrollment)}`;
}

function getEmptyUploadForm(): StudentFileUploadState {
    return {
        file: null,
        comment: "",
    };
}

function formatDate(value: unknown) {
    const cleanDate = cleanText(value);

    if (!cleanDate) return "Sin fecha";

    const date = new Date(cleanDate);

    if (Number.isNaN(date.getTime())) return "Sin fecha";

    return new Intl.DateTimeFormat("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getBlockTitle(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.title) ||
        cleanText(content.name) ||
        cleanText(content.label) ||
        cleanText(content.titulo) ||
        `Archivo obligatorio #${block.id}`
    );
}

function getBlockDescription(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.description) ||
        cleanText(content.instructions) ||
        cleanText(content.descripcion) ||
        "Documento requerido para completar el proceso asociado al curso."
    );
}

function getBlockAcceptedTypes(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.accepted_file_types) ||
        cleanText(content.acceptedFileTypes) ||
        cleanText(content.accept) ||
        cleanText(content.file_types) ||
        cleanText(content.fileTypes)
    );
}

function getBlockMaxFileSize(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.max_file_size_mb) ||
        cleanText(content.maxFileSizeMb) ||
        cleanText(content.max_size_mb) ||
        cleanText(content.maxSizeMb)
    );
}

function getBlockTemplateUrl(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return buildFileUrl(
        cleanText(content.template_url) ||
        cleanText(content.templateUrl) ||
        cleanText(content.file_url) ||
        cleanText(content.fileUrl) ||
        cleanText(content.url) ||
        cleanText(content.attachment_url),
    );
}

function getBlockFileName(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.file_name) ||
        cleanText(content.fileName) ||
        cleanText(content.original_name) ||
        cleanText(content.originalName) ||
        ""
    );
}

function getBlockTypeId(block: LessonBlock) {
    const content = getContentRecord(block.content);
    const lessonBlockType = toRecord(block.lesson_block_type);

    return (
        readNumber(block.block_type_id, 0) ||
        readNumber(lessonBlockType?.id, 0) ||
        readNumber(content.block_type_id, 0) ||
        readNumber(content.blockTypeId, 0) ||
        readNumber(content.lesson_block_type_id, 0) ||
        readNumber(content.lessonBlockTypeId, 0)
    );
}

function isRequiredFileBlock(block: LessonBlock) {
    const content = getContentRecord(block.content);

    const isActive = readBoolean(
        block.is_active ?? content.is_active ?? content.isActive,
        true,
    );

    const deleted = readBoolean(block.deleted ?? content.deleted, false);

    return (
        getBlockTypeId(block) === REQUIRED_FILE_BLOCK_TYPE_ID &&
        isActive &&
        !deleted
    );
}

function sortByOrder<
    T extends { id: number | string; order?: number | string | null },
>(items: T[]) {
    return [...items].sort((a, b) => {
        const orderA = readNumber(a.order, 0);
        const orderB = readNumber(b.order, 0);

        if (orderA !== orderB) return orderA - orderB;

        return Number(a.id) - Number(b.id);
    });
}

function mergeBlocks(blocks: LessonBlock[]) {
    const unique = new Map<number, LessonBlock>();

    for (const block of blocks) {
        const blockId = readNumber(block.id, 0);

        if (!blockId) continue;

        unique.set(blockId, block);
    }

    return sortByOrder([...unique.values()]);
}

function getLessonName(lessons: Lesson[], lessonId: number) {
    const lesson = lessons.find((item) => Number(item.id) === Number(lessonId));

    if (lesson?.name) return lesson.name;

    return lessonId ? `Lección #${lessonId}` : "Sin lección";
}

function getNextOrder(blocks: LessonBlock[], lessonId: number) {
    const lessonBlocks = blocks.filter(
        (block) => Number(block.lesson_id) === Number(lessonId),
    );

    if (lessonBlocks.length === 0) return 1;

    return (
        Math.max(...lessonBlocks.map((block) => readNumber(block.order, 0))) + 1
    );
}

function getEmptyFormState(lessonId = ""): RequiredFileFormState {
    return {
        lessonId,
        title: "",
        description: "",
        acceptedFileTypes: ".pdf,.jpg,.jpeg,.png,.webp",
        maxFileSizeMb: "10",
        file: null,
    };
}

async function getDefaultLessonBlocksByCourseAndBlockType(
    courseId: number,
    blockTypeId: number,
): Promise<LessonBlock[]> {
    const validCourseId = readNumber(courseId, 0);
    const validBlockTypeId = readNumber(blockTypeId, 0);

    if (!validCourseId || !validBlockTypeId) return [];

    const params = new URLSearchParams({
        block_type_id: String(validBlockTypeId),
        course_id: String(validCourseId),
    });

    const response = await fetch(
        `${getApiOrigin()}/api/v1/lesson-blocks/lesson-blocks/default/?${params.toString()}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<LessonBlock[]>(response);

    return Array.isArray(data) ? data : [];
}

function buildRequiredFilePayload(params: {
    lessonId: number;
    title: string;
    description: string;
    acceptedFileTypes: string;
    maxFileSizeMb: string;
    order: number;
    block?: LessonBlock;
    file?: File | null;
}): LessonBlockPayload {
    const previousContent = getContentRecord(params.block?.content);

    return {
        lesson_id: params.lessonId,
        block_type_id: REQUIRED_FILE_BLOCK_TYPE_ID,
        completion_type: "SUBIR",
        completion_value: params.block?.completion_value ?? 10,
        order: params.order,
        default: params.block?.default ?? false,
        counts_toward_grade: true,
        is_active: true,
        date_available:
            params.block?.date_available ?? new Date().toISOString(),
        file: params.file ?? null,
        content: {
            ...previousContent,
            type: "homework",
            itemType: "homework",
            block_type_id: REQUIRED_FILE_BLOCK_TYPE_ID,
            lesson_block_type_id: REQUIRED_FILE_BLOCK_TYPE_ID,
            default: params.block?.default ?? false,
            is_required: true,
            required: true,
            is_active: true,
            mdt_required_file: true,
            mdtRequiredFile: true,
            required_file: true,
            requiredFile: true,
            title: params.title,
            name: params.title,
            label: params.title,
            description: params.description,
            instructions: params.description,
            accepted_file_types: params.acceptedFileTypes,
            acceptedFileTypes: params.acceptedFileTypes,
            file_types: params.acceptedFileTypes,
            fileTypes: params.acceptedFileTypes,
            max_file_size_mb: params.maxFileSizeMb,
            maxFileSizeMb: params.maxFileSizeMb,
            max_size_mb: params.maxFileSizeMb,
            maxSizeMb: params.maxFileSizeMb,
            max_score: readNumber(previousContent.max_score, 10),
            attachments: Array.isArray(previousContent.attachments)
                ? previousContent.attachments
                : [],
        },
    };
}

async function createRequiredFileBlock(payload: {
    lessonId: number;
    title: string;
    description: string;
    acceptedFileTypes: string;
    maxFileSizeMb: string;
    order: number;
    file: File | null;
}) {
    return createLessonBlock(
        buildRequiredFilePayload({
            lessonId: payload.lessonId,
            title: payload.title,
            description: payload.description,
            acceptedFileTypes: payload.acceptedFileTypes,
            maxFileSizeMb: payload.maxFileSizeMb,
            order: payload.order,
            file: payload.file,
        }),
    );
}

async function updateRequiredFileBlock(payload: {
    block: LessonBlock;
    lessonId: number;
    title: string;
    description: string;
    acceptedFileTypes: string;
    maxFileSizeMb: string;
    order: number;
    file: File | null;
}) {
    return updateLessonBlock(
        payload.block.id,
        buildRequiredFilePayload({
            lessonId: payload.lessonId,
            title: payload.title,
            description: payload.description,
            acceptedFileTypes: payload.acceptedFileTypes,
            maxFileSizeMb: payload.maxFileSizeMb,
            order: payload.order,
            block: payload.block,
            file: payload.file,
        }),
    );
}

function mapReviewStatusToHomeworkStatus(status: string) {
    const normalized = getSubmissionStatus({ status });

    if (normalized === "approved") return "APROBADO";
    if (normalized === "rejected") return "RECHAZADO";
    if (normalized === "observed") return "OBSERVADO";

    return "PENDIENTE";
}

async function getCourseEnrollmentsForVerification(
    courseId: number,
): Promise<EnrollmentRecord[]> {
    const validCourseId = readNumber(courseId, 0);

    if (!validCourseId) return [];

    const data = await getEnrollmentsByCourseAndRole(validCourseId, 4);

    return Array.isArray(data)
        ? data
            .filter((item) => {
                const courseRecord = toRecord(item.course);
                const roleRecord = toRecord(item.role);
                const courseMatches =
                    readNumber(courseRecord?.id, validCourseId) ===
                    validCourseId;
                const isStudent = readNumber(roleRecord?.id, 4) === 4;
                const isAccepted = item.accepted === true;

                return courseMatches && isStudent && isAccepted;
            })
            .map((item) => item as unknown as EnrollmentRecord)
        : [];
}

async function getRequiredFileSubmissionsByBlock(
    blockId: number,
): Promise<RequiredFileSubmission[]> {
    const validBlockId = readNumber(blockId, 0);

    if (!validBlockId) return [];

    const data = await getHomeworkResponsesByLessonBlock(validBlockId);

    return Array.isArray(data)
        ? data.map((item) => item as unknown as RequiredFileSubmission)
        : [];
}

async function updateRequiredFileSubmissionReview(
    submission: RequiredFileSubmission,
    form: ReviewFormState,
): Promise<RequiredFileSubmission> {
    const submissionId = getSubmissionId(submission);

    if (!submissionId) {
        throw new Error("No se encontró el identificador de la entrega.");
    }

    const numericScore =
        form.score.trim() === "" ? null : Number(form.score.trim());

    const status = mapReviewStatusToHomeworkStatus(form.status);
    const comment = form.feedback.trim();

    if (Number.isFinite(numericScore)) {
        const updated = await gradeHomeworkResponse(submissionId, {
            score: numericScore as number,
            comment,
            status,
        });

        return updated as unknown as RequiredFileSubmission;
    }

    const updated = await updateHomeworkResponse(submissionId, {
        comment,
        status,
    });

    return updated as unknown as RequiredFileSubmission;
}

export default function MdtRequiredFilesPage({ params }: PageProps) {
    const [courseId, setCourseId] = useState(0);

    const [modules, setModules] = useState<CourseModule[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [blocks, setBlocks] = useState<LessonBlock[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [verificationSearch, setVerificationSearch] = useState("");
    const [formModal, setFormModal] = useState<FormModalState | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(
        null,
    );
    const [verifyModal, setVerifyModal] = useState<VerifyModalState | null>(
        null,
    );

    const [formState, setFormState] = useState<RequiredFileFormState>(
        getEmptyFormState(),
    );
    const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
    const [submissions, setSubmissions] = useState<RequiredFileSubmission[]>(
        [],
    );
    const [reviewForms, setReviewForms] = useState<
        Record<string, ReviewFormState>
    >({});

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingVerifications, setIsLoadingVerifications] =
        useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savingReviewId, setSavingReviewId] = useState(0);
    const [savingUploadKey, setSavingUploadKey] = useState("");
    const [uploadForms, setUploadForms] = useState<
        Record<string, StudentFileUploadState>
    >({});
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        void Promise.resolve(params).then((value) => {
            if (!isMounted) return;

            setCourseId(readNumber(value.courseId, 0));
        });

        return () => {
            isMounted = false;
        };
    }, [params]);

    const requiredBlocks = useMemo(
        () => blocks.filter(isRequiredFileBlock),
        [blocks],
    );

    const filteredBlocks = useMemo(() => {
        const query = normalizeSearch(searchTerm);

        if (!query) return requiredBlocks;

        return requiredBlocks.filter((block) => {
            const title = normalizeSearch(getBlockTitle(block));
            const description = normalizeSearch(getBlockDescription(block));
            const lessonName = normalizeSearch(
                getLessonName(lessons, block.lesson_id),
            );
            const acceptedTypes = normalizeSearch(getBlockAcceptedTypes(block));

            return (
                title.includes(query) ||
                description.includes(query) ||
                lessonName.includes(query) ||
                acceptedTypes.includes(query)
            );
        });
    }, [lessons, requiredBlocks, searchTerm]);

    const verificationRows = useMemo<VerificationRow[]>(() => {
        if (!verifyModal) return [];

        const rows = enrollments.map((enrollment) => ({
            enrollment,
            submission: getSubmissionForEnrollment(enrollment, submissions),
        }));

        const query = normalizeSearch(verificationSearch);

        if (!query) return rows;

        return rows.filter((row) => {
            const studentName = normalizeSearch(
                getStudentName(row.enrollment),
            );
            const studentEmail = normalizeSearch(
                getStudentEmail(row.enrollment),
            );
            const status = normalizeSearch(
                getStatusLabel(getSubmissionStatus(row.submission)),
            );
            const fileName = normalizeSearch(
                getSubmissionFileName(row.submission),
            );

            return (
                studentName.includes(query) ||
                studentEmail.includes(query) ||
                status.includes(query) ||
                fileName.includes(query)
            );
        });
    }, [enrollments, submissions, verificationSearch, verifyModal]);

    const verificationSummary = useMemo(() => {
        const allRows = enrollments.map((enrollment) => ({
            enrollment,
            submission: getSubmissionForEnrollment(enrollment, submissions),
        }));

        const submitted = allRows.filter((row) =>
            Boolean(getSubmissionFileUrl(row.submission)),
        ).length;

        const approved = allRows.filter(
            (row) => getSubmissionStatus(row.submission) === "approved",
        ).length;

        const observed = allRows.filter((row) =>
            ["observed", "rejected"].includes(
                getSubmissionStatus(row.submission),
            ),
        ).length;

        return {
            total: allRows.length,
            submitted,
            pending: Math.max(allRows.length - submitted, 0),
            approved,
            observed,
        };
    }, [enrollments, submissions]);

    const firstLessonId = lessons[0] ? String(lessons[0].id) : "";

    const selectedLessonName = useMemo(() => {
        const lessonId = Number(formState.lessonId);

        if (!lessonId) return "Sin lección seleccionada";

        return getLessonName(lessons, lessonId);
    }, [formState.lessonId, lessons]);

    const hasCurrentLessonInOptions = useMemo(() => {
        if (!formState.lessonId) return true;

        return lessons.some(
            (lesson) => Number(lesson.id) === Number(formState.lessonId),
        );
    }, [formState.lessonId, lessons]);

    const loadData = useCallback(
        async (clearFeedback = true) => {
            if (!courseId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                if (clearFeedback) {
                    setError("");
                    setMessage("");
                }

                const defaultBlocks =
                    await getDefaultLessonBlocksByCourseAndBlockType(
                        courseId,
                        REQUIRED_FILE_BLOCK_TYPE_ID,
                    );

                let moduleItems: CourseModule[] = [];
                let lessonItems: Lesson[] = [];
                let lessonBlockItems: LessonBlock[] = [];

                try {
                    moduleItems = await getModulesByCourse(courseId);

                    const sortedModuleItems = sortByOrder(moduleItems);

                    lessonItems = (
                        await Promise.all(
                            sortedModuleItems.map((moduleItem) =>
                                getLessonsByModule(Number(moduleItem.id)),
                            ),
                        )
                    ).flat();

                    const sortedLessonItems = sortByOrder(lessonItems);

                    lessonBlockItems = (
                        await Promise.all(
                            sortedLessonItems.map((lessonItem) =>
                                getLessonBlocksByLesson(Number(lessonItem.id)),
                            ),
                        )
                    ).flat();

                    moduleItems = sortedModuleItems;
                    lessonItems = sortedLessonItems;
                } catch {
                    moduleItems = [];
                    lessonItems = [];
                    lessonBlockItems = [];
                }

                const mergedBlocks = mergeBlocks([
                    ...defaultBlocks,
                    ...lessonBlockItems,
                ]);

                setModules(sortByOrder(moduleItems));
                setLessons(sortByOrder(lessonItems));
                setBlocks(mergedBlocks);

                setFormState((current) => {
                    if (
                        current.lessonId &&
                        lessonItems.some(
                            (lesson) =>
                                Number(lesson.id) ===
                                Number(current.lessonId),
                        )
                    ) {
                        return current;
                    }

                    const firstLesson = lessonItems[0];

                    return {
                        ...current,
                        lessonId: firstLesson ? String(firstLesson.id) : "",
                    };
                });
            } catch (currentError) {
                setError(
                    currentError instanceof Error
                        ? currentError.message
                        : "No se pudo cargar la información de archivos MDT.",
                );

                setModules([]);
                setLessons([]);
                setBlocks([]);
            } finally {
                setIsLoading(false);
            }
        },
        [courseId],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadData(true);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadData]);

    useEffect(() => {
        if (!formModal && !deleteModal && !verifyModal) return;

        function closeWithEscape(event: KeyboardEvent) {
            if (event.key !== "Escape" || isSaving || savingReviewId) return;

            setFormModal(null);
            setDeleteModal(null);
            setVerifyModal(null);
        }

        document.addEventListener("keydown", closeWithEscape);

        return () => {
            document.removeEventListener("keydown", closeWithEscape);
        };
    }, [deleteModal, formModal, isSaving, savingReviewId, verifyModal]);

    function openCreateModal() {
        setError("");
        setMessage("");
        setFormState(getEmptyFormState(formState.lessonId || firstLessonId));
        setFormModal({ mode: "create" });
    }

    function openEditModal(block: LessonBlock) {
        setError("");
        setMessage("");

        setFormState({
            lessonId: String(block.lesson_id || ""),
            title: getBlockTitle(block),
            description: getBlockDescription(block),
            acceptedFileTypes:
                getBlockAcceptedTypes(block) || ".pdf,.jpg,.jpeg,.png,.webp",
            maxFileSizeMb: getBlockMaxFileSize(block) || "10",
            file: null,
        });

        setFormModal({
            mode: "edit",
            block,
        });
    }

    function closeFormModal() {
        if (isSaving) return;

        setFormModal(null);
        setFormState(getEmptyFormState(firstLessonId));
    }

    function openDeleteModal(block: LessonBlock) {
        setError("");
        setMessage("");
        setDeleteModal({ block });
    }

    function closeDeleteModal() {
        if (isSaving) return;

        setDeleteModal(null);
    }

    async function loadVerificationData(block: LessonBlock) {
        const blockId = readNumber(block.id, 0);

        if (!courseId || !blockId) {
            setError("No se pudo identificar el curso o el archivo requerido.");
            return;
        }

        try {
            setIsLoadingVerifications(true);
            setError("");

            const [enrollmentItems, submissionItems] = await Promise.all([
                getCourseEnrollmentsForVerification(courseId),
                getRequiredFileSubmissionsByBlock(blockId),
            ]);

            setEnrollments(enrollmentItems);
            setSubmissions(submissionItems);

            const nextForms: Record<string, ReviewFormState> = {};

            for (const submission of submissionItems) {
                const submissionId = getSubmissionId(submission);

                if (!submissionId) continue;

                nextForms[String(submissionId)] =
                    getReviewInitialForm(submission);
            }

            setReviewForms(nextForms);
            setUploadForms({});
        } catch (currentError) {
            setEnrollments([]);
            setSubmissions([]);
            setReviewForms({});
            setUploadForms({});

            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudieron cargar los documentos enviados por los estudiantes.",
            );
        } finally {
            setIsLoadingVerifications(false);
        }
    }

    function openVerifyModal(block: LessonBlock) {
        setError("");
        setMessage("");
        setVerificationSearch("");
        setVerifyModal({ block });
        setEnrollments([]);
        setSubmissions([]);
        setReviewForms({});
        setUploadForms({});
        setSavingUploadKey("");

        void loadVerificationData(block);
    }

    function closeVerifyModal() {
        if (isLoadingVerifications || savingReviewId || savingUploadKey) return;

        setVerifyModal(null);
        setVerificationSearch("");
        setEnrollments([]);
        setSubmissions([]);
        setReviewForms({});
        setUploadForms({});
        setSavingUploadKey("");
    }

    function updateReviewForm(
        submission: RequiredFileSubmission,
        updates: Partial<ReviewFormState>,
    ) {
        const submissionId = getSubmissionId(submission);

        if (!submissionId) return;

        setReviewForms((current) => ({
            ...current,
            [String(submissionId)]: {
                ...getReviewInitialForm(submission),
                ...current[String(submissionId)],
                ...updates,
            },
        }));
    }

    function updateUploadForm(
        row: VerificationRow,
        updates: Partial<StudentFileUploadState>,
    ) {
        const rowKey = getUploadRowKey(row);

        setUploadForms((current) => ({
            ...current,
            [rowKey]: {
                ...getEmptyUploadForm(),
                ...current[rowKey],
                ...updates,
            },
        }));
    }

    function clearUploadForm(row: VerificationRow) {
        const rowKey = getUploadRowKey(row);

        setUploadForms((current) => {
            const next = { ...current };

            delete next[rowKey];

            return next;
        });
    }

    async function handleUploadStudentFile(row: VerificationRow) {
        const rowKey = getUploadRowKey(row);
        const uploadForm = uploadForms[rowKey] ?? getEmptyUploadForm();
        const selectedFile = uploadForm.file;
        const enrollmentId = getEnrollmentId(row.enrollment);
        const blockId = readNumber(verifyModal?.block.id, 0);
        const submissionId = getSubmissionId(row.submission);

        if (!selectedFile) {
            setError("Selecciona el archivo que deseas subir o actualizar.");
            return;
        }

        if (!enrollmentId) {
            setError("No se encontró la matrícula del estudiante.");
            return;
        }

        if (!blockId) {
            setError("No se encontró el archivo obligatorio seleccionado.");
            return;
        }

        try {
            setSavingUploadKey(rowKey);
            setError("");
            setMessage("");

            if (submissionId && row.submission) {
                const currentForm =
                    reviewForms[String(submissionId)] ??
                    getReviewInitialForm(row.submission);

                const updated = await updateHomeworkResponse(submissionId, {
                    file: selectedFile,
                    comment:
                        uploadForm.comment.trim() ||
                        currentForm.feedback.trim() ||
                        getSubmissionFeedback(row.submission),
                    status: mapReviewStatusToHomeworkStatus(
                        currentForm.status,
                    ),
                });

                const updatedSubmission =
                    updated as unknown as RequiredFileSubmission;

                setSubmissions((current) =>
                    current.map((item) =>
                        getSubmissionId(item) === submissionId
                            ? {
                                ...item,
                                ...updatedSubmission,
                            }
                            : item,
                    ),
                );

                setMessage("Archivo del estudiante actualizado correctamente.");
            } else {
                const created = await createHomeworkResponse({
                    enrollment_id: enrollmentId,
                    lesson_block_id: blockId,
                    comment: uploadForm.comment.trim(),
                    file: selectedFile,
                });

                const createdSubmission =
                    created as unknown as RequiredFileSubmission;
                const createdSubmissionId = getSubmissionId(createdSubmission);

                setSubmissions((current) => {
                    const withoutDuplicates = current.filter((item) => {
                        const sameEnrollment =
                            getSubmissionEnrollmentId(item) === enrollmentId;
                        const sameBlock =
                            readNumber(item.lesson_block_id, 0) === blockId ||
                            readNumber(item.lessonBlockId, 0) === blockId;

                        return !(sameEnrollment && sameBlock);
                    });

                    return [...withoutDuplicates, createdSubmission];
                });

                if (createdSubmissionId) {
                    setReviewForms((current) => ({
                        ...current,
                        [String(createdSubmissionId)]:
                            getReviewInitialForm(createdSubmission),
                    }));
                }

                setMessage("Archivo faltante subido correctamente.");
            }

            clearUploadForm(row);
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo subir o actualizar el archivo del estudiante.",
            );
        } finally {
            setSavingUploadKey("");
        }
    }

    async function handleSaveReview(submission: RequiredFileSubmission | null) {
        if (!submission) {
            setError("El estudiante todavía no ha subido este documento.");
            return;
        }

        const submissionId = getSubmissionId(submission);

        if (!submissionId) {
            setError("No se encontró el identificador de la entrega.");
            return;
        }

        const currentForm =
            reviewForms[String(submissionId)] ??
            getReviewInitialForm(submission);

        if (
            currentForm.score.trim() &&
            Number.isNaN(Number(currentForm.score.trim()))
        ) {
            setError("La calificación debe ser un número válido.");
            return;
        }

        try {
            setSavingReviewId(submissionId);
            setError("");
            setMessage("");

            const updatedSubmission =
                await updateRequiredFileSubmissionReview(
                    submission,
                    currentForm,
                );

            setSubmissions((current) =>
                current.map((item) =>
                    getSubmissionId(item) === submissionId
                        ? {
                            ...item,
                            ...updatedSubmission,
                            status: currentForm.status,
                            review_status: currentForm.status,
                            teacher_status: currentForm.status,
                            feedback: currentForm.feedback,
                            teacher_feedback: currentForm.feedback,
                            observations: currentForm.feedback,
                            score: currentForm.score,
                        }
                        : item,
                ),
            );

            setMessage("Documento del estudiante actualizado correctamente.");
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo actualizar la revisión del documento.",
            );
        } finally {
            setSavingReviewId(0);
        }
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        setFormState((current) => ({
            ...current,
            file,
        }));

        event.target.value = "";
    }

    function clearCapturedFile() {
        setFormState((current) => ({
            ...current,
            file: null,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!formModal) return;

        const cleanTitle = formState.title.trim();
        const cleanDescription = formState.description.trim();
        const cleanAcceptedTypes = formState.acceptedFileTypes.trim();
        const cleanMaxFileSize = formState.maxFileSizeMb.trim();

        const lessonId = Number(formState.lessonId);

        if (!lessonId) {
            setError("Selecciona una lección para guardar el archivo.");
            return;
        }

        if (!cleanTitle) {
            setError("Escribe el nombre del archivo obligatorio.");
            return;
        }

        if (!cleanDescription) {
            setError("Escribe la descripción o indicación del archivo.");
            return;
        }

        if (!cleanAcceptedTypes) {
            setError("Indica los formatos permitidos.");
            return;
        }

        if (!cleanMaxFileSize || Number(cleanMaxFileSize) <= 0) {
            setError("Indica un tamaño máximo válido.");
            return;
        }

        try {
            setIsSaving(true);
            setError("");
            setMessage("");

            if (formModal.mode === "create") {
                await createRequiredFileBlock({
                    lessonId,
                    title: cleanTitle,
                    description: cleanDescription,
                    acceptedFileTypes: cleanAcceptedTypes,
                    maxFileSizeMb: cleanMaxFileSize,
                    order: getNextOrder(blocks, lessonId),
                    file: formState.file,
                });

                setMessage("Archivo obligatorio creado correctamente.");
            }

            if (formModal.mode === "edit") {
                const previousLessonId = Number(formModal.block.lesson_id);
                const movedToAnotherLesson = previousLessonId !== lessonId;

                await updateRequiredFileBlock({
                    block: formModal.block,
                    lessonId,
                    title: cleanTitle,
                    description: cleanDescription,
                    acceptedFileTypes: cleanAcceptedTypes,
                    maxFileSizeMb: cleanMaxFileSize,
                    order: movedToAnotherLesson
                        ? getNextOrder(blocks, lessonId)
                        : readNumber(formModal.block.order, 1),
                    file: formState.file,
                });

                setMessage("Archivo obligatorio actualizado correctamente.");
            }

            setFormModal(null);
            setFormState(getEmptyFormState(String(lessonId)));

            await loadData(false);
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo guardar el archivo obligatorio.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteModal) return;

        try {
            setIsSaving(true);
            setError("");
            setMessage("");

            await deleteLessonBlock(deleteModal.block.id);

            setDeleteModal(null);
            setMessage("Archivo obligatorio eliminado correctamente.");

            await loadData(false);
        } catch (currentError) {
            setError(
                currentError instanceof Error
                    ? currentError.message
                    : "No se pudo eliminar el archivo obligatorio.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-5">
                {error ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : null}

                {message ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{message}</span>
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-br from-[#07122f] via-[#172b78] to-orange-500 px-5 py-7 text-white sm:px-7">
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]">
                                    <FileCheck2 className="h-4 w-4" />
                                    Archivos MDT
                                </span>

                                <h1 className="mt-5 text-2xl font-black sm:text-3xl">
                                    Gestión de archivos MDT del profesor
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                                    Consulta, crea y administra los documentos
                                    obligatorios que deberán subir los
                                    estudiantes del curso.
                                </p>
                            </div>

                            <div className="flex justify-start xl:justify-end">
                                <div className="w-full max-w-[320px] rounded-[1.4rem] border border-white/15 bg-white/15 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur">

                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
                                            Archivos MDT
                                        </p>

                                        <p className="mt-3 text-4xl font-black leading-none text-white">
                                            {requiredBlocks.length}
                                        </p>

                                        <p className="mt-2 text-xs font-bold text-white/80">
                                            Registros
                                        </p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
                        <div className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-950">
                                        Archivos obligatorios MDT
                                    </h2>

                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Busque, consulte y administre los
                                        archivos requeridos del curso.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => void loadData(true)}
                                        disabled={isLoading || !courseId}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCcw className="h-4 w-4" />
                                        )}
                                        Actualizar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={openCreateModal}
                                        disabled={
                                            isLoading || lessons.length === 0
                                        }
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nuevo archivo
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                Archivos
                                            </p>
                                            <p className="text-lg font-black text-slate-950">
                                                {requiredBlocks.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                Activos
                                            </p>
                                            <p className="text-lg font-black text-slate-950">
                                                {requiredBlocks.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="mt-5 rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                            <div className="grid gap-4 border-b border-slate-200 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center sm:p-5">
                                <div className="relative max-w-xl">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        value={searchTerm}
                                        onChange={(event) =>
                                            setSearchTerm(event.target.value)
                                        }
                                        placeholder="Buscar archivo..."
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
                                    />
                                </div>

                                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                                    <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                                        Mostrando {filteredBlocks.length}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        Ver todos
                                    </button>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center gap-2 p-6 text-sm font-bold text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando archivos MDT...
                                </div>
                            ) : null}

                            {!isLoading && filteredBlocks.length === 0 ? (
                                <div className="m-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:m-5">
                                    <FileUp className="mx-auto h-10 w-10 text-slate-400" />

                                    <h3 className="mt-4 text-base font-black text-slate-900">
                                        No hay archivos obligatorios registrados
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                                        Los archivos MDT aparecerán aquí cuando
                                        existan bloques del tipo #
                                        {REQUIRED_FILE_BLOCK_TYPE_ID}.
                                    </p>
                                </div>
                            ) : null}

                            {!isLoading && filteredBlocks.length > 0 ? (
                                <div className="grid gap-4 p-4 sm:p-5">
                                    {filteredBlocks.map((block) => {
                                        const templateUrl =
                                            getBlockTemplateUrl(block);
                                        const fileName =
                                            getBlockFileName(block);
                                        const acceptedTypes =
                                            getBlockAcceptedTypes(block) ||
                                            "Documento";
                                        const maxSize =
                                            getBlockMaxFileSize(block) || "10";

                                        return (
                                            <div
                                                key={block.id}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                            >
                                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                                                <FileText className="h-5 w-5" />
                                                            </div>

                                                            <h3 className="text-base font-black text-slate-950">
                                                                {getBlockTitle(
                                                                    block,
                                                                )}
                                                            </h3>

                                                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                                                                Obligatorio
                                                            </span>

                                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                                                                Bloque #
                                                                {block.id}
                                                            </span>
                                                        </div>

                                                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                                                            {getBlockDescription(
                                                                block,
                                                            )}
                                                        </p>

                                                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                                                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                                                Lección:{" "}
                                                                {getLessonName(
                                                                    lessons,
                                                                    block.lesson_id,
                                                                )}
                                                            </span>

                                                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                                                Tipos:{" "}
                                                                {acceptedTypes}
                                                            </span>

                                                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                                                Máx: {maxSize} MB
                                                            </span>

                                                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                                                Actualizado:{" "}
                                                                {formatDate(
                                                                    getValue(
                                                                        block,
                                                                        [
                                                                            "updated_at",
                                                                            "updatedAt",
                                                                            "created_at",
                                                                            "createdAt",
                                                                        ],
                                                                    ),
                                                                )}
                                                            </span>
                                                        </div>

                                                        {fileName ? (
                                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                                                                Archivo
                                                                capturado:{" "}
                                                                {fileName}
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4">
                                                        {templateUrl ? (
                                                            <a
                                                                href={
                                                                    templateUrl
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                                Ver archivo
                                                            </a>
                                                        ) : (
                                                            <span className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-400">
                                                                Sin archivo
                                                            </span>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openVerifyModal(
                                                                    block,
                                                                )
                                                            }
                                                            disabled={
                                                                isSaving ||
                                                                isLoadingVerifications
                                                            }
                                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <ClipboardCheck className="h-4 w-4" />
                                                            Verificar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    block,
                                                                )
                                                            }
                                                            disabled={isSaving}
                                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    block,
                                                                )
                                                            }
                                                            disabled={isSaving}
                                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {formModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-3 py-6 sm:px-4">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-3xl overflow-hidden rounded-[1.7rem] bg-white shadow-2xl sm:rounded-[2rem]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    {formModal.mode === "create"
                                        ? "Agregar archivo obligatorio"
                                        : "Editar archivo obligatorio"}
                                </h2>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Registra el documento requerido que el
                                    estudiante deberá subir en el aula.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeFormModal}
                                disabled={isSaving}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Cerrar modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-black text-slate-700">
                                        Lección
                                    </span>

                                    <select
                                        value={formState.lessonId}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                lessonId: event.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option value="">
                                            Selecciona una lección
                                        </option>

                                        {lessons.map((lesson) => (
                                            <option
                                                key={lesson.id}
                                                value={lesson.id}
                                            >
                                                {lesson.name}
                                            </option>
                                        ))}

                                        {!hasCurrentLessonInOptions &&
                                            formState.lessonId ? (
                                            <option value={formState.lessonId}>
                                                Lección #{formState.lessonId}
                                            </option>
                                        ) : null}
                                    </select>
                                </label>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                        Curso
                                    </p>

                                    <p className="mt-1 text-lg font-black text-slate-950">
                                        #{courseId || "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                                    Ubicación
                                </p>

                                <p className="mt-1 text-sm font-black text-blue-950">
                                    {selectedLessonName}
                                </p>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <label className="block md:col-span-2">
                                    <span className="text-sm font-black text-slate-700">
                                        Nombre del archivo obligatorio
                                    </span>

                                    <input
                                        value={formState.title}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                title: event.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                        placeholder="Ejemplo: Copia de cédula"
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </label>

                                <label className="block md:col-span-2">
                                    <span className="text-sm font-black text-slate-700">
                                        Descripción o indicaciones
                                    </span>

                                    <textarea
                                        value={formState.description}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                description:
                                                    event.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                        rows={3}
                                        placeholder="Ejemplo: Suba una copia legible de su documento de identidad en PDF o imagen."
                                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-black text-slate-700">
                                        Formatos permitidos
                                    </span>

                                    <input
                                        value={formState.acceptedFileTypes}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                acceptedFileTypes:
                                                    event.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                        placeholder=".pdf,.jpg,.png"
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-black text-slate-700">
                                        Tamaño máximo MB
                                    </span>

                                    <input
                                        value={formState.maxFileSizeMb}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                maxFileSizeMb:
                                                    event.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                        type="number"
                                        min="1"
                                        placeholder="10"
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </label>
                            </div>

                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                    <UploadCloud className="h-6 w-6" />
                                </div>

                                <h3 className="mt-3 text-base font-black text-slate-950">
                                    Archivo capturado
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Opcional. Puede adjuntar una plantilla o
                                    archivo de referencia para el estudiante.
                                </p>

                                <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white transition hover:opacity-95">
                                    <UploadCloud className="h-4 w-4" />
                                    Elegir archivo
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                        onChange={handleFileChange}
                                        disabled={isSaving}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {formState.file ? (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-black text-slate-950">
                                            Archivo seleccionado
                                        </p>

                                        <button
                                            type="button"
                                            onClick={clearCapturedFile}
                                            disabled={isSaving}
                                            className="text-xs font-black text-red-600 hover:underline disabled:opacity-60"
                                        >
                                            Quitar
                                        </button>
                                    </div>

                                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                                        <p className="truncate text-sm font-black text-slate-800">
                                            {formState.file.name}
                                        </p>

                                        <p className="text-xs font-semibold text-slate-500">
                                            {Math.max(
                                                formState.file.size / 1024,
                                                1,
                                            ).toFixed(0)}{" "}
                                            KB
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            {formModal.mode === "edit" &&
                                getBlockTemplateUrl(formModal.block) ? (
                                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                                        Archivo actual
                                    </p>

                                    <a
                                        href={getBlockTemplateUrl(
                                            formModal.block,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-flex items-center gap-1 text-sm font-black text-[#172861] hover:underline"
                                    >
                                        Ver archivo actual
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            ) : null}
                        </div>

                        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:grid-cols-2 sm:px-6">
                            <button
                                type="button"
                                onClick={closeFormModal}
                                disabled={isSaving}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : formModal.mode === "create" ? (
                                    <Plus className="h-4 w-4" />
                                ) : (
                                    <Edit3 className="h-4 w-4" />
                                )}

                                {formModal.mode === "create"
                                    ? "Crear archivo"
                                    : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {verifyModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-3 py-6 sm:px-4">
                    <div className="w-full max-w-7xl overflow-hidden rounded-[1.7rem] bg-white shadow-2xl sm:rounded-[2rem]">
                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                    <ClipboardCheck className="h-3.5 w-3.5" />
                                    Revisión de documentos
                                </span>

                                <h2 className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">
                                    {getBlockTitle(verifyModal.block)}
                                </h2>

                                <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                                    Verifica los documentos subidos por cada
                                    estudiante matriculado. Puedes aprobar,
                                    observar o rechazar la entrega y guardar una
                                    observación.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void loadVerificationData(
                                            verifyModal.block,
                                        )
                                    }
                                    disabled={
                                        isLoadingVerifications ||
                                        Boolean(savingReviewId) ||
                                        Boolean(savingUploadKey)
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoadingVerifications ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCcw className="h-4 w-4" />
                                    )}
                                    Actualizar
                                </button>

                                <button
                                    type="button"
                                    onClick={closeVerifyModal}
                                    disabled={
                                        isLoadingVerifications ||
                                        Boolean(savingReviewId) ||
                                        Boolean(savingUploadKey)
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <X className="h-4 w-4" />
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[76vh] overflow-y-auto px-5 py-5 sm:px-6">
                            <div className="grid gap-3 md:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                            <UserRoundCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                Matriculados
                                            </p>
                                            <p className="text-lg font-black text-slate-950">
                                                {verificationSummary.total}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <FileCheck2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                Subidos
                                            </p>
                                            <p className="text-lg font-black text-slate-950">
                                                {verificationSummary.submitted}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                            <Clock3 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                Pendientes
                                            </p>
                                            <p className="text-lg font-black text-slate-950">
                                                {verificationSummary.pending}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                Aprobados
                                            </p>
                                            <p className="text-lg font-black text-slate-950">
                                                {verificationSummary.approved}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                <div className="relative max-w-xl">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        value={verificationSearch}
                                        onChange={(event) =>
                                            setVerificationSearch(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Buscar estudiante, correo, estado o archivo..."
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
                                    />
                                </div>

                                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                                    Mostrando {verificationRows.length}
                                </span>
                            </div>

                            {isLoadingVerifications ? (
                                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando documentos enviados por
                                    estudiantes...
                                </div>
                            ) : null}

                            {!isLoadingVerifications &&
                                verificationRows.length === 0 ? (
                                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                    <UserRoundCheck className="mx-auto h-10 w-10 text-slate-400" />

                                    <h3 className="mt-4 text-base font-black text-slate-900">
                                        No hay estudiantes para revisar
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                                        Verifica que el curso tenga estudiantes
                                        matriculados y que el servicio de
                                        matrículas esté respondiendo
                                        correctamente.
                                    </p>
                                </div>
                            ) : null}

                            {!isLoadingVerifications &&
                                verificationRows.length > 0 ? (
                                <div className="mt-5 grid gap-4">
                                    {verificationRows.map((row) => {
                                        const submissionId =
                                            getSubmissionId(row.submission);
                                        const fileUrl = getSubmissionFileUrl(
                                            row.submission,
                                        );
                                        const fileName = getSubmissionFileName(
                                            row.submission,
                                        );
                                        const status = getSubmissionStatus(
                                            row.submission,
                                        );
                                        const currentForm = submissionId
                                            ? reviewForms[
                                            String(submissionId)
                                            ] ??
                                            getReviewInitialForm(
                                                row.submission,
                                            )
                                            : getReviewInitialForm(null);
                                        const isSavingThis =
                                            savingReviewId === submissionId;
                                        const uploadRowKey =
                                            getUploadRowKey(row);
                                        const uploadForm =
                                            uploadForms[uploadRowKey] ??
                                            getEmptyUploadForm();
                                        const isSavingUpload =
                                            savingUploadKey === uploadRowKey;
                                        const hasAnotherUploadSaving = Boolean(
                                            savingUploadKey &&
                                            savingUploadKey !==
                                            uploadRowKey,
                                        );
                                        const uploadAcceptTypes =
                                            getBlockAcceptedTypes(
                                                verifyModal.block,
                                            ) ||
                                            ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

                                        return (
                                            <div
                                                key={`${getEnrollmentId(
                                                    row.enrollment,
                                                )}-${submissionId || "empty"}`}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                            >
                                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] xl:items-start">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                                                <UserRoundCheck className="h-5 w-5" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <h3 className="truncate text-base font-black text-slate-950">
                                                                    {getStudentName(
                                                                        row.enrollment,
                                                                    )}
                                                                </h3>

                                                                <p className="truncate text-xs font-bold text-slate-500">
                                                                    {getStudentEmail(
                                                                        row.enrollment,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                                                                Matrícula #
                                                                {getEnrollmentId(
                                                                    row.enrollment,
                                                                ) || "-"}
                                                            </span>

                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(
                                                                    status,
                                                                )}`}
                                                            >
                                                                {getStatusLabel(
                                                                    status,
                                                                )}
                                                            </span>
                                                        </div>


                                                        {fileUrl ? (
                                                            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                                                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                                                                    Documento
                                                                    subido
                                                                </p>

                                                                <p className="mt-1 truncate text-sm font-black text-emerald-950">
                                                                    {fileName ||
                                                                        "Archivo del estudiante"}
                                                                </p>

                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    <a
                                                                        href={
                                                                            fileUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                        Ver
                                                                    </a>

                                                                    <a
                                                                        href={
                                                                            fileUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        download
                                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                                                                    >
                                                                        <Download className="h-3.5 w-3.5" />
                                                                        Descargar
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
                                                                <div className="flex items-center gap-2 text-sm font-black text-slate-500">
                                                                    <XCircle className="h-4 w-4" />
                                                                    El estudiante
                                                                    aún no ha
                                                                    subido este
                                                                    documento.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 text-slate-500" />
                                                            <p className="text-sm font-black text-slate-900">
                                                                Revisión docente
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 grid gap-3">

                                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3">
                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                                                                            {fileUrl
                                                                                ? "Actualizar archivo"
                                                                                : "Subir archivo faltante"}
                                                                        </p>

                                                                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                                                                            {fileUrl
                                                                                ? "Permite reemplazar el documento enviado por el estudiante."
                                                                                : "Si el estudiante no subió información, el docente puede registrar el archivo aquí."}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3 grid gap-2">
                                                                    <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100">
                                                                        <UploadCloud className="h-3.5 w-3.5" />
                                                                        Seleccionar archivo
                                                                        <input
                                                                            type="file"
                                                                            accept={
                                                                                uploadAcceptTypes
                                                                            }
                                                                            disabled={
                                                                                isSavingUpload ||
                                                                                hasAnotherUploadSaving ||
                                                                                Boolean(
                                                                                    savingReviewId,
                                                                                )
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) => {
                                                                                const file =
                                                                                    event
                                                                                        .target
                                                                                        .files?.[0] ??
                                                                                    null;

                                                                                updateUploadForm(
                                                                                    row,
                                                                                    {
                                                                                        file,
                                                                                    },
                                                                                );

                                                                                event.target.value =
                                                                                    "";
                                                                            }}
                                                                            className="hidden"
                                                                        />
                                                                    </label>

                                                                    {uploadForm.file ? (
                                                                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate text-xs font-black text-slate-800">
                                                                                        {
                                                                                            uploadForm
                                                                                                .file
                                                                                                .name
                                                                                        }
                                                                                    </p>

                                                                                    <p className="text-[11px] font-semibold text-slate-500">
                                                                                        {Math.max(
                                                                                            uploadForm
                                                                                                .file
                                                                                                .size /
                                                                                            1024,
                                                                                            1,
                                                                                        ).toFixed(
                                                                                            0,
                                                                                        )}{" "}
                                                                                        KB
                                                                                    </p>
                                                                                </div>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        updateUploadForm(
                                                                                            row,
                                                                                            {
                                                                                                file: null,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        isSavingUpload
                                                                                    }
                                                                                    className="shrink-0 text-[11px] font-black text-red-600 hover:underline disabled:opacity-60"
                                                                                >
                                                                                    Quitar
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : null}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            void handleUploadStudentFile(
                                                                                row,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !uploadForm.file ||
                                                                            isSavingUpload ||
                                                                            hasAnotherUploadSaving ||
                                                                            Boolean(
                                                                                savingReviewId,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        {isSavingUpload ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <UploadCloud className="h-3.5 w-3.5" />
                                                                        )}
                                                                        {fileUrl
                                                                            ? "Actualizar archivo"
                                                                            : "Subir archivo"}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void handleSaveReview(
                                                                        row.submission,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !row.submission ||
                                                                    isSavingThis ||
                                                                    Boolean(
                                                                        savingReviewId,
                                                                    ) ||
                                                                    Boolean(
                                                                        savingUploadKey,
                                                                    )
                                                                }
                                                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {isSavingThis ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Save className="h-4 w-4" />
                                                                )}
                                                                Guardar
                                                                revisión
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}

            {deleteModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-3 py-6 sm:px-4">
                    <div className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                            <Trash2 className="h-6 w-6" />
                        </div>

                        <h2 className="mt-4 text-xl font-black text-slate-950">
                            Eliminar archivo obligatorio
                        </h2>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                            ¿Seguro que deseas eliminar{" "}
                            <strong className="text-slate-900">
                                {getBlockTitle(deleteModal.block)}
                            </strong>
                            ? Esta acción eliminará el registro del archivo
                            obligatorio.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={isSaving}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleConfirmDelete()}
                                disabled={isSaving}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}