"use client";

import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Crown,
    Loader2,
} from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { MAX_QUIZ_ATTEMPTS } from "../../constants";
import {
    getQuizAttemptsCount,
    getQuizResponseForBlock,
    normalizeQuizQuestions,
} from "../../quiz";
import { getContentValue } from "../../utils";

type QuizBlockProps = {
    room: CourseRoomHook;
};

export function QuizBlock({ room }: QuizBlockProps) {
    const [questionPageByBlock, setQuestionPageByBlock] = useState<
        Record<string, number>
    >({});

    if (!room.selectedBlock) return null;

    const blockId = room.selectedBlock.id;
    const blockKey = String(blockId);

    const questions = normalizeQuizQuestions(room.selectedContent.questions);
    const stored = getQuizResponseForBlock(room.quizResponses, blockId);

    const usedAttempts = getQuizAttemptsCount(stored);
    const remainingAttempts = Math.max(0, MAX_QUIZ_ATTEMPTS - usedAttempts);

    const isQuizCompleted = room.completedBlocks.includes(blockId);
    const isQuizLimitReached = usedAttempts >= MAX_QUIZ_ATTEMPTS;

    const currentQuestionIndex = Math.min(
        questionPageByBlock[blockKey] ?? 0,
        Math.max(questions.length - 1, 0),
    );

    const currentQuestion = questions[currentQuestionIndex];

    const answeredQuestionsCount = questions.filter((question) => {
        const answer = room.quizAnswers[question.id];
        return answer !== undefined && answer !== null;
    }).length;

    const unansweredQuestionsCount = Math.max(
        questions.length - answeredQuestionsCount,
        0,
    );

    const allQuestionsAnswered =
        questions.length > 0 &&
        answeredQuestionsCount === questions.length;

    function changeQuestionPage(nextIndex: number) {
        if (nextIndex < 0 || nextIndex >= questions.length) return;

        setQuestionPageByBlock((current) => ({
            ...current,
            [blockKey]: nextIndex,
        }));
    }

    function isApprovedResult() {
        return room.quizResult?.startsWith("Evaluación aprobada") === true;
    }

    return (
        <div className="min-w-0 space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <p className="break-words text-sm font-bold text-amber-800">
                        Mínimo requerido: {room.selectedBlock.completion_value} puntos
                    </p>

                    <p className="mt-1 break-words whitespace-pre-wrap text-xs leading-5 text-amber-700 sm:text-sm">
                        {getContentValue(room.selectedContent, "instructions") ||
                            "Responde todas las preguntas para finalizar la evaluación."}
                    </p>
                </div>

                <div className="min-w-0 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="break-words text-sm font-bold text-blue-800">
                        Intentos usados: {usedAttempts} de {MAX_QUIZ_ATTEMPTS}
                    </p>

                    <p className="mt-1 break-words text-xs leading-5 text-blue-700 sm:text-sm">
                        {isQuizCompleted
                            ? "Esta evaluación ya fue aprobada."
                            : isQuizLimitReached
                                ? "Ya no tienes intentos disponibles."
                                : `Te quedan ${remainingAttempts} intento(s).`}
                    </p>
                </div>
            </div>

            {questions.length === 0 ? (
                <div className="min-w-0 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                    Esta evaluación todavía no tiene preguntas cargadas.
                </div>
            ) : (
                <>
                    {currentQuestion ? (
                        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
                                        Pregunta {currentQuestionIndex + 1} de {questions.length}
                                    </p>

                                    <h3 className="mt-1 break-words text-base font-black leading-6 text-slate-950">
                                        {currentQuestionIndex + 1}.{" "}
                                        {currentQuestion.question}
                                    </h3>
                                </div>

                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                                    {answeredQuestionsCount}/{questions.length}
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {currentQuestion.options.map((option, optionIndex) => (
                                    <label
                                        key={`${currentQuestion.id}-${optionIndex}`}
                                        className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition ${room.quizAnswers[currentQuestion.id] === optionIndex
                                            ? "border-blue-500 bg-blue-50 text-blue-800"
                                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${currentQuestion.id}`}
                                            checked={
                                                room.quizAnswers[currentQuestion.id] === optionIndex
                                            }
                                            onChange={() =>
                                                room.handleQuizAnswer(
                                                    currentQuestion.id,
                                                    optionIndex,
                                                )
                                            }
                                            className="h-4 w-4 shrink-0 accent-blue-700"
                                        />

                                        <span className="min-w-0 break-words">
                                            {option}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
                        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                            <button
                                type="button"
                                onClick={() => changeQuestionPage(currentQuestionIndex - 1)}
                                disabled={currentQuestionIndex === 0}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                            </button>

                            <div className="flex justify-center gap-2 overflow-x-auto">
                                {questions.map((question, index) => {
                                    const answered =
                                        room.quizAnswers[question.id] !== undefined &&
                                        room.quizAnswers[question.id] !== null;

                                    const isActive = index === currentQuestionIndex;

                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => changeQuestionPage(index)}
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${isActive
                                                ? "bg-blue-700 text-white"
                                                : answered
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => changeQuestionPage(currentQuestionIndex + 1)}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {unansweredQuestionsCount > 0 &&
                !isQuizCompleted &&
                !isQuizLimitReached ? (
                <div className="min-w-0 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700">
                    Debes responder {unansweredQuestionsCount} pregunta
                    {unansweredQuestionsCount === 1 ? "" : "s"} antes de finalizar.
                </div>
            ) : null}

            {room.quizResult ? (
                <div
                    className={`flex min-w-0 items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold ${isApprovedResult()
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    {isApprovedResult() ? (
                        <Crown className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
                    )}

                    <span className="min-w-0 break-words">
                        {room.quizResult}
                    </span>
                </div>
            ) : null}

            <button
                type="button"
                onClick={() => void room.handleSubmitQuiz()}
                disabled={
                    room.quizSaving ||
                    isQuizCompleted ||
                    isQuizLimitReached ||
                    !allQuestionsAnswered
                }
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
                {room.quizSaving ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : isQuizCompleted ? (
                    <Crown className="h-4 w-4 shrink-0" />
                ) : (
                    <ClipboardList className="h-4 w-4 shrink-0" />
                )}

                <span className="min-w-0 break-words">
                    {room.quizSaving
                        ? "Guardando respuestas..."
                        : isQuizCompleted
                            ? "Evaluación guardada"
                            : isQuizLimitReached
                                ? "Sin intentos disponibles"
                                : !allQuestionsAnswered
                                    ? "Responde todas las preguntas"
                                    : "Finalizar evaluación"}
                </span>
            </button>
        </div>
    );
}