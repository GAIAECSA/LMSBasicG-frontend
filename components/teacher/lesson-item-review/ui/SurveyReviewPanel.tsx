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
            className={`inline-flex min-w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${meta.className}`}
        >
            <span className="text-lg leading-none">{meta.emoji}</span>
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                No existen estudiantes matriculados para esta encuesta.
            </div>
        );
    }

    if (submittedRows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Clock3 className="mx-auto h-9 w-9 text-slate-400" />

                <p className="mt-3 text-sm font-black text-slate-700">
                    Todavía no existen respuestas registradas.
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                    Las respuestas aparecerán cuando los estudiantes
                    completen la encuesta.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#172861] shadow-sm">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-black text-slate-950">
                                Vista general de respuestas
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Revisa las respuestas registradas por cada
                                estudiante.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                            <Users className="h-4 w-4" />
                            {submittedRows.length} de {rows.length} respondieron
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                            <ClipboardList className="h-4 w-4" />
                            {questions.length} pregunta
                            {questions.length === 1 ? "" : "s"}
                        </span>
                    </div>
                </div>
            </div>

            {questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm font-bold text-amber-800">
                    Existen respuestas registradas, pero no se pudieron
                    recuperar las preguntas de la encuesta.
                </div>
            ) : (
                <>
                    <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
                        <table className="min-w-[980px] w-full border-collapse text-left">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className="sticky left-0 z-10 min-w-[230px] bg-slate-50 px-4 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Estudiante
                                    </th>

                                    <th className="min-w-[130px] px-4 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Estado
                                    </th>

                                    {questions.map((question, index) => (
                                        <th
                                            key={question.id}
                                            className="min-w-[210px] px-4 py-4 align-top"
                                        >
                                            <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                                                Pregunta {index + 1}
                                            </p>

                                            <p
                                                title={question.question}
                                                className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600"
                                            >
                                                {question.question}
                                            </p>
                                        </th>
                                    ))}

                                    <th className="min-w-[170px] px-4 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                                            <td className="sticky left-0 z-10 bg-white px-4 py-4">
                                                <p className="text-sm font-black text-slate-950">
                                                    {row.studentName}
                                                </p>

                                                {row.studentEmail ? (
                                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                                        {row.studentEmail}
                                                    </p>
                                                ) : null}
                                            </td>

                                            <td className="px-4 py-4">
                                                {row.hasSubmission ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Respondida
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                                                        <Clock3 className="h-3.5 w-3.5" />
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>

                                            {questions.map((question) => (
                                                <td
                                                    key={`${row.id}-${question.id}`}
                                                    className="px-4 py-4"
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

                                            <td className="px-4 py-4 text-xs font-bold text-slate-500">
                                                {getSubmittedDate(row)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 md:hidden">
                        {rows.map((row) => {
                            const answers = getAnswers(row);

                            return (
                                <article
                                    key={row.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-black text-slate-950">
                                                {row.studentName}
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                                {getSubmittedDate(row)}
                                            </p>
                                        </div>

                                        {row.hasSubmission ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Respondida
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                Pendiente
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                                        {questions.map(
                                            (question, index) => (
                                                <div
                                                    key={`${row.id}-${question.id}`}
                                                    className="flex flex-col gap-2"
                                                >
                                                    <p className="text-xs font-black text-slate-600">
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