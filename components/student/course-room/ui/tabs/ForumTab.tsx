"use client";

import { useEffect, useMemo } from "react";
import { MessageSquareText } from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { CourseRoomHook } from "../../hook";
import { getBlockTitle, getLessonItemType } from "../../utils";
import { ForumBlock } from "../blocks/ForumBlock";

type ForumTabProps = {
    room: CourseRoomHook;
};

export function ForumTab({ room }: ForumTabProps) {
    const { allBlocks, selectedBlock, handleSelectBlock } = room;

    const forumBlocks = useMemo<LessonBlock[]>(() => {
        return allBlocks.filter(
            (block): block is LessonBlock =>
                Boolean(block) && getLessonItemType(block) === "forum",
        );
    }, [allBlocks]);

    const selectedForumBlock = useMemo<LessonBlock | null>(() => {
        const currentSelectedForum = forumBlocks.find(
            (block) => block.id === selectedBlock?.id,
        );

        return currentSelectedForum ?? forumBlocks[0] ?? null;
    }, [forumBlocks, selectedBlock?.id]);

    useEffect(() => {
        if (!selectedForumBlock) return;

        if (selectedBlock?.id !== selectedForumBlock.id) {
            handleSelectBlock(selectedForumBlock);
        }
    }, [selectedForumBlock, selectedBlock?.id, handleSelectBlock]);

    function handleSelectForum(block: LessonBlock) {
        handleSelectBlock(block);
    }

    if (forumBlocks.length === 0) {
        return (
            <div className="min-w-0 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center shadow-sm sm:rounded-3xl sm:p-7">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <MessageSquareText className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>

                <h2 className="mt-3 text-base font-black text-slate-900 sm:text-lg">
                    No hay foros disponibles
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                    Cuando el docente agregue un bloque de tipo foro, aparecerá
                    en esta sección.
                </p>
            </div>
        );
    }

    return (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-4 lg:sticky lg:top-3">
                <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <MessageSquareText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-slate-900 sm:text-base">
                            Foros
                        </h2>

                        <p className="text-[11px] font-bold text-slate-500 sm:text-xs">
                            {forumBlocks.length} disponible
                            {forumBlocks.length === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:max-h-[calc(100vh-190px)] lg:space-y-2 lg:overflow-y-auto lg:pb-0">
                    {forumBlocks.map((block) => {
                        const active = selectedForumBlock?.id === block.id;
                        const responseCount =
                            room.forumResponses[block.id]?.length ?? 0;

                        return (
                            <button
                                key={block.id}
                                type="button"
                                onClick={() => handleSelectForum(block)}
                                className={`min-w-[220px] flex-1 rounded-xl border px-3 py-2.5 text-left transition lg:w-full lg:min-w-0 ${
                                    active
                                        ? "border-blue-200 bg-blue-50 text-blue-900"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <p className="line-clamp-2 break-all text-xs font-black leading-5 [overflow-wrap:anywhere] sm:text-sm">
                                    {getBlockTitle(block)}
                                </p>

                                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-xs">
                                    {responseCount} publicación
                                    {responseCount === 1 ? "" : "es"}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <section className="min-w-0 overflow-hidden">
                {selectedForumBlock ? (
                    <ForumBlock
                        room={room}
                        block={selectedForumBlock}
                        active
                        onSelect={handleSelectForum}
                    />
                ) : null}
            </section>
        </div>
    );
}

export default ForumTab;
