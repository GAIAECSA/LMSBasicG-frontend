import {
    AlignLeft,
    ListChecks,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

import type {
    LessonItemState,
} from "../hook";

type SurveySectionProps = {
    item: LessonItemState;
};

export function SurveySection({
    item,
}: SurveySectionProps) {
    if (
        item.itemType !==
        "survey"
    ) {
        return null;
    }

    const totalQuestions =
        item.form
            .survey_questions
            .length;

    const likertQuestions =
        item.form.survey_questions.filter(
            (
                question,
            ) =>
                question.type ===
                "single",
        ).length;

    const textQuestions =
        item.form.survey_questions.filter(
            (
                question,
            ) =>
                question.type ===
                "text",
        ).length;

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[24px]">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="border-b border-slate-100 px-4 py-4 sm:px-5 lg:px-6 [@media(max-height:760px)]:py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <ListChecks className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-black text-slate-950 sm:text-lg">
                                Configuración de la encuesta
                            </h2>

                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                Puedes combinar preguntas
                                con escala Likert y
                                preguntas abiertas de
                                respuesta libre.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                            {likertQuestions} Likert
                        </span>

                        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
                            {textQuestions} abiertas
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5 [@media(max-height:760px)]:space-y-3">

                {/* =====================================
                    INSTRUCCIONES
                ===================================== */}

                <div>
                    <label
                        htmlFor="survey-instructions"
                        className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-slate-500"
                    >
                        Instrucciones para el estudiante
                    </label>

                    <textarea
                        id="survey-instructions"
                        value={
                            item.form
                                .survey_instructions
                        }
                        onChange={(
                            event,
                        ) =>
                            item.setForm(
                                (
                                    current,
                                ) => ({
                                    ...current,

                                    survey_instructions:
                                        event
                                            .target
                                            .value,
                                }),
                            )
                        }
                        rows={2}
                        placeholder="Ej.: Responde las siguientes preguntas según tu experiencia en esta lección..."
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                    />
                </div>

                {/* =====================================
                    PREGUNTAS
                ===================================== */}

                <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-black text-slate-950">
                                Preguntas de la encuesta
                            </h3>

                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                Selecciona si cada pregunta
                                será Likert o de respuesta
                                abierta.
                            </p>
                        </div>

                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                            {totalQuestions}{" "}
                            {totalQuestions ===
                                1
                                ? "pregunta"
                                : "preguntas"}
                        </span>
                    </div>

                    {/* =================================
                        SIN PREGUNTAS
                    ================================= */}

                    {totalQuestions ===
                        0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <ListChecks className="h-6 w-6" />
                            </div>

                            <h4 className="mt-3 text-base font-black text-slate-900">
                                Aún no existen preguntas
                            </h4>

                            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                                Puedes crear preguntas
                                Likert o preguntas abiertas
                                para que el estudiante
                                escriba su respuesta.
                            </p>

                            <div className="mt-4 flex flex-wrap justify-center gap-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        item.handleAddSurveyQuestion(
                                            "single",
                                        )
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    <ListChecks className="h-4 w-4" />

                                    Agregar Likert
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        item.handleAddSurveyQuestion(
                                            "text",
                                        )
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-violet-700"
                                >
                                    <AlignLeft className="h-4 w-4" />

                                    Agregar abierta
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] border-collapse text-left">

                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-200">

                                            <th className="w-[70px] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                                                N.º
                                            </th>

                                            <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                                                Texto de la pregunta
                                            </th>

                                            <th className="w-[190px] px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                                                Tipo
                                            </th>

                                            <th className="w-[150px] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                                                Obligatoria
                                            </th>

                                            <th className="w-[90px] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {item.form.survey_questions.map(
                                            (
                                                question,
                                                index,
                                            ) => (
                                                <tr
                                                    key={
                                                        question.id
                                                    }
                                                    className="transition hover:bg-blue-50/40"
                                                >
                                                    {/* NÚMERO */}

                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#172861] text-xs font-black text-white">
                                                            {index +
                                                                1}
                                                        </span>
                                                    </td>

                                                    {/* TEXTO */}

                                                    <td className="px-4 py-3">
                                                        <label
                                                            htmlFor={`survey-question-${question.id}`}
                                                            className="sr-only"
                                                        >
                                                            Pregunta{" "}
                                                            {index +
                                                                1}
                                                        </label>

                                                        <input
                                                            id={`survey-question-${question.id}`}
                                                            type="text"
                                                            value={
                                                                question.question
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                item.handleChangeSurveyQuestion(
                                                                    question.id,
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder={
                                                                question.type ===
                                                                    "text"
                                                                    ? "Ej.: ¿Qué aspecto del curso te resultó más útil y por qué?"
                                                                    : "Ej.: El contenido presentado fue claro y comprensible."
                                                            }
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm"
                                                        />

                                                        <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                                                            {question.type ===
                                                                "text"
                                                                ? "El estudiante podrá escribir libremente su respuesta."
                                                                : "El estudiante seleccionará una opción de la escala Likert 1–5."}
                                                        </p>
                                                    </td>

                                                    {/* TIPO */}

                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={
                                                                question.type
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                item.handleChangeSurveyType(
                                                                    question.id,
                                                                    event
                                                                        .target
                                                                        .value as
                                                                    | "text"
                                                                    | "single",
                                                                )
                                                            }
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                        >
                                                            <option value="single">
                                                                Escala
                                                                Likert
                                                            </option>

                                                            <option value="text">
                                                                Respuesta
                                                                abierta
                                                            </option>
                                                        </select>
                                                    </td>

                                                    {/* OBLIGATORIA */}

                                                    <td className="px-4 py-3 text-center">
                                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-100">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    question.required
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    item.handleChangeSurveyRequired(
                                                                        question.id,
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-blue-300 accent-blue-600"
                                                            />

                                                            Sí
                                                        </label>
                                                    </td>

                                                    {/* ELIMINAR */}

                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                item.handleRemoveSurveyQuestion(
                                                                    question.id,
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                            aria-label={`Eliminar pregunta ${index + 1}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* =================================
                                AGREGAR
                            ================================= */}

                            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                                <p className="text-xs font-semibold text-slate-500">
                                    Puedes combinar ambos
                                    tipos de pregunta en una
                                    misma encuesta.
                                </p>

                                <div className="flex flex-wrap gap-2">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            item.handleAddSurveyQuestion(
                                                "single",
                                            )
                                        }
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50 active:scale-[0.97] sm:px-4 sm:text-sm"
                                    >
                                        <Plus className="h-4 w-4" />

                                        Likert
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            item.handleAddSurveyQuestion(
                                                "text",
                                            )
                                        }
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 text-xs font-black text-violet-700 transition hover:bg-violet-50 active:scale-[0.97] sm:px-4 sm:text-sm"
                                    >
                                        <AlignLeft className="h-4 w-4" />

                                        Abierta
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* =====================================
                    GUARDAR
                ===================================== */}

                {totalQuestions >
                    0 ? (
                    <div className="flex justify-stretch border-t border-slate-100 pt-3 sm:justify-end sm:pt-4">
                        <button
                            type="submit"
                            disabled={
                                item.saving
                            }
                            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#0f1d48] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto sm:px-5 sm:text-sm"
                        >
                            <Save className="h-4 w-4" />

                            {item.saving
                                ? "Guardando..."
                                : "Guardar encuesta"}
                        </button>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export default SurveySection;