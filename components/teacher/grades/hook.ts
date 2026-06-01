"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    createCertificateFromTemplate,
    getCertificatesByCourse,
    getCertificateTemplate,
    reissueCertificateFromTemplate,
    type Certificate,
} from "@/services/certificates.service";
import {
    getLessonBlocksByLesson,
    getLessonsByModule,
    type Lesson,
    type LessonBlock,
} from "@/services/lessons.service";
import {
    getModulesByCourse,
    type CourseModule,
} from "@/services/modules.service";
import {
    getQuizzResponsesByLessonBlock,
    updateQuizzResponse,
} from "@/services/quizz-response.service";
import {
    getHomeworkResponsesByLessonBlockFlexible,
    normalizeList,
    updateHomeworkResponseFlexible,
} from "./api";
import type {
    EnrollmentGroup,
    GradeBlockInfo,
    GradeResponse,
    GradeRow,
    GroupModalState,
    TeacherQuizGradesViewProps,
} from "./types";
import {
    getActivityTitle,
    getCalculatedPassed,
    getCourseIdFromPathname,
    getEnrollmentId,
    getErrorMessage,
    getGroupAverage,
    getScore,
    getStudentName,
    getUserId,
    isHomeworkBlock,
    isQuizBlock,
    normalizeResponseToString,
    openCertificateByRoute,
    sortByOrder,
} from "./utils";

const ROWS_PER_PAGE = 7;

export function useGrades({ courseId, params }: TeacherQuizGradesViewProps) {
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
    const [activityBlocks, setActivityBlocks] = useState<GradeBlockInfo[]>([]);
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
        () => [...courses].sort((a: Course, b: Course) => a.name.localeCompare(b.name)),
        [courses],
    );

    const quizBlocks = useMemo(
        () =>
            activityBlocks.filter(
                (item: GradeBlockInfo) => item.kind === "quiz",
            ),
        [activityBlocks],
    );

    const homeworkBlocks = useMemo(
        () =>
            activityBlocks.filter(
                (item: GradeBlockInfo) => item.kind === "homework",
            ),
        [activityBlocks],
    );

    const filteredGrades = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return grades.filter((row: GradeRow) => {
            const selectedBlockMatches =
                selectedBlockId === 0 ||
                Number(row.blockInfo.block.id) === selectedBlockId;

            if (!selectedBlockMatches) return false;

            if (!normalizedSearch) return true;

            const studentName = getStudentName(row.response).toLowerCase();
            const activityTitle = getActivityTitle(row).toLowerCase();
            const moduleName = row.blockInfo.module.name.toLowerCase();
            const lessonName = row.blockInfo.lesson.name.toLowerCase();

            return (
                studentName.includes(normalizedSearch) ||
                activityTitle.includes(normalizedSearch) ||
                moduleName.includes(normalizedSearch) ||
                lessonName.includes(normalizedSearch) ||
                String(getScore(row)).includes(normalizedSearch) ||
                String(getEnrollmentId(row.response)).includes(
                    normalizedSearch,
                ) ||
                String(
                    row.response.lesson_block_id ?? row.response.lessonBlockId,
                ).includes(normalizedSearch)
            );
        });
    }, [grades, searchTerm, selectedBlockId]);

    const groupedGrades = useMemo<EnrollmentGroup[]>(() => {
        const groups = new Map<string, GradeRow[]>();

        filteredGrades.forEach((row: GradeRow) => {
            const enrollmentId = getEnrollmentId(row.response);
            const userId = getUserId(row.response);

            const key =
                enrollmentId > 0
                    ? `enrollment-${enrollmentId}`
                    : `user-${userId || getStudentName(row.response)}`;

            const currentRows = groups.get(key) ?? [];

            groups.set(key, [...currentRows, row]);
        });

        return Array.from(groups.values())
            .map((rows: GradeRow[]) => {
                const sortedRows = [...rows].sort(
                    (a: GradeRow, b: GradeRow) =>
                        new Date(
                            b.response.updated_at ??
                            b.response.created_at ??
                            "",
                        ).getTime() -
                        new Date(
                            a.response.updated_at ??
                            a.response.created_at ??
                            "",
                        ).getTime(),
                );

                const firstRow = sortedRows[0];
                const userId = getUserId(firstRow.response);
                const enrollmentId = getEnrollmentId(firstRow.response);

                const passedCount = sortedRows.filter((row: GradeRow) =>
                    getCalculatedPassed(row),
                ).length;

                const failedCount = sortedRows.length - passedCount;

                const certificate =
                    certificates.find(
                        (item: Certificate) =>
                            Number(item.user_id) === userId &&
                            Number(item.course_id) === currentCourseId &&
                            item.is_valid !== false,
                    ) ??
                    certificates.find(
                        (item: Certificate) =>
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
                    lastDate:
                        sortedRows[0]?.response.updated_at ??
                        sortedRows[0]?.response.created_at ??
                        "",
                    certificate,
                };
            })
            .sort((a: EnrollmentGroup, b: EnrollmentGroup) =>
                a.studentName.localeCompare(b.studentName),
            );
    }, [filteredGrades, certificates, currentCourseId]);

    const totalPages = Math.max(
        1,
        Math.ceil(groupedGrades.length / ROWS_PER_PAGE),
    );

    const activePage = Math.min(currentPage, totalPages);

    const paginatedGroups = useMemo(() => {
        const start = (activePage - 1) * ROWS_PER_PAGE;

        return groupedGrades.slice(start, start + ROWS_PER_PAGE);
    }, [groupedGrades, activePage]);

    const passedCount = useMemo(
        () =>
            grades.filter((row: GradeRow) => getCalculatedPassed(row)).length,
        [grades],
    );

    const failedCount = grades.length - passedCount;

    const averageScore = useMemo(() => getGroupAverage(grades), [grades]);

    const generatedCertificatesCount = useMemo(
        () =>
            groupedGrades.filter((group: EnrollmentGroup) => group.certificate)
                .length,
        [groupedGrades],
    );

    const startItem =
        groupedGrades.length === 0
            ? 0
            : (activePage - 1) * ROWS_PER_PAGE + 1;

    const endItem = Math.min(activePage * ROWS_PER_PAGE, groupedGrades.length);

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
                    const safeCourses = normalizeList<Course>(coursesData);

                    setCourses(safeCourses);
                    setCourse(null);
                    setActivityBlocks([]);
                    setGrades([]);
                    setCertificates([]);
                    setCurrentPage(1);
                    return;
                }

                const [
                    coursesData,
                    courseModulesData,
                    courseCertificatesData,
                ] = await Promise.all([
                    getAllCourses(),
                    getModulesByCourse(currentCourseId),
                    getCertificatesByCourse(currentCourseId),
                ]);

                const safeCourses = normalizeList<Course>(coursesData);
                const courseModules =
                    normalizeList<CourseModule>(courseModulesData);
                const courseCertificates =
                    normalizeList<Certificate>(courseCertificatesData);

                setCourses(safeCourses);

                const currentCourse =
                    safeCourses.find(
                        (courseItem: Course) =>
                            Number(courseItem.id) === currentCourseId,
                    ) ?? null;

                const blockResults = await Promise.all(
                    sortByOrder<CourseModule>(courseModules).map(
                        async (moduleItem: CourseModule) => {
                            const lessonsData = await getLessonsByModule(
                                moduleItem.id,
                            );

                            const lessons = normalizeList<Lesson>(lessonsData);

                            const lessonBlockResults = await Promise.all(
                                sortByOrder<Lesson>(lessons).map(
                                    async (lessonItem: Lesson) => {
                                        const blocksData =
                                            await getLessonBlocksByLesson(
                                                lessonItem.id,
                                            );

                                        const blocks =
                                            normalizeList<LessonBlock>(
                                                blocksData,
                                            );

                                        return sortByOrder<LessonBlock>(blocks)
                                            .filter(
                                                (block: LessonBlock) =>
                                                    block.is_active !== false &&
                                                    (isQuizBlock(block) ||
                                                        isHomeworkBlock(block)),
                                            )
                                            .map((block: LessonBlock) => ({
                                                module: moduleItem,
                                                lesson: lessonItem,
                                                block,
                                                kind: isQuizBlock(block)
                                                    ? ("quiz" as const)
                                                    : ("homework" as const),
                                            }));
                                    },
                                ),
                            );

                            return lessonBlockResults.flat();
                        },
                    ),
                );

                const currentActivityBlocks: GradeBlockInfo[] =
                    blockResults.flat();

                const responseResults = await Promise.all(
                    currentActivityBlocks.map(
                        async (blockInfo: GradeBlockInfo) => {
                            if (blockInfo.kind === "quiz") {
                                const responsesData =
                                    await getQuizzResponsesByLessonBlock(
                                        blockInfo.block.id,
                                    );

                                const responses =
                                    normalizeList<GradeResponse>(responsesData);

                                return responses.map(
                                    (response: GradeResponse): GradeRow => ({
                                        kind: "quiz",
                                        blockInfo,
                                        response,
                                    }),
                                );
                            }

                            const responses =
                                await getHomeworkResponsesByLessonBlockFlexible(
                                    blockInfo.block.id,
                                );

                            return responses.map(
                                (response: GradeResponse): GradeRow => ({
                                    kind: "homework",
                                    blockInfo,
                                    response,
                                }),
                            );
                        },
                    ),
                );

                const currentGrades = responseResults
                    .flat()
                    .filter(
                        (row: GradeRow) => Number(row.response.id) > 0,
                    )
                    .sort(
                        (a: GradeRow, b: GradeRow) =>
                            new Date(
                                b.response.updated_at ??
                                b.response.created_at ??
                                "",
                            ).getTime() -
                            new Date(
                                a.response.updated_at ??
                                a.response.created_at ??
                                "",
                            ).getTime(),
                    );

                setCourse(currentCourse);
                setActivityBlocks(currentActivityBlocks);
                setGrades(currentGrades);
                setCertificates(courseCertificates);
                setCurrentPage(1);
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
                setCourse(null);
                setActivityBlocks([]);
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

        group.rows.forEach((row: GradeRow) => {
            scores[row.response.id] = String(getScore(row));
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
        setCertificates((current: Certificate[]) => {
            const nextCertificates = current.filter(
                (item: Certificate) =>
                    item.id !== certificate.id &&
                    !(
                        Number(item.user_id) === Number(certificate.user_id) &&
                        Number(item.course_id) ===
                        Number(certificate.course_id)
                    ),
            );

            return [certificate, ...nextCertificates];
        });

        setGroupModal((current: GroupModalState | null) => {
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

    function replaceGradeResponse(updatedResponse: GradeResponse) {
        setGrades((current: GradeRow[]) =>
            current.map((item: GradeRow) =>
                item.response.id === updatedResponse.id
                    ? {
                        ...item,
                        response: {
                            ...item.response,
                            ...updatedResponse,
                            enrollment: item.response.enrollment,
                            user: item.response.user,
                        },
                    }
                    : item,
            ),
        );

        setGroupModal((current: GroupModalState | null) => {
            if (!current) return current;

            const updatedModalRows = current.group.rows.map((item: GradeRow) =>
                item.response.id === updatedResponse.id
                    ? {
                        ...item,
                        response: {
                            ...item.response,
                            ...updatedResponse,
                            enrollment: item.response.enrollment,
                            user: item.response.user,
                        },
                    }
                    : item,
            );

            const passedGroupCount = updatedModalRows.filter(
                (item: GradeRow) => getCalculatedPassed(item),
            ).length;

            return {
                group: {
                    ...current.group,
                    rows: updatedModalRows,
                    averageScore: getGroupAverage(updatedModalRows),
                    passedCount: passedGroupCount,
                    failedCount: updatedModalRows.length - passedGroupCount,
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

            const payload = {
                response: normalizeResponseToString(row.response.response),
                score: parsedScore,
                grade: parsedScore,
                is_passed: editPassed[responseId] ?? false,
                isPassed: editPassed[responseId] ?? false,
            };

            const updatedResponse =
                row.kind === "quiz"
                    ? await updateQuizzResponse(responseId, payload)
                    : await updateHomeworkResponseFlexible(
                        responseId,
                        payload,
                    );

            replaceGradeResponse({
                ...row.response,
                ...(updatedResponse && typeof updatedResponse === "object"
                    ? (updatedResponse as GradeResponse)
                    : {}),
                id: responseId,
                score: parsedScore,
                grade: parsedScore,
                is_passed: editPassed[responseId] ?? false,
            });

            if (currentCourseId > 0) {
                const freshCertificatesData =
                    await getCertificatesByCourse(currentCourseId);

                const freshCertificates =
                    normalizeList<Certificate>(freshCertificatesData);

                setCertificates(freshCertificates);

                setGroupModal((current: GroupModalState | null) => {
                    if (!current) return current;

                    const freshCertificate =
                        freshCertificates.find(
                            (item: Certificate) =>
                                Number(item.user_id) ===
                                Number(current.group.userId) &&
                                Number(item.course_id) ===
                                Number(currentCourseId) &&
                                item.is_valid !== false,
                        ) ??
                        freshCertificates.find(
                            (item: Certificate) =>
                                Number(item.user_id) ===
                                Number(current.group.userId) &&
                                Number(item.course_id) ===
                                Number(currentCourseId),
                        ) ??
                        current.group.certificate ??
                        null;

                    return {
                        group: {
                            ...current.group,
                            certificate: freshCertificate,
                        },
                    };
                });
            }

            setNotice(
                "Calificación actualizada correctamente. El promedio del certificado fue actualizado.",
            );
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
            setErrorMessage(
                "No hay calificaciones para generar el certificado.",
            );
            return;
        }

        if (group.failedCount > 0) {
            setErrorMessage(
                "No se puede generar el certificado porque el estudiante tiene actividades no aprobadas.",
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

            const freshCertificatesData =
                await getCertificatesByCourse(currentCourseId);

            const freshCertificates =
                normalizeList<Certificate>(freshCertificatesData);

            const existingCertificate =
                freshCertificates.find(
                    (item: Certificate) =>
                        Number(item.user_id) === Number(group.userId) &&
                        Number(item.course_id) === Number(currentCourseId) &&
                        item.is_valid !== false,
                ) ??
                freshCertificates.find(
                    (item: Certificate) =>
                        Number(item.user_id) === Number(group.userId) &&
                        Number(item.course_id) === Number(currentCourseId),
                ) ??
                group.certificate ??
                null;

            const certificateFinalGrade = existingCertificate?.final_grade?.trim()
                ? existingCertificate.final_grade
                : group.averageScore;

            const values = {
                studentName: group.studentName,
                courseName: course.name,
                completionDate: new Date().toLocaleDateString("es-EC"),
                instructorName: "Instructor",
                certificateCode: existingCertificate?.certificate_code ?? "",
                finalGrade: certificateFinalGrade,
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

    return {
        routeCourseId,
        isAdminRoute,
        selectedCourseId,
        currentCourseId,

        courses,
        course,
        courseOptions,
        activityBlocks,
        grades,
        certificates,
        searchTerm,
        selectedBlockId,
        currentPage,

        isLoading,
        isRefreshing,
        savingResponseId,
        generatingCertificateUserId,
        errorMessage,
        notice,

        groupModal,
        editScores,
        editPassed,
        modalError,

        quizBlocks,
        homeworkBlocks,
        filteredGrades,
        groupedGrades,
        paginatedGroups,

        totalPages,
        activePage,
        passedCount,
        failedCount,
        averageScore,
        generatedCertificatesCount,
        startItem,
        endItem,

        setSearchTerm,
        setSelectedBlockId,
        setCurrentPage,
        setEditScores,
        setEditPassed,
        setModalError,

        loadGrades,
        handleSelectCourse,
        openGroupModal,
        closeGroupModal,
        handleSaveGrade,
        handleGenerateOrReissueCertificate,
    };
}