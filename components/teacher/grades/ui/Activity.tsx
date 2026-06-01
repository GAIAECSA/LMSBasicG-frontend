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

export function Activity({ row }: ActivityProps) {
    const questions = row.kind === "quiz" ? getQuizQuestions(row) : [];
    const responseFileUrl = getResponseFileUrl(row.response);

    return (
        <td className="px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${row.kind === "quiz"
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

            <p className="mt-2 font-bold text-slate-950">
                {getActivityTitle(row)}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
                {row.blockInfo.lesson.name}
            </p>

            {row.kind === "quiz" ? (
                <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-bold text-[#172861]">
                        Ver respuestas
                    </summary>

                    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {questions.length === 0 ? (
                            <p className="text-xs font-semibold text-slate-500">
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
                                    question.options[
                                    question.correct_answer
                                    ] ?? "Sin respuesta correcta";

                                const isCorrect =
                                    selectedAnswer !== null &&
                                    selectedAnswer === question.correct_answer;

                                return (
                                    <div
                                        key={question.id}
                                        className="rounded-lg bg-white p-3 ring-1 ring-slate-200"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-xs font-bold text-slate-800">
                                                {index + 1}.{" "}
                                                {question.question}
                                            </p>

                                            <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${isCorrect
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
                                                <span className="font-bold">
                                                    Respondió:
                                                </span>{" "}
                                                {selectedOption}
                                            </p>

                                            <p className="text-xs text-slate-600">
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
                <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-bold text-[#172861]">
                        Ver respuesta
                    </summary>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="whitespace-pre-line text-xs font-semibold leading-5 text-slate-600">
                            {getResponseText(row.response)}
                        </p>

                        {responseFileUrl ? (
                            <a
                                href={responseFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#172861] ring-1 ring-slate-200 transition hover:bg-slate-50"
                            >
                                Ver evidencia
                            </a>
                        ) : null}
                    </div>
                </details>
            )}
        </td>
    );
}