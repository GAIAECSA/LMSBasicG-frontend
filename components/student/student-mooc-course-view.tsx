"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Award,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Download,
    FileCheck2,
    FileText,
    ImageIcon,
    Layers3,
    Loader2,
    Lock,
    PlayCircle,
} from "lucide-react";
import { getModulesByCourse, type CourseModule } from "@/services/modules.service";
import {
    getLessonBlocksByLesson,
    getLessonsByModule,
    type Lesson,
    type LessonBlock,
} from "@/services/lessons.service";
import {
    completeBlockProgress,
    createBlockProgress,
    getProgressByEnrollment,
    type BlockProgress,
} from "@/services/progress.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";
import {
    createQuizzResponse,
    getQuizzResponsesByEnrollment,
    getQuizzResponsesByLessonBlock,
    updateQuizzResponse,
    type QuizzResponse,
    type QuizzResponseByLessonBlock,
} from "@/services/quizz-response.service";
import {
    createCertificateFromTemplate,
    getCertificatesByCourse,
    getCertificateTemplate,
    reissueCertificateFromTemplate,
    type Certificate,
} from "@/services/certificates.service";
import { getAuthSession } from "@/lib/auth";

type StudentMoocCourseViewProps = {
    courseId: string;
};

type LessonItemType = "text" | "image" | "pdf" | "video" | "quiz";

type QuizQuestion = {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    points: number;
};

type LessonBlockWithOptionalType = LessonBlock & {
    block_type_id?: number;
    lesson_block_type?: {
        id?: number;
        key?: string;
    };
};

type LessonBlockRoot = LessonBlock & Record<string, unknown>;

type LessonView = Lesson & {
    blocks: LessonBlock[];
};

type ModuleView = CourseModule & {
    lessons: LessonView[];
};

type QuizAnswers = Record<number, number>;

type SessionUserWithRole = {
    id?: number | string;
    role?: string;
    role_id?: number | string;
    roleId?: number | string;
};

type CertificateWithFileFields = Certificate & {
    pdf_url?: string | null;
    file_url?: string | null;
    url?: string | null;
    certificate_url?: string | null;
    path?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

const MAX_QUIZ_ATTEMPTS = 3;

function sortByOrder<T extends { order: number }>(items: T[]) {
    return [...items].sort((a, b) => a.order - b.order);
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

function getContentValue(
    content: Record<string, unknown> | null | undefined,
    key: string,
) {
    const value = content?.[key];

    if (typeof value === "string") return value;

    return "";
}

function getRootValue(block: LessonBlock | null | undefined, key: string) {
    if (!block) return "";

    const value = (block as LessonBlockRoot)[key];

    if (typeof value === "string") return value;

    return "";
}

function getContentNumber(
    content: Record<string, unknown> | null | undefined,
    key: string,
) {
    const value = content?.[key];

    if (typeof value === "number") return value;

    if (typeof value === "string") {
        const parsedValue = Number(value);

        if (Number.isFinite(parsedValue)) return parsedValue;
    }

    return null;
}

function normalizeResourceUrl(url: string) {
    if (!url) return "";

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

function getProtectedPdfViewerUrl(url: string) {
    if (!url) return "";

    const cleanUrl = url.split("#")[0];

    return `${cleanUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
}

function getStringFromUnknown(value: unknown) {
    if (typeof value === "string") return value;

    return "";
}

function getNestedFileUrl(value: unknown) {
    if (!value || typeof value !== "object") return "";

    const record = value as Record<string, unknown>;

    return (
        getStringFromUnknown(record.url) ||
        getStringFromUnknown(record.file_url) ||
        getStringFromUnknown(record.path) ||
        getStringFromUnknown(record.file_path) ||
        getStringFromUnknown(record.image_url) ||
        getStringFromUnknown(record.pdf_url) ||
        getStringFromUnknown(record.document_url)
    );
}

function getFileUrlFromBlock(block: LessonBlock | null) {
    if (!block) return "";

    const root = block as LessonBlockRoot;
    const content = block.content ?? {};

    const directUrl =
        getContentValue(content, "file_url") ||
        getContentValue(content, "url") ||
        getContentValue(content, "path") ||
        getContentValue(content, "file_path") ||
        getContentValue(content, "image_url") ||
        getContentValue(content, "pdf_url") ||
        getContentValue(content, "document_url") ||
        getContentValue(content, "media_url") ||
        getContentValue(content, "attachment_url") ||
        getRootValue(block, "file_url") ||
        getRootValue(block, "url") ||
        getRootValue(block, "path") ||
        getRootValue(block, "file_path") ||
        getRootValue(block, "image_url") ||
        getRootValue(block, "pdf_url") ||
        getRootValue(block, "document_url") ||
        getRootValue(block, "media_url") ||
        getRootValue(block, "attachment_url");

    if (directUrl) return normalizeResourceUrl(directUrl);

    const nestedUrl =
        getNestedFileUrl(content.file) ||
        getNestedFileUrl(content.image) ||
        getNestedFileUrl(content.pdf) ||
        getNestedFileUrl(content.document) ||
        getNestedFileUrl(root.file) ||
        getNestedFileUrl(root.image) ||
        getNestedFileUrl(root.pdf) ||
        getNestedFileUrl(root.document);

    return nestedUrl ? normalizeResourceUrl(nestedUrl) : "";
}

function getBlockTitle(block: LessonBlock) {
    const content = block.content ?? {};

    return (
        getContentValue(content, "title") ||
        getContentValue(content, "name") ||
        getContentValue(content, "label") ||
        getRootValue(block, "title") ||
        getRootValue(block, "name") ||
        getRootValue(block, "label") ||
        `Bloque ${block.id}`
    );
}

function getBlockDescription(block: LessonBlock | null) {
    if (!block) return "";

    const content = block.content ?? {};

    return (
        getContentValue(content, "description") ||
        getContentValue(content, "descripcion") ||
        getRootValue(block, "description") ||
        getRootValue(block, "descripcion")
    );
}

function getLessonItemType(block: LessonBlock): LessonItemType {
    const content = block.content ?? {};
    const optionalBlock = block as LessonBlockWithOptionalType;

    const contentType =
        getContentValue(content, "itemType").toLowerCase() ||
        getContentValue(content, "type").toLowerCase() ||
        getContentValue(content, "blockType").toLowerCase();

    const key = optionalBlock.lesson_block_type?.key?.toLowerCase() ?? "";

    const blockTypeId =
        getContentNumber(content, "block_type_id") ??
        optionalBlock.block_type_id ??
        optionalBlock.lesson_block_type?.id;

    if (
        blockTypeId === 1 ||
        contentType.includes("video") ||
        key.includes("video")
    ) {
        return "video";
    }

    if (
        blockTypeId === 2 ||
        contentType.includes("quiz") ||
        contentType.includes("prueba") ||
        contentType.includes("evaluacion") ||
        key.includes("quiz") ||
        key.includes("prueba") ||
        key.includes("evaluacion")
    ) {
        return "quiz";
    }

    if (
        blockTypeId === 4 ||
        contentType.includes("image") ||
        contentType.includes("imagen") ||
        contentType.includes("foto") ||
        key.includes("image") ||
        key.includes("imagen") ||
        key.includes("foto")
    ) {
        return "image";
    }

    if (
        blockTypeId === 5 ||
        contentType.includes("pdf") ||
        contentType.includes("document") ||
        contentType.includes("documento") ||
        key.includes("pdf") ||
        key.includes("document") ||
        key.includes("documento")
    ) {
        return "pdf";
    }

    return "text";
}

function getItemLabel(type: LessonItemType) {
    if (type === "video") return "Video";
    if (type === "quiz") return "Evaluación";
    if (type === "image") return "Imagen";
    if (type === "pdf") return "PDF";

    return "Texto";
}

function renderItemIcon(type: LessonItemType, className: string) {
    if (type === "video") return <PlayCircle className={className} />;
    if (type === "quiz") return <ClipboardList className={className} />;
    if (type === "image") return <ImageIcon className={className} />;
    if (type === "pdf") return <FileText className={className} />;

    return <FileText className={className} />;
}

type VideoPreview =
    | {
        type: "iframe";
        url: string;
    }
    | {
        type: "video";
        url: string;
    }
    | null;

function isDirectVideoFile(url: string) {
    return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);
}

function getVideoUrlFromBlock(block: LessonBlock | null) {
    if (!block) return "";

    const content = block.content ?? {};

    const directUrl =
        getContentValue(content, "embed_url") ||
        getContentValue(content, "video_url") ||
        getContentValue(content, "microsoft365_url") ||
        getContentValue(content, "microsoft_365_url") ||
        getContentValue(content, "stream_url") ||
        getContentValue(content, "sharepoint_url") ||
        getContentValue(content, "onedrive_url") ||
        getContentValue(content, "url") ||
        getRootValue(block, "embed_url") ||
        getRootValue(block, "video_url") ||
        getRootValue(block, "microsoft365_url") ||
        getRootValue(block, "microsoft_365_url") ||
        getRootValue(block, "stream_url") ||
        getRootValue(block, "sharepoint_url") ||
        getRootValue(block, "onedrive_url") ||
        getRootValue(block, "url");

    return directUrl ? normalizeResourceUrl(directUrl) : "";
}

function getVideoPreview(url: string): VideoPreview {
    if (!url) return null;

    const cleanUrl = url.trim();

    if (!cleanUrl) return null;

    if (isDirectVideoFile(cleanUrl)) {
        return {
            type: "video",
            url: cleanUrl,
        };
    }

    try {
        const parsedUrl = new URL(cleanUrl);
        const hostname = parsedUrl.hostname.toLowerCase();
        const pathname = parsedUrl.pathname;

        if (hostname.includes("youtube.com")) {
            const videoId = parsedUrl.searchParams.get("v");

            if (videoId) {
                return {
                    type: "iframe",
                    url: `https://www.youtube.com/embed/${videoId}`,
                };
            }
        }

        if (hostname.includes("youtu.be")) {
            const videoId = pathname.replace("/", "");

            if (videoId) {
                return {
                    type: "iframe",
                    url: `https://www.youtube.com/embed/${videoId}`,
                };
            }
        }

        if (hostname.includes("web.microsoftstream.com")) {
            if (pathname.includes("/embed/video/")) {
                return {
                    type: "iframe",
                    url: cleanUrl,
                };
            }

            const parts = pathname.split("/").filter(Boolean);
            const videoIndex = parts.findIndex((part) => part === "video");
            const videoId = videoIndex >= 0 ? parts[videoIndex + 1] : "";

            if (videoId) {
                return {
                    type: "iframe",
                    url: `${parsedUrl.origin}/embed/video/${videoId}`,
                };
            }
        }

        if (
            hostname.includes("sharepoint.com") ||
            hostname.includes("onedrive.live.com") ||
            hostname.includes("1drv.ms") ||
            hostname.includes("office.com") ||
            hostname.includes("microsoft365.com") ||
            pathname.includes("/_layouts/15/embed.aspx") ||
            pathname.includes("/stream.aspx")
        ) {
            return {
                type: "iframe",
                url: cleanUrl,
            };
        }

        return {
            type: "iframe",
            url: cleanUrl,
        };
    } catch {
        return null;
    }
}

function normalizeQuizQuestions(value: unknown): QuizQuestion[] {
    if (!Array.isArray(value)) return [];

    return value.map((question, index) => {
        const item = question as Partial<QuizQuestion>;

        return {
            id: typeof item.id === "number" ? item.id : index + 1,
            question: typeof item.question === "string" ? item.question : "",
            options: Array.isArray(item.options)
                ? item.options.map((option) =>
                    typeof option === "string" ? option : "",
                )
                : [],
            correct_answer:
                typeof item.correct_answer === "number"
                    ? item.correct_answer
                    : 0,
            points: typeof item.points === "number" ? item.points : 1,
        };
    });
}

function findApprovedEnrollment(
    enrollments: Enrollment[],
    courseId: number,
): Enrollment | null {
    return (
        enrollments.find(
            (enrollment) =>
                Number(enrollment.course?.id) === courseId &&
                enrollment.accepted === true &&
                Number(enrollment.role?.id) === 4,
        ) ??
        enrollments.find(
            (enrollment) =>
                Number(enrollment.course?.id) === courseId &&
                enrollment.accepted === true,
        ) ??
        null
    );
}

function parseStoredQuizResponse(value: string | null | undefined) {
    if (!value) {
        return {
            attempts: 0,
            history: [] as unknown[],
        };
    }

    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;

        const history = Array.isArray(parsed.history)
            ? parsed.history
            : Array.isArray(parsed.attempts_history)
                ? parsed.attempts_history
                : [];

        const attemptsValue = Number(parsed.attempts);

        return {
            attempts: Number.isFinite(attemptsValue)
                ? attemptsValue
                : history.length > 0
                    ? history.length
                    : 1,
            history,
        };
    } catch {
        return {
            attempts: 1,
            history: [] as unknown[],
        };
    }
}

function getQuizResponseForBlock(
    responses: QuizzResponse[],
    lessonBlockId: number,
) {
    return (
        responses.find(
            (response) => Number(response.lesson_block_id) === lessonBlockId,
        ) ?? null
    );
}

function mapLessonBlockQuizResponseToQuizResponse(
    item: QuizzResponseByLessonBlock,
): QuizzResponse {
    return {
        id: item.id,
        enrollment_id: Number(item.enrollment?.id),
        lesson_block_id: item.lesson_block_id,
        quizz: item.quizz,
        response: item.response,
        score: item.score,
        is_passed: item.is_passed,
        created_at: item.created_at,
    };
}

function getQuizResponseForEnrollmentFromLessonBlock(
    responses: QuizzResponseByLessonBlock[],
    enrollmentId: number,
) {
    const foundResponse = responses.find(
        (response) => Number(response.enrollment?.id) === enrollmentId,
    );

    return foundResponse
        ? mapLessonBlockQuizResponseToQuizResponse(foundResponse)
        : null;
}

function upsertQuizResponse(
    responses: QuizzResponse[],
    responseToSave: QuizzResponse,
) {
    const exists = responses.some((item) => item.id === responseToSave.id);

    if (exists) {
        return responses.map((item) =>
            item.id === responseToSave.id ? responseToSave : item,
        );
    }

    return [...responses, responseToSave];
}

function getQuizAttemptsCount(response: QuizzResponse | null) {
    if (!response) return 0;

    const parsedResponse = parseStoredQuizResponse(response.response);

    return Math.max(parsedResponse.attempts, parsedResponse.history.length, 1);
}

function getQuizLimitMessage(
    responses: QuizzResponse[],
    block: LessonBlock | null,
) {
    if (!block || getLessonItemType(block) !== "quiz") return "";

    const storedResponse = getQuizResponseForBlock(responses, block.id);
    const attemptsCount = getQuizAttemptsCount(storedResponse);

    if (attemptsCount >= MAX_QUIZ_ATTEMPTS) {
        return "Ya alcanzaste el máximo de 3 intentos para esta evaluación.";
    }

    return "";
}

function getCertificateFileUrl(certificate: Certificate | null) {
    if (!certificate) return "";

    const currentCertificate = certificate as CertificateWithFileFields;

    const fileUrl =
        currentCertificate.pdf_url ||
        currentCertificate.file_url ||
        currentCertificate.certificate_url ||
        currentCertificate.url ||
        currentCertificate.path ||
        "";

    return fileUrl ? normalizeResourceUrl(fileUrl) : "";
}

function getCertificateVerifyUrl(certificate: Certificate | null) {
    if (!certificate?.certificate_code) return "";

    return `/certificates/verify/${certificate.certificate_code}`;
}

function getCertificateTargetUrl(certificate: Certificate | null) {
    if (!certificate) return "";

    const verifyUrl = getCertificateVerifyUrl(certificate);
    const fileUrl = getCertificateFileUrl(certificate);

    return verifyUrl || fileUrl;
}

function getUniqueNumbers(values: number[]) {
    return Array.from(new Set(values));
}

function getQuizBlocks(blocks: LessonBlock[]) {
    return blocks.filter((block) => getLessonItemType(block) === "quiz");
}

function getAverageQuizScore(
    responses: QuizzResponse[],
    blocks: LessonBlock[],
) {
    const quizBlockIds = new Set(getQuizBlocks(blocks).map((block) => block.id));

    const quizScores = responses
        .filter((response) => quizBlockIds.has(Number(response.lesson_block_id)))
        .map((response) => Number(response.score || 0));

    if (quizScores.length === 0) return 0;

    const total = quizScores.reduce((sum, score) => sum + score, 0);

    return Math.round((total / quizScores.length) * 100) / 100;
}

function getEnrollmentStudentName(enrollment: Enrollment | null) {
    const firstname = enrollment?.user?.firstname ?? "";
    const lastname = enrollment?.user?.lastname ?? "";
    const fullName = `${firstname} ${lastname}`.trim();

    return fullName || "Estudiante";
}

export function StudentMoocCourseView({ courseId }: StudentMoocCourseViewProps) {
    const numericCourseId = useMemo(() => Number(courseId), [courseId]);

    const [modules, setModules] = useState<ModuleView[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<LessonBlock | null>(null);
    const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
    const [openLessons, setOpenLessons] = useState<Record<number, boolean>>({});
    const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);
    const [progressRecords, setProgressRecords] = useState<BlockProgress[]>([]);
    const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
    const [progressSavingBlockId, setProgressSavingBlockId] = useState<
        number | null
    >(null);
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
    const [quizResponses, setQuizResponses] = useState<QuizzResponse[]>([]);
    const [quizResult, setQuizResult] = useState("");
    const [quizSaving, setQuizSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [studentUserId, setStudentUserId] = useState<number | null>(null);
    const [studentName, setStudentName] = useState("");
    const [courseName, setCourseName] = useState("");
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [certificateMessage, setCertificateMessage] = useState("");
    const [certificateGenerating, setCertificateGenerating] = useState(false);

    const allBlocks = useMemo(
        () =>
            modules.flatMap((moduleItem) =>
                moduleItem.lessons.flatMap((lessonItem) => lessonItem.blocks),
            ),
        [modules],
    );

    const selectedType = selectedBlock ? getLessonItemType(selectedBlock) : "text";
    const selectedContent = selectedBlock?.content ?? {};
    const selectedTitle = selectedBlock ? getBlockTitle(selectedBlock) : "";

    const totalBlocks = allBlocks.length;
    const completedCount = allBlocks.filter((block) =>
        completedBlocks.includes(block.id),
    ).length;

    const progress =
        totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;

    const courseCompleted = totalBlocks > 0 && completedCount === totalBlocks;
    const certificateFileUrl = getCertificateFileUrl(certificate);
    const certificateTargetUrl = getCertificateTargetUrl(certificate);
    const certificateReady = Boolean(certificate && certificateTargetUrl);

    async function refreshProgress(currentEnrollmentId: number) {
        const progressResponse = await getProgressByEnrollment(currentEnrollmentId);

        setProgressRecords(progressResponse);
        setCompletedBlocks(
            progressResponse
                .filter((item) => item.is_completed)
                .map((item) => item.lesson_block_id),
        );

        return progressResponse;
    }

    async function refreshQuizResponseForBlock(
        blockId: number,
        currentEnrollmentId: number,
    ) {
        const blockResponses = await getQuizzResponsesByLessonBlock(blockId);
        const studentResponse = getQuizResponseForEnrollmentFromLessonBlock(
            blockResponses,
            currentEnrollmentId,
        );

        if (studentResponse) {
            setQuizResponses((current) =>
                upsertQuizResponse(current, studentResponse),
            );
        }

        return studentResponse;
    }

    const loadCourseContent = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            setCertificateMessage("");

            if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
                throw new Error("No se pudo identificar el curso.");
            }

            const session = getAuthSession();
            const sessionUser = session?.user as SessionUserWithRole | undefined;
            const userId = Number(sessionUser?.id);

            if (!userId || Number.isNaN(userId)) {
                throw new Error("No se pudo identificar al estudiante autenticado.");
            }

            const [courseModules, userEnrollments] = await Promise.all([
                getModulesByCourse(numericCourseId),
                getEnrollmentsByUser(userId),
            ]);

            const activeEnrollment = findApprovedEnrollment(
                userEnrollments,
                numericCourseId,
            );

            if (!activeEnrollment) {
                throw new Error(
                    "No se encontró una matrícula aprobada para este curso.",
                );
            }

            let courseCertificates: Certificate[] = [];

            try {
                courseCertificates = await getCertificatesByCourse(numericCourseId);
            } catch {
                courseCertificates = [];
            }

            const progressResponse = await getProgressByEnrollment(
                activeEnrollment.id,
            );

            let quizResponsesResponse: QuizzResponse[] = [];

            try {
                quizResponsesResponse = await getQuizzResponsesByEnrollment(
                    activeEnrollment.id,
                );
            } catch {
                quizResponsesResponse = [];
            }

            const modulesWithLessons = await Promise.all(
                sortByOrder(courseModules).map(async (moduleItem) => {
                    const lessons = await getLessonsByModule(moduleItem.id);

                    const lessonsWithBlocks = await Promise.all(
                        sortByOrder(lessons).map(async (lessonItem) => {
                            const blocks = await getLessonBlocksByLesson(
                                lessonItem.id,
                            );

                            return {
                                ...lessonItem,
                                blocks: sortByOrder(
                                    blocks.filter((block) => block.is_active),
                                ),
                            };
                        }),
                    );

                    return {
                        ...moduleItem,
                        lessons: lessonsWithBlocks,
                    };
                }),
            );

            const existingCertificate =
                courseCertificates.find(
                    (item) =>
                        Number(item.user_id) === userId &&
                        Number(item.course_id) === numericCourseId &&
                        item.is_valid !== false,
                ) ?? null;

            setEnrollmentId(activeEnrollment.id);
            setStudentUserId(userId);
            setStudentName(getEnrollmentStudentName(activeEnrollment));
            setCourseName(activeEnrollment.course?.name ?? `Curso #${numericCourseId}`);
            setCertificate(existingCertificate);
            setCertificateMessage(
                existingCertificate ? "Tu certificado ya está disponible." : "",
            );
            setProgressRecords(progressResponse);
            setQuizResponses(quizResponsesResponse);
            setCompletedBlocks(
                progressResponse
                    .filter((item) => item.is_completed)
                    .map((item) => item.lesson_block_id),
            );
            setModules(modulesWithLessons);

            const firstBlock =
                modulesWithLessons[0]?.lessons[0]?.blocks[0] ?? null;

            setSelectedBlock(firstBlock);
            setQuizAnswers({});
            setQuizResult(getQuizLimitMessage(quizResponsesResponse, firstBlock));

            if (modulesWithLessons[0]) {
                setOpenModules({
                    [modulesWithLessons[0].id]: true,
                });
            }

            if (modulesWithLessons[0]?.lessons[0]) {
                setOpenLessons({
                    [modulesWithLessons[0].lessons[0].id]: true,
                });
            }
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
            setModules([]);
            setSelectedBlock(null);
            setCompletedBlocks([]);
            setProgressRecords([]);
            setQuizResponses([]);
            setEnrollmentId(null);
            setStudentUserId(null);
            setStudentName("");
            setCourseName("");
            setCertificate(null);
            setCertificateMessage("");
        } finally {
            setLoading(false);
        }
    }, [numericCourseId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCourseContent();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCourseContent]);

    function canGenerateCertificate(
        nextCompletedBlocks: number[],
        nextQuizResponses: QuizzResponse[],
    ) {
        const completedSet = new Set(nextCompletedBlocks);

        const allCourseBlocksCompleted =
            allBlocks.length > 0 &&
            allBlocks.every((block) => completedSet.has(block.id));

        const quizBlocks = getQuizBlocks(allBlocks);

        const allQuizzesApproved = quizBlocks.every((block) => {
            const response = getQuizResponseForBlock(
                nextQuizResponses,
                block.id,
            );

            return response?.is_passed === true;
        });

        return allCourseBlocksCompleted && allQuizzesApproved;
    }

    async function generateCertificateIfCourseFinished(
        nextCompletedBlocks: number[],
        nextQuizResponses: QuizzResponse[] = quizResponses,
    ): Promise<Certificate | null> {
        if (certificateGenerating) return null;

        const currentCertificateTargetUrl = getCertificateTargetUrl(certificate);

        if (certificate && currentCertificateTargetUrl) {
            setCertificateMessage(
                "Tu certificado ya fue generado. Puedes visualizarlo.",
            );

            return certificate;
        }

        if (!studentUserId || !enrollmentId || !numericCourseId) {
            setCertificateMessage(
                "No se pudo identificar al estudiante o la matrícula.",
            );
            return null;
        }

        if (!canGenerateCertificate(nextCompletedBlocks, nextQuizResponses)) {
            setCertificateMessage(
                "Primero debes completar el 100% del curso y aprobar las evaluaciones.",
            );
            return null;
        }

        try {
            setCertificateGenerating(true);
            setCertificateMessage("");

            const template = await getCertificateTemplate(numericCourseId);

            if (!template.id) {
                setCertificateMessage(
                    "Curso terminado, pero aún no existe una plantilla de certificado para este curso.",
                );
                return null;
            }

            const finalGrade = getAverageQuizScore(nextQuizResponses, allBlocks);

            const values = {
                studentName: studentName || "Estudiante",
                courseName: courseName || `Curso #${numericCourseId}`,
                completionDate: new Date().toLocaleDateString("es-EC"),
                instructorName: "Instructor",
                certificateCode: certificate?.certificate_code ?? "",
                finalGrade,
            };

            const generatedCertificate = certificate
                ? await reissueCertificateFromTemplate({
                    certificateId: certificate.id,
                    userId: studentUserId,
                    courseId: numericCourseId,
                    template,
                    values,
                })
                : await createCertificateFromTemplate({
                    userId: studentUserId,
                    courseId: numericCourseId,
                    template,
                    values,
                });

            setCertificate(generatedCertificate);
            setCertificateMessage(
                "Tu certificado se generó correctamente. Ahora puedes visualizarlo.",
            );

            return generatedCertificate;
        } catch (error) {
            const message = getErrorMessage(error);

            console.error("Error generando certificado:", error);

            setCertificateMessage(
                message.includes("403") ||
                    message.toLowerCase().includes("forbidden") ||
                    message.toLowerCase().includes("permisos")
                    ? "No se pudo generar el certificado porque el backend no permite que el estudiante cree o actualice certificados."
                    : message,
            );

            return null;
        } finally {
            setCertificateGenerating(false);
        }
    }

    async function handleViewCertificate() {
        setCertificateMessage("");

        if (!courseCompleted) {
            setCertificateMessage(
                `El certificado se habilitará cuando llegues al 100%. Progreso actual: ${progress}%.`,
            );
            return;
        }

        if (certificateGenerating) return;

        const currentCertificateTargetUrl = getCertificateTargetUrl(certificate);

        if (certificate && currentCertificateTargetUrl) {
            window.open(currentCertificateTargetUrl, "_blank", "noopener,noreferrer");
            return;
        }

        const generatedCertificate = await generateCertificateIfCourseFinished(
            completedBlocks,
            quizResponses,
        );

        if (!generatedCertificate) {
            setCertificateMessage(
                "No se pudo generar el certificado. Revisa que el curso tenga plantilla, que el progreso esté al 100% y que el backend permita emitir certificados.",
            );
            return;
        }

        const generatedCertificateTargetUrl =
            getCertificateTargetUrl(generatedCertificate);

        if (!generatedCertificateTargetUrl) {
            setCertificateMessage(
                "El certificado fue generado, pero no se encontró una URL para visualizarlo.",
            );
            return;
        }

        window.open(generatedCertificateTargetUrl, "_blank", "noopener,noreferrer");
    }

    async function registerBlockStarted(blockId: number) {
        if (!enrollmentId) return;

        const exists = progressRecords.some(
            (item) => item.lesson_block_id === blockId,
        );

        if (exists) return;

        try {
            const createdProgress = await createBlockProgress({
                enrollment_id: enrollmentId,
                lesson_block_id: blockId,
                is_completed: false,
                started_at: new Date().toISOString(),
                completed_at: null,
            });

            setProgressRecords((current) => [...current, createdProgress]);
        } catch {
            // No se bloquea la navegación si el backend ya tiene este registro.
        }
    }

    async function markBlockAsCompleted(blockId: number) {
        if (completedBlocks.includes(blockId)) {
            return completedBlocks;
        }

        if (!enrollmentId) {
            setErrorMessage("No se pudo identificar la matrícula del estudiante.");
            return null;
        }

        try {
            setProgressSavingBlockId(blockId);
            setErrorMessage("");

            const nextCompletedBlocks = getUniqueNumbers([
                ...completedBlocks,
                blockId,
            ]);

            setCompletedBlocks(nextCompletedBlocks);

            await completeBlockProgress(enrollmentId, blockId);

            const progressResponse = await refreshProgress(enrollmentId);

            const freshCompletedBlocks = progressResponse
                .filter((item) => item.is_completed)
                .map((item) => item.lesson_block_id);

            setCompletedBlocks(freshCompletedBlocks);

            return freshCompletedBlocks;
        } catch (error) {
            setCompletedBlocks((current) =>
                current.filter((currentBlockId) => currentBlockId !== blockId),
            );
            setErrorMessage(getErrorMessage(error));
            return null;
        } finally {
            setProgressSavingBlockId(null);
        }
    }

    function handleSelectBlock(block: LessonBlock) {
        setSelectedBlock(block);
        setQuizAnswers({});
        setQuizResult(getQuizLimitMessage(quizResponses, block));
        void registerBlockStarted(block.id);

        if (getLessonItemType(block) === "quiz" && enrollmentId) {
            void refreshQuizResponseForBlock(block.id, enrollmentId)
                .then((studentResponse) => {
                    if (!studentResponse) return;

                    setQuizResult(
                        getQuizAttemptsCount(studentResponse) >=
                            MAX_QUIZ_ATTEMPTS
                            ? "Ya alcanzaste el máximo de 3 intentos para esta evaluación."
                            : "",
                    );
                })
                .catch(() => {
                    // No se bloquea la vista si el backend no devuelve intentos previos.
                });
        }
    }

    function handleQuizAnswer(questionId: number, optionIndex: number) {
        setQuizAnswers((current) => ({
            ...current,
            [questionId]: optionIndex,
        }));
    }

    async function handleSubmitQuiz() {
        if (!selectedBlock) return;

        const questions = normalizeQuizQuestions(
            (selectedBlock.content ?? {}).questions,
        );

        if (questions.length === 0) {
            setQuizResult("Esta evaluación todavía no tiene preguntas.");
            return;
        }

        const unansweredQuestion = questions.find(
            (question) => quizAnswers[question.id] === undefined,
        );

        if (unansweredQuestion) {
            setQuizResult("Responde todas las preguntas antes de finalizar.");
            return;
        }

        if (!enrollmentId) {
            setQuizResult("No se pudo identificar la matrícula del estudiante.");
            return;
        }

        let storedQuizResponse = getQuizResponseForBlock(
            quizResponses,
            selectedBlock.id,
        );

        try {
            const latestStoredResponse = await refreshQuizResponseForBlock(
                selectedBlock.id,
                enrollmentId,
            );

            if (latestStoredResponse) {
                storedQuizResponse = latestStoredResponse;
            }
        } catch {
            // Si el backend no puede consultar por bloque, se usa lo que ya está en memoria.
        }

        const currentAttempts = getQuizAttemptsCount(storedQuizResponse);

        if (currentAttempts >= MAX_QUIZ_ATTEMPTS) {
            setQuizResult(
                "Ya alcanzaste el máximo de 3 intentos para esta evaluación.",
            );
            return;
        }

        const nextAttempt = currentAttempts + 1;

        const score = questions.reduce((total, question) => {
            const answer = quizAnswers[question.id];

            if (answer === question.correct_answer) {
                return total + question.points;
            }

            return total;
        }, 0);

        const minimumScore = selectedBlock.completion_value || 0;
        const isPassed = score >= minimumScore;
        const submittedAt = new Date().toISOString();
        const previousResponse = parseStoredQuizResponse(
            storedQuizResponse?.response,
        );

        const attemptRecord = {
            attempt: nextAttempt,
            answers: quizAnswers,
            score,
            minimum_score: minimumScore,
            is_passed: isPassed,
            submitted_at: submittedAt,
        };

        const responsePayload = {
            answers: quizAnswers,
            score,
            minimum_score: minimumScore,
            is_passed: isPassed,
            submitted_at: submittedAt,
            attempts: nextAttempt,
            max_attempts: MAX_QUIZ_ATTEMPTS,
            history: [...previousResponse.history, attemptRecord],
        };

        try {
            setQuizSaving(true);
            setQuizResult("");

            const savedQuizResponse = storedQuizResponse
                ? await updateQuizzResponse(storedQuizResponse.id, {
                    response: JSON.stringify(responsePayload),
                    score,
                    is_passed: isPassed,
                })
                : await createQuizzResponse({
                    enrollment_id: enrollmentId,
                    lesson_block_id: selectedBlock.id,
                    quizz: JSON.stringify(selectedBlock.content ?? {}),
                    response: JSON.stringify(responsePayload),
                    score,
                    is_passed: isPassed,
                });

            const updatedQuizResponses = upsertQuizResponse(
                quizResponses,
                savedQuizResponse,
            );

            setQuizResponses(updatedQuizResponses);

            if (isPassed) {
                await markBlockAsCompleted(selectedBlock.id);

                setQuizResult(
                    `Evaluación aprobada. Intento ${nextAttempt} de ${MAX_QUIZ_ATTEMPTS}. Puntaje obtenido: ${score}. Mínimo requerido: ${minimumScore}.`,
                );

                return;
            }

            const remainingAttempts = MAX_QUIZ_ATTEMPTS - nextAttempt;

            if (remainingAttempts <= 0) {
                setQuizResult(
                    `Evaluación no aprobada. Puntaje obtenido: ${score}. Mínimo requerido: ${minimumScore}. Ya no tienes intentos disponibles.`,
                );

                return;
            }

            setQuizResult(
                `Evaluación no aprobada. Intento ${nextAttempt} de ${MAX_QUIZ_ATTEMPTS}. Puntaje obtenido: ${score}. Mínimo requerido: ${minimumScore}. Te quedan ${remainingAttempts} intento(s).`,
            );
        } catch (error) {
            setQuizResult(getErrorMessage(error));
        } finally {
            setQuizSaving(false);
        }
    }

    function renderCompleteButton(label: string) {
        if (!selectedBlock) return null;

        const isCompleted = completedBlocks.includes(selectedBlock.id);
        const isSaving = progressSavingBlockId === selectedBlock.id;

        return (
            <button
                type="button"
                disabled={isCompleted || isSaving}
                onClick={() => void markBlockAsCompleted(selectedBlock.id)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <CheckCircle2 className="h-4 w-4" />
                )}
                {isCompleted ? "Bloque completado" : label}
            </button>
        );
    }

    function renderCertificatePanel() {
        const isViewCertificateDisabled =
            !courseCompleted || certificateGenerating;

        const buttonLabel = certificateGenerating
            ? "Generando..."
            : certificateReady
                ? "Visualizar certificado"
                : "Generar certificado";

        return (
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${certificateReady
                                    ? "bg-emerald-50 text-emerald-700"
                                    : courseCompleted
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-blue-50 text-blue-700"
                                }`}
                        >
                            {certificateReady ? (
                                <FileCheck2 className="h-6 w-6" />
                            ) : (
                                <Award className="h-6 w-6" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-black text-slate-950">
                                Certificado del curso
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                {certificateReady
                                    ? "Tu certificado ya fue generado. Puedes visualizarlo cuando lo necesites."
                                    : courseCompleted
                                        ? "Presiona Generar certificado. Luego el botón cambiará a visualización."
                                        : "El certificado se habilitará cuando completes el 100% del curso."}
                            </p>

                            {!courseCompleted ? (
                                <p className="mt-2 text-sm font-bold text-slate-600">
                                    Progreso actual: {progress}%. Completa todos
                                    los contenidos y evaluaciones para
                                    desbloquearlo.
                                </p>
                            ) : null}

                            {certificateMessage ? (
                                <p className="mt-2 text-sm font-bold text-blue-700">
                                    {certificateMessage}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            disabled={isViewCertificateDisabled}
                            onClick={() => void handleViewCertificate()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {certificateGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : certificateReady ? (
                                <FileCheck2 className="h-4 w-4" />
                            ) : (
                                <Award className="h-4 w-4" />
                            )}

                            {buttonLabel}
                        </button>

                        {certificateFileUrl ? (
                            <a
                                href={certificateFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                <Download className="h-4 w-4" />
                                Descargar PDF
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    function renderSelectedBlockContent() {
        if (!selectedBlock) {
            return (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Lock className="h-10 w-10 text-slate-400" />

                    <h2 className="mt-4 text-xl font-black text-slate-950">
                        Selecciona una lección
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Elige un contenido, video, imagen, PDF o evaluación desde
                        el índice del curso.
                    </p>
                </div>
            );
        }

        if (selectedType === "video") {
            const videoUrl = getVideoUrlFromBlock(selectedBlock);
            const videoPreview = getVideoPreview(videoUrl);

            return (
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-sm">
                        {videoPreview?.type === "iframe" ? (
                            <iframe
                                src={videoPreview.url}
                                title={selectedTitle}
                                className="aspect-video w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                            />
                        ) : videoPreview?.type === "video" ? (
                            <video
                                src={videoPreview.url}
                                title={selectedTitle}
                                className="aspect-video w-full bg-black"
                                controls
                                controlsList="nodownload"
                            />
                        ) : (
                            <div className="flex aspect-video flex-col items-center justify-center p-6 text-center text-sm font-bold text-white">
                                <PlayCircle className="mb-3 h-10 w-10 text-white/70" />
                                <p>No se pudo generar la vista previa del video.</p>
                                <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-white/60">
                                    Verifica que el enlace sea de YouTube,
                                    Microsoft Stream, SharePoint, OneDrive o un
                                    archivo de video válido.
                                </p>
                            </div>
                        )}
                    </div>

                    {renderCompleteButton("Marcar video como completado")}
                </div>
            );
        }

        if (selectedType === "image") {
            const imageUrl = getFileUrlFromBlock(selectedBlock);
            const description = getBlockDescription(selectedBlock);

            return (
                <div className="space-y-5">
                    {description ? (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                            {description}
                        </div>
                    ) : null}

                    {imageUrl ? (
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt={selectedTitle}
                                className="max-h-[620px] w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />

                            <h3 className="mt-3 text-lg font-black text-slate-950">
                                Imagen no disponible
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Este bloque todavía no tiene una imagen cargada.
                            </p>
                        </div>
                    )}

                    {renderCompleteButton("Marcar imagen como completada")}
                </div>
            );
        }

        if (selectedType === "pdf") {
            const pdfUrl = getFileUrlFromBlock(selectedBlock);
            const protectedPdfUrl = getProtectedPdfViewerUrl(pdfUrl);
            const description = getBlockDescription(selectedBlock);

            return (
                <div className="space-y-5">
                    {description ? (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                            {description}
                        </div>
                    ) : null}

                    {pdfUrl ? (
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-sm">
                            <iframe
                                src={protectedPdfUrl}
                                title={selectedTitle || "Documento PDF"}
                                className="h-[720px] w-full bg-white"
                            />
                        </div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <FileText className="mx-auto h-10 w-10 text-slate-400" />

                            <h3 className="mt-3 text-lg font-black text-slate-950">
                                PDF no disponible
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Este bloque todavía no tiene un PDF cargado.
                            </p>
                        </div>
                    )}

                    {renderCompleteButton("Marcar PDF como completado")}
                </div>
            );
        }

        if (selectedType === "quiz") {
            const questions = normalizeQuizQuestions(selectedContent.questions);
            const storedQuizResponse = selectedBlock
                ? getQuizResponseForBlock(quizResponses, selectedBlock.id)
                : null;
            const usedAttempts = getQuizAttemptsCount(storedQuizResponse);
            const remainingAttempts = Math.max(
                0,
                MAX_QUIZ_ATTEMPTS - usedAttempts,
            );
            const isQuizCompleted = selectedBlock
                ? completedBlocks.includes(selectedBlock.id)
                : false;
            const isQuizLimitReached = usedAttempts >= MAX_QUIZ_ATTEMPTS;

            return (
                <div className="space-y-5">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-sm font-bold text-amber-800">
                            Mínimo requerido: {selectedBlock.completion_value} puntos
                        </p>

                        <p className="mt-1 text-sm leading-6 text-amber-700">
                            {getContentValue(selectedContent, "instructions") ||
                                "Responde todas las preguntas para finalizar la evaluación."}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-sm font-bold text-blue-800">
                            Intentos usados: {usedAttempts} de{" "}
                            {MAX_QUIZ_ATTEMPTS}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-700">
                            {isQuizCompleted
                                ? "Esta evaluación ya fue aprobada."
                                : isQuizLimitReached
                                    ? "Ya no tienes intentos disponibles para esta evaluación."
                                    : `Te quedan ${remainingAttempts} intento(s).`}
                        </p>
                    </div>

                    {questions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                            Esta evaluación todavía no tiene preguntas cargadas.
                        </div>
                    ) : (
                        questions.map((question, questionIndex) => (
                            <div
                                key={question.id}
                                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <h3 className="text-base font-black text-slate-950">
                                    {questionIndex + 1}. {question.question}
                                </h3>

                                <div className="mt-4 space-y-3">
                                    {question.options.map((option, optionIndex) => (
                                        <label
                                            key={`${question.id}-${optionIndex}`}
                                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${quizAnswers[question.id] ===
                                                optionIndex
                                                ? "border-blue-500 bg-blue-50 text-blue-800"
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${question.id}`}
                                                checked={
                                                    quizAnswers[question.id] ===
                                                    optionIndex
                                                }
                                                onChange={() =>
                                                    handleQuizAnswer(
                                                        question.id,
                                                        optionIndex,
                                                    )
                                                }
                                                className="h-4 w-4 accent-blue-700"
                                            />

                                            {option}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                    {quizResult ? (
                        <div
                            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${quizResult.startsWith("Evaluación aprobada")
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                                }`}
                        >
                            {quizResult}
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => void handleSubmitQuiz()}
                        disabled={quizSaving || isQuizCompleted || isQuizLimitReached}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {quizSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ClipboardList className="h-4 w-4" />
                        )}
                        {quizSaving
                            ? "Guardando respuestas..."
                            : isQuizCompleted
                                ? "Evaluación aprobada"
                                : isQuizLimitReached
                                    ? "Sin intentos disponibles"
                                    : "Finalizar evaluación"}
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-5">
                {getContentValue(selectedContent, "description") ? (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                        {getContentValue(selectedContent, "description")}
                    </div>
                ) : null}

                <div className="prose prose-slate max-w-none rounded-[24px] border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700">
                    {getContentValue(selectedContent, "body") ||
                        getContentValue(selectedContent, "text") ||
                        getContentValue(selectedContent, "content_body") ? (
                        <p className="whitespace-pre-line">
                            {getContentValue(selectedContent, "body") ||
                                getContentValue(selectedContent, "text") ||
                                getContentValue(
                                    selectedContent,
                                    "content_body",
                                )}
                        </p>
                    ) : (
                        <p className="text-slate-500">
                            Este texto todavía no tiene información cargada.
                        </p>
                    )}
                </div>

                {renderCompleteButton("Marcar texto como completado")}
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <Link
                href="/student/courses"
                className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a mis cursos
            </Link>

            {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}

            {loading ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                    <p className="mt-4 text-sm font-bold text-slate-600">
                        Cargando curso...
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-5 py-5 md:px-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Curso MOOC
                                    </div>

                                    <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                                        Aula del curso
                                    </h1>

                                    <p className="mt-2 max-w-3xl text-sm leading-5 text-slate-300">
                                        Avanza por los módulos, revisa contenidos,
                                        videos, imágenes, PDF y evaluaciones.
                                    </p>
                                </div>

                                <div className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-sm lg:w-[260px]">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                                                Progreso
                                            </p>

                                            <p className="mt-1 text-2xl font-black">
                                                {progress}%
                                            </p>
                                        </div>

                                        <p className="text-right text-xs font-semibold leading-5 text-slate-200">
                                            {completedCount} de {totalBlocks}
                                            <br />
                                            completados
                                        </p>
                                    </div>

                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                                        <div
                                            className="h-full rounded-full bg-white"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderCertificatePanel()}

                    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-black text-slate-950">
                                Contenido del curso
                            </h2>

                            <div className="mt-5 space-y-4">
                                {modules.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                                        Este curso todavía no tiene módulos.
                                    </div>
                                ) : (
                                    modules.map((moduleItem, moduleIndex) => {
                                        const isModuleOpen =
                                            openModules[moduleItem.id] ?? true;

                                        return (
                                            <div
                                                key={moduleItem.id}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenModules(
                                                            (current) => ({
                                                                ...current,
                                                                [moduleItem.id]:
                                                                    !isModuleOpen,
                                                            }),
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-between gap-3 text-left"
                                                >
                                                    <span>
                                                        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                                                            Módulo {moduleIndex + 1}
                                                        </span>

                                                        <span className="block text-sm font-black text-slate-950">
                                                            {moduleItem.name}
                                                        </span>
                                                    </span>

                                                    <ChevronDown
                                                        className={`h-5 w-5 text-slate-500 transition ${isModuleOpen
                                                            ? ""
                                                            : "-rotate-90"
                                                            }`}
                                                    />
                                                </button>

                                                {isModuleOpen ? (
                                                    <div className="mt-4 space-y-3">
                                                        {moduleItem.lessons.map(
                                                            (
                                                                lessonItem,
                                                                lessonIndex,
                                                            ) => {
                                                                const isLessonOpen =
                                                                    openLessons[
                                                                    lessonItem.id
                                                                    ] ?? true;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            lessonItem.id
                                                                        }
                                                                        className="rounded-xl bg-white p-3"
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setOpenLessons(
                                                                                    (
                                                                                        current,
                                                                                    ) => ({
                                                                                        ...current,
                                                                                        [lessonItem.id]:
                                                                                            !isLessonOpen,
                                                                                    }),
                                                                                )
                                                                            }
                                                                            className="flex w-full items-center justify-between gap-3 text-left"
                                                                        >
                                                                            <span className="text-sm font-black text-slate-800">
                                                                                Lección{" "}
                                                                                {lessonIndex +
                                                                                    1}
                                                                                :{" "}
                                                                                {
                                                                                    lessonItem.name
                                                                                }
                                                                            </span>

                                                                            <ChevronDown
                                                                                className={`h-4 w-4 text-slate-500 transition ${isLessonOpen
                                                                                    ? ""
                                                                                    : "-rotate-90"
                                                                                    }`}
                                                                            />
                                                                        </button>

                                                                        {isLessonOpen ? (
                                                                            <div className="mt-3 space-y-2">
                                                                                {lessonItem
                                                                                    .blocks
                                                                                    .length ===
                                                                                    0 ? (
                                                                                    <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                                                                                        Sin
                                                                                        contenido.
                                                                                    </p>
                                                                                ) : (
                                                                                    lessonItem.blocks.map(
                                                                                        (
                                                                                            block,
                                                                                        ) => {
                                                                                            const type =
                                                                                                getLessonItemType(
                                                                                                    block,
                                                                                                );
                                                                                            const isSelected =
                                                                                                selectedBlock?.id ===
                                                                                                block.id;
                                                                                            const isCompleted =
                                                                                                completedBlocks.includes(
                                                                                                    block.id,
                                                                                                );

                                                                                            return (
                                                                                                <button
                                                                                                    key={
                                                                                                        block.id
                                                                                                    }
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        handleSelectBlock(
                                                                                                            block,
                                                                                                        )
                                                                                                    }
                                                                                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${isSelected
                                                                                                        ? "bg-blue-700 text-white"
                                                                                                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                                                                                        }`}
                                                                                                >
                                                                                                    {isCompleted ? (
                                                                                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                                                                    ) : (
                                                                                                        renderItemIcon(
                                                                                                            type,
                                                                                                            "h-4 w-4 shrink-0",
                                                                                                        )
                                                                                                    )}

                                                                                                    <span className="min-w-0">
                                                                                                        <span className="block truncate text-sm font-bold">
                                                                                                            {getBlockTitle(
                                                                                                                block,
                                                                                                            )}
                                                                                                        </span>

                                                                                                        <span
                                                                                                            className={`block text-xs font-semibold ${isSelected
                                                                                                                ? "text-blue-100"
                                                                                                                : "text-slate-500"
                                                                                                                }`}
                                                                                                        >
                                                                                                            {getItemLabel(
                                                                                                                type,
                                                                                                            )}
                                                                                                        </span>
                                                                                                    </span>
                                                                                                </button>
                                                                                            );
                                                                                        },
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </aside>

                        <main className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            {selectedBlock ? (
                                <div className="mb-6 border-b border-slate-200 pb-5">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                                        {renderItemIcon(selectedType, "h-3.5 w-3.5")}
                                        {getItemLabel(selectedType)}
                                    </div>

                                    <h2 className="mt-4 text-2xl font-black text-slate-950">
                                        {selectedTitle}
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        {completedBlocks.includes(selectedBlock.id)
                                            ? "Este bloque ya está completado."
                                            : "Completa este bloque para avanzar en tu curso."}
                                    </p>
                                </div>
                            ) : null}

                            {renderSelectedBlockContent()}
                        </main>
                    </div>
                </>
            )}
        </section>
    );
}

export default StudentMoocCourseView;