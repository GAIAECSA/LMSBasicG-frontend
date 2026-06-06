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
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center sm:rounded-2xl sm:p-8 [@media(max-height:760px)]:p-4">
                <HelpCircle className="mx-auto h-8 w-8 text-slate-400 sm:h-9 sm:w-9" />

                <p className="mt-3 text-xs font-black leading-5 text-slate-700 sm:text-sm">
                    Selecciona un estudiante para revisar la evaluación.
                </p>
            </div>
        );
    }

    if (!row.responseId) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center sm:rounded-2xl sm:p-8 [@media(max-height:760px)]:p-4">
                <HelpCircle className="mx-auto h-8 w-8 text-slate-400 sm:h-9 sm:w-9" />

                <p className="mt-3 text-xs font-black leading-5 text-slate-700 sm:text-sm">
                    El estudiante aún no ha respondido la evaluación.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 sm:h-12 sm:w-12 sm:rounded-2xl">
                        <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <div>
                        <h3 className="text-sm font-black text-slate-950 sm:text-base">
                            Respuesta de evaluación
                        </h3>

                        <div className="mt-2 grid gap-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
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

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-3xl sm:p-5 [@media(max-height:760px)]:p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                        <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">
                            Preguntas y respuestas
                        </p>

                        <h3 className="text-sm font-black text-slate-950 sm:text-base">
                            {quizContent?.title || "Detalle de evaluación"}
                        </h3>
                    </div>
                </div>

                {questions.length > 0 ? (
                    <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4 [@media(max-height:760px)]:mt-3">
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
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 sm:text-xs sm:tracking-[0.12em]">
                                                Pregunta {index + 1}
                                            </p>

                                            <h4 className="mt-1 break-words text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                                                {getQuestionText(question, index)}
                                            </h4>
                                        </div>

                                        {question.points !== null &&
                                            question.points !== undefined ? (
                                            <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm sm:px-3 sm:text-xs">
                                                {question.points} pts
                                            </span>
                                        ) : null}
                                    </div>

                                    {options.length > 0 ? (
                                        <div className="mt-3 grid gap-2 sm:mt-4">
                                            {options.map((option, optionIndex) => {
                                                const selected =
                                                    Number(studentAnswer) === optionIndex;
                                                const correct = correctIndex === optionIndex;

                                                return (
                                                    <div
                                                        key={`${option}-${optionIndex}`}
                                                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold leading-5 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${correct
                                                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                                : selected
                                                                    ? "border-blue-200 bg-blue-50 text-blue-800"
                                                                    : "border-slate-200 bg-white text-slate-600"
                                                            }`}
                                                    >
                                                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
                                                            <span>
                                                                {String.fromCharCode(
                                                                    65 + optionIndex,
                                                                )}
                                                                . {option}
                                                            </span>

                                                            {correct ? (
                                                                <span className="text-[10px] font-black uppercase sm:text-xs">
                                                                    Correcta
                                                                </span>
                                                            ) : selected ? (
                                                                <span className="text-[10px] font-black uppercase sm:text-xs">
                                                                    Marcada
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null}

                                    <div className="mt-3 rounded-xl bg-white p-3 sm:mt-4 sm:rounded-2xl sm:p-4">
                                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                            Respuesta del estudiante
                                        </p>

                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                            <p className="break-words text-xs font-black leading-5 text-slate-800 [overflow-wrap:anywhere] sm:text-sm">
                                                {formatAnswer(question, studentAnswer)}
                                            </p>

                                            {hasCorrection ? (
                                                isCorrect ? (
                                                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 sm:px-3 sm:text-xs">
                                                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        Correcta
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 sm:px-3 sm:text-xs">
                                                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        Incorrecta
                                                    </span>
                                                )
                                            ) : null}
                                        </div>

                                        {correctIndex !== null && options[correctIndex] ? (
                                            <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-500 [overflow-wrap:anywhere] sm:text-sm">
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
                    <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                        {answerItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center sm:rounded-2xl sm:p-6">
                                <p className="text-sm font-black text-slate-700">
                                    No se encontraron respuestas registradas.
                                </p>
                            </div>
                        ) : (
                            answerItems.map((answer, index) => (
                                <article
                                    key={`${answer.key}-${index}`}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 sm:text-xs sm:tracking-[0.12em]">
                                        Pregunta {answer.key}
                                    </p>

                                    <div className="mt-3 rounded-xl bg-white p-3 sm:rounded-2xl sm:p-4">
                                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                            Respuesta registrada
                                        </p>

                                        <p className="mt-2 break-words text-xs font-black leading-5 text-slate-800 [overflow-wrap:anywhere] sm:text-sm">
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