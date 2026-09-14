"use client";

import {
    ClipboardList,
    Loader2,
    MessageSquareText,
    Save,
} from "lucide-react";

import { useMemo, useState } from "react";

import type { LessonItemReviewState } from "../hook";
import type { ReviewStudentRow } from "../types";

type TeacherActivityCreatorProps = {
    review: LessonItemReviewState;
    row: ReviewStudentRow;
};

type AnyRecord = Record<string, unknown>;

type AnswerValue = string | number;

type QuizQuestion = {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number | null;
    points: number;
};

type SurveyQuestion = {
    id: string;
    question: string;
    required: boolean;
    type: "text" | "choice";
    options: string[];
};

function isRecord(value: unknown): value is AnyRecord {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function parseRecord(value: unknown): AnyRecord {
    if (isRecord(value)) {
        return value;
    }

    if (typeof value !== "string" || !value.trim()) {
        return {};
    }

    try {
        const parsed = JSON.parse(value);

        return isRecord(parsed)
            ? parsed
            : {};
    } catch {
        return {};
    }
}

function readText(value: unknown): string {
    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(value).trim();
    }

    return "";
}

function getBlockContent(
    review: LessonItemReviewState,
): AnyRecord {
    return parseRecord(
        review.block?.content,
    );
}

function normalizeQuizQuestions(
    content: AnyRecord,
): QuizQuestion[] {
    const source = Array.isArray(content.questions)
        ? content.questions
        : [];

    return source
        .map((item, index) => {
            if (!isRecord(item)) {
                return null;
            }

            const question =
                readText(item.question) ||
                readText(item.text) ||
                readText(item.title) ||
                `Pregunta ${index + 1}`;

            const options = Array.isArray(item.options)
                ? item.options
                    .map((option) =>
                        readText(option),
                    )
                    .filter(Boolean)
                : [];

            const rawCorrect =
                item.correct_answer ??
                item.correctAnswer;

            const parsedCorrect =
                rawCorrect !== undefined &&
                    rawCorrect !== null &&
                    rawCorrect !== ""
                    ? Number(rawCorrect)
                    : null;

            const rawPoints = Number(
                item.points ?? 1,
            );

            return {
                id: String(
                    item.id ?? index + 1,
                ),

                question,

                options,

                correctAnswer:
                    parsedCorrect !== null &&
                        Number.isFinite(parsedCorrect)
                        ? parsedCorrect
                        : null,

                points:
                    Number.isFinite(rawPoints)
                        ? rawPoints
                        : 1,
            };
        })
        .filter(
            (
                question,
            ): question is QuizQuestion =>
                question !== null,
        );
}

function normalizeSurveyQuestions(
    content: AnyRecord,
): SurveyQuestion[] {
    const source =
        content.questions ??
        content.preguntas ??
        content.items;

    if (!Array.isArray(source)) {
        return [];
    }

    return source
        .map((item, index) => {
            if (!isRecord(item)) {
                return null;
            }

            const question =
                readText(item.question) ||
                readText(item.text) ||
                readText(item.label);

            if (!question) {
                return null;
            }

            const rawType = readText(
                item.type,
            ).toLowerCase();

            const rawScale = readText(
                item.scale,
            ).toLowerCase();

            const options = Array.isArray(
                item.options,
            )
                ? item.options
                    .map((option) =>
                        readText(option),
                    )
                    .filter(Boolean)
                : [];

            const isText =
                rawType === "text" ||
                rawType === "textarea" ||
                rawType === "open";

            const isLikert =
                rawType === "likert" ||
                rawType === "single" ||
                rawScale === "likert";

            let finalOptions = options;

            if (
                isLikert &&
                finalOptions.length === 0
            ) {
                finalOptions = [
                    "1 - Muy en desacuerdo",
                    "2 - En desacuerdo",
                    "3 - Ni de acuerdo ni en desacuerdo",
                    "4 - De acuerdo",
                    "5 - Muy de acuerdo",
                ];
            }

            return {
                id: String(
                    item.id ?? index + 1,
                ),

                question,

                required:
                    item.required === undefined
                        ? true
                        : Boolean(item.required),

                type:
                    isText ||
                        finalOptions.length === 0
                        ? "text"
                        : "choice",

                options: finalOptions,
            };
        })
        .filter(
            (
                question,
            ): question is SurveyQuestion =>
                question !== null,
        );
}

export function TeacherActivityCreator({
    review,
    row,
}: TeacherActivityCreatorProps) {
    const [forumText, setForumText] =
        useState("");

    const [
        quizAnswers,
        setQuizAnswers,
    ] = useState<
        Record<string, AnswerValue>
    >({});

    const [
        surveyAnswers,
        setSurveyAnswers,
    ] = useState<Record<string, string>>(
        {},
    );

    const content = useMemo(
        () => getBlockContent(review),
        [review.block],
    );

    const quizQuestions = useMemo(
        () =>
            normalizeQuizQuestions(content),
        [content],
    );

    const surveyQuestions = useMemo(
        () =>
            normalizeSurveyQuestions(content),
        [content],
    );

    const saving =
        review.creatingTeacherResponse;

    function changeQuizAnswer(
        questionId: string,
        value: AnswerValue,
    ) {
        setQuizAnswers((current) => ({
            ...current,
            [questionId]: value,
        }));
    }

    function changeSurveyAnswer(
        questionId: string,
        value: string,
    ) {
        setSurveyAnswers((current) => ({
            ...current,
            [questionId]: value,
        }));
    }

    async function handleSave() {
        if (review.itemType === "forum") {
            const comment =
                forumText.trim();

            if (!comment) {
                return;
            }

            await review.handleTeacherForumCreate(
                comment,
            );

            return;
        }

        if (review.itemType === "quiz") {
            if (
                quizQuestions.length === 0
            ) {
                return;
            }

            const hasMissing =
                quizQuestions.some(
                    (question) =>
                        quizAnswers[
                        question.id
                        ] === undefined,
                );

            if (hasMissing) {
                return;
            }

            await review.handleTeacherQuizCreate(
                quizAnswers,
            );

            return;
        }

        if (
            review.itemType === "survey"
        ) {
            if (
                surveyQuestions.length === 0
            ) {
                return;
            }

            const hasMissingRequired =
                surveyQuestions.some(
                    (question) =>
                        question.required &&
                        !String(
                            surveyAnswers[
                            question.id
                            ] ?? "",
                        ).trim(),
                );

            if (hasMissingRequired) {
                return;
            }

            await review.handleTeacherSurveyCreate(
                surveyAnswers,
            );
        }
    }

    if (
        review.itemType === "homework"
    ) {
        /*
         * HomeworkReviewPanel ya contiene
         * TeacherHomeworkUpload.
         */
        return null;
    }

    return (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:rounded-3xl sm:p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                    {review.itemType ===
                        "forum" ? (
                        <MessageSquareText className="h-5 w-5" />
                    ) : (
                        <ClipboardList className="h-5 w-5" />
                    )}
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 sm:text-xs">
                        Acción docente
                    </p>

                    <h3 className="mt-1 text-sm font-black text-slate-950 sm:text-base">
                        Completar actividad por{" "}
                        {row.studentName}
                    </h3>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                        El estudiante todavía no
                        registra una respuesta.
                    </p>
                </div>
            </div>

            {review.itemType ===
                "forum" ? (
                <div className="mt-4">
                    <label className="block">
                        <span className="text-xs font-black text-slate-700 sm:text-sm">
                            Participación
                        </span>

                        <textarea
                            value={forumText}
                            onChange={(event) =>
                                setForumText(
                                    event.target
                                        .value,
                                )
                            }
                            rows={5}
                            placeholder="Escribe la participación..."
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold leading-5 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:rounded-2xl sm:px-4 sm:text-sm"
                        />
                    </label>
                </div>
            ) : null}

            {review.itemType ===
                "quiz" ? (
                <div className="mt-4 space-y-3">
                    {quizQuestions.length ===
                        0 ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
                            No se pudieron
                            recuperar las preguntas
                            de esta evaluación.
                        </div>
                    ) : (
                        quizQuestions.map(
                            (
                                question,
                                questionIndex,
                            ) => (
                                <article
                                    key={
                                        question.id
                                    }
                                    className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 sm:text-xs">
                                                Pregunta{" "}
                                                {questionIndex +
                                                    1}
                                            </p>

                                            <p className="mt-1 text-xs font-black leading-5 text-slate-900 sm:text-sm">
                                                {
                                                    question.question
                                                }
                                            </p>
                                        </div>

                                        <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500">
                                            {
                                                question.points
                                            }{" "}
                                            pts
                                        </span>
                                    </div>

                                    {question.options
                                        .length >
                                        0 ? (
                                        <div className="mt-3 space-y-2">
                                            {question.options.map(
                                                (
                                                    option,
                                                    optionIndex,
                                                ) => {
                                                    const checked =
                                                        Number(
                                                            quizAnswers[
                                                            question
                                                                .id
                                                            ],
                                                        ) ===
                                                        optionIndex;

                                                    return (
                                                        <label
                                                            key={`${question.id}-${optionIndex}`}
                                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-xs font-bold transition sm:text-sm ${checked
                                                                    ? "border-blue-300 bg-blue-50 text-blue-800"
                                                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200"
                                                                }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`quiz-${row.enrollmentId}-${question.id}`}
                                                                checked={
                                                                    checked
                                                                }
                                                                onChange={() =>
                                                                    changeQuizAnswer(
                                                                        question.id,
                                                                        optionIndex,
                                                                    )
                                                                }
                                                            />

                                                            <span>
                                                                {String.fromCharCode(
                                                                    65 +
                                                                    optionIndex,
                                                                )}
                                                                .{" "}
                                                                {
                                                                    option
                                                                }
                                                            </span>
                                                        </label>
                                                    );
                                                },
                                            )}
                                        </div>
                                    ) : (
                                        <textarea
                                            value={String(
                                                quizAnswers[
                                                question
                                                    .id
                                                ] ?? "",
                                            )}
                                            onChange={(
                                                event,
                                            ) =>
                                                changeQuizAnswer(
                                                    question.id,
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Registrar respuesta..."
                                            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 sm:text-sm"
                                        />
                                    )}
                                </article>
                            ),
                        )
                    )}
                </div>
            ) : null}

            {review.itemType ===
                "survey" ? (
                <div className="mt-4 space-y-3">
                    {surveyQuestions.length ===
                        0 ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
                            No se pudieron
                            recuperar las preguntas
                            de esta encuesta.
                        </div>
                    ) : (
                        surveyQuestions.map(
                            (
                                question,
                                questionIndex,
                            ) => (
                                <article
                                    key={
                                        question.id
                                    }
                                    className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 sm:text-xs">
                                        Pregunta{" "}
                                        {questionIndex +
                                            1}
                                        {question.required
                                            ? " · Obligatoria"
                                            : ""}
                                    </p>

                                    <p className="mt-1 text-xs font-black leading-5 text-slate-900 sm:text-sm">
                                        {
                                            question.question
                                        }
                                    </p>

                                    {question.type ===
                                        "text" ? (
                                        <textarea
                                            value={
                                                surveyAnswers[
                                                question
                                                    .id
                                                ] ?? ""
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                changeSurveyAnswer(
                                                    question.id,
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Escribe la respuesta..."
                                            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm"
                                        />
                                    ) : (
                                        <div className="mt-3 space-y-2">
                                            {question.options.map(
                                                (
                                                    option,
                                                ) => {
                                                    const checked =
                                                        surveyAnswers[
                                                        question
                                                            .id
                                                        ] ===
                                                        option;

                                                    return (
                                                        <label
                                                            key={`${question.id}-${option}`}
                                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-xs font-bold transition sm:text-sm ${checked
                                                                    ? "border-blue-300 bg-blue-50 text-blue-800"
                                                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200"
                                                                }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`survey-${row.enrollmentId}-${question.id}`}
                                                                checked={
                                                                    checked
                                                                }
                                                                onChange={() =>
                                                                    changeSurveyAnswer(
                                                                        question.id,
                                                                        option,
                                                                    )
                                                                }
                                                            />

                                                            <span>
                                                                {
                                                                    option
                                                                }
                                                            </span>
                                                        </label>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </article>
                            ),
                        )
                    )}
                </div>
            ) : null}

            <button
                type="button"
                onClick={() =>
                    void handleSave()
                }
                disabled={
                    saving ||
                    (review.itemType ===
                        "forum" &&
                        !forumText.trim()) ||
                    (review.itemType ===
                        "quiz" &&
                        quizQuestions.length ===
                        0) ||
                    (review.itemType ===
                        "survey" &&
                        surveyQuestions.length ===
                        0)
                }
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-5 text-xs font-black text-white transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:rounded-2xl sm:text-sm"
            >
                {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Save className="h-4 w-4" />
                )}

                {saving
                    ? "Guardando..."
                    : review.itemType ===
                        "quiz"
                        ? "Guardar evaluación"
                        : review.itemType ===
                            "survey"
                            ? "Guardar encuesta"
                            : "Guardar participación"}
            </button>
        </section>
    );
}

export default TeacherActivityCreator;