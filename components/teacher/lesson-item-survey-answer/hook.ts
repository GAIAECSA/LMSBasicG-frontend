"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { usePathname } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { notify } from "@/lib/notify";

import {
    getEnrollmentsByCourseAndRole,
    type Enrollment,
} from "@/services/enrollments.service";

import {
    getLessonBlock,
    type LessonBlock,
} from "@/services/lessons.service";

import {
    getSurveyResponsesByLessonBlock,
} from "@/services/survey-response.service";

import {
    createSurveyResponseFlexible,
    updateSurveyResponseFlexible,
} from "../../student/course-room/api";

/* =========================================================
   CONSTANTES
========================================================= */

const TEACHER_ROLE_ID = 3;

const LIKERT_OPTIONS = [
    "1 - Muy en desacuerdo",
    "2 - En desacuerdo",
    "3 - Ni de acuerdo ni en desacuerdo",
    "4 - De acuerdo",
    "5 - Muy de acuerdo",
];

/* =========================================================
   TIPOS
========================================================= */

type AnyRecord =
    Record<string, unknown>;

export type TeacherSurveyQuestion = {
    id: string;

    question: string;

    type:
    | "single"
    | "text";

    options: string[];

    required: boolean;
};

type SurveyAnswers =
    Record<string, string>;

type UseTeacherSurveyAnswerParams = {
    courseId: string;

    itemId: string;
};

/* =========================================================
   HELPERS GENERALES
========================================================= */

function isRecord(
    value: unknown,
): value is AnyRecord {
    return (
        Boolean(value) &&
        typeof value ===
        "object" &&
        !Array.isArray(value)
    );
}

function parseRecord(
    value: unknown,
): AnyRecord {
    if (isRecord(value)) {
        return value;
    }

    if (
        typeof value !==
        "string" ||
        !value.trim()
    ) {
        return {};
    }

    try {
        const parsed =
            JSON.parse(
                value,
            ) as unknown;

        return isRecord(
            parsed,
        )
            ? parsed
            : {};
    } catch {
        return {};
    }
}

function getText(
    value: unknown,
    fallback = "",
): string {
    if (
        value === null ||
        value ===
        undefined
    ) {
        return fallback;
    }

    if (
        typeof value ===
        "string" ||
        typeof value ===
        "number"
    ) {
        return String(
            value,
        );
    }

    return fallback;
}

function getBoolean(
    value: unknown,
    fallback = false,
): boolean {
    if (
        typeof value ===
        "boolean"
    ) {
        return value;
    }

    if (
        typeof value ===
        "number"
    ) {
        return value === 1;
    }

    if (
        typeof value ===
        "string"
    ) {
        const normalized =
            value
                .trim()
                .toLowerCase();

        if (
            [
                "true",
                "1",
                "yes",
                "si",
                "sí",
            ].includes(
                normalized,
            )
        ) {
            return true;
        }

        if (
            [
                "false",
                "0",
                "no",
            ].includes(
                normalized,
            )
        ) {
            return false;
        }
    }

    return fallback;
}

function normalizeText(
    value: unknown,
): string {
    return getText(
        value,
    )
        .trim()
        .toUpperCase();
}

/* =========================================================
   BLOQUE / CONTENT
========================================================= */

function getBlockContent(
    block:
        | LessonBlock
        | null,
): AnyRecord {
    if (!block) {
        return {};
    }

    return parseRecord(
        block.content,
    );
}

function getSurveyTitle(
    block:
        | LessonBlock
        | null,
): string {
    if (!block) {
        return "Encuesta";
    }

    const content =
        getBlockContent(
            block,
        );

    const title =
        getText(
            content.title ??
            content.name ??
            content.label ??
            content.text,
        ).trim();

    return (
        title ||
        `Encuesta #${block.id}`
    );
}

/* =========================================================
   PREGUNTAS
========================================================= */

function normalizeSurveyQuestions(
    value: unknown,
): TeacherSurveyQuestion[] {
    if (
        !Array.isArray(
            value,
        )
    ) {
        return [];
    }

    return value
        .map(
            (
                item,
                index,
            ):
                | TeacherSurveyQuestion
                | null => {
                if (
                    !isRecord(
                        item,
                    )
                ) {
                    return null;
                }

                const question =
                    getText(
                        item.question ??
                        item.text ??
                        item.label,
                    ).trim();

                if (
                    !question
                ) {
                    return null;
                }

                const rawType =
                    getText(
                        item.type,
                        "single",
                    )
                        .trim()
                        .toLowerCase();

                const type:
                    | "single"
                    | "text" =
                    rawType ===
                        "text" ||
                        rawType ===
                        "textarea" ||
                        rawType ===
                        "open"
                        ? "text"
                        : "single";

                const savedOptions =
                    Array.isArray(
                        item.options,
                    )
                        ? item.options
                            .map(
                                (
                                    option,
                                ) =>
                                    getText(
                                        option,
                                    ).trim(),
                            )
                            .filter(
                                Boolean,
                            )
                        : [];

                return {
                    id: String(
                        item.id ??
                        index +
                        1,
                    ),

                    question,

                    type,

                    options:
                        type ===
                            "single"
                            ? savedOptions
                                .length >
                                0
                                ? savedOptions
                                : [
                                    ...LIKERT_OPTIONS,
                                ]
                            : [],

                    required:
                        getBoolean(
                            item.required,
                            true,
                        ),
                };
            },
        )
        .filter(
            (
                question,
            ): question is TeacherSurveyQuestion =>
                question !==
                null,
        );
}

/* =========================================================
   ENROLLMENT DOCENTE
========================================================= */

function isTeacherEnrollment(
    enrollment: Enrollment,
): boolean {
    const roleId =
        Number(
            enrollment.role
                ?.id,
        );

    const roleName =
        normalizeText(
            enrollment.role
                ?.name,
        );

    return (
        roleId ===
        TEACHER_ROLE_ID ||
        roleName ===
        "PROFESOR" ||
        roleName ===
        "DOCENTE" ||
        roleName ===
        "TEACHER"
    );
}

function isValidTeacherEnrollment(
    enrollment: Enrollment,
    courseId: number,
): boolean {
    return (
        enrollment.accepted ===
        true &&
        Number(
            enrollment.course
                ?.id,
        ) === courseId &&
        isTeacherEnrollment(
            enrollment,
        )
    );
}

/*
 * IMPORTANTE
 *
 * Si el usuario autenticado es un profesor asignado,
 * usamos SU matrícula.
 *
 * Si entramos como ADMIN y existe exactamente un
 * profesor asignado, usamos la matrícula de ese
 * profesor.
 *
 * Si existen varios profesores y el ADMIN está
 * respondiendo, NO elegimos uno al azar.
 */
function resolveTeacherEnrollment(
    enrollments: Enrollment[],
    courseId: number,
    authenticatedUserId:
        | number
        | null,
): Enrollment | null {
    const teachers =
        enrollments.filter(
            (
                enrollment,
            ) =>
                isValidTeacherEnrollment(
                    enrollment,
                    courseId,
                ),
        );

    if (
        authenticatedUserId
    ) {
        const ownEnrollment =
            teachers.find(
                (
                    enrollment,
                ) =>
                    Number(
                        enrollment
                            .user
                            ?.id,
                    ) ===
                    authenticatedUserId,
            );

        if (
            ownEnrollment
        ) {
            return ownEnrollment;
        }
    }

    /*
     * Caso ADMIN:
     * si solamente hay un docente asignado,
     * podemos determinar inequívocamente quién
     * responde.
     */
    if (
        teachers.length ===
        1
    ) {
        return teachers[0];
    }

    return null;
}

/* =========================================================
   SURVEY RESPONSE
========================================================= */

function getEnrollmentIdFromResponse(
    response: unknown,
): number {
    const record =
        parseRecord(
            response,
        );

    const enrollment =
        parseRecord(
            record.enrollment,
        );

    const value =
        Number(
            record.enrollment_id ??
            record.enrollmentId ??
            enrollment.id ??
            0,
        );

    return Number.isFinite(
        value,
    )
        ? value
        : 0;
}

function getResponseId(
    response: unknown,
): number | null {
    const record =
        parseRecord(
            response,
        );

    const id =
        Number(
            record.id,
        );

    return (
        Number.isFinite(
            id,
        ) &&
        id > 0
    )
        ? id
        : null;
}

function getAnswersFromResponse(
    response: unknown,
): SurveyAnswers {
    const record =
        parseRecord(
            response,
        );

    const responseRecord =
        parseRecord(
            record.response,
        );

    const answersRecord =
        parseRecord(
            responseRecord.answers ??
            record.answers,
        );

    const answers:
        SurveyAnswers = {};

    Object.entries(
        answersRecord,
    ).forEach(
        (
            [
                key,
                value,
            ],
        ) => {
            answers[
                String(key)
            ] =
                getText(
                    value,
                );
        },
    );

    return answers;
}

function hasAnswers(
    answers: SurveyAnswers,
): boolean {
    return (
        Object.keys(
            answers,
        ).length >
        0
    );
}

/* =========================================================
   HOOK
========================================================= */

export function useTeacherSurveyAnswer({
    courseId,
    itemId,
}: UseTeacherSurveyAnswerParams) {
    const pathname =
        usePathname();

    const isAdminRoute =
        pathname.startsWith(
            "/admin",
        );

    const numericCourseId =
        useMemo(
            () =>
                Number(
                    courseId,
                ),
            [courseId],
        );

    const numericItemId =
        useMemo(
            () =>
                Number(
                    itemId,
                ),
            [itemId],
        );

    /* =====================================================
       STATE
    ===================================================== */

    const [
        loading,
        setLoading,
    ] =
        useState(
            true,
        );

    const [
        saving,
        setSaving,
    ] =
        useState(
            false,
        );

    const [
        error,
        setError,
    ] =
        useState(
            "",
        );

    const [
        block,
        setBlock,
    ] =
        useState<LessonBlock | null>(
            null,
        );

    const [
        teacherEnrollment,
        setTeacherEnrollment,
    ] =
        useState<Enrollment | null>(
            null,
        );

    const [
        existingResponse,
        setExistingResponse,
    ] =
        useState<unknown | null>(
            null,
        );

    const [
        answers,
        setAnswers,
    ] =
        useState<SurveyAnswers>(
            {},
        );

    /* =====================================================
       REFS
    ===================================================== */

    const loadingRef =
        useRef(
            false,
        );

    const savingRef =
        useRef(
            false,
        );

    /* =====================================================
       DATOS DERIVADOS
    ===================================================== */

    const content =
        useMemo(
            () =>
                getBlockContent(
                    block,
                ),
            [block],
        );

    const questions =
        useMemo(
            () =>
                normalizeSurveyQuestions(
                    content.questions ??
                    content.survey_questions ??
                    content.preguntas ??
                    content.items,
                ),
            [content],
        );

    const title =
        useMemo(
            () =>
                getSurveyTitle(
                    block,
                ),
            [block],
        );

    const description =
        useMemo(
            () =>
                getText(
                    content.instructions ??
                    content.survey_instructions ??
                    content.description,
                ),
            [content],
        );

    /* =====================================================
       CARGAR DATOS
    ===================================================== */

    const loadData =
        useCallback(
            async () => {
                if (
                    loadingRef.current
                ) {
                    return;
                }

                loadingRef.current =
                    true;

                try {
                    setLoading(
                        true,
                    );

                    setError(
                        "",
                    );

                    /* =================================
                       VALIDAR IDs
                    ================================= */

                    if (
                        !Number.isFinite(
                            numericCourseId,
                        ) ||
                        numericCourseId <=
                        0
                    ) {
                        throw new Error(
                            "No se pudo identificar el curso.",
                        );
                    }

                    if (
                        !Number.isFinite(
                            numericItemId,
                        ) ||
                        numericItemId <=
                        0
                    ) {
                        throw new Error(
                            "No se pudo identificar la encuesta.",
                        );
                    }

                    /* =================================
                       USUARIO AUTENTICADO
                    ================================= */

                    const session =
                        getAuthSession();

                    const sessionUser =
                        session?.user as
                        | {
                            id?:
                            | number
                            | string;
                        }
                        | undefined;

                    const rawUserId =
                        Number(
                            sessionUser?.id,
                        );

                    const authenticatedUserId =
                        Number.isFinite(
                            rawUserId,
                        ) &&
                            rawUserId >
                            0
                            ? rawUserId
                            : null;

                    /* =================================
                       CONSULTAS
                    ================================= */

                    const [
                        currentBlock,
                        teacherEnrollments,
                        surveyResponses,
                    ] =
                        await Promise.all(
                            [
                                getLessonBlock(
                                    numericItemId,
                                ),

                                getEnrollmentsByCourseAndRole(
                                    numericCourseId,
                                    TEACHER_ROLE_ID,
                                ),

                                getSurveyResponsesByLessonBlock(
                                    numericItemId,
                                ),
                            ],
                        );

                    /*
                     * Guardamos el bloque inmediatamente para
                     * que incluso si falla la matrícula,
                     * podamos mostrar el título correcto.
                     */
                    setBlock(
                        currentBlock,
                    );

                    console.log(
                        "USUARIO AUTENTICADO:",
                        authenticatedUserId,
                    );

                    console.log(
                        "DOCENTES CURSO:",
                        teacherEnrollments,
                    );

                    console.log(
                        "RESPUESTAS ENCUESTA:",
                        surveyResponses,
                    );

                    /* =================================
                       RESOLVER DOCENTE
                    ================================= */

                    const safeTeacherEnrollments =
                        Array.isArray(
                            teacherEnrollments,
                        )
                            ? teacherEnrollments
                            : [];

                    const enrollment =
                        resolveTeacherEnrollment(
                            safeTeacherEnrollments,
                            numericCourseId,
                            authenticatedUserId,
                        );

                    if (
                        !enrollment
                    ) {
                        const validTeachers =
                            safeTeacherEnrollments.filter(
                                (
                                    current,
                                ) =>
                                    isValidTeacherEnrollment(
                                        current,
                                        numericCourseId,
                                    ),
                            );

                        if (
                            validTeachers.length >
                            1
                        ) {
                            throw new Error(
                                "Hay varios docentes asignados al curso. No se puede determinar automáticamente cuál responderá la encuesta.",
                            );
                        }

                        throw new Error(
                            "No existe un docente aprobado y asignado a este curso.",
                        );
                    }

                    console.log(
                        "MATRÍCULA DOCENTE SELECCIONADA:",
                        enrollment,
                    );

                    /*
                     * En tu ejemplo debe ser:
                     *
                     * enrollment.id = 23
                     */
                    setTeacherEnrollment(
                        enrollment,
                    );

                    /* =================================
                       BUSCAR RESPUESTA DEL DOCENTE
                    ================================= */

                    const safeSurveyResponses =
                        Array.isArray(
                            surveyResponses,
                        )
                            ? surveyResponses
                            : [];

                    const response =
                        safeSurveyResponses.find(
                            (
                                currentResponse,
                            ) =>
                                getEnrollmentIdFromResponse(
                                    currentResponse,
                                ) ===
                                Number(
                                    enrollment.id,
                                ),
                        ) ??
                        null;

                    console.log(
                        "RESPUESTA DOCENTE:",
                        response,
                    );

                    setExistingResponse(
                        response,
                    );

                    setAnswers(
                        response
                            ? getAnswersFromResponse(
                                response,
                            )
                            : {},
                    );
                } catch (
                loadError
                ) {
                    const message =
                        loadError instanceof
                            Error
                            ? loadError.message
                            : "No se pudo cargar la encuesta.";

                    setError(
                        message,
                    );

                    notify.error(
                        "No se pudo cargar la encuesta.",
                        message,
                    );
                } finally {
                    loadingRef.current =
                        false;

                    setLoading(
                        false,
                    );
                }
            },
            [
                numericCourseId,
                numericItemId,
            ],
        );

    /* =====================================================
       EFFECT
    ===================================================== */

    /*
     * setTimeout evita el warning:
     *
     * Calling setState synchronously within an effect...
     */
    useEffect(() => {
        const timeoutId =
            window.setTimeout(
                () => {
                    void loadData();
                },
                0,
            );

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [loadData]);

    /* =====================================================
       CAMBIAR RESPUESTA
    ===================================================== */

    function setAnswer(
        questionId: string,
        value: string,
    ) {
        setAnswers(
            (
                current,
            ) => ({
                ...current,

                [questionId]:
                    value,
            }),
        );
    }

    /* =====================================================
       GUARDAR ENCUESTA
    ===================================================== */

    async function handleSubmit() {
        if (
            savingRef.current
        ) {
            return;
        }

        if (!block) {
            notify.error(
                "No se pudo identificar la encuesta.",
            );

            return;
        }

        if (
            !teacherEnrollment
        ) {
            notify.error(
                "No se pudo identificar la matrícula del docente.",
            );

            return;
        }

        /* =============================================
           VALIDAR OBLIGATORIAS
        ============================================= */

        const hasMissingRequired =
            questions.some(
                (
                    question,
                ) =>
                    question.required &&
                    !String(
                        answers[
                        question.id
                        ] ?? "",
                    ).trim(),
            );

        if (
            hasMissingRequired
        ) {
            notify.warning(
                "Encuesta incompleta.",
                "Responde todas las preguntas obligatorias antes de guardar.",
            );

            return;
        }

        const enrollmentId =
            Number(
                teacherEnrollment.id,
            );

        const blockId =
            Number(
                block.id,
            );

        if (
            !Number.isFinite(
                enrollmentId,
            ) ||
            enrollmentId <=
            0
        ) {
            notify.error(
                "La matrícula del docente no es válida.",
            );

            return;
        }

        if (
            !Number.isFinite(
                blockId,
            ) ||
            blockId <= 0
        ) {
            notify.error(
                "La encuesta no es válida.",
            );

            return;
        }

        /* =============================================
           PAYLOAD
        ============================================= */

        const payload = {
            enrollment_id:
                enrollmentId,

            enrollmentId,

            lesson_block_id:
                blockId,

            lessonBlockId:
                blockId,

            survey:
                getBlockContent(
                    block,
                ),

            response: {
                answers,

                submitted_at:
                    new Date().toISOString(),
            },

            /*
             * Compatibilidad con el endpoint flexible
             */
            answers,
        };

        console.log(
            "PAYLOAD ENCUESTA DOCENTE:",
            payload,
        );

        const existingId =
            getResponseId(
                existingResponse,
            );

        const toastId =
            notify.loading(
                existingId
                    ? "Actualizando encuesta..."
                    : "Enviando encuesta...",
                "Estamos registrando las respuestas del docente.",
            );

        savingRef.current =
            true;

        setSaving(
            true,
        );

        setError(
            "",
        );

        try {
            /* =========================================
               PUT O POST
            ========================================= */

            const saved =
                existingId
                    ? await updateSurveyResponseFlexible(
                        existingId,
                        payload,
                    )
                    : await createSurveyResponseFlexible(
                        payload,
                    );

            console.log(
                "RESPUESTA GUARDADA:",
                saved,
            );

            setExistingResponse(
                saved,
            );

            /*
             * Algunos endpoints devuelven toda la respuesta;
             * otros solamente el registro creado.
             *
             * Si llegan answers, los usamos.
             * Si no, conservamos los actuales.
             */
            const savedAnswers =
                getAnswersFromResponse(
                    saved,
                );

            if (
                hasAnswers(
                    savedAnswers,
                )
            ) {
                setAnswers(
                    savedAnswers,
                );
            }

            notify.dismiss(
                toastId,
            );

            notify.success(
                existingId
                    ? "Encuesta actualizada."
                    : "Encuesta enviada.",
                existingId
                    ? "Las respuestas del docente fueron actualizadas correctamente."
                    : "Las respuestas del docente fueron registradas correctamente.",
            );

            /*
             * NO llamar aquí:
             *
             * markBlockAsCompleted()
             *
             * porque el docente no debe generar
             * progreso académico.
             */
        } catch (
        saveError
        ) {
            const message =
                saveError instanceof
                    Error
                    ? saveError.message
                    : "No se pudo guardar la encuesta.";

            setError(
                message,
            );

            notify.dismiss(
                toastId,
            );

            notify.error(
                "No se pudo guardar la encuesta.",
                message,
            );
        } finally {
            savingRef.current =
                false;

            setSaving(
                false,
            );
        }
    }

    /* =====================================================
       RUTAS
    ===================================================== */

    const backHref =
        isAdminRoute
            ? `/admin/modules/${numericCourseId}`
            : `/teacher/courses/${numericCourseId}/modules`;

    const editorHref =
        isAdminRoute
            ? `/admin/modules/${numericCourseId}/items/${numericItemId}`
            : `/teacher/courses/${numericCourseId}/modules/items/${numericItemId}`;

    /* =====================================================
       RETURN
    ===================================================== */

    return {
        numericCourseId,
        numericItemId,

        isAdminRoute,

        loading,
        saving,

        error,

        block,

        title,
        description,

        content,
        questions,

        teacherEnrollment,

        answers,
        setAnswer,

        existingResponse,

        hasResponse:
            Boolean(
                existingResponse,
            ),

        handleSubmit,

        loadData,

        backHref,
        editorHref,
    };
}

export type TeacherSurveyAnswerState =
    ReturnType<
        typeof useTeacherSurveyAnswer
    >;