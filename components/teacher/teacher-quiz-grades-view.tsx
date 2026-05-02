"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
    AlertCircle,
    Award,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    Eye,
    FileCheck2,
    Layers3,
    Loader2,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    UserRound,
    X,
    XCircle,
} from "lucide-react";
import { getAllCourses, type Course } from "@/services/courses.service";
import { getModulesByCourse, type CourseModule } from "@/services/modules.service";
import {
    getLessonBlocksByLesson,
    getLessonsByModule,
    type Lesson,
    type LessonBlock,
} from "@/services/lessons.service";
import {
    getQuizzResponsesByLessonBlock,
    updateQuizzResponse,
    type QuizzResponseByLessonBlock,
} from "@/services/quizz-response.service";
import {
    createCertificateFromTemplate,
    getCertificatesByCourse,
    getCertificateTemplate,
    reissueCertificateFromTemplate,
    type Certificate,
} from "@/services/certificates.service";

type TeacherQuizGradesViewProps = {
    courseId?: string;
    params?: {
        courseId?: string;
    };
};

type LessonBlockWithType = LessonBlock & {
    block_type_id?: number;
    lesson_block_type?: {
        id?: number;
        key?: string;
    };
};

type QuizQuestionView = {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    points: number;
};

type QuizBlockInfo = {
    module: CourseModule;
    lesson: Lesson;
    block: LessonBlock;
};

type GradeRow = {
    blockInfo: QuizBlockInfo;
    response: QuizzResponseByLessonBlock;
};

type EnrollmentGroup = {
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

type GroupModalState = {
    group: EnrollmentGroup;
};

const ROWS_PER_PAGE = 7;

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Ocurrió un error inesperado.";
}

function getCourseIdFromPathname(pathname: string) {
    const teacherMatch = pathname.match(/^\/teacher\/courses\/([^/]+)\/grades/);
    const adminMatch = pathname.match(/^\/admin\/courses\/([^/]+)\/grades/);

    return teacherMatch?.[1] ?? adminMatch?.[1] ?? "";
}

function sortByOrder<T extends { order: number }>(items: T[]) {
    return [...items].sort((a, b) => a.order - b.order);
}

function parseJsonSafe<T>(value: string, fallback: T): T {
    try {
        const parsedValue = JSON.parse(value) as T;

        return parsedValue ?? fallback;
    } catch {
        return fallback;
    }
}

function formatDate(value?: string | null) {
    if (!value) return "Sin fecha";

    try {
        return new Intl.DateTimeFormat("es-EC", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function getContentString(
    content: Record<string, unknown> | null | undefined,
    key: string,
) {
    const value = content?.[key];

    return typeof value === "string" ? value : "";
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

function getStudentName(response: QuizzResponseByLessonBlock) {
    const firstname = response.enrollment?.user?.firstname ?? "";
    const lastname = response.enrollment?.user?.lastname ?? "";
    const fullName = `${firstname} ${lastname}`.trim();

    return fullName || `Estudiante #${response.enrollment?.user?.id ?? ""}`;
}

function getQuizTitleFromBlock(block: LessonBlock) {
    const content = block.content ?? {};

    return (
        getContentString(content, "title") ||
        getContentString(content, "name") ||
        getContentString(content, "label") ||
        `Prueba #${block.id}`
    );
}

function getQuizTitleFromResponse(response: QuizzResponseByLessonBlock) {
    const parsedQuiz = parseJsonSafe<Record<string, unknown>>(
        response.quizz,
        {},
    );

    const title = parsedQuiz.title;
    const name = parsedQuiz.name;

    if (typeof title === "string" && title.trim()) return title;
    if (typeof name === "string" && name.trim()) return name;

    return `Prueba #${response.lesson_block_id}`;
}

function getQuizTitle(row: GradeRow) {
    return (
        getQuizTitleFromBlock(row.blockInfo.block) ||
        getQuizTitleFromResponse(row.response)
    );
}

function isQuizBlock(block: LessonBlock) {
    const content = block.content ?? {};
    const typedBlock = block as LessonBlockWithType;

    const type =
        getContentString(content, "type").toLowerCase() ||
        getContentString(content, "itemType").toLowerCase() ||
        getContentString(content, "blockType").toLowerCase();

    const blockTypeId =
        getContentNumber(content, "block_type_id") ??
        typedBlock.block_type_id ??
        typedBlock.lesson_block_type?.id;

    const key = typedBlock.lesson_block_type?.key?.toLowerCase() ?? "";

    return (
        blockTypeId === 2 ||
        type.includes("quiz") ||
        type.includes("prueba") ||
        type.includes("evaluacion") ||
        key.includes("quiz") ||
        key.includes("prueba") ||
        key.includes("evaluacion")
    );
}

function getQuizQuestionsFromBlock(block: LessonBlock): QuizQuestionView[] {
    const questions = block.content?.questions;

    if (!Array.isArray(questions)) return [];

    return questions.map((question, index) => {
        const item = question as Partial<QuizQuestionView>;

        return {
            id: typeof item.id === "number" ? item.id : index + 1,
            question:
                typeof item.question === "string"
                    ? item.question
                    : `Pregunta ${index + 1}`,
            options: Array.isArray(item.options)
                ? item.options.filter(
                    (option): option is string =>
                        typeof option === "string",
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

function getQuizQuestionsFromResponse(
    response: QuizzResponseByLessonBlock,
): QuizQuestionView[] {
    const parsedQuiz = parseJsonSafe<Record<string, unknown>>(
        response.quizz,
        {},
    );

    const questions = parsedQuiz.questions;

    if (!Array.isArray(questions)) return [];

    return questions.map((question, index) => {
        const item = question as Partial<QuizQuestionView>;

        return {
            id: typeof item.id === "number" ? item.id : index + 1,
            question:
                typeof item.question === "string"
                    ? item.question
                    : `Pregunta ${index + 1}`,
            options: Array.isArray(item.options)
                ? item.options.filter(
                    (option): option is string =>
                        typeof option === "string",
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

function getQuizQuestions(row: GradeRow) {
    const questionsFromBlock = getQuizQuestionsFromBlock(row.blockInfo.block);

    if (questionsFromBlock.length > 0) return questionsFromBlock;

    return getQuizQuestionsFromResponse(row.response);
}

function getParsedAnswers(response: QuizzResponseByLessonBlock) {
    const parsedResponse = parseJsonSafe<Record<string, unknown>>(
        response.response,
        {},
    );

    const answers = parsedResponse.answers;

    if (!answers || typeof answers !== "object") return {};

    return answers as Record<string, unknown>;
}

function getAnswerValue(answers: Record<string, unknown>, questionId: number) {
    const rawValue = answers[String(questionId)];

    if (typeof rawValue === "number") return rawValue;

    if (typeof rawValue === "string") {
        const parsedValue = Number(rawValue);

        if (Number.isFinite(parsedValue)) return parsedValue;
    }

    return null;
}

function getMaxScore(questions: QuizQuestionView[]) {
    return questions.reduce(
        (total, question) => total + Number(question.points || 0),
        0,
    );
}

function getMinimumScore(row: GradeRow) {
    const blockMinimum = Number(row.blockInfo.block.completion_value || 0);

    if (Number.isFinite(blockMinimum) && blockMinimum > 0) return blockMinimum;

    const parsedResponse = parseJsonSafe<Record<string, unknown>>(
        row.response.response,
        {},
    );

    const minimumFromResponse = parsedResponse.minimum_score;

    if (typeof minimumFromResponse === "number") return minimumFromResponse;

    if (typeof minimumFromResponse === "string") {
        const parsedValue = Number(minimumFromResponse);

        if (Number.isFinite(parsedValue)) return parsedValue;
    }

    return 0;
}

function getCalculatedPassed(row: GradeRow) {
    const minimumScore = getMinimumScore(row);

    if (minimumScore <= 0) return row.response.is_passed;

    return Number(row.response.score || 0) >= minimumScore;
}

function getGroupAverage(rows: GradeRow[]) {
    if (rows.length === 0) return 0;

    const total = rows.reduce(
        (sum, row) => sum + Number(row.response.score || 0),
        0,
    );

    return Math.round((total / rows.length) * 100) / 100;
}

function isValidGroupForCertificate(group: EnrollmentGroup) {
    return group.rows.length > 0 && group.failedCount === 0;
}

function getCertificateVerifyHref(certificate: Certificate | null) {
    if (!certificate?.certificate_code) return "";

    return `/certificates/verify/${encodeURIComponent(
        certificate.certificate_code,
    )}`;
}

function openCertificateByRoute(certificate: Certificate | null) {
    const certificateHref = getCertificateVerifyHref(certificate);

    if (!certificateHref) return false;

    window.open(certificateHref, "_blank", "noopener,noreferrer");

    return true;
}

export function TeacherQuizGradesView({
    courseId,
    params,
}: TeacherQuizGradesViewProps) {
    const pathname = usePathname();

    const routeCourseId = useMemo(() => {
        const rawCourseId =
            courseId ?? params?.courseId ?? getCourseIdFromPathname(pathname);

        const parsedCourseId = Number(rawCourseId);

        return Number.isFinite(parsedCourseId) && parsedCourseId > 0
            ? parsedCourseId
            : 0;
    }, [courseId, params?.courseId, pathname]);

    const isAdminRoute = pathname.startsWith("/admin");
    const [selectedCourseId, setSelectedCourseId] = useState(0);

    const currentCourseId =
        routeCourseId > 0 ? routeCourseId : selectedCourseId;

    const [courses, setCourses] = useState<Course[]>([]);
    const [course, setCourse] = useState<Course | null>(null);
    const [quizBlocks, setQuizBlocks] = useState<QuizBlockInfo[]>([]);
    const [grades, setGrades] = useState<GradeRow[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBlockId, setSelectedBlockId] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [savingResponseId, setSavingResponseId] = useState<number | null>(
        null,
    );
    const [generatingCertificateUserId, setGeneratingCertificateUserId] =
        useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [notice, setNotice] = useState("");

    const [groupModal, setGroupModal] = useState<GroupModalState | null>(null);
    const [editScores, setEditScores] = useState<Record<number, string>>({});
    const [editPassed, setEditPassed] = useState<Record<number, boolean>>({});
    const [modalError, setModalError] = useState("");

    const courseOptions = useMemo(
        () => [...courses].sort((a, b) => a.name.localeCompare(b.name)),
        [courses],
    );

    const filteredGrades = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return grades.filter((row) => {
            const selectedBlockMatches =
                selectedBlockId === 0 ||
                Number(row.blockInfo.block.id) === selectedBlockId;

            if (!selectedBlockMatches) return false;

            if (!normalizedSearch) return true;

            const studentName = getStudentName(row.response).toLowerCase();
            const quizTitle = getQuizTitle(row).toLowerCase();
            const moduleName = row.blockInfo.module.name.toLowerCase();
            const lessonName = row.blockInfo.lesson.name.toLowerCase();

            return (
                studentName.includes(normalizedSearch) ||
                quizTitle.includes(normalizedSearch) ||
                moduleName.includes(normalizedSearch) ||
                lessonName.includes(normalizedSearch) ||
                String(row.response.score).includes(normalizedSearch) ||
                String(row.response.enrollment?.id).includes(normalizedSearch) ||
                String(row.response.lesson_block_id).includes(normalizedSearch)
            );
        });
    }, [grades, searchTerm, selectedBlockId]);

    const groupedGrades = useMemo<EnrollmentGroup[]>(() => {
        const groups = new Map<number, GradeRow[]>();

        filteredGrades.forEach((row) => {
            const enrollmentId = Number(row.response.enrollment?.id ?? 0);

            if (!enrollmentId) return;

            const currentRows = groups.get(enrollmentId) ?? [];

            groups.set(enrollmentId, [...currentRows, row]);
        });

        return Array.from(groups.entries())
            .map(([enrollmentId, rows]) => {
                const sortedRows = [...rows].sort(
                    (a, b) =>
                        new Date(b.response.created_at).getTime() -
                        new Date(a.response.created_at).getTime(),
                );

                const firstRow = sortedRows[0];
                const userId = Number(
                    firstRow.response.enrollment?.user?.id ?? 0,
                );

                const passedCount = sortedRows.filter((row) =>
                    getCalculatedPassed(row),
                ).length;

                const failedCount = sortedRows.length - passedCount;

                const certificate =
                    certificates.find(
                        (item) =>
                            Number(item.user_id) === userId &&
                            Number(item.course_id) === currentCourseId &&
                            item.is_valid !== false,
                    ) ??
                    certificates.find(
                        (item) =>
                            Number(item.user_id) === userId &&
                            Number(item.course_id) === currentCourseId,
                    ) ??
                    null;

                return {
                    enrollmentId,
                    userId,
                    studentName: getStudentName(firstRow.response),
                    rows: sortedRows,
                    averageScore: getGroupAverage(sortedRows),
                    passedCount,
                    failedCount,
                    lastDate: sortedRows[0]?.response.created_at ?? "",
                    certificate,
                };
            })
            .sort((a, b) => a.studentName.localeCompare(b.studentName));
    }, [filteredGrades, certificates, currentCourseId]);

    const totalPages = Math.max(
        1,
        Math.ceil(groupedGrades.length / ROWS_PER_PAGE),
    );

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * ROWS_PER_PAGE;

        return groupedGrades.slice(start, start + ROWS_PER_PAGE);
    }, [groupedGrades, currentPage]);

    const passedCount = useMemo(
        () => grades.filter((row) => getCalculatedPassed(row)).length,
        [grades],
    );

    const failedCount = grades.length - passedCount;

    const averageScore = useMemo(() => {
        if (grades.length === 0) return 0;

        const total = grades.reduce(
            (sum, row) => sum + Number(row.response.score || 0),
            0,
        );

        return Math.round((total / grades.length) * 100) / 100;
    }, [grades]);

    const generatedCertificatesCount = useMemo(
        () => groupedGrades.filter((group) => group.certificate).length,
        [groupedGrades],
    );

    const startItem =
        groupedGrades.length === 0
            ? 0
            : (currentPage - 1) * ROWS_PER_PAGE + 1;

    const endItem = Math.min(currentPage * ROWS_PER_PAGE, groupedGrades.length);

    const loadGrades = useCallback(
        async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                setErrorMessage("");
                setNotice("");

                if (!currentCourseId || currentCourseId <= 0) {
                    const coursesData = await getAllCourses();

                    setCourses(Array.isArray(coursesData) ? coursesData : []);
                    setCourse(null);
                    setQuizBlocks([]);
                    setGrades([]);
                    setCertificates([]);
                    setCurrentPage(1);
                    return;
                }

                const [coursesData, courseModules, courseCertificates] =
                    await Promise.all([
                        getAllCourses(),
                        getModulesByCourse(currentCourseId),
                        getCertificatesByCourse(currentCourseId),
                    ]);

                setCourses(Array.isArray(coursesData) ? coursesData : []);

                const currentCourse =
                    coursesData.find(
                        (courseItem) =>
                            Number(courseItem.id) === currentCourseId,
                    ) ?? null;

                const blockResults = await Promise.all(
                    sortByOrder(courseModules).map(async (moduleItem) => {
                        const lessons = await getLessonsByModule(moduleItem.id);

                        const lessonBlockResults = await Promise.all(
                            sortByOrder(lessons).map(async (lessonItem) => {
                                const blocks = await getLessonBlocksByLesson(
                                    lessonItem.id,
                                );

                                return sortByOrder(blocks)
                                    .filter(
                                        (block) =>
                                            block.is_active !== false &&
                                            isQuizBlock(block),
                                    )
                                    .map((block) => ({
                                        module: moduleItem,
                                        lesson: lessonItem,
                                        block,
                                    }));
                            }),
                        );

                        return lessonBlockResults.flat();
                    }),
                );

                const currentQuizBlocks = blockResults.flat();

                const responseResults = await Promise.all(
                    currentQuizBlocks.map(async (blockInfo) => {
                        const responses =
                            await getQuizzResponsesByLessonBlock(
                                blockInfo.block.id,
                            );

                        return responses.map((response) => ({
                            blockInfo,
                            response,
                        }));
                    }),
                );

                const currentGrades = responseResults
                    .flat()
                    .sort(
                        (a, b) =>
                            new Date(b.response.created_at).getTime() -
                            new Date(a.response.created_at).getTime(),
                    );

                setCourse(currentCourse);
                setQuizBlocks(currentQuizBlocks);
                setGrades(currentGrades);
                setCertificates(courseCertificates);
                setCurrentPage(1);
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
                setCourse(null);
                setQuizBlocks([]);
                setGrades([]);
                setCertificates([]);
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [currentCourseId],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadGrades(false);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadGrades]);

    function handleSelectCourse(value: string) {
        const parsedCourseId = Number(value);

        setSelectedCourseId(
            Number.isFinite(parsedCourseId) && parsedCourseId > 0
                ? parsedCourseId
                : 0,
        );
        setSearchTerm("");
        setSelectedBlockId(0);
        setCurrentPage(1);
        setErrorMessage("");
        setNotice("");
        setGroupModal(null);
    }

    function openGroupModal(group: EnrollmentGroup) {
        const scores: Record<number, string> = {};
        const passed: Record<number, boolean> = {};

        group.rows.forEach((row) => {
            scores[row.response.id] = String(row.response.score ?? 0);
            passed[row.response.id] = getCalculatedPassed(row);
        });

        setGroupModal({ group });
        setEditScores(scores);
        setEditPassed(passed);
        setModalError("");
        setNotice("");
        setErrorMessage("");
    }

    function closeGroupModal() {
        if (savingResponseId || generatingCertificateUserId) return;

        setGroupModal(null);
        setEditScores({});
        setEditPassed({});
        setModalError("");
    }

    function updateCertificateState(certificate: Certificate) {
        setCertificates((current) => {
            const nextCertificates = current.filter(
                (item) =>
                    item.id !== certificate.id &&
                    !(
                        Number(item.user_id) === Number(certificate.user_id) &&
                        Number(item.course_id) === Number(certificate.course_id)
                    ),
            );

            return [certificate, ...nextCertificates];
        });

        setGroupModal((current) => {
            if (!current) return current;

            if (
                Number(current.group.userId) !== Number(certificate.user_id) ||
                Number(certificate.course_id) !== Number(currentCourseId)
            ) {
                return current;
            }

            return {
                group: {
                    ...current.group,
                    certificate,
                },
            };
        });
    }

    async function handleSaveGrade(row: GradeRow) {
        const responseId = row.response.id;
        const parsedScore = Number(editScores[responseId]);

        if (!Number.isFinite(parsedScore) || parsedScore < 0) {
            setModalError("Ingresa un puntaje válido.");
            return;
        }

        try {
            setSavingResponseId(responseId);
            setModalError("");

            const updatedResponse = await updateQuizzResponse(responseId, {
                response: row.response.response,
                score: parsedScore,
                is_passed: editPassed[responseId] ?? false,
            });

            setGrades((current) =>
                current.map((item) =>
                    item.response.id === updatedResponse.id
                        ? {
                            ...item,
                            response: {
                                ...item.response,
                                ...updatedResponse,
                                enrollment: item.response.enrollment,
                            },
                        }
                        : item,
                ),
            );

            setGroupModal((current) => {
                if (!current) return current;

                const updatedRows = current.group.rows.map((item) =>
                    item.response.id === updatedResponse.id
                        ? {
                            ...item,
                            response: {
                                ...item.response,
                                ...updatedResponse,
                                enrollment: item.response.enrollment,
                            },
                        }
                        : item,
                );

                const passedGroupCount = updatedRows.filter((item) =>
                    getCalculatedPassed(item),
                ).length;

                return {
                    group: {
                        ...current.group,
                        rows: updatedRows,
                        averageScore: getGroupAverage(updatedRows),
                        passedCount: passedGroupCount,
                        failedCount: updatedRows.length - passedGroupCount,
                    },
                };
            });

            setNotice("Calificación actualizada correctamente.");
        } catch (error) {
            setModalError(getErrorMessage(error));
        } finally {
            setSavingResponseId(null);
        }
    }

    async function handleGenerateOrReissueCertificate(group: EnrollmentGroup) {
        if (!course || !currentCourseId || !group.userId) {
            setErrorMessage("No se pudo identificar el curso o el estudiante.");
            return;
        }

        if (group.rows.length === 0) {
            setErrorMessage("No hay calificaciones para generar el certificado.");
            return;
        }

        if (group.failedCount > 0) {
            setErrorMessage(
                "No se puede generar el certificado porque el estudiante tiene cuestionarios no aprobados.",
            );
            return;
        }

        try {
            setGeneratingCertificateUserId(group.userId);
            setErrorMessage("");
            setNotice("");
            setModalError("");

            const template = await getCertificateTemplate(currentCourseId);

            if (!template.id) {
                throw new Error(
                    "No existe una plantilla guardada para este curso. Primero guarda la plantilla del certificado.",
                );
            }

            const freshCertificates = await getCertificatesByCourse(currentCourseId);

            const existingCertificate =
                freshCertificates.find(
                    (item) =>
                        Number(item.user_id) === Number(group.userId) &&
                        Number(item.course_id) === Number(currentCourseId) &&
                        item.is_valid !== false,
                ) ??
                freshCertificates.find(
                    (item) =>
                        Number(item.user_id) === Number(group.userId) &&
                        Number(item.course_id) === Number(currentCourseId),
                ) ??
                group.certificate ??
                null;

            const values = {
                studentName: group.studentName,
                courseName: course.name,
                completionDate: new Date().toLocaleDateString("es-EC"),
                instructorName: "Instructor",
                certificateCode: existingCertificate?.certificate_code ?? "",
                finalGrade: group.averageScore,
            };

            const certificate = existingCertificate
                ? await reissueCertificateFromTemplate({
                    certificateId: existingCertificate.id,
                    userId: group.userId,
                    courseId: currentCourseId,
                    template,
                    values,
                })
                : await createCertificateFromTemplate({
                    userId: group.userId,
                    courseId: currentCourseId,
                    template,
                    values,
                });

            updateCertificateState(certificate);

            const wasOpened = openCertificateByRoute(certificate);

            setNotice(
                existingCertificate
                    ? wasOpened
                        ? "Certificado reemitido correctamente y abierto en otra pestaña."
                        : "Certificado reemitido correctamente, pero no se pudo abrir porque no tiene código."
                    : wasOpened
                        ? "Certificado generado correctamente y abierto en otra pestaña."
                        : "Certificado generado correctamente, pero no se pudo abrir porque no tiene código.",
            );
        } catch (error) {
            const message = getErrorMessage(error);

            setErrorMessage(message);
            setModalError(message);
        } finally {
            setGeneratingCertificateUserId(null);
        }
    }

    if (isLoading) {
        return (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                <p className="mt-4 text-sm font-bold text-slate-600">
                    {currentCourseId > 0
                        ? "Cargando calificaciones del curso..."
                        : "Cargando cursos disponibles..."}
                </p>
            </section>
        );
    }

    if (currentCourseId <= 0) {
        return (
            <section className="space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-6 md:px-7">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                                <Award className="h-3.5 w-3.5" />
                                Panel del administrador
                            </div>

                            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                                Gestión de calificaciones
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                Selecciona primero un curso para cargar sus
                                cuestionarios, matrículas, notas y certificados.
                            </p>
                        </div>
                    </div>

                    <div className="p-5">
                        {errorMessage ? (
                            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                Curso
                            </label>

                            <select
                                value=""
                                onChange={(event) =>
                                    handleSelectCourse(event.target.value)
                                }
                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="">Selecciona un curso</option>
                                {courseOptions.map((courseItem) => (
                                    <option
                                        key={courseItem.id}
                                        value={courseItem.id}
                                    >
                                        {courseItem.name}
                                    </option>
                                ))}
                            </select>

                            {courseOptions.length === 0 ? (
                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                    No hay cursos registrados para mostrar.
                                </p>
                            ) : (
                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                    Al seleccionar un curso se cargarán las
                                    calificaciones agrupadas por matrícula.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-6 md:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                                <Award className="h-3.5 w-3.5" />
                                {isAdminRoute
                                    ? "Panel del administrador"
                                    : "Panel del profesor"}
                            </div>

                            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                                Calificaciones del curso
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                Resumen agrupado por matrícula dentro de{" "}
                                <span className="font-bold text-white">
                                    {course?.name || `curso #${currentCourseId}`}
                                </span>
                                .
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                                    Promedio
                                </p>
                                <p className="mt-1 text-2xl font-black">
                                    {averageScore}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                                    Aprobadas
                                </p>
                                <p className="mt-1 text-2xl font-black">
                                    {passedCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                                    No aprobadas
                                </p>
                                <p className="mt-1 text-2xl font-black">
                                    {failedCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                                    Certificados
                                </p>
                                <p className="mt-1 text-2xl font-black">
                                    {generatedCertificatesCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 bg-white p-5">
                    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[minmax(0,1fr)_320px_auto] xl:items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                Buscar dentro del curso
                            </label>

                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) => {
                                        setSearchTerm(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Buscar estudiante, prueba, módulo, matrícula o puntaje..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {isAdminRoute && routeCourseId <= 0 ? (
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                    Curso seleccionado
                                </label>

                                <select
                                    value={currentCourseId || ""}
                                    onChange={(event) =>
                                        handleSelectCourse(event.target.value)
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="">Selecciona un curso</option>
                                    {courseOptions.map((courseItem) => (
                                        <option
                                            key={courseItem.id}
                                            value={courseItem.id}
                                        >
                                            {courseItem.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => void loadGrades(true)}
                            disabled={isRefreshing || currentCourseId <= 0}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRefreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {notice ? (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{notice}</span>
                </div>
            ) : null}

            {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                            <BookOpen className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Curso actual
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-950">
                                {course?.name || `Curso #${currentCourseId}`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <Layers3 className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Matrículas con respuestas
                            </p>
                            <p className="mt-1 text-xl font-black text-slate-950">
                                {groupedGrades.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Respuestas recibidas
                            </p>
                            <p className="mt-1 text-xl font-black text-slate-950">
                                {grades.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                            <FileCheck2 className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Certificados generados
                            </p>
                            <p className="mt-1 text-xl font-black text-slate-950">
                                {generatedCertificatesCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {groupedGrades.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <ClipboardList className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-lg font-black text-slate-950">
                        No hay respuestas de pruebas para este curso
                    </h2>

                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Cuando los estudiantes respondan las pruebas del curso,
                        aparecerá el resumen por matrícula.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Estudiante
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Cuestionarios
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Promedio
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Aprobadas
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        No aprobadas
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Última respuesta
                                    </th>
                                    <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Certificado
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Acción
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white">
                                {paginatedGroups.map((group) => (
                                    <tr
                                        key={group.enrollmentId}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                    <UserRound className="h-5 w-5" />
                                                </div>

                                                <div>
                                                    <p className="font-black text-slate-950">
                                                        {group.studentName}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <span className="font-black text-slate-950">
                                                {group.rows.length}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex rounded-xl bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                                                {group.averageScore}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex rounded-xl bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                                                {group.passedCount}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex rounded-xl bg-red-50 px-3 py-1 text-sm font-black text-red-700">
                                                {group.failedCount}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                            {formatDate(group.lastDate)}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            {group.certificate ? (
                                                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                    <FileCheck2 className="h-4 w-4" />
                                                    Generado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                                    <XCircle className="h-4 w-4" />
                                                    No generado
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openGroupModal(group)
                                                    }
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white transition hover:bg-blue-800"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Ver resumen
                                                </button>

                                                {group.certificate
                                                    ?.certificate_code ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openCertificateByRoute(
                                                                group.certificate,
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Ver certificado
                                                    </button>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleGenerateOrReissueCertificate(
                                                            group,
                                                        )
                                                    }
                                                    disabled={
                                                        generatingCertificateUserId ===
                                                        group.userId ||
                                                        !isValidGroupForCertificate(
                                                            group,
                                                        )
                                                    }
                                                    title={
                                                        group.failedCount > 0
                                                            ? "El estudiante tiene cuestionarios no aprobados."
                                                            : undefined
                                                    }
                                                    className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${group.certificate
                                                            ? "bg-amber-600 hover:bg-amber-700"
                                                            : "bg-emerald-600 hover:bg-emerald-700"
                                                        }`}
                                                >
                                                    {generatingCertificateUserId ===
                                                        group.userId ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : group.certificate ? (
                                                        <RotateCcw className="h-4 w-4" />
                                                    ) : (
                                                        <FileCheck2 className="h-4 w-4" />
                                                    )}

                                                    {generatingCertificateUserId ===
                                                        group.userId
                                                        ? "Procesando..."
                                                        : group.certificate
                                                            ? "Reemitir"
                                                            : "Generar"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-slate-500">
                            Mostrando {startItem} - {endItem} de{" "}
                            {groupedGrades.length} matrículas
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(1, page - 1),
                                    )
                                }
                                disabled={currentPage === 1}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1),
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {groupModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[24px] bg-white shadow-2xl">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Resumen de cuestionarios
                                </h2>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    {groupModal.group.studentName} · Matrícula #
                                    {groupModal.group.enrollmentId}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeGroupModal}
                                disabled={Boolean(
                                    savingResponseId ||
                                    generatingCertificateUserId,
                                )}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-5">
                            {modalError ? (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {modalError}
                                </div>
                            ) : null}

                            <div className="mb-4 grid gap-3 sm:grid-cols-5">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                                        Cuestionarios
                                    </p>
                                    <p className="mt-1 text-xl font-black text-slate-950">
                                        {groupModal.group.rows.length}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                                        Promedio
                                    </p>
                                    <p className="mt-1 text-xl font-black text-slate-950">
                                        {groupModal.group.averageScore}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                        Aprobadas
                                    </p>
                                    <p className="mt-1 text-xl font-black text-emerald-700">
                                        {groupModal.group.passedCount}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-red-700">
                                        No aprobadas
                                    </p>
                                    <p className="mt-1 text-xl font-black text-red-700">
                                        {groupModal.group.failedCount}
                                    </p>
                                </div>

                                <div
                                    className={`rounded-xl border px-4 py-3 ${groupModal.group.certificate
                                            ? "border-emerald-100 bg-emerald-50"
                                            : "border-slate-200 bg-slate-50"
                                        }`}
                                >
                                    <p
                                        className={`text-[11px] font-black uppercase tracking-[0.12em] ${groupModal.group.certificate
                                                ? "text-emerald-700"
                                                : "text-slate-500"
                                            }`}
                                    >
                                        Certificado
                                    </p>
                                    <p
                                        className={`mt-1 text-sm font-black ${groupModal.group.certificate
                                                ? "text-emerald-700"
                                                : "text-slate-700"
                                            }`}
                                    >
                                        {groupModal.group.certificate
                                            ? "Generado"
                                            : "No generado"}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-950">
                                        Certificado del estudiante
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        Se genera usando la plantilla guardada
                                        del curso y el promedio actual del
                                        estudiante.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    {groupModal.group.certificate
                                        ?.certificate_code ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openCertificateByRoute(
                                                    groupModal.group.certificate,
                                                )
                                            }
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Ver certificado
                                        </button>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleGenerateOrReissueCertificate(
                                                groupModal.group,
                                            )
                                        }
                                        disabled={
                                            generatingCertificateUserId ===
                                            groupModal.group.userId ||
                                            !isValidGroupForCertificate(
                                                groupModal.group,
                                            )
                                        }
                                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${groupModal.group.certificate
                                                ? "bg-amber-600 hover:bg-amber-700"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                            }`}
                                    >
                                        {generatingCertificateUserId ===
                                            groupModal.group.userId ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : groupModal.group.certificate ? (
                                            <RotateCcw className="h-4 w-4" />
                                        ) : (
                                            <FileCheck2 className="h-4 w-4" />
                                        )}

                                        {generatingCertificateUserId ===
                                            groupModal.group.userId
                                            ? "Procesando..."
                                            : groupModal.group.certificate
                                                ? "Reemitir certificado"
                                                : "Generar certificado"}
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                                    Cuestionario
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                                    Nota
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                                    Mínimo
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                                    Estado
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                                    Editar nota
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                                    Acción
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {groupModal.group.rows.map(
                                                (row) => {
                                                    const questions =
                                                        getQuizQuestions(row);
                                                    const maxScore =
                                                        getMaxScore(questions);
                                                    const minimumScore =
                                                        getMinimumScore(row);
                                                    const responseId =
                                                        row.response.id;

                                                    return (
                                                        <tr
                                                            key={responseId}
                                                            className="align-top transition hover:bg-slate-50"
                                                        >
                                                            <td className="px-4 py-4">
                                                                <p className="font-black text-slate-950">
                                                                    {getQuizTitle(
                                                                        row,
                                                                    )}
                                                                </p>

                                                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                                                    {
                                                                        row
                                                                            .blockInfo
                                                                            .lesson
                                                                            .name
                                                                    }
                                                                </p>

                                                                <details className="mt-3">
                                                                    <summary className="cursor-pointer text-xs font-black text-blue-700">
                                                                        Ver
                                                                        respuestas
                                                                    </summary>

                                                                    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                                        {questions.length ===
                                                                            0 ? (
                                                                            <p className="text-xs font-semibold text-slate-500">
                                                                                No
                                                                                hay
                                                                                preguntas
                                                                                guardadas.
                                                                            </p>
                                                                        ) : (
                                                                            questions.map(
                                                                                (
                                                                                    question,
                                                                                    index,
                                                                                ) => {
                                                                                    const answers =
                                                                                        getParsedAnswers(
                                                                                            row.response,
                                                                                        );

                                                                                    const selectedAnswer =
                                                                                        getAnswerValue(
                                                                                            answers,
                                                                                            question.id,
                                                                                        );

                                                                                    const selectedOption =
                                                                                        selectedAnswer ===
                                                                                            null
                                                                                            ? "Sin respuesta"
                                                                                            : question
                                                                                                .options[
                                                                                            selectedAnswer
                                                                                            ] ??
                                                                                            "Sin respuesta";

                                                                                    const correctOption =
                                                                                        question
                                                                                            .options[
                                                                                        question
                                                                                            .correct_answer
                                                                                        ] ??
                                                                                        "Sin respuesta correcta";

                                                                                    const isCorrect =
                                                                                        selectedAnswer !==
                                                                                        null &&
                                                                                        selectedAnswer ===
                                                                                        question.correct_answer;

                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                question.id
                                                                                            }
                                                                                            className="rounded-lg bg-white p-3 ring-1 ring-slate-200"
                                                                                        >
                                                                                            <div className="flex items-start justify-between gap-3">
                                                                                                <p className="text-xs font-black text-slate-800">
                                                                                                    {index +
                                                                                                        1}
                                                                                                    .{" "}
                                                                                                    {
                                                                                                        question.question
                                                                                                    }
                                                                                                </p>

                                                                                                <span
                                                                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${isCorrect
                                                                                                            ? "bg-emerald-50 text-emerald-700"
                                                                                                            : "bg-red-50 text-red-700"
                                                                                                        }`}
                                                                                                >
                                                                                                    {isCorrect
                                                                                                        ? "Correcta"
                                                                                                        : "Incorrecta"}
                                                                                                </span>
                                                                                            </div>

                                                                                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                                                                                                <p className="text-xs text-slate-600">
                                                                                                    <span className="font-black">
                                                                                                        Respondió:
                                                                                                    </span>{" "}
                                                                                                    {
                                                                                                        selectedOption
                                                                                                    }
                                                                                                </p>

                                                                                                <p className="text-xs text-slate-600">
                                                                                                    <span className="font-black">
                                                                                                        Correcta:
                                                                                                    </span>{" "}
                                                                                                    {
                                                                                                        correctOption
                                                                                                    }
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                },
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </details>
                                                            </td>

                                                            <td className="px-4 py-4 text-center">
                                                                <span className="inline-flex rounded-xl bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                                                                    {
                                                                        row
                                                                            .response
                                                                            .score
                                                                    }
                                                                    {maxScore > 0
                                                                        ? ` / ${maxScore}`
                                                                        : ""}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-4 text-center">
                                                                <span className="font-black text-slate-800">
                                                                    {
                                                                        minimumScore
                                                                    }
                                                                    {maxScore > 0
                                                                        ? ` / ${maxScore}`
                                                                        : ""}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-4 text-center">
                                                                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            editPassed[
                                                                            responseId
                                                                            ] ??
                                                                            false
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            setEditPassed(
                                                                                (
                                                                                    current,
                                                                                ) => ({
                                                                                    ...current,
                                                                                    [responseId]:
                                                                                        event
                                                                                            .target
                                                                                            .checked,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="h-4 w-4 accent-blue-700"
                                                                        disabled={
                                                                            savingResponseId ===
                                                                            responseId
                                                                        }
                                                                    />

                                                                    {editPassed[
                                                                        responseId
                                                                    ]
                                                                        ? "Aprobado"
                                                                        : "No aprobado"}
                                                                </label>
                                                            </td>

                                                            <td className="px-4 py-4">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={
                                                                        editScores[
                                                                        responseId
                                                                        ] ?? ""
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) => {
                                                                        const value =
                                                                            event
                                                                                .target
                                                                                .value;

                                                                        setEditScores(
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                [responseId]:
                                                                                    value,
                                                                            }),
                                                                        );

                                                                        const numericValue =
                                                                            Number(
                                                                                value,
                                                                            );

                                                                        setEditPassed(
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                [responseId]:
                                                                                    Number.isFinite(
                                                                                        numericValue,
                                                                                    ) &&
                                                                                    numericValue >=
                                                                                    minimumScore,
                                                                            }),
                                                                        );

                                                                        setModalError(
                                                                            "",
                                                                        );
                                                                    }}
                                                                    className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                                    disabled={
                                                                        savingResponseId ===
                                                                        responseId
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="px-4 py-4 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void handleSaveGrade(
                                                                            row,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        savingResponseId ===
                                                                        responseId
                                                                    }
                                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {savingResponseId ===
                                                                        responseId ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Save className="h-4 w-4" />
                                                                    )}
                                                                    Guardar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default TeacherQuizGradesView;