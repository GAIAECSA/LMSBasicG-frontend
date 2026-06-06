"use client";

import { usePathname } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import {
    getLessonBlock,
    updateLessonBlock,
    type LessonBlock,
    type LessonBlockPayload,
} from "@/services/lessons.service";
import { emptyForm } from "./constants";
import { getForumResponsesByBlock, getSurveyResponsesByBlock } from "./api";
import type {
    ActivityResponse,
    FormState,
    LessonItemEditorPageProps,
    SurveyQuestion,
} from "./types";
import {
    buildLessonBlockPayload,
    createQuestion,
    createSurveyQuestion,
    getErrorMessage,
    getExistingFileUrl,
    getFormFromBlock,
    getItemType,
    getItemTypeLabel,
    normalizeUrl,
} from "./utils";

type LessonItemType = ReturnType<typeof getItemType>;
type QuizQuestionFormItem = FormState["quiz_questions"][number];

const LIKERT_OPTIONS = [
    "1 - Muy en desacuerdo",
    "2 - En desacuerdo",
    "3 - Ni de acuerdo ni en desacuerdo",
    "4 - De acuerdo",
    "5 - Muy de acuerdo",
];

function createLikertSurveyQuestion(id: number): SurveyQuestion {
    return {
        id,
        question: "",
        type: "single",
        options: [...LIKERT_OPTIONS],
        required: true,
    };
}

function normalizeSurveyQuestionsForForm(value: unknown): SurveyQuestion[] {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
        const questionRecord = getContentRecord(item);

        return {
            id: Math.trunc(getSafeNumber(questionRecord.id, index + 1)),
            question: getSafeText(
                questionRecord.question ?? questionRecord.text,
            ),
            type: "single",
            options: [...LIKERT_OPTIONS],
            required:
                questionRecord.required === undefined
                    ? true
                    : Boolean(questionRecord.required),
        };
    });
}

function normalizeSurveyQuestionsForApi(questions: SurveyQuestion[]) {
    return questions.map((question, index) => ({
        id: Math.trunc(getSafeNumber(question.id, index + 1)),
        question: getSafeText(question.question).trim(),
        type: "single",
        scale: "likert",
        options: [...LIKERT_OPTIONS],
        required: Boolean(question.required),
    }));
}

function getContentRecord(value: unknown): Record<string, unknown> {
    if (!value) return {};

    if (typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return parsed as Record<string, unknown>;
            }

            return {};
        } catch {
            return {};
        }
    }

    return {};
}

function getSafeNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return fallback;
    }

    return numericValue;
}

function getSafeText(value: unknown, fallback = "") {
    if (value === null || value === undefined) return fallback;

    return String(value);
}

function normalizeOptions(value: unknown) {
    const options = Array.isArray(value)
        ? value.map((option) => getSafeText(option).trim())
        : [];

    const paddedOptions = [...options];

    while (paddedOptions.length < 4) {
        paddedOptions.push("");
    }

    return paddedOptions.slice(0, 4);
}

function normalizeQuizQuestionsForForm(value: unknown): QuizQuestionFormItem[] {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
        const questionRecord = getContentRecord(item);

        const options = normalizeOptions(questionRecord.options);

        const rawCorrectAnswer =
            questionRecord.correct_answer ?? questionRecord.correctAnswer ?? 0;

        const correctAnswer = Math.trunc(getSafeNumber(rawCorrectAnswer, 0));

        const safeCorrectAnswer =
            correctAnswer >= 0 && correctAnswer < options.length
                ? correctAnswer
                : 0;

        return {
            id: Math.trunc(getSafeNumber(questionRecord.id, index + 1)),
            question: getSafeText(
                questionRecord.question ?? questionRecord.text,
            ),
            options,
            correct_answer: safeCorrectAnswer,
            points: getSafeNumber(questionRecord.points, 0),
        } as QuizQuestionFormItem;
    });
}

function getSafeFormFromBlock(block: LessonBlock): FormState {
    const baseForm = getFormFromBlock(block);
    const content = getContentRecord(block.content);
    const currentItemType = getItemType(block);

    if (currentItemType === "quiz") {
        const contentQuestions =
            content.questions ??
            content.quiz_questions ??
            content.quizQuestions ??
            [];

        const normalizedQuestions =
            normalizeQuizQuestionsForForm(contentQuestions);

        if (normalizedQuestions.length === 0) {
            return baseForm;
        }

        return {
            ...baseForm,
            quiz_instructions: getSafeText(
                content.quiz_instructions ?? content.instructions,
                baseForm.quiz_instructions,
            ),
            quiz_questions: normalizedQuestions,
        };
    }

    if (currentItemType === "survey") {
        const contentQuestions =
            content.questions ??
            content.survey_questions ??
            content.surveyQuestions ??
            [];

        return {
            ...baseForm,
            survey_instructions: getSafeText(
                content.survey_instructions ?? content.instructions,
                baseForm.survey_instructions,
            ),
            survey_questions:
                normalizeSurveyQuestionsForForm(contentQuestions),
        };
    }

    return baseForm;
}

function normalizeQuizQuestionsForApi(questions: QuizQuestionFormItem[]) {
    return questions.map((question, index) => {
        const options = normalizeOptions(question.options);

        const correctAnswer = Math.trunc(
            getSafeNumber(question.correct_answer, 0),
        );

        const safeCorrectAnswer =
            correctAnswer >= 0 && correctAnswer < options.length
                ? correctAnswer
                : 0;

        return {
            id: Math.trunc(getSafeNumber(question.id, index + 1)),
            question: getSafeText(question.question).trim(),
            options,
            correct_answer: safeCorrectAnswer,
            correctAnswer: safeCorrectAnswer,
            points: getSafeNumber(question.points, 0),
        };
    });
}

function buildSurveyContent(block: LessonBlock, form: FormState) {
    const currentContent = getContentRecord(block.content);
    const blockRecord = block as unknown as Record<string, unknown>;

    const surveyInstructions = form.survey_instructions.trim();

    const questions = normalizeSurveyQuestionsForApi(
        form.survey_questions,
    );

    return {
        ...currentContent,
        type: "survey",
        itemType: "survey",
        title: form.title.trim(),
        default: Boolean(
            blockRecord.default ?? currentContent.default ?? true,
        ),
        is_active: Boolean(
            blockRecord.is_active ?? currentContent.is_active ?? true,
        ),
        instructions: surveyInstructions,
        survey_instructions: surveyInstructions,
        block_type_id: getSafeNumber(
            blockRecord.block_type_id ?? currentContent.block_type_id,
            7,
        ),
        survey_type: "likert",
        questions,
        survey_questions: questions,
    };
}

function buildSafePayload(
    block: LessonBlock,
    itemType: LessonItemType,
    form: FormState,
    selectedFile: File | null,
): LessonBlockPayload {
    const payload = buildLessonBlockPayload(
        block,
        itemType,
        form,
        selectedFile,
    ) as LessonBlockPayload;

    if (itemType === "survey") {
        return {
            ...payload,
            content: buildSurveyContent(block, form),
        } as LessonBlockPayload;
    }

    return payload;
}

function sortResponsesByDate(responses: ActivityResponse[]) {
    return [...responses].sort(
        (a, b) =>
            new Date(b.updated_at ?? b.created_at ?? "").getTime() -
            new Date(a.updated_at ?? a.created_at ?? "").getTime(),
    );
}

export function useLessonItem({
    courseId,
    itemId,
}: LessonItemEditorPageProps) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith("/admin");

    const backHref = isAdminRoute
        ? `/admin/modules/${courseId}`
        : `/teacher/courses/${courseId}/modules`;

    const numericCourseId = useMemo(() => Number(courseId), [courseId]);
    const numericItemId = useMemo(() => Number(itemId), [itemId]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [block, setBlock] = useState<LessonBlock | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [surveyResponses, setSurveyResponses] = useState<ActivityResponse[]>(
        [],
    );
    const [forumResponses, setForumResponses] = useState<ActivityResponse[]>(
        [],
    );
    const [loadingResponses, setLoadingResponses] = useState(false);

    const itemType = getItemType(block);
    const itemTypeLabel = getItemTypeLabel(itemType);

    const blockContent = useMemo(
        () => getContentRecord(block?.content),
        [block?.content],
    );

    const existingFileUrl = block ? getExistingFileUrl(blockContent) : "";

    const fullExistingFileUrl = existingFileUrl
        ? normalizeUrl(existingFileUrl)
        : "";

    const canShowResponsePanel = itemType === "survey" || itemType === "forum";

    const activityResponses =
        itemType === "survey"
            ? surveyResponses
            : itemType === "forum"
                ? forumResponses
                : [];

    const loadActivityResponses = useCallback(
        async (currentBlock: LessonBlock | null) => {
            if (!currentBlock?.id) {
                setSurveyResponses([]);
                setForumResponses([]);
                return;
            }

            const currentItemType = getItemType(currentBlock);

            if (currentItemType !== "survey" && currentItemType !== "forum") {
                setSurveyResponses([]);
                setForumResponses([]);
                return;
            }

            try {
                setLoadingResponses(true);

                if (currentItemType === "survey") {
                    const responses = await getSurveyResponsesByBlock(
                        currentBlock.id,
                    );

                    setSurveyResponses(sortResponsesByDate(responses));
                    setForumResponses([]);
                    return;
                }

                const responses = await getForumResponsesByBlock(
                    currentBlock.id,
                );

                setForumResponses(sortResponsesByDate(responses));
                setSurveyResponses([]);
            } catch (err) {
                setSurveyResponses([]);
                setForumResponses([]);
                setError(getErrorMessage(err));
            } finally {
                setLoadingResponses(false);
            }
        },
        [],
    );

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setNotice("");
            setSelectedFile(null);

            if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
                throw new Error("No se pudo identificar el curso.");
            }

            if (!Number.isFinite(numericItemId) || numericItemId <= 0) {
                throw new Error(
                    "No se pudo identificar el bloque seleccionado.",
                );
            }

            const currentBlock = await getLessonBlock(numericItemId);

            setBlock(currentBlock);
            setForm(getSafeFormFromBlock(currentBlock));
            void loadActivityResponses(currentBlock);
        } catch (err) {
            setError(getErrorMessage(err));
            setBlock(null);
            setSurveyResponses([]);
            setForumResponses([]);
        } finally {
            setLoading(false);
        }
    }, [numericCourseId, numericItemId, loadActivityResponses]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadDetail();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadDetail]);

    function handleAddQuestion() {
        setForm((current) => {
            const lastId = current.quiz_questions.reduce(
                (maxId, question) => Math.max(maxId, Number(question.id)),
                0,
            );

            return {
                ...current,
                quiz_questions: [
                    ...current.quiz_questions,
                    createQuestion(lastId + 1),
                ],
            };
        });
    }

    function handleRemoveQuestion(questionId: number) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.filter(
                (question) => question.id !== questionId,
            ),
        }));
    }

    function handleChangeQuestion(questionId: number, value: string) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        question: value,
                    }
                    : question,
            ),
        }));
    }

    function handleChangeOption(
        questionId: number,
        optionIndex: number,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) => {
                if (question.id !== questionId) return question;

                return {
                    ...question,
                    options: question.options.map((option, index) =>
                        index === optionIndex ? value : option,
                    ),
                };
            }),
        }));
    }

    function handleChangeCorrectAnswer(questionId: number, value: number) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        correct_answer: value,
                    }
                    : question,
            ),
        }));
    }

    function handleChangePoints(questionId: number, value: number) {
        setForm((current) => ({
            ...current,
            quiz_questions: current.quiz_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        points: value,
                    }
                    : question,
            ),
        }));
    }

    function handleAddSurveyQuestion() {
        setForm((current) => {
            const lastId = current.survey_questions.reduce(
                (maxId, question) => Math.max(maxId, question.id),
                0,
            );

            return {
                ...current,
                survey_questions: [
                    ...current.survey_questions,
                    createLikertSurveyQuestion(lastId + 1),
                ],
            };
        });
    }

    function handleRemoveSurveyQuestion(questionId: number) {
        setForm((current) => ({
            ...current,
            survey_questions: current.survey_questions.filter(
                (question) => question.id !== questionId,
            ),
        }));
    }

    function handleChangeSurveyQuestion(questionId: number, value: string) {
        setForm((current) => ({
            ...current,
            survey_questions: current.survey_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        question: value,
                    }
                    : question,
            ),
        }));
    }

    function handleChangeSurveyType(
        questionId: number,
        value: SurveyQuestion["type"],
    ) {
        setForm((current) => ({
            ...current,
            survey_questions: current.survey_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        type: value,
                        options:
                            value === "single"
                                ? question.options.length > 0
                                    ? question.options
                                    : ["Sí", "No"]
                                : [],
                    }
                    : question,
            ),
        }));
    }

    function handleChangeSurveyRequired(questionId: number, value: boolean) {
        setForm((current) => ({
            ...current,
            survey_questions: current.survey_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        required: value,
                    }
                    : question,
            ),
        }));
    }

    function handleAddSurveyOption(questionId: number) {
        setForm((current) => ({
            ...current,
            survey_questions: current.survey_questions.map((question) =>
                question.id === questionId
                    ? {
                        ...question,
                        type: "single",
                        options: [
                            ...question.options,
                            `Opción ${question.options.length + 1}`,
                        ],
                    }
                    : question,
            ),
        }));
    }

    function handleChangeSurveyOption(
        questionId: number,
        optionIndex: number,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            survey_questions: current.survey_questions.map((question) => {
                if (question.id !== questionId) return question;

                return {
                    ...question,
                    options: question.options.map((option, index) =>
                        index === optionIndex ? value : option,
                    ),
                };
            }),
        }));
    }

    function handleRemoveSurveyOption(questionId: number, optionIndex: number) {
        setForm((current) => ({
            ...current,
            survey_questions: current.survey_questions.map((question) => {
                if (question.id !== questionId) return question;

                return {
                    ...question,
                    options: question.options.filter(
                        (_, index) => index !== optionIndex,
                    ),
                };
            }),
        }));
    }

    function handleSelectedFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (!file) return;

        if (itemType === "image") {
            const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];

            if (!allowedImageTypes.includes(file.type)) {
                setError("Solo puedes subir imágenes PNG, JPG o WEBP.");
                event.target.value = "";
                return;
            }
        }

        if (itemType === "pdf" && file.type !== "application/pdf") {
            setError("Solo puedes subir archivos PDF.");
            event.target.value = "";
            return;
        }

        setError("");
        setSelectedFile(file);
        event.target.value = "";
    }

    function validateForm() {
        if (!form.title.trim()) {
            throw new Error("Ingresa el título.");
        }

        if (itemType === "text" && !form.text.trim()) {
            throw new Error("Ingresa el texto de la lección.");
        }

        if (itemType === "video" && !form.video_url.trim()) {
            throw new Error("Ingresa la URL del video.");
        }

        if (
            (itemType === "image" || itemType === "pdf") &&
            !selectedFile &&
            !existingFileUrl
        ) {
            throw new Error(
                itemType === "image"
                    ? "Selecciona una imagen para guardar este bloque."
                    : "Selecciona un archivo PDF para guardar este bloque.",
            );
        }

        if (itemType === "quiz") {
            if (form.quiz_questions.length === 0) {
                throw new Error(
                    "Agrega al menos una pregunta para la evaluación.",
                );
            }

            const hasEmptyQuestion = form.quiz_questions.some(
                (question) => !question.question.trim(),
            );

            if (hasEmptyQuestion) {
                throw new Error("Todas las preguntas deben tener texto.");
            }

            const hasLessThanTwoOptions = form.quiz_questions.some(
                (question) => {
                    const completedOptions = question.options.filter(
                        (option) => option.trim().length > 0,
                    );

                    return completedOptions.length < 2;
                },
            );

            if (hasLessThanTwoOptions) {
                throw new Error(
                    "Cada pregunta debe tener al menos dos opciones completas.",
                );
            }

            const hasInvalidAnswer = form.quiz_questions.some((question) => {
                const selectedOption = question.options[question.correct_answer];

                return (
                    question.correct_answer < 0 ||
                    question.correct_answer >= question.options.length ||
                    !selectedOption ||
                    !selectedOption.trim()
                );
            });

            if (hasInvalidAnswer) {
                throw new Error(
                    "La respuesta correcta debe corresponder a una opción completa.",
                );
            }

            const hasInvalidPoints = form.quiz_questions.some(
                (question) => Number(question.points) < 0,
            );

            if (hasInvalidPoints) {
                throw new Error(
                    "Los puntos de cada pregunta no pueden ser negativos.",
                );
            }

            const totalPoints = form.quiz_questions.reduce(
                (total, question) => total + Number(question.points || 0),
                0,
            );

            const safeTotalPoints = Number(totalPoints.toFixed(2));

            if (safeTotalPoints !== 10) {
                throw new Error(
                    `La sumatoria de puntos debe ser exactamente 10. Actualmente tienes ${safeTotalPoints}.`,
                );
            }
        }

        if (itemType === "survey") {
            if (form.survey_questions.length === 0) {
                throw new Error(
                    "Agrega al menos una pregunta para la encuesta.",
                );
            }

            const hasEmptyQuestion = form.survey_questions.some(
                (question) => !question.question.trim(),
            );

            if (hasEmptyQuestion) {
                throw new Error(
                    "Todas las preguntas de la encuesta deben tener texto.",
                );
            }

            const hasInvalidOptions = form.survey_questions.some(
                (question) =>
                    question.type === "single" &&
                    question.options.filter((option) => option.trim()).length <
                    2,
            );

            if (hasInvalidOptions) {
                throw new Error(
                    "Las preguntas de selección deben tener al menos dos opciones.",
                );
            }
        }

        if (itemType === "forum" && !form.forum_prompt.trim()) {
            throw new Error("Ingresa la consigna o instrucción del foro.");
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setNotice("");

            if (!block) {
                throw new Error("No se encontró el bloque seleccionado.");
            }

            if (!Number.isFinite(numericItemId) || numericItemId <= 0) {
                throw new Error(
                    "No se pudo identificar el bloque seleccionado.",
                );
            }

            validateForm();

            const payload = buildSafePayload(
                block,
                itemType,
                form,
                selectedFile,
            );

            await updateLessonBlock(numericItemId, payload);

            /**
             * GET real después del PUT.
             * Así la pantalla se carga con lo que realmente quedó guardado
             * en la base de datos.
             */
            const refreshedBlock = await getLessonBlock(numericItemId);

            console.log(
                "BLOQUE REFRESCADO DESPUÉS DEL PUT:",
                JSON.stringify(refreshedBlock, null, 2),
            );

            setBlock(refreshedBlock);
            setForm(getSafeFormFromBlock(refreshedBlock));
            setSelectedFile(null);
            setNotice("Información guardada correctamente.");
            void loadActivityResponses(refreshedBlock);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return {
        pathname,
        isAdminRoute,
        backHref,
        numericCourseId,
        numericItemId,

        loading,
        saving,
        error,
        notice,
        block,
        form,
        selectedFile,
        surveyResponses,
        forumResponses,
        loadingResponses,

        itemType,
        itemTypeLabel,
        existingFileUrl,
        fullExistingFileUrl,
        canShowResponsePanel,
        activityResponses,

        setForm,
        setSelectedFile,
        setError,
        setNotice,

        loadDetail,
        loadActivityResponses,

        handleAddQuestion,
        handleRemoveQuestion,
        handleChangeQuestion,
        handleChangeOption,
        handleChangeCorrectAnswer,
        handleChangePoints,

        handleAddSurveyQuestion,
        handleRemoveSurveyQuestion,
        handleChangeSurveyQuestion,
        handleChangeSurveyType,
        handleChangeSurveyRequired,
        handleAddSurveyOption,
        handleChangeSurveyOption,
        handleRemoveSurveyOption,

        handleSelectedFile,
        handleSubmit,
    };
}

export type LessonItemState = ReturnType<typeof useLessonItem>;