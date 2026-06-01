"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAcceptedStudentEnrollmentsByCourse } from "@/services/enrollments.service";
import { getForumResponsesByLessonBlock } from "@/services/forum-response.service";
import {
    getHomeworkResponsesByLessonBlock,
    gradeHomeworkResponse,
} from "@/services/homework-response.service";
import {
    getDefaultLessonBlocksByCourseAndType,
    getLessonBlock,
} from "@/services/lessons.service";
import {
    getQuizzResponsesByLessonBlock,
    updateQuizzResponse,
} from "@/services/quizz-response.service";
import { getSurveyResponsesByLessonBlock } from "@/services/survey-response.service";
import { BLOCK_TYPE_IDS, STUDENT_ROLE_ID } from "./constants";
import type {
    GradeFormState,
    LessonItemReviewPageProps,
    ReviewStudentRow,
} from "./types";
import {
    buildStudentRows,
    getBlockTitle,
    getItemTypeFromBlock,
    getItemTypeLabel,
    getResponseRecord,
} from "./utils";

type AnyRecord = Record<string, unknown>;

type EnrollmentList = Awaited<
    ReturnType<typeof getAcceptedStudentEnrollmentsByCourse>
>;

type LessonBlockData = Awaited<ReturnType<typeof getLessonBlock>>;

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AnyRecord;
}

function readText(value: unknown) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);

    return "";
}

function readNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function getGradeFormFromRow(
    row: {
        score?: string | number | null;
        comment?: string | null;
    } | null,
): GradeFormState {
    return {
        score:
            row?.score !== null && row?.score !== undefined
                ? String(row.score)
                : "",
        comment: row?.comment ?? "",
    };
}

function getEnrollmentIdFromEnrollment(enrollment: unknown): number | null {
    const record = toRecord(enrollment);

    if (!record) return null;

    return (
        readNumber(record.id) ??
        readNumber(record.enrollment_id) ??
        readNumber(record.enrollmentId)
    );
}

function getEnrollmentRoleId(enrollment: unknown): number | null {
    const record = toRecord(enrollment);

    if (!record) return null;

    const user =
        toRecord(record.user) ??
        toRecord(record.student) ??
        toRecord(record.person);

    const role =
        toRecord(record.role) ??
        toRecord(user?.role) ??
        toRecord(user?.user_role);

    return (
        readNumber(record.role_id) ??
        readNumber(record.roleId) ??
        readNumber(user?.role_id) ??
        readNumber(user?.roleId) ??
        readNumber(role?.id)
    );
}

function isStudentEnrollment(enrollment: unknown) {
    const roleId = getEnrollmentRoleId(enrollment);

    if (!roleId) return true;

    return roleId === STUDENT_ROLE_ID;
}

function getStudentNameFromEnrollment(enrollment: unknown) {
    const record = toRecord(enrollment);

    if (!record) return "Estudiante";

    const user =
        toRecord(record.user) ??
        toRecord(record.student) ??
        toRecord(record.person);

    const firstname =
        readText(user?.firstname) ||
        readText(user?.first_name) ||
        readText(user?.names);

    const lastname =
        readText(user?.lastname) ||
        readText(user?.last_name) ||
        readText(user?.surnames);

    const fullName = `${firstname} ${lastname}`.trim();

    return (
        fullName ||
        readText(user?.name) ||
        readText(user?.full_name) ||
        readText(user?.email) ||
        readText(record.student_name) ||
        readText(record.user_name) ||
        "Estudiante"
    );
}

function getStudentEmailFromEnrollment(enrollment: unknown) {
    const record = toRecord(enrollment);

    if (!record) return "";

    const user =
        toRecord(record.user) ??
        toRecord(record.student) ??
        toRecord(record.person);

    return readText(user?.email) || readText(record.email);
}

function getEnrollmentIdFromResponse(response: unknown): number | null {
    const record = getResponseRecord(response);
    const enrollment = toRecord(record.enrollment);

    return (
        readNumber(record.enrollment_id) ??
        readNumber(record.enrollmentId) ??
        readNumber(enrollment?.id)
    );
}

function getForumComment(response: unknown) {
    const record = getResponseRecord(response);

    return (
        readText(record.comment) ||
        readText(record.response) ||
        readText(record.content) ||
        readText(record.message) ||
        readText(record.answer) ||
        "Sin comentario."
    );
}

function getForumResponseDate(response: unknown) {
    const record = getResponseRecord(response);

    return (
        readText(record.created_at) ||
        readText(record.createdAt) ||
        readText(record.updated_at) ||
        readText(record.updatedAt) ||
        readText(record.submitted_at) ||
        readText(record.submittedAt)
    );
}

function sortForumResponsesByDate(responses: unknown[]) {
    return [...responses].sort((first, second) => {
        const firstDate = new Date(getForumResponseDate(first)).getTime();
        const secondDate = new Date(getForumResponseDate(second)).getTime();

        if (Number.isNaN(firstDate) && Number.isNaN(secondDate)) return 0;
        if (Number.isNaN(firstDate)) return 1;
        if (Number.isNaN(secondDate)) return -1;

        return firstDate - secondDate;
    });
}


function buildForumStudentRows(params: {
    itemType: ReturnType<typeof getItemTypeFromBlock>;
    enrollments: EnrollmentList;
    responses: unknown[];
}): ReviewStudentRow[] {
    const baseRows = buildStudentRows({
        itemType: params.itemType,
        enrollments: params.enrollments,
        responses: params.responses,
    }) as ReviewStudentRow[];

    const groupedResponses = new Map<number, unknown[]>();

    params.responses.forEach((response) => {
        const record = getResponseRecord(response);

        if (record.deleted === true) return;

        const enrollmentId = getEnrollmentIdFromResponse(response);

        if (!enrollmentId) return;

        if (!groupedResponses.has(enrollmentId)) {
            groupedResponses.set(enrollmentId, []);
        }

        groupedResponses.get(enrollmentId)?.push(response);
    });

    return baseRows.map((row) => {
        const enrollmentId = readNumber(row.enrollmentId);

        const studentResponses = enrollmentId
            ? sortForumResponsesByDate(groupedResponses.get(enrollmentId) ?? [])
            : [];

        const lastResponse =
            studentResponses.length > 0
                ? studentResponses[studentResponses.length - 1]
                : null;

        const currentRaw = toRecord(row.raw) ?? {};

        return {
            ...row,

            hasSubmission: studentResponses.length > 0,
            responseId: null,
            score: null,
            comment: lastResponse ? getForumComment(lastResponse) : "",

            /**
             * No tocamos row.status porque ReviewStatus no acepta
             * "submitted" ni "pending".
             */
            statusLabel:
                studentResponses.length > 0
                    ? `${studentResponses.length} participación${studentResponses.length === 1 ? "" : "es"
                    }`
                    : row.statusLabel,

            raw: {
                ...currentRaw,
                response: lastResponse,
                forumResponses: studentResponses,
                forum_responses: studentResponses,
                responses: studentResponses,
                participations: studentResponses,
            },
        };
    });
}

function getNormalRows(params: {
    itemType: ReturnType<typeof getItemTypeFromBlock>;
    enrollments: EnrollmentList;
    responses: unknown[];
}) {
    return buildStudentRows({
        itemType: params.itemType,
        enrollments: params.enrollments,
        responses: params.responses,
    }) as ReviewStudentRow[];
}

export function useLessonItemReview({
    courseId,
    itemId,
}: LessonItemReviewPageProps) {
    const numericCourseId = useMemo(() => Number(courseId), [courseId]);
    const numericItemId = useMemo(() => Number(itemId), [itemId]);

    const backHref = `/teacher/courses/${courseId}/modules`;
    const editorHref = `/teacher/courses/${courseId}/modules/items/${itemId}`;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingGrade, setSavingGrade] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [block, setBlock] = useState<LessonBlockData | null>(null);

    const [surveyBlocks, setSurveyBlocks] = useState<LessonBlockData[]>([]);

    const [enrollments, setEnrollments] = useState<EnrollmentList>([]);
    const [responses, setResponses] = useState<unknown[]>([]);
    const [selectedEnrollmentId, setSelectedEnrollmentIdState] =
        useState<number | null>(null);

    const [gradeForm, setGradeForm] = useState<GradeFormState>({
        score: "",
        comment: "",
    });

    const itemType = useMemo(() => getItemTypeFromBlock(block), [block]);

    const itemTypeLabel = useMemo(
        () => getItemTypeLabel(itemType),
        [itemType],
    );

    const title = useMemo(() => getBlockTitle(block), [block]);

    const rows = useMemo<ReviewStudentRow[]>(() => {
        if (itemType === "forum") {
            return buildForumStudentRows({
                itemType,
                enrollments,
                responses,
            });
        }

        return getNormalRows({
            itemType,
            enrollments,
            responses,
        });
    }, [itemType, enrollments, responses]);

    const selectedRow = useMemo<ReviewStudentRow | null>(() => {
        if (rows.length === 0) return null;

        if (selectedEnrollmentId === null) {
            return rows[0] ?? null;
        }

        return (
            rows.find((row) => row.enrollmentId === selectedEnrollmentId) ??
            rows[0] ??
            null
        );
    }, [rows, selectedEnrollmentId]);

    const selectedIndex = useMemo(() => {
        if (!selectedRow) return -1;

        return rows.findIndex(
            (row) => row.enrollmentId === selectedRow.enrollmentId,
        );
    }, [rows, selectedRow]);

    const totalStudents = rows.length;

    const totalSubmissions = useMemo(() => {
        if (itemType === "forum") {
            return responses.filter((response) => {
                const record = getResponseRecord(response);

                return record.deleted !== true;
            }).length;
        }

        return rows.filter((row) => row.hasSubmission).length;
    }, [itemType, responses, rows]);

    const canGrade =
        itemType !== "forum" &&
        itemType !== "survey" &&
        Boolean(selectedRow?.hasSubmission);

    const loadResponses = useCallback(
        async (currentItemType = itemType) => {
            if (!Number.isFinite(numericItemId) || numericItemId <= 0) {
                return [];
            }

            if (currentItemType === "homework") {
                return getHomeworkResponsesByLessonBlock(numericItemId);
            }

            if (currentItemType === "quiz") {
                return getQuizzResponsesByLessonBlock(numericItemId);
            }

            if (currentItemType === "survey") {
                return getSurveyResponsesByLessonBlock(numericItemId);
            }

            if (currentItemType === "forum") {
                return getForumResponsesByLessonBlock(numericItemId);
            }

            return [];
        },
        [itemType, numericItemId],
    );

    const loadData = useCallback(async () => {
        setError("");
        setNotice("");
        setRefreshing(true);

        try {
            if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
                throw new Error("No se pudo identificar el curso.");
            }

            if (!Number.isFinite(numericItemId) || numericItemId <= 0) {
                throw new Error("No se pudo identificar el ítem.");
            }

            const currentBlock = await getLessonBlock(numericItemId);
            const currentItemType = getItemTypeFromBlock(currentBlock);

            const surveyBlocksPromise =
                currentItemType === "survey"
                    ? getDefaultLessonBlocksByCourseAndType(
                        numericCourseId,
                        BLOCK_TYPE_IDS.survey,
                    ).catch(() => [])
                    : Promise.resolve([]);

            const [
                currentEnrollments,
                currentResponses,
                currentSurveyBlocks,
            ] = await Promise.all([
                getAcceptedStudentEnrollmentsByCourse(numericCourseId),
                loadResponses(currentItemType),
                surveyBlocksPromise,
            ]);

            const safeEnrollments = Array.isArray(currentEnrollments)
                ? currentEnrollments
                : [];

            const safeResponses = Array.isArray(currentResponses)
                ? currentResponses
                : [];

            const safeSurveyBlocks = Array.isArray(currentSurveyBlocks)
                ? currentSurveyBlocks.filter(
                    (surveyBlock) =>
                        getItemTypeFromBlock(surveyBlock) === "survey",
                )
                : [];

            if (
                currentItemType === "survey" &&
                !safeSurveyBlocks.some(
                    (surveyBlock) => surveyBlock.id === currentBlock.id,
                )
            ) {
                safeSurveyBlocks.push(currentBlock);
            }

            safeSurveyBlocks.sort(
                (first, second) =>
                    Number(first.order ?? 0) - Number(second.order ?? 0),
            );

            const currentRows =
                currentItemType === "forum"
                    ? buildForumStudentRows({
                        itemType: currentItemType,
                        enrollments: safeEnrollments as EnrollmentList,
                        responses: safeResponses,
                    })
                    : getNormalRows({
                        itemType: currentItemType,
                        enrollments: safeEnrollments as EnrollmentList,
                        responses: safeResponses,
                    });

            const nextSelectedRow =
                currentRows.find(
                    (row) => row.enrollmentId === selectedEnrollmentId,
                ) ??
                currentRows[0] ??
                null;

            setBlock(currentBlock);
            setSurveyBlocks(
                currentItemType === "survey" ? safeSurveyBlocks : [],
            );
            setEnrollments(safeEnrollments as EnrollmentList);
            setResponses(safeResponses);
            setSelectedEnrollmentIdState(
                nextSelectedRow?.enrollmentId ?? null,
            );
            setGradeForm(getGradeFormFromRow(nextSelectedRow));
        } catch (loadError) {
            const message =
                loadError instanceof Error
                    ? loadError.message
                    : "No se pudo cargar la revisión del ítem.";

            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [
        loadResponses,
        numericCourseId,
        numericItemId,
        selectedEnrollmentId,
    ]);

    const setSelectedEnrollmentId = useCallback(
        (enrollmentId: number | null) => {
            const nextRow =
                rows.find((row) => row.enrollmentId === enrollmentId) ??
                rows[0] ??
                null;

            setSelectedEnrollmentIdState(nextRow?.enrollmentId ?? null);
            setGradeForm(getGradeFormFromRow(nextRow));
        },
        [rows],
    );

    const goToPreviousStudent = useCallback(() => {
        if (selectedIndex <= 0) return;

        const previousRow = rows[selectedIndex - 1];

        setSelectedEnrollmentId(previousRow?.enrollmentId ?? null);
    }, [rows, selectedIndex, setSelectedEnrollmentId]);

    const goToNextStudent = useCallback(() => {
        if (selectedIndex < 0 || selectedIndex >= rows.length - 1) return;

        const nextRow = rows[selectedIndex + 1];

        setSelectedEnrollmentId(nextRow?.enrollmentId ?? null);
    }, [rows, selectedIndex, setSelectedEnrollmentId]);

    async function handleSaveGrade() {
        setError("");
        setNotice("");

        if (itemType === "forum" || itemType === "survey") {
            setNotice(
                "Este tipo de ítem solo requiere revisión y no necesita calificación numérica.",
            );
            return;
        }

        if (!selectedRow?.responseId) {
            setError("Selecciona una entrega o respuesta para calificar.");
            return;
        }

        const score = Number(gradeForm.score);

        if (!Number.isFinite(score) || score < 0) {
            setError("Ingresa una nota válida.");
            return;
        }

        setSavingGrade(true);

        try {
            if (itemType === "homework") {
                await gradeHomeworkResponse(selectedRow.responseId, {
                    score,
                    comment: gradeForm.comment,
                });

                setNotice("Tarea calificada correctamente.");
                await loadData();
                return;
            }

            if (itemType === "quiz") {
                const raw = getResponseRecord(selectedRow.raw);
                const currentResponse = String(raw.response ?? "");
                const minimumScore = Number(block?.completion_value ?? 0);

                await updateQuizzResponse(selectedRow.responseId, {
                    response: currentResponse,
                    score,
                    is_passed:
                        minimumScore > 0 ? score >= minimumScore : true,
                });

                setNotice("Evaluación actualizada correctamente.");
                await loadData();
                return;
            }

            setError(
                "Este tipo de ítem no permite calificación desde esta pantalla.",
            );
        } catch (saveError) {
            const message =
                saveError instanceof Error
                    ? saveError.message
                    : "No se pudo guardar la calificación.";

            setError(message);
        } finally {
            setSavingGrade(false);
        }
    }

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadData]);

    return {
        courseId,
        itemId,
        numericCourseId,
        numericItemId,

        backHref,
        editorHref,

        loading,
        refreshing,
        savingGrade,
        error,
        notice,

        block,
        surveyBlocks,
        itemType,
        itemTypeLabel,
        title,

        enrollments,
        responses,
        rows,

        selectedEnrollmentId,
        selectedRow,
        selectedIndex,

        totalStudents,
        totalSubmissions,

        canGrade,
        canGoPrevious: selectedIndex > 0,
        canGoNext: selectedIndex >= 0 && selectedIndex < rows.length - 1,

        gradeForm,
        setGradeForm,

        setSelectedEnrollmentId,
        loadData,
        loadResponses,
        handleRefresh: loadData,

        handleSaveGrade,
        goToPreviousStudent,
        goToNextStudent,
        handlePreviousStudent: goToPreviousStudent,
        handleNextStudent: goToNextStudent,
    };
}

export type LessonItemReviewState = ReturnType<typeof useLessonItemReview>;