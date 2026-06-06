import {
    ChevronDown,
    Layers3,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import type {
    DragState,
    CourseModuleView,
} from "../types";
import type { CourseModsState } from "../hook";
import { LessonCard } from "./LessonCard";

type ModuleCardProps = {
    mods: CourseModsState;
    courseModule: CourseModuleView;
    moduleIndex: number;
};

export function ModuleCard({
    mods,
    courseModule,
    moduleIndex,
}: ModuleCardProps) {
    const moduleOpen =
        mods.openModules[courseModule.id] ?? true;

    const moduleDragState: DragState = {
        type: "module",
        id: courseModule.id,
    };

    const moduleIsDragging =
        mods.isDraggingItem(moduleDragState);

    const moduleIsOver =
        mods.isDragOverItem(moduleDragState);

    return (
        <div
            className={`relative min-w-0 transition ${
                moduleIsDragging ? "opacity-50" : ""
            }`}
            onDragOver={(event) =>
                mods.handleDragOver(
                    event,
                    moduleDragState,
                )
            }
            onDrop={(event) =>
                mods.handleDrop(event, moduleDragState)
            }
        >
            <div className="absolute -left-[19px] top-6 h-3 w-3 rounded-full border-[3px] border-[#172861] bg-white sm:-left-[26px] sm:top-7 sm:h-4 sm:w-4 sm:border-4" />

            <div
                draggable
                onDragStart={(event) =>
                    mods.handleDragStart(
                        event,
                        moduleDragState,
                    )
                }
                onDragEnd={mods.resetDragState}
                className={`min-w-0 cursor-grab rounded-2xl border bg-slate-50 p-3 shadow-sm transition active:cursor-grabbing sm:rounded-[26px] sm:p-4 ${
                    moduleIsOver
                        ? "border-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200"
                }`}
            >
                <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <button
                        type="button"
                        onClick={() =>
                            mods.setOpenModules(
                                (current) => ({
                                    ...current,
                                    [courseModule.id]:
                                        !moduleOpen,
                                }),
                            )
                        }
                        className="flex min-w-0 items-center gap-2 text-left sm:gap-3"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-white sm:h-11 sm:w-11 sm:rounded-2xl">
                            <Layers3 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>

                        <span className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#172861] sm:text-xs sm:tracking-[0.14em]">
                                Módulo {moduleIndex + 1}
                            </span>

                            <span
                                className="block truncate text-sm font-black text-slate-950 sm:text-base lg:text-lg"
                                title={courseModule.title}
                            >
                                {courseModule.title}
                            </span>
                        </span>

                        <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-500 transition sm:h-5 sm:w-5 ${
                                moduleOpen
                                    ? ""
                                    : "-rotate-90"
                            }`}
                        />
                    </button>

                    <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 lg:justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                mods.openCreateLessonModal(
                                    courseModule.id,
                                )
                            }
                            title="Agregar lección"
                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-xl bg-white px-2 text-[10px] font-bold text-[#172861] ring-1 ring-blue-100 transition hover:bg-blue-50 active:scale-[0.97] sm:w-9 sm:px-0 xl:w-auto xl:px-3 xl:text-xs 2xl:rounded-2xl"
                        >
                            <Plus className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            <span className="truncate sm:hidden xl:inline">
                                Lección
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                mods.openEditModuleModal(
                                    courseModule,
                                )
                            }
                            title="Editar módulo"
                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-xl bg-white px-2 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.97] sm:w-9 sm:px-0 xl:w-auto xl:px-3 xl:text-xs 2xl:rounded-2xl"
                        >
                            <Pencil className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            <span className="truncate sm:hidden xl:inline">
                                Editar
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                mods.openDeleteModal({
                                    type: "module",
                                    id: courseModule.id,
                                    title: courseModule.title,
                                })
                            }
                            title="Eliminar módulo"
                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-xl bg-white px-2 text-[10px] font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-50 active:scale-[0.97] sm:w-9 sm:px-0 xl:w-auto xl:px-3 xl:text-xs 2xl:rounded-2xl"
                        >
                            <Trash2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            <span className="truncate sm:hidden xl:inline">
                                Eliminar
                            </span>
                        </button>
                    </div>
                </div>

                {moduleOpen ? (
                    <div className="mt-3 min-w-0 space-y-3 border-l border-slate-200 pl-2.5 sm:mt-4 sm:space-y-4 sm:border-l-2 sm:pl-4 lg:pl-5 [@media(max-height:760px)]:mt-3">
                        {courseModule.lessons.length ===
                        0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs leading-5 text-slate-500 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm">
                                Este módulo todavía no tiene
                                lecciones.
                            </div>
                        ) : (
                            courseModule.lessons.map(
                                (lesson, lessonIndex) => (
                                    <LessonCard
                                        key={lesson.id}
                                        mods={mods}
                                        courseModule={
                                            courseModule
                                        }
                                        lesson={lesson}
                                        lessonIndex={
                                            lessonIndex
                                        }
                                    />
                                ),
                            )
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
