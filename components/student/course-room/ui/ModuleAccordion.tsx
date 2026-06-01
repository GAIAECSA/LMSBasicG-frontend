import { ChevronDown } from "lucide-react";
import type { CourseRoomHook } from "../hook";
import type { ModuleView } from "../types";
import { LessonAccordion } from "./LessonAccordion";


type ModuleAccordionProps = { moduleItem: ModuleView; moduleIndex: number; room: CourseRoomHook };

export function ModuleAccordion({ moduleItem, moduleIndex, room }: ModuleAccordionProps) {
    const isOpen = room.openModules[moduleItem.id] ?? true;
    const moduleBlocks = moduleItem.lessons.flatMap((lessonItem) => lessonItem.blocks);
    const completed = moduleBlocks.filter((block) => room.completedBlocks.includes(block.id)).length;
    return <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]"><button type="button" onClick={() => room.setOpenModules((current) => ({ ...current, [moduleItem.id]: !isOpen }))} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"><span><span className="block text-xs font-black uppercase text-[var(--primary)]">Módulo {moduleIndex + 1}</span><span className="block text-sm font-black text-[var(--foreground)]">{moduleItem.name}</span></span><span className="flex items-center gap-2 text-xs font-black text-[var(--muted-foreground)]">{completed}/{moduleBlocks.length}<ChevronDown className={`h-4 w-4 transition ${isOpen ? "" : "-rotate-90"}`} /></span></button>{isOpen ? <div className="space-y-3 border-t border-[var(--border)] bg-white p-3">{moduleItem.lessons.map((lessonItem, lessonIndex) => <LessonAccordion key={lessonItem.id} lessonItem={lessonItem} lessonIndex={lessonIndex} room={room} />)}</div> : null}</div>;
}
