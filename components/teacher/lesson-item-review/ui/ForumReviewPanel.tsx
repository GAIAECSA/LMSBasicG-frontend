import { CalendarClock, MessageSquareText, Trash2 } from "lucide-react";
import type { ReviewStudentRow } from "../types";
import { getResponseRecord, readString } from "../utils";

type ForumReviewPanelProps = {
    row: ReviewStudentRow | null;
    deletingId?: number | string | null;
    onDeleteParticipation?: (participationId: number | string) => void;
};

type AnyRecord = Record<string, unknown>;

type ForumParticipation = {
    id: number | string | null;
    comment: string;
    createdAt: string;
    raw: unknown;
};

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AnyRecord;
}

function toArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function readId(value: unknown): number | string | null {
    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    return null;
}

function getPossibleParticipations(row: ReviewStudentRow): unknown[] {
    const rowRecord = toRecord(row);
    const rawRecord = toRecord(row.raw);

    const possibleLists = [
        rawRecord?.forumResponses,
        rawRecord?.forum_responses,
        rawRecord?.participations,
        rawRecord?.responses,
        rawRecord?.submissions,
        rawRecord?.items,
        rowRecord?.forumResponses,
        rowRecord?.forum_responses,
        rowRecord?.participations,
        rowRecord?.responses,
        rowRecord?.submissions,
    ];

    const foundList = possibleLists.find(
        (value) => Array.isArray(value) && value.length > 0,
    );

    if (Array.isArray(foundList)) {
        return toArray(foundList);
    }

    return row.raw ? [row.raw] : [];
}

function getParticipationComment(value: unknown) {
    const record = getResponseRecord(value);

    return (
        readString(record.comment) ||
        readString(record.response) ||
        readString(record.content) ||
        readString(record.message) ||
        readString(record.answer) ||
        "Sin comentario."
    );
}

function getParticipationDate(value: unknown) {
    const record = getResponseRecord(value);

    return (
        readString(record.created_at) ||
        readString(record.createdAt) ||
        readString(record.updated_at) ||
        readString(record.updatedAt) ||
        readString(record.submitted_at) ||
        readString(record.submittedAt) ||
        ""
    );
}

function getParticipationId(value: unknown) {
    const record = getResponseRecord(value);

    return (
        readId(record.id) ??
        readId(record.forum_response_id) ??
        readId(record.forumResponseId) ??
        readId(record.response_id) ??
        readId(record.responseId)
    );
}

function formatForumDate(value: string) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function extractForumParticipations(row: ReviewStudentRow): ForumParticipation[] {
    return getPossibleParticipations(row)
        .map((item) => ({
            id: getParticipationId(item),
            comment: getParticipationComment(item),
            createdAt: getParticipationDate(item),
            raw: item,
        }))
        .filter((item) => item.comment.trim().length > 0);
}

export function ForumReviewPanel({
    row,
    deletingId = null,
    onDeleteParticipation,
}: ForumReviewPanelProps) {
    if (!row) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                Selecciona un estudiante.
            </div>
        );
    }

    if (!row.hasSubmission) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-black text-slate-700">
                El estudiante aún no ha participado en el foro.
            </div>
        );
    }

    const participations = extractForumParticipations(row);

    if (participations.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-black text-slate-700">
                No se encontraron participaciones para este estudiante.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                        <MessageSquareText className="h-6 w-6" />
                    </div>

                    <div>
                        <p className="text-sm font-black text-slate-950">
                            Participaciones en foro
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            {participations.length} participación
                            {participations.length === 1 ? "" : "es"} registrada
                            {participations.length === 1 ? "" : "s"} por este
                            estudiante.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {participations.map((participation, index) => {
                    const isDeleting =
                        participation.id !== null &&
                        String(deletingId) === String(participation.id);

                    return (
                        <article
                            key={`${participation.id ?? index}-${participation.createdAt || index
                                }`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                        Participación #{index + 1}
                                    </p>

                                    <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <CalendarClock className="h-3.5 w-3.5" />
                                        {formatForumDate(
                                            participation.createdAt,
                                        )}
                                    </div>
                                </div>

                                {participation.id !== null && onDeleteParticipation ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (participation.id === null) return;

                                            onDeleteParticipation(participation.id);
                                        }}
                                        disabled={isDeleting}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {isDeleting ? "Eliminando..." : "Eliminar"}
                                    </button>
                                ) : null}
                            </div>

                            <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                                <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                                    {participation.comment}
                                </p>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default ForumReviewPanel;