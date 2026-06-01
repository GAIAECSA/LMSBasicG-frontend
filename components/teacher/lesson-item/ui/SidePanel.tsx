"use client";

import Link from "next/link";
import { ClipboardCheck, Eye, RefreshCw, Users } from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { LessonItemState } from "../hook";
import {
    formatDate,
    getActivityResponseStudent,
    getActivityResponseText,
} from "../utils";

type SidePanelProps = {
    item: LessonItemState;
    block: LessonBlock;
    reviewHref: string;
};

type ResponsesPanelProps = {
    item: LessonItemState;
    block: LessonBlock;
};

type AnyRecord = Record<string, unknown>;

type ActivityResponse = LessonItemState["activityResponses"][number];

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AnyRecord;
}

function readText(value: unknown) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);

    return "";
}

function getResponseKey(response: ActivityResponse, index: number) {
    const record = toRecord(response);

    if (!record) return `response-${index}`;

    const id = readText(record.id);
    const createdAt = readText(record.created_at);

    return `${id || index}-${createdAt || index}`;
}

function getResponseEnrollment(response: ActivityResponse) {
    const record = toRecord(response);

    if (!record) return "N/D";

    const enrollment = toRecord(record.enrollment);

    return (
        readText(enrollment?.id) ||
        readText(record.enrollment_id) ||
        readText(record.enrollmentId) ||
        "N/D"
    );
}

function getResponseDate(response: ActivityResponse) {
    const record = toRecord(response);

    if (!record) return "Sin fecha";

    const dateValue = readText(record.updated_at) || readText(record.created_at);

    return formatDate(dateValue || null);
}

function getResponseNumber(response: ActivityResponse, index: number) {
    const record = toRecord(response);

    if (!record) return index + 1;

    return readText(record.id) || index + 1;
}

function getReviewDescription(itemType: LessonItemState["itemType"]) {
    if (itemType === "forum") {
        return "Revisa la participación de los estudiantes en el foro.";
    }

    if (itemType === "survey") {
        return "Revisa las respuestas enviadas por los estudiantes.";
    }

    if (itemType === "quiz") {
        return "Revisa los intentos y respuestas de los estudiantes.";
    }

    if (itemType === "homework") {
        return "Revisa las entregas enviadas por los estudiantes.";
    }

    return "Revisa la información registrada por los estudiantes.";
}

function getReviewButtonLabel(itemType: LessonItemState["itemType"]) {
    if (itemType === "forum") return "Ver participación";
    if (itemType === "survey") return "Ver respuestas";
    if (itemType === "homework") return "Ver entregas";
    if (itemType === "quiz") return "Ver revisión";

    return "Ver revisión";
}

function ResponsesPanel({ item, block }: ResponsesPanelProps) {
    if (item.itemType === "forum") return null;
    if (!item.canShowResponsePanel) return null;

    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Users className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-lg font-black text-slate-950">
                        Respuestas recibidas
                    </h2>

                    <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                        Respuestas enviadas por estudiantes en esta actividad.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void item.loadActivityResponses(block)}
                    disabled={item.loadingResponses}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Actualizar respuestas"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${item.loadingResponses ? "animate-spin" : ""
                            }`}
                    />
                </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Total
                </p>

                <p className="mt-1 text-2xl font-black text-slate-950">
                    {item.activityResponses.length}
                </p>
            </div>

            {item.loadingResponses ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                    Cargando respuestas...
                </div>
            ) : item.activityResponses.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                    Todavía no existen respuestas para este bloque.
                </div>
            ) : (
                <div className="mt-4 max-h-[440px] space-y-3 overflow-y-auto pr-1">
                    {item.activityResponses.map((response, index) => (
                        <article
                            key={getResponseKey(response, index)}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-950">
                                        {getActivityResponseStudent(response)}
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        Matrícula #
                                        {getResponseEnrollment(response)}
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
                                    #{getResponseNumber(response, index)}
                                </span>
                            </div>

                            <p className="mt-3 line-clamp-5 whitespace-pre-line text-xs font-semibold leading-5 text-slate-600">
                                {getActivityResponseText(response) ||
                                    "Sin contenido."}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-400">
                                    {getResponseDate(response)}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        window.alert(
                                            getActivityResponseText(response) ||
                                            "Sin contenido.",
                                        )
                                    }
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 text-[11px] font-black text-slate-700 transition hover:bg-slate-200"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Ver
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export function SidePanel({ item, block, reviewHref }: SidePanelProps) {
    return (
        <aside className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <ClipboardCheck className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-lg font-black text-slate-950">
                    Revisión
                </h2>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {getReviewDescription(item.itemType)}
                </p>

                <Link
                    href={reviewHref}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black !text-white shadow-sm transition hover:bg-[#0f1d48]"
                >
                    <ClipboardCheck className="h-4 w-4" />
                    {getReviewButtonLabel(item.itemType)}
                </Link>
            </div>

            {item.itemType !== "survey" ? (
                <ResponsesPanel item={item} block={block} />
            ) : null}
        </aside>
    );
}

export default SidePanel;