import { ChevronDown, Layers3, Pencil, Plus, Trash2 } from "lucide-react";
import type { DragState, CourseModuleView } from "../types";
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
    const moduleOpen = mods.openModules[courseModule.id] ?? true;

    const moduleDragState: DragState = {
        type: "module",
        id: courseModule.id,
    };

    const moduleIsDragging = mods.isDraggingItem(moduleDragState);
    const moduleIsOver = mods.isDragOverItem(moduleDragState);

    return (
        <div
            className={`relative transition ${moduleIsDragging ? "opacity-50" : ""
                }`}
            onDragOver={(event) => mods.handleDragOver(event, moduleDragState)}
            onDrop={(event) => mods.handleDrop(event, moduleDragState)}
        >
            <div className="absolute -left-[26px] top-7 h-4 w-4 rounded-full border-4 border-[#172861] bg-white" />

            <div
                draggable
                onDragStart={(event) =>
                    mods.handleDragStart(event, moduleDragState)
                }
                onDragEnd={mods.resetDragState}
                className={`cursor-grab rounded-[26px] border bg-slate-50 p-4 shadow-sm transition active:cursor-grabbing ${moduleIsOver
                        ? "border-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200"
                    }`}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                mods.setOpenModules((current) => ({
                                    ...current,
                                    [courseModule.id]: !moduleOpen,
                                }))
                            }
                            className="flex min-w-0 items-center gap-3 text-left"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-white">
                                <Layers3 className="h-5 w-5" />
                            </span>

                            <span className="min-w-0">
                                <span className="block text-xs font-bold uppercase tracking-[0.14em] text-[#172861]">
                                    Módulo {moduleIndex + 1}
                                </span>

                                <span className="block truncate text-lg font-black text-slate-950">
                                    {courseModule.title}
                                </span>
                            </span>

                            <ChevronDown
                                className={`h-5 w-5 text-slate-500 transition ${moduleOpen ? "" : "-rotate-90"
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                mods.openCreateLessonModal(courseModule.id)
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-[#172861] ring-1 ring-blue-100 transition hover:bg-blue-50"
                        >
                            <Plus className="h-4 w-4" />
                            Lección
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                mods.openEditModuleModal(courseModule)
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
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
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </button>
                    </div>
                </div>

                {moduleOpen ? (
                    <div className="mt-5 space-y-4 border-l-2 border-slate-200 pl-5">
                        {courseModule.lessons.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                                Este módulo todavía no tiene lecciones.
                            </div>
                        ) : (
                            courseModule.lessons.map((lesson, lessonIndex) => (
                                <LessonCard
                                    key={lesson.id}
                                    mods={mods}
                                    courseModule={courseModule}
                                    lesson={lesson}
                                    lessonIndex={lessonIndex}
                                />
                            ))
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}