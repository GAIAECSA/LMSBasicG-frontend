"use client";

import { useEffect, useMemo } from "react";
import { ClipboardList, CircleCheck, Clock3 } from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { CourseRoomHook } from "../../hook";
import { getBlockTitle, getLessonItemType } from "../../utils";
import { SurveyBlock } from "../blocks/SurveyBlock";

type SurveyTabProps = {
    room: CourseRoomHook;
};

export function SurveyTab({ room }: SurveyTabProps) {
    const { allBlocks, selectedBlock, handleSelectBlock } = room;

    const surveyBlocks = useMemo<LessonBlock[]>(() => {
        return allBlocks.filter(
            (block): block is LessonBlock =>
                Boolean(block) && getLessonItemType(block) === "survey",
        );
    }, [allBlocks]);

    const selectedSurveyBlock = useMemo<LessonBlock | null>(() => {
        const currentSelectedSurvey = surveyBlocks.find(
            (block) => block.id === selectedBlock?.id,
        );

        return currentSelectedSurvey ?? surveyBlocks[0] ?? null;
    }, [surveyBlocks, selectedBlock?.id]);

    useEffect(() => {
        if (!selectedSurveyBlock) return;

        if (selectedBlock?.id !== selectedSurveyBlock.id) {
            handleSelectBlock(selectedSurveyBlock);
        }
    }, [
        selectedSurveyBlock,
        selectedBlock?.id,
        handleSelectBlock,
    ]);

    function handleSelectSurvey(block: LessonBlock) {
        handleSelectBlock(block);
    }

    if (surveyBlocks.length === 0) {
        return (
            <div className="min-w-0 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:p-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <ClipboardList className="h-7 w-7" />
                </div>

                <h2 className="mt-4 text-lg font-black text-slate-900">
                    No hay encuestas disponibles
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">
                    Cuando el docente agregue una encuesta, aparecerá en esta
                    sección.
                </p>
            </div>
        );
    }

    return (
        <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <ClipboardList className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-base font-black text-slate-900">
                            Encuestas
                        </h2>

                        <p className="text-xs font-bold text-slate-500">
                            {surveyBlocks.length} disponible
                            {surveyBlocks.length === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
                    {surveyBlocks.map((block) => {
                        const active =
                            selectedSurveyBlock?.id === block.id;

                        const hasResponse = Boolean(
                            room.surveyResponses[block.id],
                        );

                        return (
                            <button
                                key={block.id}
                                type="button"
                                onClick={() => handleSelectSurvey(block)}
                                className={`min-w-[230px] flex-1 rounded-2xl border px-4 py-3 text-left transition xl:min-w-0 xl:w-full ${active
                                        ? "border-blue-200 bg-blue-50 text-blue-900"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="line-clamp-2 text-sm font-black">
                                    {getBlockTitle(block)}
                                </p>

                                <div className="mt-2 flex items-center gap-2">
                                    {hasResponse ? (
                                        <>
                                            <CircleCheck className="h-4 w-4 text-emerald-600" />

                                            <span className="text-xs font-bold text-emerald-700">
                                                Respondida
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock3 className="h-4 w-4 text-amber-600" />

                                            <span className="text-xs font-bold text-amber-700">
                                                Pendiente
                                            </span>
                                        </>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <section className="min-w-0 overflow-hidden">
                {selectedSurveyBlock ? (
                    <SurveyBlock room={room} />
                ) : null}
            </section>
        </div>
    );
}

export default SurveyTab;