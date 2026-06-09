"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Course } from "@/services/courses.service";
import { getCourseById } from "@/services/courses.service";
import { getModulesByCourse } from "@/services/modules.service";
import {
    getLessonBlocksByLesson,
    getLessonsByModule,
    type LessonBlock,
} from "@/services/lessons.service";
import {
    completeBlockProgress,
    getProgressByEnrollment,
    type BlockProgress,
} from "@/services/progress.service";
import { getEnrollmentsByUser } from "@/services/enrollments.service";
import {
    createQuizzResponse,
    getQuizzResponsesByEnrollment,
    getQuizzResponsesByLessonBlock,
    updateQuizzResponse,
    type QuizzResponse,
} from "@/services/quizz-response.service";
import {
    createForumResponse,
    getForumResponsesByLessonBlock,
} from "@/services/forum-response.service";
import {
    getCertificatesByCourse,
    getCertificateTemplate,
    reissueCertificateFromTemplate,
    type Certificate,
} from "@/services/certificates.service";
import {
    createHomeworkResponse,
    getHomeworkResponseByEnrollmentAndBlock,
    updateHomeworkResponse,
} from "@/services/homework-response.service";
import { getAuthSession } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { MAX_QUIZ_ATTEMPTS } from "./constants";
import {
    canMarkAttendance,
    getAttendanceRecordForSession,
    getAttendanceRecordsByEnrollment,
    getAttendanceSessionsByCourse,
    saveStudentAttendance,
    upsertAttendanceRecord,
} from "./attendance";
import {
    createSurveyResponseFlexible,
    loadStudentResponseMaps,
    updateSurveyResponseFlexible,
} from "./api";
import { buildCertificateValues, canGenerateCertificate } from "./certificate";
import { getCompletedBlockIds } from "./progress";
import {
    getQuizAttemptsCount,
    getQuizLimitMessage,
    getQuizResponseForBlock,
    getQuizResponseForEnrollmentFromLessonBlock,
    normalizeQuizQuestions,
    parseStoredQuizResponse,
    upsertQuizResponse,
} from "./quiz";
import type {
    AttendanceRecord,
    AttendanceSession,
    CourseTab,
    CourseWithImageFields,
    ModuleView,
    QuizAnswers,
    SessionUserWithRole,
    StudentBlockResponse,
} from "./types";
import {
    findApprovedEnrollment,
    formatCourseLevel,
    getAverageQuizScore,
    getBlockContent,
    getBlockTitle,
    getCertificateFileUrl,
    getCertificateTargetUrl,
    getCourseDescription,
    getCourseDurationLabel,
    getCourseImageUrl,
    getEnrollmentStudentName,
    getErrorMessage,
    getFileUrlFromBlock,
    getLessonItemType,
    getQuizBlocks,
    getStudentResponseFileUrl,
    getStudentResponseText,
    getSurveyAnswersFromResponse,
    getUniqueNumbers,
    normalizeSurveyQuestions,
    sortByOrder,
} from "./utils";

type HookRecord = Record<string, unknown>;

function hasCompletedBlock(
    completedBlockIds: number[],
    blockId: number,
): boolean {
    return completedBlockIds.some(
        (currentBlockId) =>
            Number(currentBlockId) === Number(blockId),
    );
}

function toHookRecord(value: unknown): HookRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as HookRecord;
}

function cleanHookText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

function toHookBoolean(value: unknown) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        return ["true", "1", "yes", "si", "sí", "mdt"].includes(normalized);
    }

    return false;
}

function readBooleanFromHookRecord(record: unknown, keys: string[]) {
    const currentRecord = toHookRecord(record);

    if (!currentRecord) return false;

    for (const key of keys) {
        if (key in currentRecord) {
            return toHookBoolean(currentRecord[key]);
        }
    }

    return false;
}

function getIsMdtFromCourse(course: unknown) {
    return readBooleanFromHookRecord(course, [
        "is_mdt",
        "isMdt",
        "isMdtCourse",
        "mdt",
        "course_is_mdt",
    ]);
}

function findDeepHookText(source: unknown, keys: string[]): string {
    const record = toHookRecord(source);

    if (!record) return "";

    for (const key of keys) {
        const value = record[key];
        const text = cleanHookText(value);

        if (text) return text;
    }

    for (const value of Object.values(record)) {
        if (value && typeof value === "object") {
            const found = findDeepHookText(value, keys);

            if (found) return found;
        }
    }

    return "";
}

function getStudentIdNumberFromSources(...sources: unknown[]) {
    const keys = [
        "idnumber",
        "id_number",
        "identification",
        "identification_number",
        "cedula",
        "dni",
        "document",
        "document_number",
    ];

    for (const source of sources) {
        const value = findDeepHookText(source, keys).replace(/\s+/g, "");

        if (value) return value;
    }

    return "";
}

function getAnsweredForumBlockIds(
    forumMap: Record<number, StudentBlockResponse[]>,
) {
    return Object.entries(forumMap)
        .filter(([, responses]) => Array.isArray(responses) && responses.length > 0)
        .map(([blockId]) => Number(blockId))
        .filter((blockId) => Number.isFinite(blockId) && blockId > 0);
}

export function useCourseRoom(courseId: string) {
    const numericCourseId = useMemo(() => Number(courseId), [courseId]);

    const refreshInProgressRef = useRef(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [modules, setModules] = useState<ModuleView[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<LessonBlock | null>(
        null,
    );
    const [openModules, setOpenModules] = useState<Record<number, boolean>>(
        {},
    );
    const [openLessons, setOpenLessons] = useState<Record<number, boolean>>(
        {},
    );
    const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);
    const [progressRecords, setProgressRecords] = useState<BlockProgress[]>(
        [],
    );
    const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
    const [progressSavingBlockId, setProgressSavingBlockId] = useState<
        number | null
    >(null);

    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
    const [quizResponses, setQuizResponses] = useState<QuizzResponse[]>([]);
    const [quizResult, setQuizResult] = useState("");
    const [quizSaving, setQuizSaving] = useState(false);

    const [homeworkResponses, setHomeworkResponses] = useState<
        Record<number, StudentBlockResponse | null>
    >({});
    const [surveyResponses, setSurveyResponses] = useState<
        Record<number, StudentBlockResponse | null>
    >({});
    const [forumResponses, setForumResponses] = useState<
        Record<number, StudentBlockResponse[]>
    >({});

    const [homeworkText, setHomeworkText] = useState("");
    const [homeworkFile, setHomeworkFile] = useState<File | null>(null);

    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>(
        {},
    );
    const [forumText, setForumText] = useState("");

    const [studentResponseSaving, setStudentResponseSaving] = useState(false);
    const [studentResponseMessage, setStudentResponseMessage] = useState("");

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [studentUserId, setStudentUserId] = useState<number | null>(null);
    const [studentName, setStudentName] = useState("");
    const [studentIdNumber, setStudentIdNumber] = useState("");
    const [authUser, setAuthUser] = useState<SessionUserWithRole | null>(null);

    const [course, setCourse] = useState<CourseWithImageFields | null>(null);
    const [isMdtCourse, setIsMdtCourse] = useState(false);

    const [courseName, setCourseName] = useState("");
    const [courseImageUrl, setCourseImageUrl] = useState("");
    const [courseDescription, setCourseDescription] = useState("");
    const [courseLevel, setCourseLevel] = useState("Principiante");
    const [courseDuration, setCourseDuration] = useState("4 semanas");

    const [activeTab, setActiveTab] = useState<CourseTab>("summary");

    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [certificateMessage, setCertificateMessage] = useState("");
    const [certificateGenerating, setCertificateGenerating] = useState(false);

    const [attendanceSessions, setAttendanceSessions] = useState<
        AttendanceSession[]
    >([]);
    const [attendanceRecords, setAttendanceRecords] = useState<
        AttendanceRecord[]
    >([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceSavingSessionId, setAttendanceSavingSessionId] = useState<
        number | null
    >(null);
    const [attendanceMessage, setAttendanceMessage] = useState("");
    const [attendanceCodeBySession, setAttendanceCodeBySession] = useState<
        Record<number, string>
    >({});

    const allBlocks = useMemo(
        () =>
            modules.flatMap((moduleItem) =>
                moduleItem.lessons.flatMap((lessonItem) => lessonItem.blocks),
            ),
        [modules],
    );

    const selectedType = selectedBlock
        ? getLessonItemType(selectedBlock)
        : "text";
    const selectedContent = getBlockContent(selectedBlock);
    const selectedTitle = selectedBlock ? getBlockTitle(selectedBlock) : "";

    const totalBlocks = allBlocks.length;

    const completedCount = allBlocks.filter((block) =>
        hasCompletedBlock(completedBlocks, block.id),
    ).length;

    const progress =
        totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;

    const courseCompleted = totalBlocks > 0 && completedCount === totalBlocks;

    const certificateFileUrl = getCertificateFileUrl(certificate);
    const certificateTargetUrl = getCertificateTargetUrl(certificate);

    /*
     * El certificado solamente se considera generado cuando ya existe
     * el archivo PDF definitivo. Tener un registro o una URL auxiliar
     * no significa que el estudiante ya lo haya generado.
     */
    const certificateReady = Boolean(certificate && certificateFileUrl);

    const studentInitials = useMemo(() => {
        const words = (studentName || "Estudiante")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) return "ES";

        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }

        return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }, [studentName]);

    const heroImageUrl = useMemo(() => {
        if (courseImageUrl) return courseImageUrl;

        const imageBlock = allBlocks.find(
            (block) => getLessonItemType(block) === "image",
        );

        return getFileUrlFromBlock(imageBlock ?? null);
    }, [allBlocks, courseImageUrl]);

    const upcomingBlocks = useMemo(
        () =>
            allBlocks
                .filter(
                    (block) =>
                        !hasCompletedBlock(completedBlocks, block.id),
                )
                .slice(0, 3),
        [allBlocks, completedBlocks],
    );

    const quizBlocks = useMemo(() => getQuizBlocks(allBlocks), [allBlocks]);

    const videoBlocks = useMemo(
        () => allBlocks.filter((block) => getLessonItemType(block) === "video"),
        [allBlocks],
    );

    const resourceBlocks = useMemo(
        () =>
            allBlocks.filter((block) =>
                ["text", "image", "pdf"].includes(getLessonItemType(block)),
            ),
        [allBlocks],
    );

    const averageScore = getAverageQuizScore(quizResponses, allBlocks);

    const markedAttendanceCount = attendanceSessions.filter((session) =>
        getAttendanceRecordForSession(attendanceRecords, session.id),
    ).length;

    const attendanceProgress =
        attendanceSessions.length > 0
            ? Math.round(
                (markedAttendanceCount / attendanceSessions.length) * 100,
            )
            : 0;

    async function refreshAttendance(
        currentCourseId: number,
        currentEnrollmentId: number,
    ) {
        try {
            setAttendanceLoading(true);
            setAttendanceMessage("");

            const [sessions, records] = await Promise.all([
                getAttendanceSessionsByCourse(currentCourseId),
                getAttendanceRecordsByEnrollment(currentEnrollmentId),
            ]);

            setAttendanceSessions(sessions);
            setAttendanceRecords(records);
        } catch (error) {
            setAttendanceSessions([]);
            setAttendanceRecords([]);
            setAttendanceMessage(getErrorMessage(error));
        } finally {
            setAttendanceLoading(false);
        }
    }

    async function refreshProgress(
        currentEnrollmentId: number,
        completedFallbackIds: number[] = [],
    ) {
        const response = await getProgressByEnrollment(currentEnrollmentId);

        const nextCompletedBlocks = getUniqueNumbers([
            ...getCompletedBlockIds(response),
            ...completedFallbackIds,
        ]);

        setProgressRecords(response);
        setCompletedBlocks(nextCompletedBlocks);

        return nextCompletedBlocks;
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

    const loadCourseContent = useCallback(async (manualRefresh = false) => {
        if (manualRefresh && refreshInProgressRef.current) return;

        let toastId: string | number | undefined;

        if (manualRefresh) {
            refreshInProgressRef.current = true;
            setIsRefreshing(true);
            toastId = notify.loading(
                "Actualizando aula...",
                "Estamos consultando el contenido más reciente del curso.",
            );
        } else {
            setLoading(true);
        }

        try {
            setErrorMessage("");
            setCertificateMessage("");

            if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
                throw new Error("No se pudo identificar el curso.");
            }

            const session = getAuthSession();
            const sessionUser =
                session?.user as SessionUserWithRole | undefined;
            const currentAuthUser = sessionUser ?? null;
            const userId = Number(sessionUser?.id);

            setAuthUser(currentAuthUser);

            if (!userId || Number.isNaN(userId)) {
                throw new Error(
                    "No se pudo identificar al estudiante autenticado.",
                );
            }

            const [courseModules, userEnrollments, courseDetail] =
                await Promise.all([
                    getModulesByCourse(numericCourseId),
                    getEnrollmentsByUser(userId),
                    getCourseById(numericCourseId).catch(() => null),
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

            const progressResponse = await getProgressByEnrollment(
                activeEnrollment.id,
            );

            let quizResponsesResponse: QuizzResponse[] = [];
            let courseCertificates: Certificate[] = [];

            try {
                quizResponsesResponse = await getQuizzResponsesByEnrollment(
                    activeEnrollment.id,
                );
            } catch {
                quizResponsesResponse = [];
            }

            try {
                courseCertificates = await getCertificatesByCourse(
                    numericCourseId,
                    {
                        onlyValid: false,
                    },
                );
            } catch {
                courseCertificates = [];
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
                        Number(item.course_id) === numericCourseId,
                ) ?? null;

            const flatBlocks = modulesWithLessons.flatMap((moduleItem) =>
                moduleItem.lessons.flatMap((lessonItem) => lessonItem.blocks),
            );

            const studentResponseMaps = await loadStudentResponseMaps(
                flatBlocks,
                activeEnrollment.id,
            );

            const enrollmentRecord = activeEnrollment as unknown as HookRecord;
            const enrollmentCourse = toHookRecord(enrollmentRecord.course);
            const enrollmentUser = toHookRecord(enrollmentRecord.user);

            const currentCourseDetail = {
                ...(enrollmentCourse ?? {}),
                ...((courseDetail as CourseWithImageFields | null) ?? {}),
            } as CourseWithImageFields;

            const currentIsMdtCourse = getIsMdtFromCourse(currentCourseDetail);

            const currentStudentIdNumber = getStudentIdNumberFromSources(
                enrollmentUser,
                activeEnrollment,
                currentAuthUser,
            );

            void refreshAttendance(numericCourseId, activeEnrollment.id);

            setEnrollmentId(activeEnrollment.id);
            setStudentUserId(userId);
            setStudentName(getEnrollmentStudentName(activeEnrollment));
            setStudentIdNumber(currentStudentIdNumber);

            setCourse(currentCourseDetail);
            setIsMdtCourse(currentIsMdtCourse);

            setCourseName(
                currentCourseDetail?.name ||
                activeEnrollment.course?.name ||
                `Curso #${numericCourseId}`,
            );

            setCourseImageUrl(getCourseImageUrl(currentCourseDetail));
            setCourseDescription(
                getCourseDescription(currentCourseDetail as Course | null),
            );
            setCourseLevel(formatCourseLevel(currentCourseDetail?.level));
            setCourseDuration(
                getCourseDurationLabel(currentCourseDetail as Course | null),
            );

            setCertificate(existingCertificate);
            setCertificateMessage(
                existingCertificate &&
                    getCertificateFileUrl(existingCertificate)
                    ? "Tu certificado ya está disponible."
                    : "",
            );

            setProgressRecords(progressResponse);
            setQuizResponses(quizResponsesResponse);

            setHomeworkResponses(studentResponseMaps.homework);
            setSurveyResponses(studentResponseMaps.survey);
            setForumResponses(studentResponseMaps.forum);

            const completedFromProgress = getCompletedBlockIds(progressResponse);

            const completedFromAnsweredForums = getAnsweredForumBlockIds(
                studentResponseMaps.forum,
            );

            const nextCompletedBlocks = getUniqueNumbers([
                ...completedFromProgress,
                ...completedFromAnsweredForums,
            ]);

            setCompletedBlocks(nextCompletedBlocks);
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

            if (manualRefresh) {
                if (toastId !== undefined) {
                    notify.dismiss(toastId);
                    toastId = undefined;
                }

                notify.success(
                    "Aula actualizada correctamente.",
                    "El contenido y tu progreso se encuentran al día.",
                );
            }
        } catch (error) {
            const message = getErrorMessage(error);

            setErrorMessage(message);

            if (manualRefresh) {
                if (toastId !== undefined) {
                    notify.dismiss(toastId);
                    toastId = undefined;
                }

                notify.error(
                    "No se pudo actualizar el aula.",
                    message,
                );

                return;
            }

            setModules([]);
            setSelectedBlock(null);
            setCompletedBlocks([]);
            setProgressRecords([]);
            setQuizResponses([]);

            setHomeworkResponses({});
            setSurveyResponses({});
            setForumResponses({});

            setHomeworkText("");
            setHomeworkFile(null);
            setSurveyAnswers({});
            setForumText("");
            setStudentResponseMessage("");

            setEnrollmentId(null);
            setStudentUserId(null);
            setStudentName("");
            setStudentIdNumber("");
            setAuthUser(null);

            setCourse(null);
            setIsMdtCourse(false);

            setCourseName("");
            setCourseImageUrl("");
            setCourseDescription("");
            setCourseLevel("Principiante");
            setCourseDuration("4 semanas");
            setActiveTab("content");

            setCertificate(null);
            setCertificateMessage("");

            setAttendanceSessions([]);
            setAttendanceRecords([]);
            setAttendanceCodeBySession({});
            setAttendanceMessage("");
        } finally {
            if (toastId !== undefined) {
                notify.dismiss(toastId);
            }

            if (manualRefresh) {
                refreshInProgressRef.current = false;
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
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

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (!selectedBlock) {
                setHomeworkText("");
                setHomeworkFile(null);
                setSurveyAnswers({});
                setForumText("");
                setStudentResponseMessage("");
                return;
            }

            const type = getLessonItemType(selectedBlock);

            if (type === "homework") {
                const response = homeworkResponses[selectedBlock.id] ?? null;

                setHomeworkText(getStudentResponseText(response));
                setHomeworkFile(null);
            }

            if (type === "survey") {
                setSurveyAnswers(
                    getSurveyAnswersFromResponse(
                        surveyResponses[selectedBlock.id] ?? null,
                    ),
                );
            }

            if (type === "forum") {
                setForumText("");
            }

            setStudentResponseMessage("");
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [selectedBlock, homeworkResponses, surveyResponses]);

    async function generateCertificateIfCourseFinished(
        nextCompletedBlocks: number[],
        nextQuizResponses: QuizzResponse[] = quizResponses,
    ) {
        if (certificateGenerating) return null;

        if (certificate && getCertificateFileUrl(certificate)) {
            setCertificateMessage(
                "Tu certificado ya fue generado. Puedes visualizarlo.",
            );

            return certificate;
        }

        if (!studentUserId || !enrollmentId || !numericCourseId) {
            const message =
                "No se pudo identificar al estudiante o la matrícula.";

            setCertificateMessage(message);
            notify.error(
                "No se pudo generar el certificado.",
                message,
            );

            return null;
        }

        if (
            !canGenerateCertificate(
                allBlocks,
                nextCompletedBlocks,
                nextQuizResponses,
            )
        ) {
            const message =
                "Primero debes completar el 100% del curso y aprobar las evaluaciones.";

            setCertificateMessage(message);
            notify.info(
                "Certificado todavía bloqueado.",
                message,
            );

            return null;
        }

        const certificateId = certificate?.id;

        if (!certificateId) {
            const message =
                "No existe un registro de certificado asignado al estudiante. El backend debe crear primero el certificado para poder actualizarlo mediante PUT.";

            setCertificateMessage(message);
            notify.warning(
                "Certificado no asignado.",
                message,
            );

            return null;
        }

        let toastId: string | number | undefined;

        const dismissGenerationToast = () => {
            if (toastId === undefined) return;

            notify.dismiss(toastId);
            toastId = undefined;
        };

        try {
            setCertificateGenerating(true);
            setCertificateMessage("");

            toastId = notify.loading(
                "Generando certificado...",
                "Estamos preparando tu certificado institucional.",
            );

            const template = await getCertificateTemplate(
                numericCourseId,
            );

            if (!template.id) {
                const message =
                    "Curso terminado, pero aún no existe una plantilla de certificado para este curso.";

                setCertificateMessage(message);

                dismissGenerationToast();

                notify.warning(
                    "Plantilla no disponible.",
                    message,
                );

                return null;
            }

            const values = buildCertificateValues({
                studentName,
                courseName,
                courseId: numericCourseId,
                certificate,
                quizResponses: nextQuizResponses,
                allBlocks,
            });

            const generated =
                await reissueCertificateFromTemplate({
                    certificateId,
                    userId: studentUserId,
                    courseId: numericCourseId,
                    template,
                    values,
                });

            setCertificate(generated);

            setCertificateMessage(
                "Tu certificado se generó correctamente. Ahora presiona Visualizar certificado para abrirlo.",
            );

            dismissGenerationToast();

            notify.success(
                "Certificado generado correctamente.",
                "El archivo ya se encuentra disponible. Presiona Visualizar certificado para abrirlo o utiliza Descargar PDF.",
            );

            return generated;
        } catch (error) {
            const rawMessage = getErrorMessage(error);

            const message =
                rawMessage.includes("403") ||
                    rawMessage
                        .toLowerCase()
                        .includes("forbidden") ||
                    rawMessage
                        .toLowerCase()
                        .includes("permisos")
                    ? "No se pudo generar el certificado porque el backend no permite que el estudiante cree o actualice certificados."
                    : rawMessage;

            setCertificateMessage(message);

            dismissGenerationToast();

            notify.error(
                "No se pudo generar el certificado.",
                message,
            );

            return null;
        } finally {
            dismissGenerationToast();
            setCertificateGenerating(false);
        }
    }

    async function handleViewCertificate() {
        setCertificateMessage("");

        if (!courseCompleted) {
            const message =
                `El certificado se habilitará cuando llegues al 100%. Progreso actual: ${progress}%.`;

            setCertificateMessage(message);
            notify.info("Certificado todavía bloqueado.", message);

            return;
        }

        if (certificateGenerating) return;

        const currentFileUrl = getCertificateFileUrl(certificate);
        const currentTargetUrl = getCertificateTargetUrl(certificate);

        /*
         * Si el PDF ya existe, el botón funciona como visualización.
         */
        if (certificate && currentFileUrl && currentTargetUrl) {
            window.open(
                currentTargetUrl,
                "_blank",
                "noopener,noreferrer",
            );

            return;
        }

        /*
         * Si todavía no existe el PDF, el primer clic solamente lo genera.
         * Después de actualizarse el estado, el botón cambiará automáticamente
         * a "Visualizar certificado".
         */
        const generated = await generateCertificateIfCourseFinished(
            completedBlocks,
            quizResponses,
        );

        if (!generated) return;

        const generatedFileUrl = getCertificateFileUrl(generated);

        if (!generatedFileUrl) {
            const message =
                "El certificado fue procesado, pero todavía no tiene un archivo PDF disponible.";

            setCertificateMessage(message);
            notify.warning("Archivo no disponible.", message);

            return;
        }

        setCertificateMessage(
            "Tu certificado se generó correctamente. Ahora presiona Visualizar certificado para abrirlo.",
        );
    }

    async function markBlockAsCompleted(
        blockId: number,
        options?: {
            showToast?: boolean;
        },
    ) {
        const showToast = options?.showToast ?? true;

        if (hasCompletedBlock(completedBlocks, blockId)) {
            return completedBlocks;
        }

        if (!enrollmentId) {
            const message =
                "No se pudo identificar la matrícula del estudiante.";

            setErrorMessage(message);

            if (showToast) {
                notify.error("No se pudo actualizar el progreso.", message);
            }

            return null;
        }

        try {
            setProgressSavingBlockId(blockId);
            setErrorMessage("");

            /*
             * Se actualiza inmediatamente la interfaz.
             * Después se conserva el bloque recién completado aunque
             * la consulta de progreso tarde en reflejar el cambio.
             */
            setCompletedBlocks((current) =>
                getUniqueNumbers([
                    ...current,
                    blockId,
                ]),
            );

            await completeBlockProgress(enrollmentId, blockId);

            const completedBlockIds = await refreshProgress(
                enrollmentId,
                [blockId],
            );

            if (showToast) {
                notify.success(
                    "Contenido completado.",
                    "Tu progreso dentro del curso fue actualizado.",
                );
            }

            return completedBlockIds;
        } catch (error) {
            const message = getErrorMessage(error);

            setCompletedBlocks((current) =>
                current.filter(
                    (currentBlockId) =>
                        Number(currentBlockId) !== Number(blockId),
                ),
            );

            setErrorMessage(message);

            if (showToast) {
                notify.error("No se pudo actualizar el progreso.", message);
            }

            return null;
        } finally {
            setProgressSavingBlockId(null);
        }
    }

    function handleSelectBlock(block: LessonBlock) {
        setSelectedBlock(block);
        setQuizAnswers({});
        setQuizResult(getQuizLimitMessage(quizResponses, block));
        setStudentResponseMessage("");

        if (getLessonItemType(block) === "quiz" && enrollmentId) {
            void refreshQuizResponseForBlock(block.id, enrollmentId)
                .then((response) => {
                    if (!response) return;

                    setQuizResult(
                        getQuizAttemptsCount(response) >= MAX_QUIZ_ATTEMPTS
                            ? "Ya alcanzaste el máximo de 3 intentos para esta evaluación."
                            : "",
                    );
                })
                .catch(() => undefined);
        }
    }

    async function refreshStudentResponsesForBlock(block: LessonBlock) {
        if (!enrollmentId) return;

        const maps = await loadStudentResponseMaps([block], enrollmentId);
        const type = getLessonItemType(block);

        if (type === "homework") {
            setHomeworkResponses((current) => ({
                ...current,
                [block.id]: maps.homework[block.id] ?? null,
            }));
        }

        if (type === "survey") {
            setSurveyResponses((current) => ({
                ...current,
                [block.id]: maps.survey[block.id] ?? null,
            }));
        }

        if (type === "forum") {
            setForumResponses((current) => ({
                ...current,
                [block.id]: maps.forum[block.id] ?? [],
            }));
        }
    }

    async function handleSubmitHomework() {
        if (!selectedBlock || getLessonItemType(selectedBlock) !== "homework") {
            return;
        }

        if (studentResponseSaving) return;

        if (!enrollmentId) {
            const message =
                "No se pudo identificar la matrícula del estudiante.";

            setStudentResponseMessage(message);
            notify.error("No se pudo enviar la tarea.", message);

            return;
        }

        const cleanAnswer = homeworkText.trim();

        if (!homeworkFile) {
            const message =
                "Selecciona un archivo antes de enviar la tarea.";

            setStudentResponseMessage(message);
            notify.warning("Archivo requerido.", message);

            return;
        }

        const existing = homeworkResponses[selectedBlock.id] ?? null;
        const toastId = notify.loading(
            existing?.id ? "Actualizando tarea..." : "Enviando tarea...",
            "Estamos guardando tu archivo de evidencia.",
        );

        try {
            setStudentResponseSaving(true);
            setStudentResponseMessage("");

            let savedResponse: StudentBlockResponse | null = null;
            let wasUpdate = Boolean(existing?.id);

            if (existing?.id) {
                const updated = await updateHomeworkResponse(existing.id, {
                    comment: cleanAnswer || null,
                    file: homeworkFile,
                });

                savedResponse = updated as unknown as StudentBlockResponse;
            } else {
                try {
                    const created = await createHomeworkResponse({
                        enrollment_id: enrollmentId,
                        lesson_block_id: selectedBlock.id,
                        comment: cleanAnswer || null,
                        file: homeworkFile,
                    });

                    savedResponse = created as unknown as StudentBlockResponse;
                } catch (error) {
                    const message = getErrorMessage(error).toLowerCase();

                    if (!message.includes("ya fue enviada")) {
                        throw error;
                    }

                    const currentResponse =
                        await getHomeworkResponseByEnrollmentAndBlock(
                            enrollmentId,
                            selectedBlock.id,
                        );

                    const updated = await updateHomeworkResponse(
                        currentResponse.id,
                        {
                            comment: cleanAnswer || null,
                            file: homeworkFile,
                        },
                    );

                    savedResponse = updated as unknown as StudentBlockResponse;
                    wasUpdate = true;
                }
            }

            setHomeworkResponses((current) => ({
                ...current,
                [selectedBlock.id]: savedResponse,
            }));

            await refreshStudentResponsesForBlock(selectedBlock);
            await markBlockAsCompleted(selectedBlock.id, {
                showToast: false,
            });

            setHomeworkFile(null);

            const message = wasUpdate
                ? "Tarea actualizada correctamente."
                : "Tarea enviada correctamente.";

            setStudentResponseMessage(message);
            notify.dismiss(toastId);
            notify.success(
                wasUpdate ? "Tarea actualizada." : "Tarea enviada.",
                message,
            );
        } catch (error) {
            const message = getErrorMessage(error);

            setStudentResponseMessage(message);
            notify.dismiss(toastId);
            notify.error("No se pudo guardar la tarea.", message);
        } finally {
            setStudentResponseSaving(false);
        }
    }

    async function handleSubmitSurvey() {
        if (!selectedBlock || getLessonItemType(selectedBlock) !== "survey") {
            return;
        }

        if (studentResponseSaving) return;

        if (!enrollmentId) {
            const message =
                "No se pudo identificar la matrícula del estudiante.";

            setStudentResponseMessage(message);
            notify.error("No se pudo enviar la encuesta.", message);

            return;
        }

        const questions = normalizeSurveyQuestions(
            selectedContent.questions ??
            selectedContent.preguntas ??
            selectedContent.items,
        );

        if (questions.length === 0) {
            const message = "Esta encuesta todavía no tiene preguntas.";

            setStudentResponseMessage(message);
            notify.warning("Encuesta sin preguntas.", message);

            return;
        }

        const hasMissingRequired = questions.some(
            (question) =>
                question.required &&
                !String(surveyAnswers[question.id] ?? "").trim(),
        );

        if (hasMissingRequired) {
            const message =
                "Responde todas las preguntas obligatorias antes de guardar.";

            setStudentResponseMessage(message);
            notify.warning("Encuesta incompleta.", message);

            return;
        }

        const existing = surveyResponses[selectedBlock.id] ?? null;

        const payload = {
            enrollment_id: enrollmentId,
            enrollmentId,
            lesson_block_id: selectedBlock.id,
            lessonBlockId: selectedBlock.id,
            survey: getBlockContent(selectedBlock),
            response: {
                answers: surveyAnswers,
                submitted_at: new Date().toISOString(),
            },
            answers: surveyAnswers,
        };

        const toastId = notify.loading(
            existing?.id ? "Actualizando encuesta..." : "Enviando encuesta...",
            "Estamos registrando tus respuestas.",
        );

        try {
            setStudentResponseSaving(true);
            setStudentResponseMessage("");

            const saved = existing?.id
                ? await updateSurveyResponseFlexible(existing.id, payload)
                : await createSurveyResponseFlexible(payload);

            setSurveyResponses((current) => ({
                ...current,
                [selectedBlock.id]: saved,
            }));

            await refreshStudentResponsesForBlock(selectedBlock);
            await markBlockAsCompleted(selectedBlock.id, {
                showToast: false,
            });

            const message = existing?.id
                ? "Encuesta actualizada correctamente."
                : "Encuesta enviada correctamente.";

            setStudentResponseMessage(message);
            notify.dismiss(toastId);
            notify.success(
                existing?.id ? "Encuesta actualizada." : "Encuesta enviada.",
                message,
            );
        } catch (error) {
            const message = getErrorMessage(error);

            setStudentResponseMessage(message);
            notify.dismiss(toastId);
            notify.error("No se pudo guardar la encuesta.", message);
        } finally {
            setStudentResponseSaving(false);
        }
    }

    const refreshForumResponses = useCallback(
        async (lessonBlockId: number) => {
            const validLessonBlockId = Number(lessonBlockId);

            if (
                !Number.isFinite(validLessonBlockId) ||
                validLessonBlockId <= 0
            ) {
                return;
            }

            const responses = await getForumResponsesByLessonBlock(
                validLessonBlockId,
            );

            setForumResponses((current) => ({
                ...current,
                [validLessonBlockId]:
                    responses as unknown as StudentBlockResponse[],
            }));
        },
        [],
    );

    async function handleSubmitForumResponse() {
        if (studentResponseSaving) return;

        if (!selectedBlock?.id) {
            const message = "No se encontró el foro seleccionado.";

            setStudentResponseMessage(message);
            notify.error("No se pudo publicar la participación.", message);

            return;
        }

        const validEnrollmentId = Number(enrollmentId);

        if (!Number.isFinite(validEnrollmentId) || validEnrollmentId <= 0) {
            const message = "ID de matrícula no válido.";

            setStudentResponseMessage(message);
            notify.error("No se pudo publicar la participación.", message);

            return;
        }

        const validLessonBlockId = Number(selectedBlock.id);

        if (!Number.isFinite(validLessonBlockId) || validLessonBlockId <= 0) {
            const message = "ID de bloque no válido.";

            setStudentResponseMessage(message);
            notify.error("No se pudo publicar la participación.", message);

            return;
        }

        const comment = forumText.trim();

        if (!comment) {
            const message = "Escribe tu participación antes de publicar.";

            setStudentResponseMessage(message);
            notify.warning("Participación requerida.", message);

            return;
        }

        const toastId = notify.loading(
            "Publicando participación...",
            "Estamos registrando tu comentario en el foro.",
        );

        try {
            setStudentResponseSaving(true);
            setStudentResponseMessage("");

            await createForumResponse({
                enrollment_id: validEnrollmentId,
                lesson_block_id: validLessonBlockId,
                comment,
                forum_response_id: null,
            });

            await refreshForumResponses(validLessonBlockId);
            await markBlockAsCompleted(validLessonBlockId, {
                showToast: false,
            });

            setForumText("");

            const message =
                "Participación publicada correctamente. Actividad realizada.";

            setStudentResponseMessage(message);
            notify.dismiss(toastId);
            notify.success("Participación publicada.", message);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo publicar la participación.";

            setStudentResponseMessage(message);
            notify.dismiss(toastId);
            notify.error("No se pudo publicar la participación.", message);
        } finally {
            setStudentResponseSaving(false);
        }
    }

    function handleAttendanceCodeChange(sessionId: number, value: string) {
        setAttendanceCodeBySession((current) => ({
            ...current,
            [sessionId]: value,
        }));
    }

    async function handleMarkAttendance(sessionId: number) {
        if (!enrollmentId) {
            const message =
                "No se pudo identificar la matrícula del estudiante.";

            setAttendanceMessage(message);
            notify.error("No se pudo registrar la asistencia.", message);

            return;
        }

        const session =
            attendanceSessions.find((item) => item.id === sessionId) ?? null;

        if (!session) {
            const message = "No se encontró la sesión seleccionada.";

            setAttendanceMessage(message);
            notify.error("No se pudo registrar la asistencia.", message);

            return;
        }

        const existingRecord = getAttendanceRecordForSession(
            attendanceRecords,
            sessionId,
        );

        if (!canMarkAttendance(session, existingRecord)) {
            const message =
                "Esta sesión no está habilitada para registrar asistencia.";

            setAttendanceMessage(message);
            notify.info("Asistencia no disponible.", message);

            return;
        }

        const code = String(attendanceCodeBySession[sessionId] ?? "").trim();

        if (session.requires_code && !code) {
            const message =
                "Ingresa el código de asistencia indicado por el docente.";

            setAttendanceMessage(message);
            notify.warning("Código requerido.", message);

            return;
        }

        const toastId = notify.loading(
            "Registrando asistencia...",
            "Estamos validando la sesión seleccionada.",
        );

        try {
            setAttendanceSavingSessionId(sessionId);
            setAttendanceMessage("");

            const savedRecord = await saveStudentAttendance({
                course_id: numericCourseId,
                enrollment_id: enrollmentId,
                user_id: studentUserId,
                session_id: sessionId,
                code,
                status: "present",
            });

            setAttendanceRecords((current) =>
                upsertAttendanceRecord(current, savedRecord),
            );

            setAttendanceCodeBySession((current) => ({
                ...current,
                [sessionId]: "",
            }));

            const message = "Asistencia registrada correctamente.";

            setAttendanceMessage(message);
            notify.dismiss(toastId);
            notify.success("Asistencia registrada.", message);
        } catch (error) {
            const message = getErrorMessage(error);

            setAttendanceMessage(message);
            notify.dismiss(toastId);
            notify.error("No se pudo registrar la asistencia.", message);
        } finally {
            setAttendanceSavingSessionId(null);
        }
    }

    function handleQuizAnswer(questionId: number, optionIndex: number) {
        setQuizAnswers((current) => ({
            ...current,
            [questionId]: optionIndex,
        }));
    }

    async function handleSubmitQuiz() {
        if (!selectedBlock || getLessonItemType(selectedBlock) !== "quiz") {
            return;
        }

        if (quizSaving) return;

        const questions = normalizeQuizQuestions(selectedContent.questions);

        if (questions.length === 0) {
            const message = "Esta evaluación todavía no tiene preguntas.";

            setQuizResult(message);
            notify.warning("Evaluación sin preguntas.", message);

            return;
        }

        const hasUnansweredQuestion = questions.some(
            (question) => quizAnswers[question.id] === undefined,
        );

        if (hasUnansweredQuestion) {
            const message =
                "Responde todas las preguntas antes de finalizar.";

            setQuizResult(message);
            notify.warning("Evaluación incompleta.", message);

            return;
        }

        if (!enrollmentId) {
            const message =
                "No se pudo identificar la matrícula del estudiante.";

            setQuizResult(message);
            notify.error("No se pudo enviar la evaluación.", message);

            return;
        }

        let storedResponse = getQuizResponseForBlock(
            quizResponses,
            selectedBlock.id,
        );

        try {
            const latest = await refreshQuizResponseForBlock(
                selectedBlock.id,
                enrollmentId,
            );

            if (latest) storedResponse = latest;
        } catch {
            // Se usa la información local si falla la consulta externa.
        }

        const currentAttempts = getQuizAttemptsCount(storedResponse);

        if (currentAttempts >= MAX_QUIZ_ATTEMPTS) {
            const message =
                "Ya alcanzaste el máximo de 3 intentos para esta evaluación.";

            setQuizResult(message);
            notify.warning("Intentos agotados.", message);

            return;
        }

        const nextAttempt = currentAttempts + 1;

        const score = questions.reduce((total, question) => {
            const isCorrect =
                quizAnswers[question.id] === question.correct_answer;

            return total + (isCorrect ? question.points : 0);
        }, 0);

        const minimumScore = selectedBlock.completion_value || 0;
        const isPassed = score >= minimumScore;

        const previous = parseStoredQuizResponse(storedResponse?.response);

        const attemptRecord = {
            attempt: nextAttempt,
            answers: quizAnswers,
            score,
            minimum_score: minimumScore,
            is_passed: isPassed,
            submitted_at: new Date().toISOString(),
        };

        const responsePayload = {
            ...attemptRecord,
            attempts: nextAttempt,
            max_attempts: MAX_QUIZ_ATTEMPTS,
            history: [...previous.history, attemptRecord],
        };

        const toastId = notify.loading(
            "Enviando evaluación...",
            `Estamos registrando tu intento ${nextAttempt} de ${MAX_QUIZ_ATTEMPTS}.`,
        );

        try {
            setQuizSaving(true);
            setQuizResult("");

            const saved = storedResponse
                ? await updateQuizzResponse(storedResponse.id, {
                    response: JSON.stringify(responsePayload),
                    score,
                    is_passed: isPassed,
                })
                : await createQuizzResponse({
                    enrollment_id: enrollmentId,
                    lesson_block_id: selectedBlock.id,
                    quizz: JSON.stringify(getBlockContent(selectedBlock)),
                    response: JSON.stringify(responsePayload),
                    score,
                    is_passed: isPassed,
                });

            setQuizResponses((current) => upsertQuizResponse(current, saved));

            notify.dismiss(toastId);

            if (isPassed) {
                await markBlockAsCompleted(selectedBlock.id, {
                    showToast: false,
                });

                const message =
                    `Evaluación aprobada. Intento ${nextAttempt} de ${MAX_QUIZ_ATTEMPTS}. Puntaje obtenido: ${score}. Mínimo requerido: ${minimumScore}.`;

                setQuizResult(message);
                notify.success("Evaluación aprobada.", message);

                return;
            }

            const remaining = MAX_QUIZ_ATTEMPTS - nextAttempt;

            const message =
                remaining <= 0
                    ? `Evaluación no aprobada. Puntaje obtenido: ${score}. Mínimo requerido: ${minimumScore}. Ya no tienes intentos disponibles.`
                    : `Evaluación no aprobada. Intento ${nextAttempt} de ${MAX_QUIZ_ATTEMPTS}. Puntaje obtenido: ${score}. Mínimo requerido: ${minimumScore}. Te quedan ${remaining} intento(s).`;

            setQuizResult(message);
            notify.warning("Evaluación no aprobada.", message);
        } catch (error) {
            const message = getErrorMessage(error);

            setQuizResult(message);
            notify.dismiss(toastId);
            notify.error("No se pudo enviar la evaluación.", message);
        } finally {
            setQuizSaving(false);
        }
    }

    return {
        numericCourseId,

        course,
        selectedCourse: course,
        currentCourse: course,
        courseData: course,

        is_mdt: isMdtCourse,
        isMdt: isMdtCourse,
        isMdtCourse,

        studentIdNumber,
        idNumber: studentIdNumber,

        authUser,
        user: authUser,
        currentUser: authUser,

        modules,
        selectedBlock,
        openModules,
        openLessons,
        completedBlocks,
        progressRecords,
        enrollmentId,
        progressSavingBlockId,

        quizAnswers,
        quizResponses,
        quizResult,
        quizSaving,

        homeworkResponses,
        surveyResponses,
        forumResponses,

        homeworkText,
        setHomeworkText,
        homeworkFile,
        setHomeworkFile,

        surveyAnswers,
        setSurveyAnswers,
        forumText,
        setForumText,

        studentResponseSaving,
        studentResponseMessage,

        loading,
        isRefreshing,
        errorMessage,

        studentUserId,
        studentName,

        student: authUser,
        profile: authUser,

        courseName,
        courseImageUrl,
        courseDescription,
        courseLevel,
        courseDuration,

        activeTab,
        setActiveTab,

        certificate,
        certificateMessage,
        certificateGenerating,

        allBlocks,
        totalBlocks,
        completedCount,
        progress,
        courseCompleted,
        certificateFileUrl,
        certificateTargetUrl,
        certificateReady,

        attendanceSessions,
        attendanceRecords,
        attendanceLoading,
        attendanceSavingSessionId,
        attendanceMessage,
        attendanceCodeBySession,
        markedAttendanceCount,
        attendanceProgress,

        studentInitials,
        heroImageUrl,
        upcomingBlocks,
        quizBlocks,
        videoBlocks,
        resourceBlocks,
        selectedType,
        selectedContent,
        selectedTitle,
        averageScore,

        setOpenModules,
        setOpenLessons,

        handleSelectBlock,
        handleViewCertificate,
        markBlockAsCompleted,
        handleSubmitHomework,
        handleSubmitSurvey,
        handleSubmitForumResponse,

        handleAttendanceCodeChange,
        handleMarkAttendance,

        handleQuizAnswer,
        handleSubmitQuiz,

        reloadCourse: () => loadCourseContent(true),

        refreshAttendance: () =>
            enrollmentId
                ? refreshAttendance(numericCourseId, enrollmentId)
                : Promise.resolve(),
    };
}

export type CourseRoomHook = ReturnType<typeof useCourseRoom>;