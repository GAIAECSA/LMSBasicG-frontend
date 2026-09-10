"use client";

import Link from "next/link";

import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Loader2,
    Save,
} from "lucide-react";

import {
    useTeacherSurveyAnswer,
    type TeacherSurveyQuestion,
} from "./hook";

type Props = {
    courseId: string;
    itemId: string;
};

type LikertMeta = {
    emoji: string;
    label: string;
    selectedClassName: string;
    emojiClassName: string;
};

function getLikertValue(
    option: string,
) {
    const match =
        option
            .trim()
            .match(/^(\d+)/);

    return match?.[1] ?? "";
}

function getLikertMeta(
    option: string,
): LikertMeta {
    const value =
        getLikertValue(
            option,
        );

    if (value === "1") {
        return {
            emoji: "😠",
            label:
                "Muy en desacuerdo",
            selectedClassName:
                "border-rose-400 bg-rose-50 text-rose-800 ring-4 ring-rose-100",
            emojiClassName:
                "bg-rose-100",
        };
    }

    if (value === "2") {
        return {
            emoji: "🙁",
            label:
                "En desacuerdo",
            selectedClassName:
                "border-orange-400 bg-orange-50 text-orange-800 ring-4 ring-orange-100",
            emojiClassName:
                "bg-orange-100",
        };
    }

    if (value === "3") {
        return {
            emoji: "😐",
            label:
                "Neutral",
            selectedClassName:
                "border-amber-400 bg-amber-50 text-amber-800 ring-4 ring-amber-100",
            emojiClassName:
                "bg-amber-100",
        };
    }

    if (value === "4") {
        return {
            emoji: "🙂",
            label:
                "De acuerdo",
            selectedClassName:
                "border-lime-400 bg-lime-50 text-lime-800 ring-4 ring-lime-100",
            emojiClassName:
                "bg-lime-100",
        };
    }

    return {
        emoji: "😄",
        label:
            "Muy de acuerdo",
        selectedClassName:
            "border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100",
        emojiClassName:
            "bg-emerald-100",
    };
}

function SurveyQuestionCard({
    question,
    answer,
    onChange,
}: {
    question: TeacherSurveyQuestion;
    answer: string;
    onChange: (
        value: string,
    ) => void;
}) {
    if (
        question.type ===
        "single" &&
        question.options.length >
        0
    ) {
        return (
            <div className="grid grid-cols-1 gap-3 p-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 xl:p-5">
                {question.options.map(
                    (option) => {
                        const meta =
                            getLikertMeta(
                                option,
                            );

                        const selected =
                            answer ===
                            option;

                        return (
                            <label
                                key={
                                    option
                                }
                                className={`relative flex min-h-[118px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition-all sm:min-h-[136px] ${selected
                                        ? meta.selectedClassName
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`teacher-survey-${question.id}`}
                                    value={
                                        option
                                    }
                                    checked={
                                        selected
                                    }
                                    onChange={() =>
                                        onChange(
                                            option,
                                        )
                                    }
                                    className="sr-only"
                                />

                                {selected ? (
                                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                                        <Check className="h-4 w-4" />
                                    </span>
                                ) : null}

                                <span
                                    className={`flex h-14 w-14 items-center justify-center rounded-full text-[30px] ${meta.emojiClassName}`}
                                >
                                    {
                                        meta.emoji
                                    }
                                </span>

                                <span className="mt-4 text-xs font-bold">
                                    {
                                        meta.label
                                    }
                                </span>
                            </label>
                        );
                    },
                )}
            </div>
        );
    }

    return (
        <div className="p-5">
            <textarea
                value={answer}
                onChange={(
                    event,
                ) =>
                    onChange(
                        event.target
                            .value,
                    )
                }
                rows={4}
                placeholder="Escribe tu respuesta..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
        </div>
    );
}

export function TeacherSurveyAnswerPage({
    courseId,
    itemId,
}: Props) {
    const survey =
        useTeacherSurveyAnswer({
            courseId,
            itemId,
        });

    if (survey.loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
            </div>
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
            <div className="mx-auto w-full max-w-[1200px] space-y-4">
                <Link
                    href={
                        survey.backHref
                    }
                    className="inline-flex items-center gap-2 text-sm font-black text-blue-700"
                >
                    <ArrowLeft className="h-4 w-4" />

                    Volver a módulos
                </Link>

                <header className="overflow-hidden rounded-3xl bg-[#172861] px-5 py-6 text-white shadow-sm sm:px-7">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-100">
                        Responder encuesta
                    </span>

                    <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                        {survey.title}
                    </h1>

                    {survey.description ? (
                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-100">
                            {
                                survey.description
                            }
                        </p>
                    ) : null}
                </header>

                {survey.hasResponse ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />

                            Ya respondiste esta encuesta. Puedes modificar tus respuestas y volver a guardar.
                        </div>
                    </div>
                ) : null}

                {survey.error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {survey.error}
                    </div>
                ) : null}

                {survey.questions.map(
                    (
                        question,
                        index,
                    ) => (
                        <article
                            key={
                                question.id
                            }
                            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="border-b border-slate-100 px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                                        {index +
                                            1}
                                    </span>

                                    <div>
                                        <h3 className="text-sm font-black leading-6 text-slate-950 sm:text-base">
                                            {
                                                question.question
                                            }

                                            {question.required ? (
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            ) : null}
                                        </h3>

                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            {question.type ===
                                                "text"
                                                ? "Escribe tu respuesta."
                                                : "Selecciona una opción según tu experiencia."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <SurveyQuestionCard
                                question={
                                    question
                                }
                                answer={
                                    survey
                                        .answers[
                                    question
                                        .id
                                    ] ?? ""
                                }
                                onChange={(
                                    value,
                                ) =>
                                    survey.setAnswer(
                                        question.id,
                                        value,
                                    )
                                }
                            />
                        </article>
                    ),
                )}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() =>
                            void survey.handleSubmit()
                        }
                        disabled={
                            survey.saving ||
                            survey
                                .questions
                                .length ===
                            0
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {survey.saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        {survey.hasResponse
                            ? "Actualizar respuesta"
                            : "Enviar encuesta"}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default TeacherSurveyAnswerPage;