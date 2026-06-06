import { ClipboardCheck, ClipboardList } from "lucide-react";
import type { GradeRow } from "../types";
import {
    getActivityTitle,
    getAnswerValue,
    getParsedAnswers,
    getQuizQuestions,
    getResponseFileUrl,
    getResponseText,
} from "../utils";

type ActivityProps = {
    row: GradeRow;
};

type ActivityContentProps = {
    row: GradeRow;
    compact?: boolean;
};

export function Activity({ row }: ActivityProps) {
    return (
        <td className="px-3 py-3 align-top xl:px-4 xl:py-4">
            <ActivityContent row={row} compact />
        </td>
    );
}

export function ActivityContent({
    row,
    compact = false,
}: ActivityContentProps) {
    const questions = row.kind === "quiz" ? getQuizQuestions(row) : [];
    const responseFileUrl = getResponseFileUrl(row.response);

    return (
        <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${
                        row.kind === "quiz"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-orange-50 text-orange-700"
                    }`}
                >
                    {row.kind === "quiz" ? (
                        <ClipboardList className="h-3.5 w-3.5" />
                    ) : (
                        <ClipboardCheck className="h-3.5 w-3.5" />
                    )}

                    {row.kind === "quiz" ? "Prueba" : "Tarea"}
                </span>
            </div>

            <p
                title={getActivityTitle(row)}
                className={`mt-2 break-words font-bold leading-5 text-slate-950 [overflow-wrap:anywhere] ${
                    compact ? "text-xs" : "text-sm"
                }`}
            >
                {getActivityTitle(row)}
            </p>

            <p
                title={row.blockInfo.lesson.name}
                className="mt-1 break-words text-[10px] font-semibold leading-4 text-slate-500 [overflow-wrap:anywhere] sm:text-xs"
            >
                {row.blockInfo.lesson.name}
            </p>

            {row.kind === "quiz" ? (
                <details className="mt-2.5 sm:mt-3">
                    <summary className="cursor-pointer text-[10px] font-bold text-[#172861] sm:text-xs">
                        Ver respuestas
                    </summary>

                    <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:mt-3 sm:p-3">
                        {questions.length === 0 ? (
                            <p className="text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs">
                                No hay preguntas guardadas.
                            </p>
                        ) : (
                            questions.map((question, index) => {
                                const answers = getParsedAnswers(row.response);

                                const selectedAnswer = getAnswerValue(
                                    answers,
                                    question.id,
                                );

                                const selectedOption =
                                    selectedAnswer === null
                                        ? "Sin respuesta"
                                        : question.options[selectedAnswer] ??
                                          "Sin respuesta";

                                const correctOption =
                                    question.options[question.correct_answer] ??
                                    "Sin respuesta correcta";

                                const isCorrect =
                                    selectedAnswer !== null &&
                                    selectedAnswer === question.correct_answer;

                                return (
                                    <div
                                        key={question.id}
                                        className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200 sm:p-3"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                            <p className="min-w-0 break-words text-[10px] font-bold leading-4 text-slate-800 [overflow-wrap:anywhere] sm:text-xs sm:leading-5">
                                                {index + 1}. {question.question}
                                            </p>

                                            <span
                                                className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${
                                                    isCorrect
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-red-50 text-red-700"
                                                }`}
                                            >
                                                {isCorrect
                                                    ? "Correcta"
                                                    : "Incorrecta"}
                                            </span>
                                        </div>

                                        <div className="mt-2 grid gap-1.5 md:grid-cols-2 md:gap-2">
                                            <p className="break-words text-[10px] leading-4 text-slate-600 [overflow-wrap:anywhere] sm:text-xs sm:leading-5">
                                                <span className="font-bold">
                                                    Respondió:
                                                </span>{" "}
                                                {selectedOption}
                                            </p>

                                            <p className="break-words text-[10px] leading-4 text-slate-600 [overflow-wrap:anywhere] sm:text-xs sm:leading-5">
                                                <span className="font-bold">
                                                    Correcta:
                                                </span>{" "}
                                                {correctOption}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </details>
            ) : (
                <details className="mt-2.5 sm:mt-3">
                    <summary className="cursor-pointer text-[10px] font-bold text-[#172861] sm:text-xs">
                        Ver respuesta
                    </summary>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:mt-3 sm:p-3">
                        <p className="whitespace-pre-line break-words text-[10px] font-semibold leading-4 text-slate-600 [overflow-wrap:anywhere] sm:text-xs sm:leading-5">
                            {getResponseText(row.response)}
                        </p>

                        {responseFileUrl ? (
                            <a
                                href={responseFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-[#172861] ring-1 ring-slate-200 transition hover:bg-slate-50 sm:mt-3 sm:text-xs"
                            >
                                Ver evidencia
                            </a>
                        ) : null}
                    </div>
                </details>
            )}
        </div>
    );
}
