import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { LESSON_ITEM_TYPES } from "../constants";
import type { CourseModuleView, DragState, LessonView } from "../types";
import type { CourseModsState } from "../hook";
import { getItemButtonClass, getItemLabel } from "../utils";
import { ItemIcon } from "./ItemIcon";
import { ItemRow } from "./ItemRow";

type LessonCardProps = {
    mods: CourseModsState;
    courseModule: CourseModuleView;
    lesson: LessonView;
    lessonIndex: number;
};

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
}

function readBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") return value;

    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}

function getContentRecord(value: unknown): AnyRecord {
    if (!value) return {};

    if (typeof value === "object" && !Array.isArray(value)) {
        return value as AnyRecord;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return parsed as AnyRecord;
            }

            return {};
        } catch {
            return {};
        }
    }

    return {};
}

/*
    Se mantienen ocultos únicamente los bloques especiales MDT.

    Importante:
    NO se filtra por is_active porque esta pantalla debe mostrar
    tanto los bloques activos como los inactivos.
*/
function shouldShowItemInModuleList(item: unknown) {
    const record = toRecord(item);

    if (!record) return true;

    const rawRecord = toRecord(record.raw);
    const content = getContentRecord(
        rawRecord?.content ?? record.content,
    );

    const isDefault = readBoolean(
        rawRecord?.default ??
        rawRecord?.is_default ??
        record.default ??
        record.is_default ??
        content.default ??
        content.is_default,
        true,
    );

    const isRequired = readBoolean(
        rawRecord?.is_required ??
        rawRecord?.required ??
        rawRecord?.isRequired ??
        record.is_required ??
        record.required ??
        record.isRequired ??
        content.is_required ??
        content.required ??
        content.isRequired,
        false,
    );

    return isDefault && !isRequired;
}

export function LessonCard({
    mods,
    courseModule,
    lesson,
    lessonIndex,
}: LessonCardProps) {
    const lessonOpen = mods.openLessons[lesson.id] ?? true;

    const lessonDragState: DragState = {
        type: "lesson",
        id: lesson.id,
        moduleId: courseModule.id,
    };

    const lessonIsDragging = mods.isDraggingItem(lessonDragState);
    const lessonIsOver = mods.isDragOverItem(lessonDragState);

    const visibleItems = lesson.items.filter(shouldShowItemInModuleList);

    return (
        <div
            draggable
            className={`cursor-grab rounded-2xl border bg-white p-4 transition active:cursor-grabbing ${lessonIsDragging ? "opacity-50" : ""
                } ${lessonIsOver
                    ? "border-blue-500 ring-4 ring-blue-100"
                    : "border-slate-200"
                }`}
            onDragStart={(event) =>
                mods.handleDragStart(event, lessonDragState)
            }
            onDragEnd={mods.resetDragState}
            onDragOver={(event) => mods.handleDragOver(event, lessonDragState)}
            onDrop={(event) => mods.handleDrop(event, lessonDragState)}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            mods.setOpenLessons((current) => ({
                                ...current,
                                [lesson.id]: !lessonOpen,
                            }))
                        }
                        className="flex min-w-0 items-center gap-3 text-left"
                    >
                        <span className="min-w-0">
                            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                Lección {lessonIndex + 1}
                            </span>

                            <span className="block truncate text-base font-black text-slate-950">
                                {lesson.title}
                            </span>
                        </span>

                        <ChevronDown
                            className={`h-5 w-5 text-slate-500 transition ${lessonOpen ? "" : "-rotate-90"
                                }`}
                        />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {LESSON_ITEM_TYPES.map((itemType) => (
                        <button
                            key={itemType}
                            type="button"
                            onClick={() =>
                                mods.openCreateItemModal(lesson.id, itemType)
                            }
                            className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition ${getItemButtonClass(
                                itemType,
                            )}`}
                        >
                            <ItemIcon type={itemType} className="h-4 w-4" />
                            {getItemLabel(itemType)}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => mods.openEditLessonModal(lesson)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                    >
                        <Pencil className="h-4 w-4" />
                        Editar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            mods.openDeleteModal({
                                type: "lesson",
                                id: lesson.id,
                                title: lesson.title,
                            })
                        }
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                        title="Eliminar lección"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {lessonOpen ? (
                <div className="mt-4 space-y-3">
                    {visibleItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            Esta lección todavía no tiene contenido.
                        </div>
                    ) : (
                        visibleItems.map((item) => (
                            <ItemRow
                                key={item.id}
                                mods={mods}
                                lesson={lesson}
                                item={item}
                            />
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default LessonCard;