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
        <div className="rounded-xl bg-white">
            <button
                type="button"
                onClick={() =>
                    room.setOpenLessons((current) => ({
                        ...current,
                        [lessonItem.id]: !isOpen,
                    }))
                }
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--muted)]"
            >
                <span className="text-sm font-black text-[var(--foreground)]">
                    Lección {lessonIndex + 1}: {lessonItem.name}
                </span>

                <ChevronDown
                    className={`h-4 w-4 text-[var(--muted-foreground)] transition ${isOpen ? "" : "-rotate-90"
                        }`}
                />
            </button>

            {isOpen ? (
                <div className="mt-2 space-y-2">
                    {visibleBlocks.length === 0 ? (
                        <p className="rounded-xl bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
                            Sin contenido.
                        </p>
                    ) : (
                        visibleBlocks.map((block) => (
                            <BlockButton
                                key={block.id}
                                block={block}
                                selectedBlockId={
                                    room.selectedBlock?.id ?? null
                                }
                                completedBlocks={
                                    room.completedBlocks
                                }
                                onSelect={
                                    room.handleSelectBlock
                                }
                            />
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default LessonAccordion;