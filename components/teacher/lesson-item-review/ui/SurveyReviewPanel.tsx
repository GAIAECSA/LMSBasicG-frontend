import {
    CheckCircle2,
    ClipboardList,
    Clock3,
    Users,
} from "lucide-react";

import type { ReviewStudentRow } from "../types";

import {
    formatDate,
    getResponseRecord,
} from "../utils";

type SurveyReviewPanelProps = {
    rows: ReviewStudentRow[];
};

type UnknownRecord = Record<string, unknown>;

type SurveyQuestionKind =
    | "likert"
    | "text";

type SurveyQuestion = {
    id: string;
    question: string;
    required: boolean;
    kind: SurveyQuestionKind;
};

type LikertMeta = {
    value: string;
    emoji: string;
    label: string;
    className: string;
};

/* =========================================================
   HELPERS
========================================================= */

function isRecord(
    value: unknown,
): value is UnknownRecord {
    return (
        Boolean(value) &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function parseRecord(
    value: unknown,
): UnknownRecord {
    if (isRecord(value)) {
        return value;
    }

    if (
        typeof value !== "string" ||
        value.trim() === ""
    ) {
        return {};
    }

    try {
        const parsed: unknown =
            JSON.parse(value);

        return isRecord(parsed)
            ? parsed
            : {};
    } catch {
        return {};
    }
}

function getText(
    value: unknown,
    fallback = "",
) {
    if (typeof value === "string") {
        return value;
    }

    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return String(value);
    }

    return fallback;
}

function getBoolean(
    value: unknown,
    fallback = false,
) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalized =
            value.trim().toLowerCase();

        if (
            [
                "true",
                "1",
                "yes",
                "si",
                "sí",
            ].includes(normalized)
        ) {
            return true;
        }

        if (
            [
                "false",
                "0",
                "no",
            ].includes(normalized)
        ) {
            return false;
        }
    }

    return fallback;
}

/* =========================================================
   TIPO DE PREGUNTA
========================================================= */

function getSurveyQuestionKind(
    item: UnknownRecord,
): SurveyQuestionKind {
    const rawType = getText(
        item.type,
    )
        .trim()
        .toLowerCase();

    const rawScale = getText(
        item.scale,
    )
        .trim()
        .toLowerCase();

    /*
     * Pregunta abierta
     */
    if (
        rawType === "text" ||
        rawType === "textarea" ||
        rawType === "open"
    ) {
        return "text";
    }

    /*
     * Escala Likert
     */
    if (
        rawType === "single" ||
        rawType === "likert" ||
        rawScale === "likert"
    ) {
        return "likert";
    }

    /*
     * Compatibilidad con encuestas antiguas:
     * si tiene opciones, la tratamos como Likert.
     */
    if (
        Array.isArray(item.options) &&
        item.options.length > 0
    ) {
        return "likert";
    }

    /*
     * Sin opciones = pregunta abierta.
     */
    return "text";
}

/* =========================================================
   NORMALIZAR PREGUNTAS
========================================================= */

function normalizeSurveyQuestions(
    value: unknown,
): SurveyQuestion[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item, index) => {
            if (!isRecord(item)) {
                return null;
            }

            const question =
                getText(
                    item.question ??
                    item.text ??
                    item.label,
                ).trim();

            if (!question) {
                return null;
            }

            return {
                id: String(
                    item.id ??
                    index + 1,
                ),

                question,

                required:
                    getBoolean(
                        item.required,
                        true,
                    ),

                kind:
                    getSurveyQuestionKind(
                        item,
                    ),
            } as SurveyQuestion;
        })
        .filter(
            (
                question,
            ): question is SurveyQuestion =>
                Boolean(question),
        );
}

/* =========================================================
   LIKERT
========================================================= */

function getLikertValue(
    answer: string,
) {
    const cleanAnswer =
        answer.trim();

    /*
     * Ejemplos soportados:
     *
     * 1
     * 1 - Muy en desacuerdo
     * 2 - En desacuerdo
     */
    const match =
        cleanAnswer.match(
            /^([1-5])/,
        );

    return match?.[1] ?? "";
}

function getLikertMeta(
    answer: string,
): LikertMeta {
    const value =
        getLikertValue(answer);

    if (value === "1") {
        return {
            value: "1",
            emoji: "😠",
            label:
                "Muy en desacuerdo",
            className:
                "bg-rose-50 text-rose-700 ring-rose-100",
        };
    }

    if (value === "2") {
        return {
            value: "2",
            emoji: "🙁",
            label:
                "En desacuerdo",
            className:
                "bg-orange-50 text-orange-700 ring-orange-100",
        };
    }

    if (value === "3") {
        return {
            value: "3",
            emoji: "😐",
            label:
                "Ni de acuerdo ni en desacuerdo",
            className:
                "bg-amber-50 text-amber-700 ring-amber-100",
        };
    }

    if (value === "4") {
        return {
            value: "4",
            emoji: "🙂",
            label:
                "De acuerdo",
            className:
                "bg-lime-50 text-lime-700 ring-lime-100",
        };
    }

    if (value === "5") {
        return {
            value: "5",
            emoji: "😄",
            label:
                "Muy de acuerdo",
            className:
                "bg-emerald-50 text-emerald-700 ring-emerald-100",
        };
    }

    return {
        value: "",
        emoji: "—",
        label:
            "Sin respuesta",
        className:
            "bg-slate-100 text-slate-500 ring-slate-200",
    };
}

/* =========================================================
   OBTENER RESPUESTAS
========================================================= */

function hasValues(
    record: UnknownRecord,
) {
    return (
        Object.keys(record)
            .length > 0
    );
}

function getAnswers(
    row: ReviewStudentRow,
): UnknownRecord {
    if (!row.hasSubmission) {
        return {};
    }

    const record =
        getResponseRecord(
            row.raw,
        );

    /*
     * Caso normal:
     *
     * response: {
     *     answers: {
     *         "1": "...",
     *         "2": "..."
     *     }
     * }
     */
    const response =
        parseRecord(
            record.response,
        );

    const nestedAnswers =
        parseRecord(
            response.answers,
        );

    if (
        hasValues(
            nestedAnswers,
        )
    ) {
        return nestedAnswers;
    }

    /*
     * Compatibilidad si el API retorna:
     *
     * answers: {...}
     */
    const directAnswers =
        parseRecord(
            record.answers,
        );

    if (
        hasValues(
            directAnswers,
        )
    ) {
        return directAnswers;
    }

    /*
     * Compatibilidad por si response
     * directamente contiene:
     *
     * {
     *   "1": "...",
     *   "2": "..."
     * }
     */
    const responseKeys =
        Object.keys(
            response,
        );

    const looksLikeAnswers =
        responseKeys.some(
            (key) =>
                /^\d+$/.test(
                    key,
                ),
        );

    if (
        looksLikeAnswers
    ) {
        return response;
    }

    return {};
}

/* =========================================================
   FECHA
========================================================= */

function getSubmittedDate(
    row: ReviewStudentRow,
) {
    if (!row.hasSubmission) {
        return "—";
    }

    const record =
        getResponseRecord(
            row.raw,
        );

    const response =
        parseRecord(
            record.response,
        );

    const value =
        response.submitted_at ??
        response.submittedAt ??
        record.submitted_at ??
        record.submittedAt ??
        row.submittedAt ??
        row.updatedAt ??
        record.created_at ??
        record.updated_at;

    return (
        typeof value === "string" &&
        value.trim()
    )
        ? formatDate(value)
        : "Sin fecha";
}

/* =========================================================
   RESPUESTA LIKERT
========================================================= */

function LikertAnswer({
    answer,
}: {
    answer: string;
}) {
    const meta =
        getLikertMeta(
            answer,
        );

    return (
        <span
            className={`inline-flex min-w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${meta.className}`}
        >
            <span className="text-base leading-none sm:text-lg">
                {meta.emoji}
            </span>

            {meta.value ? (
                <span className="font-black">
                    {meta.value}
                </span>
            ) : null}

            <span>
                {meta.label}
            </span>
        </span>
    );
}

/* =========================================================
   RESPUESTA ABIERTA
========================================================= */

function OpenAnswer({
    answer,
}: {
    answer: string;
}) {
    const cleanAnswer =
        answer.trim();

    if (!cleanAnswer) {
        return (
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200 sm:px-3 sm:py-1.5 sm:text-xs">
                Sin respuesta
            </span>
        );
    }

    return (
        <div className="min-w-[220px] max-w-[420px] whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 sm:text-sm sm:leading-6">
            {cleanAnswer}
        </div>
    );
}

/* =========================================================
   RESPUESTA SEGÚN TIPO
========================================================= */

function QuestionAnswer({
    question,
    answer,
}: {
    question: SurveyQuestion;
    answer: unknown;
}) {
    const cleanAnswer =
        getText(
            answer,
        ).trim();

    if (
        question.kind ===
        "text"
    ) {
        return (
            <OpenAnswer
                answer={
                    cleanAnswer
                }
            />
        );
    }

    return (
        <LikertAnswer
            answer={
                cleanAnswer
            }
        />
    );
}

/* =========================================================
   COMPONENTE
========================================================= */

export function SurveyReviewPanel({
    rows,
}: SurveyReviewPanelProps) {
    const submittedRows =
        rows.filter(
            (row) =>
                row.hasSubmission,
        );

    const firstSubmittedRow =
        submittedRows[0] ??
        null;

    const firstRecord =
        firstSubmittedRow
            ? getResponseRecord(
                firstSubmittedRow.raw,
            )
            : {};

    /*
     * El payload de la encuesta guarda también
     * la configuración de la encuesta en survey.
     */
    const survey =
        parseRecord(
            firstRecord.survey,
        );

    const questions =
        normalizeSurveyQuestions(
            survey.questions ??
            survey.survey_questions ??
            survey.preguntas ??
            survey.items,
        );

    const likertQuestions =
        questions.filter(
            (question) =>
                question.kind ===
                "likert",
        ).length;

    const openQuestions =
        questions.filter(
            (question) =>
                question.kind ===
                "text",
        ).length;

    /* =====================================================
       SIN ESTUDIANTES
    ===================================================== */

    if (
        rows.length === 0
    ) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs font-bold leading-5 text-slate-500 sm:rounded-2xl sm:p-8 sm:text-sm">
                No existen estudiantes
                matriculados para esta
                encuesta.
            </div>
        );
    }

    /* =====================================================
       SIN RESPUESTAS
    ===================================================== */

    if (
        submittedRows.length ===
        0
    ) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:rounded-2xl sm:p-8">
                <Clock3 className="mx-auto h-8 w-8 text-slate-400 sm:h-9 sm:w-9" />

                <p className="mt-3 text-xs font-black leading-5 text-slate-700 sm:text-sm">
                    Todavía no existen
                    respuestas registradas.
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                    Las respuestas aparecerán
                    cuando los estudiantes
                    completen la encuesta.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* =========================================
                RESUMEN
            ========================================== */}

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#172861] shadow-sm sm:h-11 sm:w-11">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-sm font-black text-slate-950 sm:text-base">
                                Vista general
                                de respuestas
                            </h2>

                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                Respuestas Likert
                                y respuestas
                                abiertas por
                                estudiante.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-100 sm:px-3 sm:py-2 sm:text-xs">
                            <Users className="h-4 w-4" />

                            {
                                submittedRows.length
                            }{" "}
                            de{" "}
                            {
                                rows.length
                            }{" "}
                            respondieron
                        </span>

                        <span className="inline-flex rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black text-violet-700 ring-1 ring-violet-100 sm:px-3 sm:py-2 sm:text-xs">
                            {likertQuestions}{" "}
                            Likert
                        </span>

                        <span className="inline-flex rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black text-cyan-700 ring-1 ring-cyan-100 sm:px-3 sm:py-2 sm:text-xs">
                            {openQuestions}{" "}
                            abiertas
                        </span>
                    </div>
                </div>
            </div>

            {/* =========================================
                SIN PREGUNTAS
            ========================================== */}

            {questions.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800 sm:rounded-2xl sm:p-6 sm:text-sm">
                    Existen respuestas
                    registradas, pero no se
                    pudieron recuperar las
                    preguntas de la encuesta.
                </div>
            ) : (
                <>
                    {/* =================================
                        DESKTOP
                    ================================== */}

                    <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block sm:rounded-2xl">
                        <table className="w-full min-w-[900px] border-collapse text-left">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className="sticky left-0 z-10 min-w-[210px] bg-slate-50 px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 lg:px-4 lg:py-4 lg:text-xs">
                                        Estudiante
                                    </th>

                                    <th className="min-w-[120px] px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 lg:px-4 lg:py-4 lg:text-xs">
                                        Estado
                                    </th>

                                    {questions.map(
                                        (
                                            question,
                                            index,
                                        ) => (
                                            <th
                                                key={
                                                    question.id
                                                }
                                                className={
                                                    question.kind ===
                                                        "text"
                                                        ? "min-w-[320px] px-3 py-3 align-top lg:px-4 lg:py-4"
                                                        : "min-w-[230px] px-3 py-3 align-top lg:px-4 lg:py-4"
                                                }
                                            >
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 lg:text-xs">
                                                        Pregunta{" "}
                                                        {index +
                                                            1}
                                                    </p>

                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ring-1 ${question.kind ===
                                                                "text"
                                                                ? "bg-cyan-50 text-cyan-700 ring-cyan-100"
                                                                : "bg-violet-50 text-violet-700 ring-violet-100"
                                                            }`}
                                                    >
                                                        {question.kind ===
                                                            "text"
                                                            ? "Abierta"
                                                            : "Likert"}
                                                    </span>
                                                </div>

                                                <p
                                                    title={
                                                        question.question
                                                    }
                                                    className="mt-1 text-[10px] font-bold leading-4 text-slate-600 lg:text-xs lg:leading-5"
                                                >
                                                    {
                                                        question.question
                                                    }
                                                </p>
                                            </th>
                                        ),
                                    )}

                                    <th className="min-w-[150px] px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 lg:px-4 lg:py-4 lg:text-xs">
                                        Fecha de envío
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {rows.map(
                                    (
                                        row,
                                    ) => {
                                        const answers =
                                            getAnswers(
                                                row,
                                            );

                                        return (
                                            <tr
                                                key={
                                                    row.id
                                                }
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="sticky left-0 z-10 bg-white px-3 py-3 lg:px-4 lg:py-4">
                                                    <p className="break-words text-xs font-black leading-5 text-slate-950 lg:text-sm">
                                                        {
                                                            row.studentName
                                                        }
                                                    </p>

                                                    {row.studentEmail ? (
                                                        <p className="mt-1 break-words text-[10px] font-semibold text-slate-500 lg:text-xs">
                                                            {
                                                                row.studentEmail
                                                            }
                                                        </p>
                                                    ) : null}
                                                </td>

                                                <td className="px-3 py-3 lg:px-4 lg:py-4">
                                                    {row.hasSubmission ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100 lg:text-xs">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Respondida
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200 lg:text-xs">
                                                            <Clock3 className="h-3.5 w-3.5" />
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </td>

                                                {questions.map(
                                                    (
                                                        question,
                                                    ) => (
                                                        <td
                                                            key={`${row.id}-${question.id}`}
                                                            className="px-3 py-3 align-top lg:px-4 lg:py-4"
                                                        >
                                                            <QuestionAnswer
                                                                question={
                                                                    question
                                                                }
                                                                answer={
                                                                    answers[
                                                                    question
                                                                        .id
                                                                    ]
                                                                }
                                                            />
                                                        </td>
                                                    ),
                                                )}

                                                <td className="px-3 py-3 text-[10px] font-bold text-slate-500 lg:px-4 lg:py-4 lg:text-xs">
                                                    {getSubmittedDate(
                                                        row,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* =================================
                        MOBILE
                    ================================== */}

                    <div className="space-y-2.5 md:hidden">
                        {rows.map(
                            (row) => {
                                const answers =
                                    getAnswers(
                                        row,
                                    );

                                return (
                                    <article
                                        key={
                                            row.id
                                        }
                                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="break-words text-xs font-black text-slate-950 sm:text-sm">
                                                    {
                                                        row.studentName
                                                    }
                                                </p>

                                                <p className="mt-1 text-[10px] font-semibold text-slate-500 sm:text-xs">
                                                    {getSubmittedDate(
                                                        row,
                                                    )}
                                                </p>
                                            </div>

                                            {row.hasSubmission ? (
                                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Respondida
                                                </span>
                                            ) : (
                                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    Pendiente
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                                            {questions.map(
                                                (
                                                    question,
                                                    index,
                                                ) => (
                                                    <div
                                                        key={`${row.id}-${question.id}`}
                                                        className="rounded-xl bg-slate-50 p-3"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <p className="text-[11px] font-black leading-5 text-slate-700 sm:text-xs">
                                                                {index +
                                                                    1}
                                                                .{" "}
                                                                {
                                                                    question.question
                                                                }
                                                            </p>

                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ring-1 ${question.kind ===
                                                                        "text"
                                                                        ? "bg-cyan-50 text-cyan-700 ring-cyan-100"
                                                                        : "bg-violet-50 text-violet-700 ring-violet-100"
                                                                    }`}
                                                            >
                                                                {question.kind ===
                                                                    "text"
                                                                    ? "Abierta"
                                                                    : "Likert"}
                                                            </span>
                                                        </div>

                                                        <div className="mt-2">
                                                            <QuestionAnswer
                                                                question={
                                                                    question
                                                                }
                                                                answer={
                                                                    answers[
                                                                    question
                                                                        .id
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </article>
                                );
                            },
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default SurveyReviewPanel;