import { ChevronDown } from "lucide-react";
import type { CourseRoomHook } from "../hook";
import type { ModuleView } from "../types";
import { LessonAccordion } from "./LessonAccordion";

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
    /*
        Mientras el estudiante todavía no interactúa con el índice,
        se abre únicamente el primer módulo.

        Después de cualquier interacción, openModules se convierte
        en la fuente de verdad.
    */
    const hasControlledModuleState =
        Object.keys(room.openModules).length > 0;

    const isOpen = hasControlledModuleState
        ? Boolean(room.openModules[moduleItem.id])
        : moduleIndex === 0;

    const moduleBlocks = moduleItem.lessons.flatMap(
        (lessonItem) => lessonItem.blocks,
    );

    const completed = moduleBlocks.filter((block) =>
        room.completedBlocks.includes(block.id),
    ).length;

    function handleToggleModule() {
        room.setOpenModules((current) => {
            const hasCurrentState = Object.keys(current).length > 0;

            const isCurrentlyOpen = hasCurrentState
                ? Boolean(current[moduleItem.id])
                : moduleIndex === 0;

            /*
                Si el estudiante presiona nuevamente el módulo abierto,
                se permite cerrarlo.

                Si abre otro módulo, el estado anterior se reemplaza
                completamente. Así nunca quedan dos módulos abiertos.
            */
            if (isCurrentlyOpen) {
                return {
                    [moduleItem.id]: false,
                };
            }

            return {
                [moduleItem.id]: true,
            };
        });
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]">
            <button
                type="button"
                onClick={handleToggleModule}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            >
                <span>
                    <span className="block text-xs font-black uppercase text-[var(--primary)]">
                        Módulo {moduleIndex + 1}
                    </span>

                    <span className="block text-sm font-black text-[var(--foreground)]">
                        {moduleItem.name}
                    </span>
                </span>

                <span className="flex items-center gap-2 text-xs font-black text-[var(--muted-foreground)]">
                    {completed}/{moduleBlocks.length}

                    <ChevronDown
                        className={`h-4 w-4 transition ${isOpen ? "" : "-rotate-90"
                            }`}
                    />
                </span>
            </button>

            {isOpen ? (
                <div className="space-y-3 border-t border-[var(--border)] bg-white p-3">
                    {moduleItem.lessons.map(
                        (lessonItem, lessonIndex) => (
                            <LessonAccordion
                                key={lessonItem.id}
                                lessonItem={lessonItem}
                                lessonIndex={lessonIndex}
                                room={room}
                            />
                        ),
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default ModuleAccordion;