import { Eye, RefreshCw, Users } from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { LessonItemState } from "../hook";
import {
    formatDate,
    getActivityResponseStudent,
    getActivityResponseText,
} from "../utils";

type ResponsesPanelProps = {
    item: LessonItemState;
    block: LessonBlock;
};

export function ResponsesPanel({ item, block }: ResponsesPanelProps) {
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

                    <p className="mt-1 text-sm text-slate-500">
                        {item.itemType === "survey"
                            ? "Respuestas enviadas por estudiantes en esta encuesta."
                            : "Participaciones enviadas por estudiantes en este foro."}
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
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
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
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                    Todavía no existen respuestas para este bloque.
                </div>
            ) : (
                <div className="mt-4 max-h-[440px] space-y-3 overflow-y-auto pr-1">
                    {item.activityResponses.map((response, index) => (
                        <article
                            key={`${response.id ?? index}-${response.created_at ?? index
                                }`}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-950">
                                        {getActivityResponseStudent(response)}
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        Matrícula #
                                        {response.enrollment?.id ??
                                            response.enrollment_id ??
                                            response.enrollmentId ??
                                            "N/D"}
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
                                    #{response.id ?? index + 1}
                                </span>
                            </div>

                            <p className="mt-3 line-clamp-5 whitespace-pre-line text-xs font-semibold leading-5 text-slate-600">
                                {getActivityResponseText(response)}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-400">
                                    {formatDate(
                                        response.updated_at ??
                                        response.created_at,
                                    )}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        window.alert(
                                            getActivityResponseText(response),
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