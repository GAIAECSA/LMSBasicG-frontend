import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
} from "@/services/api-client.service";
import {
    createLessonBlock,
    updateLessonBlock,
    type Lesson,
    type LessonBlock,
    type LessonBlockPayload,
} from "@/services/lessons.service";
import { getEnrollmentsByCourseAndRole } from "@/services/enrollments.service";
import {
    getHomeworkResponsesByLessonBlock,
    gradeHomeworkResponse,
    updateHomeworkResponse,
} from "@/services/homework-response.service";
import {
    DEFAULT_ACCEPTED_FILE_TYPES,
    REQUIRED_FILE_BLOCK_TYPE_ID,
    REVIEW_STATUS_OPTIONS,
} from "./constants";
import type {
    AnyRecord,
    EnrollmentRecord,
    RequiredFileFormState,
    RequiredFileSubmission,
    ReviewFormState,
    StudentFileUploadState,
    VerificationRow,
} from "./types";

export function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AnyRecord;
}

export function cleanText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

export function readNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function readBoolean(value: unknown, fallback = false) {
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

export function normalizeSearch(value: unknown) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function getValue(record: unknown, keys: string[]) {
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

export function getContentRecord(value: unknown): AnyRecord {
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

export function getApiOrigin() {
    const fallbackUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const cleanApiUrl = String(API_URL || fallbackUrl)
        .trim()
        .replace(/\/+$/, "");

    if (cleanApiUrl.endsWith("/api/v1")) {
        return cleanApiUrl.replace(/\/api\/v1$/, "");
    }

    return cleanApiUrl;
}

export function buildFileUrl(fileUrl: string | null | undefined) {
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

export function getFirstNestedRecord(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        const value = toRecord(currentRecord[key]);

        if (value) return value;
    }

    return null;
}

export function getPersonName(record: unknown) {
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

export function getStudentRecord(enrollment: EnrollmentRecord) {
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

export function getEnrollmentId(enrollment: EnrollmentRecord) {
    return (
        readNumber(enrollment.id, 0) ||
        readNumber(enrollment.enrollment_id, 0) ||
        readNumber(enrollment.enrollmentId, 0)
    );
}

export function getEnrollmentStudentId(enrollment: EnrollmentRecord) {
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

export function getStudentName(enrollment: EnrollmentRecord) {
    const studentRecord = getStudentRecord(enrollment);
    const studentName = getPersonName(studentRecord);

    if (studentName) return studentName;

    const enrollmentId = getEnrollmentId(enrollment);

    return enrollmentId
        ? `Estudiante matrícula #${enrollmentId}`
        : "Estudiante sin identificar";
}

export function getStudentEmail(enrollment: EnrollmentRecord) {
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

export function getSubmissionId(
    submission: RequiredFileSubmission | null,
) {
    if (!submission) return 0;

    return (
        readNumber(submission.id, 0) ||
        readNumber(submission.response_id, 0) ||
        readNumber(submission.responseId, 0)
    );
}

export function getSubmissionEnrollmentId(
    submission: RequiredFileSubmission | null,
) {
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

export function getSubmissionStudentId(
    submission: RequiredFileSubmission | null,
) {
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

export function getSubmissionForEnrollment(
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

export function getFirstUrlFromArray(value: unknown) {
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

export function getSubmissionFileUrl(
    submission: RequiredFileSubmission | null,
) {
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

export function getSubmissionFileName(
    submission: RequiredFileSubmission | null,
) {
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

export function getSubmissionStatus(
    submission: RequiredFileSubmission | null,
) {
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
        [
            "observed",
            "observado",
            "corregir",
            "revision",
            "en revision",
        ].includes(rawStatus)
    ) {
        return "observed";
    }

    return "pending";
}

export function getSubmissionFeedback(
    submission: RequiredFileSubmission | null,
) {
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

export function getSubmissionScore(
    submission: RequiredFileSubmission | null,
) {
    if (!submission) return "";

    const content = getContentRecord(submission.content);

    return (
        cleanText(submission.score) ||
        cleanText(submission.grade) ||
        cleanText(content.score) ||
        cleanText(content.grade)
    );
}

export function getSubmissionDate(
    submission: RequiredFileSubmission | null,
) {
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

export function getStatusLabel(status: string) {
    const normalized = getSubmissionStatus({ status });

    return (
        REVIEW_STATUS_OPTIONS.find(
            (option) => option.value === normalized,
        )?.label ?? "Pendiente"
    );
}

export function getStatusBadgeClass(status: string) {
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

export function getReviewInitialForm(
    submission: RequiredFileSubmission | null,
): ReviewFormState {
    return {
        status: getSubmissionStatus(submission),
        feedback: getSubmissionFeedback(submission),
        score: getSubmissionScore(submission),
    };
}

export function getUploadRowKey(row: VerificationRow) {
    const enrollmentId = getEnrollmentId(row.enrollment);
    const studentId = getEnrollmentStudentId(row.enrollment);
    const submissionId = getSubmissionId(row.submission);

    if (submissionId) return `submission-${submissionId}`;
    if (enrollmentId) return `enrollment-${enrollmentId}`;
    if (studentId) return `student-${studentId}`;

    return `row-${getStudentName(row.enrollment)}`;
}

export function getEmptyUploadForm(): StudentFileUploadState {
    return {
        file: null,
        comment: "",
    };
}

export function formatDate(value: unknown) {
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

export function getBlockTitle(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.title) ||
        cleanText(content.name) ||
        cleanText(content.label) ||
        cleanText(content.titulo) ||
        `Archivo obligatorio #${block.id}`
    );
}

export function getBlockDescription(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.description) ||
        cleanText(content.instructions) ||
        cleanText(content.descripcion) ||
        "Documento requerido para completar el proceso asociado al curso."
    );
}

export function getBlockAcceptedTypes(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.accepted_file_types) ||
        cleanText(content.acceptedFileTypes) ||
        cleanText(content.accept) ||
        cleanText(content.file_types) ||
        cleanText(content.fileTypes)
    );
}

export function getBlockMaxFileSize(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.max_file_size_mb) ||
        cleanText(content.maxFileSizeMb) ||
        cleanText(content.max_size_mb) ||
        cleanText(content.maxSizeMb)
    );
}

export function getBlockTemplateUrl(block: LessonBlock) {
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

export function getBlockFileName(block: LessonBlock) {
    const content = getContentRecord(block.content);

    return (
        cleanText(content.file_name) ||
        cleanText(content.fileName) ||
        cleanText(content.original_name) ||
        cleanText(content.originalName) ||
        ""
    );
}

export function getBlockTypeId(block: LessonBlock) {
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

export function isRequiredFileBlock(block: LessonBlock) {
    const content = getContentRecord(block.content);

    const isActive = readBoolean(
        block.is_active ?? content.is_active ?? content.isActive,
        true,
    );

    const deleted = readBoolean(
        block.deleted ?? content.deleted,
        false,
    );

    return (
        getBlockTypeId(block) === REQUIRED_FILE_BLOCK_TYPE_ID &&
        isActive &&
        !deleted
    );
}

export function sortByOrder<
    T extends {
        id: number | string;
        order?: number | string | null;
    },
>(items: T[]) {
    return [...items].sort((a, b) => {
        const orderA = readNumber(a.order, 0);
        const orderB = readNumber(b.order, 0);

        if (orderA !== orderB) return orderA - orderB;

        return Number(a.id) - Number(b.id);
    });
}

export function mergeBlocks(blocks: LessonBlock[]) {
    const unique = new Map<number, LessonBlock>();

    for (const block of blocks) {
        const blockId = readNumber(block.id, 0);

        if (!blockId) continue;

        unique.set(blockId, block);
    }

    return sortByOrder([...unique.values()]);
}

export function getLessonName(lessons: Lesson[], lessonId: number) {
    const lesson = lessons.find(
        (item) => Number(item.id) === Number(lessonId),
    );

    if (lesson?.name) return lesson.name;

    return lessonId ? `Lección #${lessonId}` : "Sin lección";
}

export function getNextOrder(blocks: LessonBlock[], lessonId: number) {
    const lessonBlocks = blocks.filter(
        (block) => Number(block.lesson_id) === Number(lessonId),
    );

    if (lessonBlocks.length === 0) return 1;

    return (
        Math.max(
            ...lessonBlocks.map((block) => readNumber(block.order, 0)),
        ) + 1
    );
}

export function getEmptyFormState(
    lessonId = "",
): RequiredFileFormState {
    return {
        lessonId,
        title: "",
        description: "",
        acceptedFileTypes: DEFAULT_ACCEPTED_FILE_TYPES,
        maxFileSizeMb: "10",
        file: null,
    };
}

export async function getDefaultLessonBlocksByCourseAndBlockType(
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

export async function createRequiredFileBlock(payload: {
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

export async function updateRequiredFileBlock(payload: {
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

export function mapReviewStatusToHomeworkStatus(status: string) {
    const normalized = getSubmissionStatus({ status });

    if (normalized === "approved") return "APROBADO";
    if (normalized === "rejected") return "RECHAZADO";
    if (normalized === "observed") return "OBSERVADO";

    return "PENDIENTE";
}

export async function getCourseEnrollmentsForVerification(
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

export async function getRequiredFileSubmissionsByBlock(
    blockId: number,
): Promise<RequiredFileSubmission[]> {
    const validBlockId = readNumber(blockId, 0);

    if (!validBlockId) return [];

    const data =
        await getHomeworkResponsesByLessonBlock(validBlockId);

    return Array.isArray(data)
        ? data.map(
              (item) =>
                  item as unknown as RequiredFileSubmission,
          )
        : [];
}

export async function updateRequiredFileSubmissionReview(
    submission: RequiredFileSubmission,
    form: ReviewFormState,
): Promise<RequiredFileSubmission> {
    const submissionId = getSubmissionId(submission);

    if (!submissionId) {
        throw new Error(
            "No se encontró el identificador de la entrega.",
        );
    }

    const numericScore =
        form.score.trim() === ""
            ? null
            : Number(form.score.trim());

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
