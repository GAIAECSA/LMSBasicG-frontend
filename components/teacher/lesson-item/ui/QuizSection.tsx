"use client";

import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
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

export function QuizSection({ item }: QuizSectionProps) {
    const [openModal, setOpenModal] = useState(false);

    const questions = item.form.quiz_questions;

    const totalPoints = questions.reduce(
        (total, question) => total + Number(question.points || 0),
        0,
    );

    const remainingPoints = QUIZ_MAX_POINTS - totalPoints;

    const incompleteQuestions = questions.filter((question) => {
        const hasQuestion = question.question.trim().length > 0;

        const completedOptions = question.options.filter(
            (option) => option.trim().length > 0,
        );

        const hasEnoughOptions = completedOptions.length >= 2;

        const selectedOption = question.options[question.correct_answer];

        const hasValidCorrectAnswer =
            Boolean(selectedOption) && selectedOption.trim().length > 0;

        return !hasQuestion || !hasEnoughOptions || !hasValidCorrectAnswer;
    }).length;

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
                                    ? `La evaluación supera el máximo permitido. Debes reducir ${totalPoints - QUIZ_MAX_POINTS} punto(s).`
                                    : totalPoints === QUIZ_MAX_POINTS
                                        ? "La sumatoria de puntos está correcta: 10/10."
                                        : `Aún puedes asignar ${QUIZ_MAX_POINTS - totalPoints} punto(s) sin superar el máximo de 10.`}
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
                            Las preguntas se administran en una ventana modal
                            para mantener limpia la pantalla.
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
                                    Puedes editar, agregar o eliminar preguntas
                                    desde el modal.
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
    onClose,
}: {
    item: LessonItemState;
    totalPoints: number;
    remainingPoints: number;
    onClose: () => void;
}) {
    const questions = item.form.quiz_questions;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#172861] to-blue-900 px-6 py-5">
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,132,40,0.35),transparent_45%)]" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                Banco de preguntas
                            </p>

                            <h3 className="mt-2 text-2xl font-black text-white">
                                Administrar preguntas de la evaluación
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-slate-200">
                                Total: {questions.length} preguntas /{" "}
                                {totalPoints} puntos
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="border-b border-slate-200 bg-white px-6 py-4">
                    <div
                        className={`rounded-2xl border px-4 py-3 ${totalPoints > QUIZ_MAX_POINTS
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
                                ? `Has excedido el límite por ${totalPoints - QUIZ_MAX_POINTS} punto(s).`
                                : totalPoints === QUIZ_MAX_POINTS
                                    ? "La sumatoria está perfecta: 10/10."
                                    : `Te quedan ${remainingPoints} punto(s) disponibles para llegar al máximo de 10.`}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-6">
                    {questions.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                            <ListChecks className="mx-auto h-10 w-10 text-slate-400" />

                            <h4 className="mt-3 text-lg font-black text-slate-950">
                                Todavía no hay preguntas
                            </h4>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Agrega preguntas para construir la evaluación.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question, questionIndex) => (
                                <div
                                    key={question.id}
                                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                                                Pregunta {questionIndex + 1}
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                                Configura opciones, respuesta
                                                correcta y puntaje.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                item.handleRemoveQuestion(
                                                    question.id,
                                                )
                                            }
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </button>
                                    </div>

                                    <label className="mt-5 block">
                                        <span className="text-sm font-black text-slate-700">
                                            Texto de la pregunta
                                        </span>

                                        <input
                                            type="text"
                                            value={question.question}
                                            onChange={(event) =>
                                                item.handleChangeQuestion(
                                                    question.id,
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            placeholder="Ej: ¿Cuál es la respuesta correcta?"
                                        />
                                    </label>

                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        {question.options.map(
                                            (option, optionIndex) => (
                                                <label
                                                    key={`${question.id}-${optionIndex}`}
                                                    className="block"
                                                >
                                                    <span className="text-sm font-black text-slate-700">
                                                        Opción{" "}
                                                        {optionIndex + 1}
                                                    </span>

                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(event) =>
                                                            item.handleChangeOption(
                                                                question.id,
                                                                optionIndex,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                        placeholder={
                                                            optionIndex < 2
                                                                ? `Opción ${optionIndex + 1} obligatoria`
                                                                : `Opción ${optionIndex + 1} opcional`
                                                        }
                                                    />
                                                </label>
                                            ),
                                        )}
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <label className="block">
                                            <span className="text-sm font-black text-slate-700">
                                                Respuesta correcta
                                            </span>

                                            <select
                                                value={question.correct_answer}
                                                onChange={(event) =>
                                                    item.handleChangeCorrectAnswer(
                                                        question.id,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            >
                                                {question.options.map(
                                                    (_, optionIndex) => (
                                                        <option
                                                            key={optionIndex}
                                                            value={optionIndex}
                                                        >
                                                            Opción{" "}
                                                            {optionIndex + 1}
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
                                                value={question.points}
                                                onChange={(event) =>
                                                    item.handleChangePoints(
                                                        question.id,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                placeholder="Ej: 2"
                                            />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <button
                        type="button"
                        onClick={item.handleAddQuestion}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-5 text-sm font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar pregunta
                    </button>

                    <div className="flex flex-col items-start gap-1 sm:items-end">
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
                                ? "Debes reducir el puntaje total para poder guardar."
                                : totalPoints === QUIZ_MAX_POINTS
                                    ? "Puntaje completo."
                                    : `Todavía puedes usar ${remainingPoints} punto(s).`}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48]"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizSection;