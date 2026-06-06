"use client";

import {
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    FileCheck2,
    LockKeyhole,
    MessageSquareText,
    Star,
} from "lucide-react";
import type { ReactNode } from "react";
import type { LessonBlock } from "@/services/lessons.service";
import type { CourseRoomHook } from "../../hook";
import {
    getBlockAvailableDateLabel,
    getBlockTitle,
    getItemLabel,
    getLessonItemType,
    isBlockAvailable,
} from "../../utils";
import { ProgressCard } from "../ProgressCard";
import { UpcomingCard } from "../UpcomingCard";

type ActivitiesTabProps = {
    room: CourseRoomHook;
};

const ACTIVITY_TYPES = ["quiz", "homework", "survey", "forum"] as const;

type ActivityType = (typeof ACTIVITY_TYPES)[number];

function isActivityBlock(block: LessonBlock) {
    const type = getLessonItemType(block);

    return ACTIVITY_TYPES.includes(type as ActivityType);
}

function getActivityIcon(type: string): ReactNode {
    if (type === "quiz") {
        return <ClipboardList className="h-5 w-5" />;
    }

    if (type === "homework") {
        return <FileCheck2 className="h-5 w-5" />;
    }

    if (type === "survey") {
        return <Star className="h-5 w-5" />;
    }

    return <MessageSquareText className="h-5 w-5" />;
}

export function ActivitiesTab({ room }: ActivitiesTabProps) {
    const activityBlocks = room.allBlocks.filter(isActivityBlock);

    const completedActivities = activityBlocks.filter((block) =>
        room.completedBlocks.includes(block.id),
    ).length;

    function handleOpenActivity(block: LessonBlock) {
        if (!isBlockAvailable(block)) return;

        room.handleSelectBlock(block);
        room.setActiveTab("content");
    }

    return (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
            <section className="min-w-0 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-sm sm:rounded-[22px]">
                <div className="flex min-w-0 flex-col gap-2 border-b border-[var(--border)] bg-[var(--muted)] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="min-w-0">
                        <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                            Actividades del curso
                        </h2>

                        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                            Revisa tus evaluaciones, tareas, encuestas y foros.
                        </p>
                    </div>

                    <span className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700 sm:text-xs">
                        {completedActivities}/{activityBlocks.length} completadas
                    </span>
                </div>

                {activityBlocks.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                        <ClipboardList className="mx-auto h-9 w-9 text-slate-400" />

                        <p className="mt-3 text-sm font-black text-slate-700">
                            No hay actividades disponibles.
                        </p>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            Las evaluaciones, tareas, encuestas y foros aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 p-2.5 sm:p-3">
                        {activityBlocks.map((block, index) => {
                            const type = getLessonItemType(block);
                            const available = isBlockAvailable(block);
                            const completed =
                                available &&
                                room.completedBlocks.includes(block.id);

                            const availableDateLabel =
                                getBlockAvailableDateLabel(block);

                            return (
                                <button
                                    key={block.id}
                                    type="button"
                                    onClick={() => handleOpenActivity(block)}
                                    disabled={!available}
                                    className={`grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:rounded-2xl sm:p-4 ${
                                        !available
                                            ? "cursor-not-allowed border-amber-200 bg-amber-50"
                                            : completed
                                              ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                                              : "border-[var(--border)] bg-white hover:border-blue-200 hover:bg-blue-50/40"
                                    }`}
                                >
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                            !available
                                                ? "bg-white text-amber-700"
                                                : completed
                                                  ? "bg-emerald-100 text-emerald-700"
                                                  : "bg-blue-50 text-[var(--primary)]"
                                        }`}
                                    >
                                        {!available ? (
                                            <LockKeyhole className="h-5 w-5" />
                                        ) : completed ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            getActivityIcon(type)
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-wide text-[var(--muted-foreground)] sm:text-xs">
                                            {index + 1}. {getItemLabel(type)}
                                        </p>

                                        <p className="mt-0.5 line-clamp-2 break-all text-xs font-black leading-5 text-[var(--foreground)] [overflow-wrap:anywhere] sm:text-sm">
                                            {getBlockTitle(block)}
                                        </p>

                                        {!available ? (
                                            <p className="mt-1 flex min-w-0 items-start gap-1 text-[10px] font-bold leading-4 text-amber-700 sm:text-[11px]">
                                                <CalendarClock className="mt-0.5 h-3 w-3 shrink-0" />

                                                <span className="min-w-0 break-words">
                                                    Disponible desde:{" "}
                                                    {availableDateLabel}
                                                </span>
                                            </p>
                                        ) : null}
                                    </div>

                                    <span
                                        className={`col-start-2 row-start-2 w-fit max-w-full shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase sm:col-start-auto sm:row-start-auto sm:px-3 sm:text-xs ${
                                            !available
                                                ? "bg-amber-100 text-amber-700"
                                                : completed
                                                  ? "bg-emerald-100 text-emerald-700"
                                                  : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {!available
                                            ? "No disponible"
                                            : completed
                                              ? "Completado"
                                              : "Pendiente"}
                                    </span>

                                    {available ? (
                                        <ChevronRight className="hidden h-4 w-4 shrink-0 text-[var(--muted-foreground)] sm:block" />
                                    ) : (
                                        <LockKeyhole className="hidden h-4 w-4 shrink-0 text-amber-700 sm:block" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            <aside className="min-w-0 space-y-4">
                <ProgressCard room={room} />
                <UpcomingCard room={room} />
            </aside>
        </div>
    );
}

export default ActivitiesTab;
