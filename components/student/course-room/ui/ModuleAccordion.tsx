import {
    ChevronDown,
} from "lucide-react";

import type {
    CourseRoomHook,
} from "../hook";

import {
    hasCompletedProgressRecord,
    includesLessonBlockId,
} from "../progress";

import type {
    ModuleView,
} from "../types";

import {
    LessonAccordion,
} from "./LessonAccordion";

type ModuleAccordionProps = {
    moduleItem: ModuleView;
    moduleIndex: number;
    room: CourseRoomHook;
};

export function ModuleAccordion({
    moduleItem,
    moduleIndex,
    room,
}: ModuleAccordionProps) {
    const hasControlledModuleState =
        Object.keys(
            room.openModules,
        ).length > 0;

    const isOpen =
        hasControlledModuleState
            ? Boolean(
                room.openModules[
                moduleItem.id
                ],
            )
            : moduleIndex === 0;

    const moduleBlocks =
        moduleItem.lessons.flatMap(
            (lessonItem) =>
                lessonItem.blocks,
        );

    /*
     * El contador consulta las dos fuentes:
     * 1. El estado local para actualizar inmediatamente.
     * 2. Los registros recibidos desde la API.
     */
    const completed = moduleBlocks.filter(
        (block) =>
            includesLessonBlockId(
                room.completedBlocks,
                block.id,
            ),
    ).length;

    function handleToggleModule() {
        room.setOpenModules(
            (current) => {
                const hasCurrentState =
                    Object.keys(
                        current,
                    ).length > 0;

                const isCurrentlyOpen =
                    hasCurrentState
                        ? Boolean(
                            current[
                            moduleItem.id
                            ],
                        )
                        : moduleIndex ===
                        0;

                if (
                    isCurrentlyOpen
                ) {
                    return {
                        [moduleItem.id]:
                            false,
                    };
                }

                return {
                    [moduleItem.id]:
                        true,
                };
            },
        );
    }

    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)] sm:rounded-2xl">
            <button
                type="button"
                onClick={
                    handleToggleModule
                }
                className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 text-left transition hover:bg-white/50 sm:px-4"
            >
                <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase text-[var(--primary)] sm:text-xs">
                        Módulo{" "}
                        {moduleIndex + 1}
                    </span>

                    <span className="mt-0.5 line-clamp-2 break-all text-xs font-black leading-4 text-[var(--foreground)] [overflow-wrap:anywhere] sm:text-sm sm:leading-5">
                        {
                            moduleItem.name
                        }
                    </span>
                </span>

                <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-black text-[var(--muted-foreground)] sm:text-xs">
                    {completed}/
                    {
                        moduleBlocks.length
                    }

                    <ChevronDown
                        className={`h-4 w-4 transition ${isOpen
                            ? ""
                            : "-rotate-90"
                            }`}
                    />
                </span>
            </button>

            {isOpen ? (
                <div className="space-y-2.5 border-t border-[var(--border)] bg-white p-2.5 sm:space-y-3 sm:p-3">
                    {moduleItem.lessons.map(
                        (
                            lessonItem,
                            lessonIndex,
                        ) => (
                            <LessonAccordion
                                key={
                                    lessonItem.id
                                }
                                lessonItem={
                                    lessonItem
                                }
                                lessonIndex={
                                    lessonIndex
                                }
                                room={
                                    room
                                }
                            />
                        ),
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default ModuleAccordion;