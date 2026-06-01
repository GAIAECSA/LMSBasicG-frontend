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
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <MessageSquareText className="h-7 w-7" />
                </div>

                <h2 className="mt-4 text-lg font-black text-slate-900">
                    No hay foros disponibles
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">
                    Cuando el docente agregue un bloque de tipo foro, aparecerá
                    en esta sección.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <MessageSquareText className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-base font-black text-slate-900">
                            Foros
                        </h2>

                        <p className="text-xs font-bold text-slate-500">
                            {forumBlocks.length} disponible
                            {forumBlocks.length === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {forumBlocks.map((block) => {
                        const active = selectedForumBlock?.id === block.id;
                        const responseCount =
                            room.forumResponses[block.id]?.length ?? 0;

                        return (
                            <button
                                key={block.id}
                                type="button"
                                onClick={() => handleSelectForum(block)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${active
                                        ? "border-blue-200 bg-blue-50 text-blue-900"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="line-clamp-2 text-sm font-black">
                                    {getBlockTitle(block)}
                                </p>

                                <p className="mt-1 text-xs font-bold text-slate-500">
                                    {responseCount} publicación
                                    {responseCount === 1 ? "" : "es"}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <section className="min-w-0">
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