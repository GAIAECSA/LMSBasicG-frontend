import {
    ChevronDown,
    Pencil,
    Trash2,
} from "lucide-react";
import { LESSON_ITEM_TYPES } from "../constants";
import type {
    CourseModuleView,
    DragState,
    LessonView,
} from "../types";
import type { CourseModsState } from "../hook";
import {
    getItemButtonClass,
    getItemLabel,
} from "../utils";
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
 * Se mantienen ocultos únicamente los bloques especiales MDT.
 * Esta pantalla conserva tanto los bloques activos como los inactivos.
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
            className={`min-w-0 cursor-grab rounded-xl border bg-white p-3 transition active:cursor-grabbing sm:rounded-2xl sm:p-4 ${
                lessonIsDragging ? "opacity-50" : ""
            } ${
                lessonIsOver
                    ? "border-blue-500 ring-4 ring-blue-100"
                    : "border-slate-200"
            }`}
            onDragStart={(event) =>
                mods.handleDragStart(event, lessonDragState)
            }
            onDragEnd={mods.resetDragState}
            onDragOver={(event) =>
                mods.handleDragOver(event, lessonDragState)
            }
            onDrop={(event) => mods.handleDrop(event, lessonDragState)}
        >
            <div className="flex min-w-0 flex-col gap-3">
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            mods.setOpenLessons((current) => ({
                                ...current,
                                [lesson.id]: !lessonOpen,
                            }))
                        }
                        className="flex min-w-0 items-center gap-2 text-left"
                    >
                        <span className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-xs sm:tracking-[0.14em]">
                                Lección {lessonIndex + 1}
                            </span>

                            <span
                                className="block truncate text-sm font-black text-slate-950 sm:text-base"
                                title={lesson.title}
                            >
                                {lesson.title}
                            </span>
                        </span>

                        <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-500 transition sm:h-5 sm:w-5 ${
                                lessonOpen ? "" : "-rotate-90"
                            }`}
                        />
                    </button>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => mods.openEditLessonModal(lesson)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700 transition hover:bg-slate-100 active:scale-[0.96] sm:h-9 sm:w-9 sm:rounded-xl"
                            title="Editar lección"
                        >
                            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 transition hover:bg-red-100 active:scale-[0.96] sm:h-9 sm:w-9 sm:rounded-xl"
                            title="Eliminar lección"
                        >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 xs:grid-cols-3 sm:flex sm:flex-wrap sm:gap-2">
                    {LESSON_ITEM_TYPES.map((itemType) => (
                        <button
                            key={itemType}
                            type="button"
                            onClick={() =>
                                mods.openCreateItemModal(
                                    lesson.id,
                                    itemType,
                                )
                            }
                            title={`Agregar ${getItemLabel(itemType)}`}
                            className={`inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-black transition active:scale-[0.97] sm:h-9 sm:w-9 sm:px-0 xl:w-auto xl:px-2.5 xl:text-xs ${getItemButtonClass(
                                itemType,
                            )}`}
                        >
                            <ItemIcon
                                type={itemType}
                                className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                            />

                            <span className="truncate sm:hidden xl:inline">
                                {getItemLabel(itemType)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {lessonOpen ? (
                <div className="mt-3 min-w-0 space-y-2.5 sm:mt-4 sm:space-y-3">
                    {visibleItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500 sm:px-4 sm:py-4 sm:text-sm">
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
