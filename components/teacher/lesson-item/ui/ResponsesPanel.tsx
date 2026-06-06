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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 [@media(max-height:760px)]:p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-12 sm:w-12 sm:rounded-2xl">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <h2 className="mt-3 text-base font-black text-slate-950 sm:mt-4 sm:text-lg">
                        Respuestas recibidas
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        {item.itemType === "survey"
                            ? "Respuestas enviadas por estudiantes en esta encuesta."
                            : "Participaciones enviadas por estudiantes en este foro."}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void item.loadActivityResponses(block)}
                    disabled={item.loadingResponses}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                    aria-label="Actualizar respuestas"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${item.loadingResponses ? "animate-spin" : ""}`}
                    />
                </button>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 sm:mt-5 sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                    Total
                </p>

                <p className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                    {item.activityResponses.length}
                </p>
            </div>

            {item.loadingResponses ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-500 sm:rounded-2xl sm:p-4 sm:text-sm">
                    Cargando respuestas...
                </div>
            ) : item.activityResponses.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500 sm:rounded-2xl sm:p-5 sm:text-sm">
                    Todavía no existen respuestas para este bloque.
                </div>
            ) : (
                <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1 sm:max-h-[440px] sm:space-y-3 [@media(max-height:760px)]:max-h-[260px]">
                    {item.activityResponses.map((response, index) => (
                        <article
                            key={`${response.id ?? index}-${response.created_at ?? index}`}
                            className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-black text-slate-950 sm:text-sm">
                                        {getActivityResponseStudent(response)}
                                    </p>

                                    <p className="mt-1 text-[10px] font-semibold text-slate-500 sm:text-xs">
                                        Matrícula #
                                        {response.enrollment?.id ??
                                            response.enrollment_id ??
                                            response.enrollmentId ??
                                            "N/D"}
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 sm:px-2.5 sm:py-1 sm:text-[10px]">
                                    #{response.id ?? index + 1}
                                </span>
                            </div>

                            <p className="mt-2 line-clamp-4 whitespace-pre-line text-[11px] font-semibold leading-5 text-slate-600 sm:mt-3 sm:text-xs">
                                {getActivityResponseText(response)}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
                                    {formatDate(
                                        response.updated_at ?? response.created_at,
                                    )}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        window.alert(getActivityResponseText(response))
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
