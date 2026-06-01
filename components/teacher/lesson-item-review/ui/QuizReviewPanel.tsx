import {
    Award,
    CheckCircle2,
    ClipboardList,
    HelpCircle,
    XCircle,
} from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { ReviewStudentRow } from "../types";

type QuizReviewPanelProps = {
    row: ReviewStudentRow | null;
    block?: LessonBlock | null;
};

type AnyRecord = Record<string, unknown>;

type QuizQuestion = {
    id?: string | number | null;
    question?: string | null;
    text?: string | null;
    title?: string | null;
    points?: string | number | null;
    options?: unknown;
    correctAnswer?: string | number | null;
    correct_answer?: string | number | null;
};

type QuizContent = {
    title?: string | null;
    questions?: QuizQuestion[];
    minimum_score?: string | number | null;
};

function isRecord(value: unknown): value is AnyRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonValue(value: unknown): unknown {
    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

function parseObject(value: unknown): AnyRecord | null {
    const parsed = parseJsonValue(value);

    return isRecord(parsed) ? parsed : null;
}

function getRawRecord(row?: ReviewStudentRow | null): AnyRecord | null {
    const parsed = parseJsonValue(row?.raw);

    if (Array.isArray(parsed)) {
        const firstItem = parsed[0];
        return isRecord(firstItem) ? firstItem : null;
    }

    return isRecord(parsed) ? parsed : null;
}

function parseQuizContent(value: unknown): QuizContent | null {
    const parsed = parseObject(value);

    if (!parsed) return null;

    const questions = Array.isArray(parsed.questions)
        ? parsed.questions.filter(isRecord).map((question) => question as QuizQuestion)
        : [];

    return {
        title: typeof parsed.title === "string" ? parsed.title : null,
        questions,
        minimum_score:
            typeof parsed.minimum_score === "string" ||
                typeof parsed.minimum_score === "number"
                ? parsed.minimum_score
                : null,
    };
}

function getQuizContent(
    block?: LessonBlock | null,
    row?: ReviewStudentRow | null,
): QuizContent | null {
    const raw = getRawRecord(row);
    const blockRecord = parseObject(block);

    const possibleQuizSources = [
        raw?.quizz,
        raw?.quiz,
        raw?.content,
        raw?.lesson_block,
        raw?.lessonBlock,
        raw?.block,
        blockRecord?.content,
        blockRecord,
    ];

    for (const source of possibleQuizSources) {
        const directContent = parseQuizContent(source);

        if (directContent?.questions?.length) {
            return directContent;
        }

        const sourceRecord = parseObject(source);
        const nestedContent = parseQuizContent(sourceRecord?.content);

        if (nestedContent?.questions?.length) {
            return nestedContent;
        }
    }

    return null;
}

function getResponseRecord(row?: ReviewStudentRow | null): AnyRecord | null {
    const raw = getRawRecord(row);

    const possibleResponseSources = [
        raw?.response,
        raw?.answers ? raw : null,
        raw?.result,
        raw?.data,
    ];

    for (const source of possibleResponseSources) {
        const response = parseObject(source);

        if (response) return response;
    }

    return null;
}

function getQuestionText(question: QuizQuestion, index: number): string {
    return (
        question.question?.trim() ||
        question.text?.trim() ||
        question.title?.trim() ||
        `Pregunta ${index + 1}`
    );
}

function getQuestionOptions(question: QuizQuestion): string[] {
    if (!Array.isArray(question.options)) return [];

    return question.options
        .map((option) => String(option ?? "").trim())
        .filter(Boolean);
}

function getCorrectAnswerIndex(question: QuizQuestion): number | null {
    const value = question.correctAnswer ?? question.correct_answer;

    if (value === null || value === undefined || value === "") return null;

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
}

function getAnswers(response: AnyRecord | null): unknown {
    if (!response) return null;

    return (
        response.answers ??
        response.response_answers ??
        response.student_answers ??
        response.responses ??
        null
    );
}

function getStudentAnswer(
    response: AnyRecord | null,
    question: QuizQuestion,
    index: number,
): unknown {
    const answers = getAnswers(response);

    if (!answers) return null;

    const questionId = String(question.id ?? index + 1);

    if (Array.isArray(answers)) {
        const directAnswer = answers[index];

        if (isRecord(directAnswer)) {
            return (
                directAnswer.answer ??
                directAnswer.selectedAnswer ??
                directAnswer.selected_answer ??
                directAnswer.value ??
                null
            );
        }

        return directAnswer ?? null;
    }

    if (isRecord(answers)) {
        return (
            answers[questionId] ??
            answers[String(index)] ??
            answers[String(index + 1)] ??
            null
        );
    }

    return null;
}

function getAnswerItems(response: AnyRecord | null): Array<{ key: string; value: unknown }> {
    const answers = getAnswers(response);

    if (!answers) return [];

    if (Array.isArray(answers)) {
        return answers.map((value, index) => ({
            key: String(index + 1),
            value,
        }));
    }

    if (isRecord(answers)) {
        return Object.entries(answers)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([key, value]) => ({
                key,
                value,
            }));
    }

    return [
        {
            key: "1",
            value: answers,
        },
    ];
}

function formatScore(value: unknown): string {
    if (value === null || value === undefined || value === "") return "Sin nota";

    const numericValue = Number(String(value).replace(",", "."));

    if (!Number.isFinite(numericValue)) return String(value);

    return numericValue.toFixed(2);
}

function formatDate(value: unknown): string {
    if (!value) return "";

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatAnswer(question: QuizQuestion, value: unknown): string {
    if (value === null || value === undefined || value === "") {
        return "Sin respuesta";
    }

    const options = getQuestionOptions(question);

    if (options.length > 0) {
        const numericValue = Number(value);

        if (Number.isFinite(numericValue) && options[numericValue]) {
            return `${String.fromCharCode(65 + numericValue)}. ${options[numericValue]}`;
        }
    }

    return String(value);
}

function formatSimpleAnswer(value: unknown): string {
    if (value === null || value === undefined || value === "") {
        return "Sin respuesta";
    }

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
        return `Opción ${String.fromCharCode(65 + numericValue)} (${numericValue})`;
    }

    return String(value);
}

export function QuizReviewPanel({ row, block }: QuizReviewPanelProps) {
    const raw = getRawRecord(row);
    const response = getResponseRecord(row);
    const quizContent = getQuizContent(block, row);

    const questions = quizContent?.questions ?? [];
    const answerItems = getAnswerItems(response);

    const score = row?.score ?? raw?.score ?? response?.score ?? null;
    const minimumScore =
        response?.minimum_score ?? quizContent?.minimum_score ?? raw?.minimum_score ?? null;

    const attempt = response?.attempt ?? null;
    const maxAttempts = response?.max_attempts ?? null;
    const submittedAt = response?.submitted_at ?? row?.submittedAt ?? raw?.created_at ?? null;
    const isPassed = response?.is_passed ?? raw?.is_passed ?? null;

    if (!row) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <HelpCircle className="mx-auto h-9 w-9 text-slate-400" />

                <p className="mt-3 text-sm font-black text-slate-700">
                    Selecciona un estudiante para revisar la evaluación.
                </p>
            </div>
        );
    }

    if (!row.responseId) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <HelpCircle className="mx-auto h-9 w-9 text-slate-400" />

                <p className="mt-3 text-sm font-black text-slate-700">
                    El estudiante aún no ha respondido la evaluación.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <Award className="h-6 w-6" />
                    </div>

                    <div>
                        <h3 className="text-base font-black text-slate-950">
                            Respuesta de evaluación
                        </h3>

                        <div className="mt-2 grid gap-1 text-sm font-semibold text-slate-500">
                            <p>
                                Nota actual:{" "}
                                <span className="font-black text-slate-800">
                                    {formatScore(score)}
                                </span>
                            </p>

                            {minimumScore !== null && minimumScore !== undefined ? (
                                <p>
                                    Nota mínima:{" "}
                                    <span className="font-black text-slate-800">
                                        {formatScore(minimumScore)}
                                    </span>
                                </p>
                            ) : null}

                            {attempt !== null && attempt !== undefined ? (
                                <p>
                                    Intento:{" "}
                                    <span className="font-black text-slate-800">
                                        {String(attempt)}
                                        {maxAttempts ? ` de ${String(maxAttempts)}` : ""}
                                    </span>
                                </p>
                            ) : null}

                            {submittedAt ? (
                                <p>
                                    Enviado:{" "}
                                    <span className="font-black text-slate-800">
                                        {formatDate(submittedAt)}
                                    </span>
                                </p>
                            ) : null}

                            {isPassed !== null && isPassed !== undefined ? (
                                <p>
                                    Estado:{" "}
                                    <span
                                        className={
                                            isPassed
                                                ? "font-black text-emerald-700"
                                                : "font-black text-red-700"
                                        }
                                    >
                                        {isPassed ? "Aprobado" : "No aprobado"}
                                    </span>
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <ClipboardList className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Preguntas y respuestas
                        </p>

                        <h3 className="text-base font-black text-slate-950">
                            {quizContent?.title || "Detalle de evaluación"}
                        </h3>
                    </div>
                </div>

                {questions.length > 0 ? (
                    <div className="mt-5 space-y-4">
                        {questions.map((question, index) => {
                            const options = getQuestionOptions(question);
                            const studentAnswer = getStudentAnswer(response, question, index);
                            const correctIndex = getCorrectAnswerIndex(question);

                            const numericStudentAnswer = Number(studentAnswer);
                            const hasCorrection =
                                correctIndex !== null &&
                                Number.isFinite(numericStudentAnswer);

                            const isCorrect =
                                hasCorrection && numericStudentAnswer === correctIndex;

                            return (
                                <article
                                    key={`${question.id ?? index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                                                Pregunta {index + 1}
                                            </p>

                                            <h4 className="mt-1 text-sm font-black leading-6 text-slate-950">
                                                {getQuestionText(question, index)}
                                            </h4>
                                        </div>

                                        {question.points !== null &&
                                            question.points !== undefined ? (
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                                                {question.points} pts
                                            </span>
                                        ) : null}
                                    </div>

                                    {options.length > 0 ? (
                                        <div className="mt-4 grid gap-2">
                                            {options.map((option, optionIndex) => {
                                                const selected =
                                                    Number(studentAnswer) === optionIndex;
                                                const correct = correctIndex === optionIndex;

                                                return (
                                                    <div
                                                        key={`${option}-${optionIndex}`}
                                                        className={`rounded-2xl border px-4 py-3 text-sm font-bold ${correct
                                                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                                : selected
                                                                    ? "border-blue-200 bg-blue-50 text-blue-800"
                                                                    : "border-slate-200 bg-white text-slate-600"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span>
                                                                {String.fromCharCode(
                                                                    65 + optionIndex,
                                                                )}
                                                                . {option}
                                                            </span>

                                                            {correct ? (
                                                                <span className="text-xs font-black uppercase">
                                                                    Correcta
                                                                </span>
                                                            ) : selected ? (
                                                                <span className="text-xs font-black uppercase">
                                                                    Marcada
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null}

                                    <div className="mt-4 rounded-2xl bg-white p-4">
                                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                            Respuesta del estudiante
                                        </p>

                                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm font-black text-slate-800">
                                                {formatAnswer(question, studentAnswer)}
                                            </p>

                                            {hasCorrection ? (
                                                isCorrect ? (
                                                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Correcta
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                                                        <XCircle className="h-4 w-4" />
                                                        Incorrecta
                                                    </span>
                                                )
                                            ) : null}
                                        </div>

                                        {correctIndex !== null && options[correctIndex] ? (
                                            <p className="mt-2 text-sm font-semibold text-slate-500">
                                                Respuesta correcta:{" "}
                                                <span className="font-black text-slate-700">
                                                    {String.fromCharCode(65 + correctIndex)}.{" "}
                                                    {options[correctIndex]}
                                                </span>
                                            </p>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-5 space-y-3">
                        {answerItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <p className="text-sm font-black text-slate-700">
                                    No se encontraron respuestas registradas.
                                </p>
                            </div>
                        ) : (
                            answerItems.map((answer, index) => (
                                <article
                                    key={`${answer.key}-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                                        Pregunta {answer.key}
                                    </p>

                                    <div className="mt-3 rounded-2xl bg-white p-4">
                                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                            Respuesta registrada
                                        </p>

                                        <p className="mt-2 text-sm font-black text-slate-800">
                                            {formatSimpleAnswer(answer.value)}
                                        </p>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuizReviewPanel;