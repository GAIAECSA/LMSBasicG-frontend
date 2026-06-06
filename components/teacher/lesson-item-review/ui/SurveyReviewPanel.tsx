import {
    CheckCircle2,
    ClipboardList,
    Clock3,
    Users,
} from "lucide-react";
import type { ReviewStudentRow } from "../types";
import { formatDate, getResponseRecord } from "../utils";

type SurveyReviewPanelProps = {
    rows: ReviewStudentRow[];
};

type UnknownRecord = Record<string, unknown>;

type SurveyQuestion = {
    id: string;
    question: string;
    required: boolean;
};

type LikertMeta = {
    emoji: string;
    label: string;
    className: string;
};

function isRecord(value: unknown): value is UnknownRecord {
    return (
        Boolean(value) &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function parseRecord(value: unknown): UnknownRecord {
    if (isRecord(value)) return value;

    if (typeof value !== "string" || value.trim() === "") {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(value);

        return isRecord(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function getText(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback;
}

function getBoolean(value: unknown, fallback = false) {
    return typeof value === "boolean" ? value : fallback;
}

function normalizeSurveyQuestions(value: unknown): SurveyQuestion[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item, index) => {
            if (!isRecord(item)) return null;

            const question = getText(
                item.question ?? item.text ?? item.label,
            ).trim();

            if (!question) return null;

            return {
                id: String(item.id ?? index + 1),
                question,
                required: getBoolean(item.required),
            };
        })
        .filter(
            (question): question is SurveyQuestion =>
                Boolean(question),
        );
}

function getLikertValue(answer: string) {
    const match = answer.trim().match(/^(\d+)/);

    return match?.[1] ?? "";
}

function getLikertMeta(answer: string): LikertMeta {
    const value = getLikertValue(answer);

    if (value === "1") {
        return {
            emoji: "😠",
            label: "Muy en desacuerdo",
            className: "bg-rose-50 text-rose-700 ring-rose-100",
        };
    }

    if (value === "2") {
        return {
            emoji: "🙁",
            label: "En desacuerdo",
            className:
                "bg-orange-50 text-orange-700 ring-orange-100",
        };
    }

    if (value === "3") {
        return {
            emoji: "😐",
            label: "Neutral",
            className: "bg-amber-50 text-amber-700 ring-amber-100",
        };
    }

    if (value === "4") {
        return {
            emoji: "🙂",
            label: "De acuerdo",
            className: "bg-lime-50 text-lime-700 ring-lime-100",
        };
    }

    if (value === "5") {
        return {
            emoji: "😄",
            label: "Muy de acuerdo",
            className:
                "bg-emerald-50 text-emerald-700 ring-emerald-100",
        };
    }

    return {
        emoji: "—",
        label: "Sin respuesta",
        className: "bg-slate-100 text-slate-500 ring-slate-200",
    };
}

function getAnswers(row: ReviewStudentRow) {
    if (!row.hasSubmission) return {};

    const record = getResponseRecord(row.raw);
    const response = parseRecord(record.response);

    return parseRecord(response.answers);
}

function getSubmittedDate(row: ReviewStudentRow) {
    if (!row.hasSubmission) return "—";

    const record = getResponseRecord(row.raw);
    const response = parseRecord(record.response);

    const value =
        response.submitted_at ??
        response.submittedAt ??
        row.submittedAt ??
        row.updatedAt ??
        record.created_at;

    return typeof value === "string" && value.trim()
        ? formatDate(value)
        : "Sin fecha";
}

function AnswerBadge({ answer }: { answer: string }) {
    const meta = getLikertMeta(answer);

    return (
        <span
            className={`inline-flex min-w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${meta.className}`}
        >
            <span className="text-base leading-none sm:text-lg">{meta.emoji}</span>
            {meta.label}
        </span>
    );
}

export function SurveyReviewPanel({
    rows,
}: SurveyReviewPanelProps) {
    const submittedRows = rows.filter((row) => row.hasSubmission);

    const firstSubmittedRow = submittedRows[0] ?? null;

    const firstRecord = firstSubmittedRow
        ? getResponseRecord(firstSubmittedRow.raw)
        : {};

    const survey = parseRecord(firstRecord.survey);

    const questions = normalizeSurveyQuestions(
        survey.questions ??
        survey.survey_questions ??
        survey.preguntas ??
        survey.items,
    );

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs font-bold leading-5 text-slate-500 sm:rounded-2xl sm:p-8 sm:text-sm">
                No existen estudiantes matriculados para esta encuesta.
            </div>
        );
    }

    if (submittedRows.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-2xl sm:p-8">
                <Clock3 className="mx-auto h-8 w-8 text-slate-400 sm:h-9 sm:w-9" />

                <p className="mt-3 text-xs font-black leading-5 text-slate-700 sm:text-sm">
                    Todavía no existen respuestas registradas.
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                    Las respuestas aparecerán cuando los estudiantes
                    completen la encuesta.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#172861] shadow-sm sm:h-11 sm:w-11">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-sm font-black text-slate-950 sm:text-base">
                                Vista general de respuestas
                            </h2>

                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                Revisa las respuestas registradas por cada
                                estudiante.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-100 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
                            <Users className="h-4 w-4" />
                            {submittedRows.length} de {rows.length} respondieron
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-100 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
                            <ClipboardList className="h-4 w-4" />
                            {questions.length} pregunta
                            {questions.length === 1 ? "" : "s"}
                        </span>
                    </div>
                </div>
            </div>

            {questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800 sm:rounded-2xl sm:p-6 sm:text-sm">
                    Existen respuestas registradas, pero no se pudieron
                    recuperar las preguntas de la encuesta.
                </div>
            ) : (
                <>
                    <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block sm:rounded-2xl">
                        <table className="w-full min-w-[900px] border-collapse text-left">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className="sticky left-0 z-10 min-w-[210px] bg-slate-50 px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 lg:px-4 lg:py-4 lg:text-xs lg:tracking-[0.12em]">
                                        Estudiante
                                    </th>

                                    <th className="min-w-[120px] px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 lg:px-4 lg:py-4 lg:text-xs lg:tracking-[0.12em]">
                                        Estado
                                    </th>

                                    {questions.map((question, index) => (
                                        <th
                                            key={question.id}
                                            className="min-w-[190px] px-3 py-3 align-top lg:px-4 lg:py-4"
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 lg:text-xs lg:tracking-[0.12em]">
                                                Pregunta {index + 1}
                                            </p>

                                            <p
                                                title={question.question}
                                                className="mt-1 line-clamp-2 text-[10px] font-bold leading-4 text-slate-600 lg:text-xs lg:leading-5"
                                            >
                                                {question.question}
                                            </p>
                                        </th>
                                    ))}

                                    <th className="min-w-[150px] px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 lg:px-4 lg:py-4 lg:text-xs lg:tracking-[0.12em]">
                                        Fecha de envío
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => {
                                    const answers = getAnswers(row);

                                    return (
                                        <tr
                                            key={row.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="sticky left-0 z-10 bg-white px-3 py-3 lg:px-4 lg:py-4">
                                                <p className="break-words text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere] lg:text-sm">
                                                    {row.studentName}
                                                </p>

                                                {row.studentEmail ? (
                                                    <p className="mt-1 break-words text-[10px] font-semibold leading-4 text-slate-500 [overflow-wrap:anywhere] lg:text-xs">
                                                        {row.studentEmail}
                                                    </p>
                                                ) : null}
                                            </td>

                                            <td className="px-3 py-3 lg:px-4 lg:py-4">
                                                {row.hasSubmission ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100 lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-xs">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Respondida
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200 lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-xs">
                                                        <Clock3 className="h-3.5 w-3.5" />
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>

                                            {questions.map((question) => (
                                                <td
                                                    key={`${row.id}-${question.id}`}
                                                    className="px-3 py-3 lg:px-4 lg:py-4"
                                                >
                                                    <AnswerBadge
                                                        answer={getText(
                                                            answers[
                                                            question.id
                                                            ],
                                                        )}
                                                    />
                                                </td>
                                            ))}

                                            <td className="px-3 py-3 text-[10px] font-bold text-slate-500 lg:px-4 lg:py-4 lg:text-xs">
                                                {getSubmittedDate(row)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-2.5 md:hidden">
                        {rows.map((row) => {
                            const answers = getAnswers(row);

                            return (
                                <article
                                    key={row.id}
                                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4"
                                >
                                    <div className="flex min-w-0 flex-col gap-2 xs:flex-row xs:items-start xs:justify-between xs:gap-3">
                                        <div>
                                            <p className="break-words text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere] lg:text-sm">
                                                {row.studentName}
                                            </p>

                                            <p className="mt-1 break-words text-[10px] font-semibold leading-4 text-slate-500 [overflow-wrap:anywhere] lg:text-xs">
                                                {getSubmittedDate(row)}
                                            </p>
                                        </div>

                                        {row.hasSubmission ? (
                                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100 sm:text-[11px]">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Respondida
                                            </span>
                                        ) : (
                                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200 sm:text-[11px]">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                Pendiente
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 sm:mt-4 sm:space-y-3 sm:pt-4">
                                        {questions.map(
                                            (question, index) => (
                                                <div
                                                    key={`${row.id}-${question.id}`}
                                                    className="flex flex-col gap-2"
                                                >
                                                    <p className="break-words text-[11px] font-black leading-5 text-slate-600 [overflow-wrap:anywhere] sm:text-xs">
                                                        {index + 1}.{" "}
                                                        {question.question}
                                                    </p>

                                                    <div>
                                                        <AnswerBadge
                                                            answer={getText(
                                                                answers[
                                                                question
                                                                    .id
                                                                ],
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export default SurveyReviewPanel;