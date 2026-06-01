import { Check, CheckCircle2, Loader2, Save } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import {
    getBlockDescription,
    getStudentResponseDate,
    normalizeSurveyQuestions,
} from "../../utils";

type SurveyBlockProps = {
    room: CourseRoomHook;
};

type LikertOptionMeta = {
    emoji: string;
    label: string;
    selectedClassName: string;
    emojiClassName: string;
};

function getLikertValue(option: string) {
    const match = option.trim().match(/^(\d+)/);

    return match?.[1] ?? "";
}

function getLikertOptionMeta(option: string): LikertOptionMeta {
    const value = getLikertValue(option);

    if (value === "1") {
        return {
            emoji: "😠",
            label: "Muy en desacuerdo",
            selectedClassName:
                "border-rose-400 bg-rose-50 text-rose-800 ring-4 ring-rose-100",
            emojiClassName: "bg-rose-100",
        };
    }

    if (value === "2") {
        return {
            emoji: "🙁",
            label: "En desacuerdo",
            selectedClassName:
                "border-orange-400 bg-orange-50 text-orange-800 ring-4 ring-orange-100",
            emojiClassName: "bg-orange-100",
        };
    }

    if (value === "3") {
        return {
            emoji: "😐",
            label: "Neutral",
            selectedClassName:
                "border-amber-400 bg-amber-50 text-amber-800 ring-4 ring-amber-100",
            emojiClassName: "bg-amber-100",
        };
    }

    if (value === "4") {
        return {
            emoji: "🙂",
            label: "De acuerdo",
            selectedClassName:
                "border-lime-400 bg-lime-50 text-lime-800 ring-4 ring-lime-100",
            emojiClassName: "bg-lime-100",
        };
    }

    return {
        emoji: "😄",
        label: "Muy de acuerdo",
        selectedClassName:
            "border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100",
        emojiClassName: "bg-emerald-100",
    };
}

export function SurveyBlock({ room }: SurveyBlockProps) {
    if (!room.selectedBlock) return null;

    const questions = normalizeSurveyQuestions(
        room.selectedContent.questions ??
        room.selectedContent.preguntas ??
        room.selectedContent.items,
    );

    const description = getBlockDescription(room.selectedBlock);

    const existing =
        room.surveyResponses[room.selectedBlock.id] ?? null;

    const isCompleted = Boolean(existing);

    return (
        <div className="space-y-5">
            {description ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold leading-6 text-blue-800">
                    {description}
                </div>
            ) : null}

            {existing ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                            <p className="font-black">
                                Encuesta realizada satisfactoriamente
                            </p>

                            <p className="mt-1 text-emerald-700">
                                Tus respuestas fueron registradas correctamente.
                            </p>

                            <p className="mt-1 text-xs text-emerald-700">
                                Fecha de envío:{" "}
                                {getStudentResponseDate(existing)}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            {questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                    Esta encuesta todavía no tiene preguntas cargadas.
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <article
                            key={question.id}
                            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="border-b border-slate-100 px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                                        {index + 1}
                                    </span>

                                    <div>
                                        <h3 className="text-sm font-black leading-6 text-slate-950 sm:text-base">
                                            {question.question}

                                            {question.required ? (
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            ) : null}
                                        </h3>

                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            Selecciona una opción según tu
                                            experiencia.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {question.type === "single" &&
                                question.options.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 lg:p-5">
                                    {question.options.map((option) => {
                                        const meta =
                                            getLikertOptionMeta(option);

                                        const selected =
                                            room.surveyAnswers[
                                            question.id
                                            ] === option;

                                        return (
                                            <label
                                                key={`${question.id}-${option}`}
                                                className={`relative flex min-h-[136px] flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition-all duration-200 ${selected
                                                        ? meta.selectedClassName
                                                        : isCompleted
                                                            ? "border-slate-200 bg-slate-50 text-slate-400 opacity-70"
                                                            : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                                                    } ${isCompleted
                                                        ? "cursor-not-allowed"
                                                        : "cursor-pointer"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`survey-question-${question.id}`}
                                                    value={option}
                                                    checked={selected}
                                                    disabled={isCompleted}
                                                    onChange={() => {
                                                        if (isCompleted) return;

                                                        room.setSurveyAnswers(
                                                            (current) => ({
                                                                ...current,
                                                                [question.id]:
                                                                    option,
                                                            }),
                                                        );
                                                    }}
                                                    className="sr-only"
                                                    aria-label={`${question.question}: ${meta.label}`}
                                                />

                                                {selected ? (
                                                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                                                        <Check className="h-4 w-4" />
                                                    </span>
                                                ) : null}

                                                <span
                                                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[30px] leading-none ${meta.emojiClassName}`}
                                                >
                                                    {meta.emoji}
                                                </span>

                                                <span className="mt-4 flex min-h-[32px] items-center justify-center text-xs font-bold leading-4">
                                                    {meta.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-5">
                                    <textarea
                                        value={
                                            room.surveyAnswers[
                                            question.id
                                            ] ?? ""
                                        }
                                        disabled={isCompleted}
                                        onChange={(event) => {
                                            if (isCompleted) return;

                                            room.setSurveyAnswers(
                                                (current) => ({
                                                    ...current,
                                                    [question.id]:
                                                        event.target.value,
                                                }),
                                            );
                                        }}
                                        rows={4}
                                        placeholder="Escribe tu respuesta..."
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                                    />
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}

            {!existing && room.studentResponseMessage ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                    {room.studentResponseMessage}
                </div>
            ) : null}

            {!existing ? (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => void room.handleSubmitSurvey()}
                        disabled={
                            room.studentResponseSaving ||
                            questions.length === 0
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {room.studentResponseSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        Enviar encuesta
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default SurveyBlock;