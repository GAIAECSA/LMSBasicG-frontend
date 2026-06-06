import { ChevronDown } from "lucide-react";
import type { CourseRoomHook } from "../hook";
import type { LessonView } from "../types";
import { BlockButton } from "./BlockButton";
import { getLessonItemType } from "../utils";

type LessonAccordionProps = {
    lessonItem: LessonView;
    lessonIndex: number;
    room: CourseRoomHook;
};

export function LessonAccordion({
    lessonItem,
    lessonIndex,
    room,
}: LessonAccordionProps) {
    const isOpen = room.openLessons[lessonItem.id] ?? true;

    const visibleBlocks = lessonItem.blocks.filter(
        (block) => getLessonItemType(block) !== "survey",
    );

    return (
        <div className="min-w-0 rounded-xl bg-white">
            <button
                type="button"
                onClick={() =>
                    room.setOpenLessons((current) => ({
                        ...current,
                        [lessonItem.id]: !isOpen,
                    }))
                }
                className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--muted)] sm:px-3"
            >
                <span className="line-clamp-2 break-all text-xs font-black leading-4 text-[var(--foreground)] [overflow-wrap:anywhere] sm:text-sm sm:leading-5">
                    Lección {lessonIndex + 1}: {lessonItem.name}
                </span>

                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition ${
                        isOpen ? "" : "-rotate-90"
                    }`}
                />
            </button>

            {isOpen ? (
                <div className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2">
                    {visibleBlocks.length === 0 ? (
                        <p className="rounded-xl bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
                            Sin contenido.
                        </p>
                    ) : (
                        visibleBlocks.map((block) => (
                            <BlockButton
                                key={block.id}
                                block={block}
                                selectedBlockId={room.selectedBlock?.id ?? null}
                                completedBlocks={room.completedBlocks}
                                onSelect={room.handleSelectBlock}
                            />
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default LessonAccordion;
