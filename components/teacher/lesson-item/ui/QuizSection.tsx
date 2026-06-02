"use client";

import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    ListChecks,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import type { LessonItemState } from "../hook";

type QuizSectionProps = {
    item: LessonItemState;
};

const QUIZ_MAX_POINTS = 10;

function isQuestionComplete(
    question: LessonItemState["form"]["quiz_questions"][number],
) {
    const hasQuestion = question.question.trim().length > 0;

    const completedOptions = question.options.filter(
        (option) => option.trim().length > 0,
    );

    const hasEnoughOptions = completedOptions.length >= 2;

    const selectedOption = question.options[question.correct_answer];

    const hasValidCorrectAnswer =
        Boolean(selectedOption) && selectedOption.trim().length > 0;

    return hasQuestion && hasEnoughOptions && hasValidCorrectAnswer;
}

export function QuizSection({ item }: QuizSectionProps) {
    const [openModal, setOpenModal] = useState(false);

    const questions = item.form.quiz_questions;

    const totalPoints = Number(
        questions
            .reduce(
                (total, question) => total + Number(question.points || 0),
                0,
            )
            .toFixed(2),
    );

    const remainingPoints = QUIZ_MAX_POINTS - totalPoints;

    const incompleteQuestions = questions.filter(
        (question) => !isQuestionComplete(question),
    ).length;

    if (item.itemType !== "quiz") {
        return null;
    }

    const statusTone =
        totalPoints > QUIZ_MAX_POINTS
            ? "danger"
            : totalPoints === QUIZ_MAX_POINTS
                ? "success"
                : "warning";

    return (
        <>
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                            <ClipboardList className="h-6 w-6" />
                        </div>

                        <h2 className="mt-4 text-xl font-black text-slate-950">
                            Configuración de la evaluación
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Define las instrucciones, la nota mínima y administra
                            las preguntas desde una ventana modal para mantener
                            la pantalla más limpia y ordenada.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48]"
                    >
                        <ListChecks className="h-4 w-4" />
                        Gestionar preguntas
                    </button>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_170px]">
                    <label className="block">
                        <span className="text-sm font-black text-slate-700">
                            Instrucciones de la evaluación
                        </span>

                        <textarea
                            value={item.form.quiz_instructions}
                            onChange={(event) =>
                                item.setForm((current) => ({
                                    ...current,
                                    quiz_instructions: event.target.value,
                                }))
                            }
                            className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="Ej: Responda cada pregunta según el contenido revisado..."
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-black text-slate-700">
                            Nota mínima
                        </span>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.form.completion_value}
                            onChange={(event) =>
                                item.setForm((current) => ({
                                    ...current,
                                    completion_value: Number(
                                        event.target.value,
                                    ),
                                }))
                            }
                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="Ej: 7"
                        />
                    </label>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                    <StatCard label="Preguntas" value={questions.length} />
                    <StatCard
                        label="Puntos usados"
                        value={totalPoints}
                        tone={
                            totalPoints > QUIZ_MAX_POINTS ? "danger" : "default"
                        }
                    />
                    <StatCard
                        label="Disponibles"
                        value={remainingPoints >= 0 ? remainingPoints : 0}
                        tone={
                            remainingPoints < 0
                                ? "danger"
                                : remainingPoints === 0
                                    ? "success"
                                    : "default"
                        }
                    />
                    <StatCard
                        label="Incompletas"
                        value={incompleteQuestions}
                        tone={incompleteQuestions > 0 ? "warning" : "success"}
                    />
                </div>

                <div
                    className={`mt-5 rounded-2xl border px-4 py-4 ${statusTone === "danger"
                        ? "border-red-200 bg-red-50"
                        : statusTone === "success"
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-amber-200 bg-amber-50"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${statusTone === "danger"
                                ? "bg-red-100 text-red-700"
                                : statusTone === "success"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                        >
                            {statusTone === "success" ? (
                                <CheckCircle2 className="h-5 w-5" />
                            ) : (
                                <AlertTriangle className="h-5 w-5" />
                            )}
                        </div>

                        <div>
                            <p
                                className={`text-sm font-black ${statusTone === "danger"
                                    ? "text-red-800"
                                    : statusTone === "success"
                                        ? "text-emerald-800"
                                        : "text-amber-800"
                                    }`}
                            >
                                Control de puntaje total
                            </p>

                            <p
                                className={`mt-1 text-sm font-semibold ${statusTone === "danger"
                                    ? "text-red-700"
                                    : statusTone === "success"
                                        ? "text-emerald-700"
                                        : "text-amber-700"
                                    }`}
                            >
                                {totalPoints > QUIZ_MAX_POINTS
                                    ? `La evaluación supera el máximo permitido. Debes reducir ${totalPoints - QUIZ_MAX_POINTS
                                    } punto(s).`
                                    : totalPoints === QUIZ_MAX_POINTS
                                        ? "La sumatoria de puntos está correcta: 10/10."
                                        : `Aún puedes asignar ${QUIZ_MAX_POINTS - totalPoints
                                        } punto(s) sin superar el máximo de 10.`}
                            </p>
                        </div>
                    </div>
                </div>

                {questions.length === 0 ? (
                    <button
                        type="button"
                        onClick={() => {
                            item.handleAddQuestion();
                            setOpenModal(true);
                        }}
                        className="mt-6 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-5 py-7 text-center transition hover:bg-blue-100"
                    >
                        <Plus className="h-6 w-6 text-blue-700" />

                        <span className="mt-2 text-sm font-black text-blue-800">
                            Agregar primera pregunta
                        </span>

                        <span className="mt-1 text-sm font-semibold text-blue-600">
                            Cada pregunta se configurará individualmente desde el
                            paginador.
                        </span>
                    </button>
                ) : (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-950">
                                    Banco de preguntas configurado
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Edita una pregunta por vez y utiliza el
                                    paginador para cambiar de pregunta.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenModal(true)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#172861] ring-1 ring-blue-100 transition hover:bg-blue-50"
                            >
                                <ListChecks className="h-4 w-4" />
                                Abrir preguntas
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {openModal ? (
                <QuestionsModal
                    item={item}
                    totalPoints={totalPoints}
                    remainingPoints={remainingPoints}
                    incompleteQuestions={incompleteQuestions}
                    onClose={() => setOpenModal(false)}
                />
            ) : null}
        </>
    );
}

function StatCard({
    label,
    value,
    tone = "default",
}: {
    label: string;
    value: string | number;
    tone?: "default" | "success" | "warning" | "danger";
}) {
    const toneClass =
        tone === "success"
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
            : tone === "warning"
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                : tone === "danger"
                    ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                    : "bg-slate-50 text-slate-700 ring-1 ring-slate-100";

    return (
        <div className={`rounded-2xl px-4 py-3 ${toneClass}`}>
            <p className="text-xs font-black uppercase tracking-[0.12em]">
                {label}
            </p>

            <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
    );
}

function QuestionsModal({
    item,
    totalPoints,
    remainingPoints,
    incompleteQuestions,
    onClose,
}: {
    item: LessonItemState;
    totalPoints: number;
    remainingPoints: number;
    incompleteQuestions: number;
    onClose: () => void;
}) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const questions = item.form.quiz_questions;

    const activeQuestionIndex = Math.min(
        currentQuestionIndex,
        Math.max(questions.length - 1, 0),
    );

    const currentQuestion = questions[activeQuestionIndex];

    function goToQuestion(index: number) {
        if (index < 0 || index >= questions.length) return;

        setCurrentQuestionIndex(index);
    }

    function addQuestionAndOpenIt() {
        const newQuestionIndex = questions.length;

        item.handleAddQuestion();
        setCurrentQuestionIndex(newQuestionIndex);
    }

    function removeCurrentQuestion() {
        if (!currentQuestion) return;

        item.handleRemoveQuestion(currentQuestion.id);

        setCurrentQuestionIndex((current) =>
            Math.max(0, Math.min(current, questions.length - 2)),
        );
    }

    const canSave =
        questions.length > 0 &&
        totalPoints === QUIZ_MAX_POINTS &&
        incompleteQuestions === 0;

    const saveButtonLabel = item.saving
        ? "Guardando..."
        : totalPoints !== QUIZ_MAX_POINTS
            ? "Completa los 10 puntos"
            : incompleteQuestions > 0
                ? "Completa las preguntas"
                : "Guardar preguntas";

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
            <div className="flex max-h-[94vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-2xl sm:rounded-[2rem]">
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#172861] to-blue-900 px-5 py-4 sm:px-6 sm:py-5">
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,132,40,0.35),transparent_45%)]" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                Banco de preguntas
                            </p>

                            <h3 className="mt-1 break-words text-xl font-black text-white sm:text-2xl">
                                Administrar preguntas de la evaluación
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-slate-200">
                                Total: {questions.length} pregunta
                                {questions.length === 1 ? "" : "s"} /{" "}
                                {totalPoints} puntos
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="border-b border-slate-200 bg-white px-5 py-3 sm:px-6">
                    <div
                        className={`rounded-xl border px-4 py-2.5 ${totalPoints > QUIZ_MAX_POINTS
                            ? "border-red-200 bg-red-50"
                            : totalPoints === QUIZ_MAX_POINTS
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-amber-200 bg-amber-50"
                            }`}
                    >
                        <p
                            className={`text-sm font-black ${totalPoints > QUIZ_MAX_POINTS
                                ? "text-red-800"
                                : totalPoints === QUIZ_MAX_POINTS
                                    ? "text-emerald-800"
                                    : "text-amber-800"
                                }`}
                        >
                            {totalPoints > QUIZ_MAX_POINTS
                                ? `Has excedido el límite por ${totalPoints - QUIZ_MAX_POINTS
                                } punto(s).`
                                : totalPoints === QUIZ_MAX_POINTS
                                    ? "La sumatoria está perfecta: 10/10."
                                    : `Te quedan ${remainingPoints} punto(s) para completar el máximo de 10.`}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5">
                    {questions.length === 0 || !currentQuestion ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                            <ListChecks className="mx-auto h-10 w-10 text-slate-400" />

                            <h4 className="mt-3 text-lg font-black text-slate-950">
                                Todavía no hay preguntas
                            </h4>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Agrega una pregunta para construir la evaluación.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                                        Pregunta {currentQuestionIndex + 1} de{" "}
                                        {questions.length}
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        Edita una pregunta y continúa con la
                                        siguiente desde el paginador.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={removeCurrentQuestion}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-xs font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={addQuestionAndOpenIt}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nueva pregunta
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <label className="block">
                                    <span className="text-sm font-black text-slate-700">
                                        Texto de la pregunta
                                    </span>

                                    <input
                                        type="text"
                                        value={currentQuestion.question}
                                        onChange={(event) =>
                                            item.handleChangeQuestion(
                                                currentQuestion.id,
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        placeholder="Ej: ¿Cuál es la respuesta correcta?"
                                    />
                                </label>

                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {currentQuestion.options.map(
                                        (option, optionIndex) => (
                                            <label
                                                key={`${currentQuestion.id}-${optionIndex}`}
                                                className="block"
                                            >
                                                <span className="text-sm font-black text-slate-700">
                                                    Opción {optionIndex + 1}
                                                </span>

                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(event) =>
                                                        item.handleChangeOption(
                                                            currentQuestion.id,
                                                            optionIndex,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                    placeholder={
                                                        optionIndex < 2
                                                            ? `Opción ${optionIndex +
                                                            1
                                                            } obligatoria`
                                                            : `Opción ${optionIndex +
                                                            1
                                                            } opcional`
                                                    }
                                                />
                                            </label>
                                        ),
                                    )}
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-black text-slate-700">
                                            Respuesta correcta
                                        </span>

                                        <select
                                            value={
                                                currentQuestion.correct_answer
                                            }
                                            onChange={(event) =>
                                                item.handleChangeCorrectAnswer(
                                                    currentQuestion.id,
                                                    Number(event.target.value),
                                                )
                                            }
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        >
                                            {currentQuestion.options.map(
                                                (_, optionIndex) => (
                                                    <option
                                                        key={optionIndex}
                                                        value={optionIndex}
                                                    >
                                                        Opción {optionIndex + 1}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="text-sm font-black text-slate-700">
                                            Puntos
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={currentQuestion.points}
                                            onChange={(event) =>
                                                item.handleChangePoints(
                                                    currentQuestion.id,
                                                    Number(event.target.value),
                                                )
                                            }
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            placeholder="Ej: 2"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        goToQuestion(currentQuestionIndex - 1)
                                    }
                                    disabled={currentQuestionIndex === 0}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </button>

                                <div className="flex justify-center gap-2 overflow-x-auto pb-1">
                                    {questions.map((question, index) => {
                                        const active =
                                            index === currentQuestionIndex;

                                        const complete =
                                            isQuestionComplete(question);

                                        return (
                                            <button
                                                key={question.id}
                                                type="button"
                                                onClick={() =>
                                                    goToQuestion(index)
                                                }
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${active
                                                    ? "bg-[#172861] text-white"
                                                    : complete
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "border border-amber-200 bg-amber-50 text-amber-700"
                                                    }`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToQuestion(currentQuestionIndex + 1)
                                    }
                                    disabled={
                                        currentQuestionIndex ===
                                        questions.length - 1
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-6">
                    <button
                        type="button"
                        onClick={addQuestionAndOpenIt}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar siguiente pregunta
                    </button>

                    <div className="flex flex-col items-start gap-1 lg:items-end">
                        <p className="text-sm font-black text-slate-800">
                            Total actual: {totalPoints} / {QUIZ_MAX_POINTS}
                        </p>

                        <p
                            className={`text-xs font-semibold ${totalPoints > QUIZ_MAX_POINTS
                                ? "text-red-600"
                                : totalPoints === QUIZ_MAX_POINTS
                                    ? "text-emerald-600"
                                    : "text-slate-500"
                                }`}
                        >
                            {totalPoints > QUIZ_MAX_POINTS
                                ? "Debes reducir el puntaje total."
                                : totalPoints === QUIZ_MAX_POINTS
                                    ? "Puntaje completo."
                                    : `Todavía puedes usar ${remainingPoints} punto(s).`}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                        >
                            <X className="h-4 w-4" />
                            Cerrar
                        </button>

                        <button
                            type="submit"
                            form="lesson-item-editor-form"
                            disabled={item.saving || !canSave}
                            title={
                                totalPoints !== QUIZ_MAX_POINTS
                                    ? "La sumatoria debe ser exactamente de 10 puntos."
                                    : incompleteQuestions > 0
                                        ? "Completa todas las preguntas antes de guardar."
                                        : "Guardar preguntas"
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />

                            {saveButtonLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuizSection;
