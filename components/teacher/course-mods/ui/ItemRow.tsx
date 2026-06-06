import Link from "next/link";
import {
    ArrowRight,
    ClipboardCheck,
    Pencil,
    Trash2,
} from "lucide-react";
import type {
    DragState,
    LessonItemView,
    LessonView,
} from "../types";
import type { CourseModsState } from "../hook";
import { getItemLabel } from "../utils";
import { ItemIcon } from "./ItemIcon";

type ItemRowProps = {
    mods: CourseModsState;
    lesson: LessonView;
    item: LessonItemView;
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

        if (
            ["true", "1", "yes", "si", "sí"].includes(
                normalized,
            )
        ) {
            return true;
        }

        if (
            ["false", "0", "no"].includes(
                normalized,
            )
        ) {
            return false;
        }
    }

    return fallback;
}

function getContentRecord(value: unknown): AnyRecord {
    if (!value) return {};

    if (
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
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
 * Permite mostrar bloques activos e inactivos.
 * Únicamente mantiene ocultos los bloques especiales MDT.
 */
function shouldShowItemInModules(item: LessonItemView) {
    const record = toRecord(item);
    const rawRecord = toRecord(item.raw);

    if (!record && !rawRecord) return true;

    const content = getContentRecord(
        rawRecord?.content ?? record?.content,
    );

    const isDefault = readBoolean(
        rawRecord?.default ??
        rawRecord?.is_default ??
        record?.default ??
        record?.is_default ??
        content.default ??
        content.is_default,
        true,
    );

    const isRequired = readBoolean(
        rawRecord?.is_required ??
        rawRecord?.required ??
        rawRecord?.isRequired ??
        record?.is_required ??
        record?.required ??
        record?.isRequired ??
        content.is_required ??
        content.required ??
        content.isRequired,
        false,
    );

    return isDefault && !isRequired;
}

function getItemIsActive(item: LessonItemView) {
    const record = toRecord(item);
    const rawRecord = toRecord(item.raw);

    const content = getContentRecord(
        rawRecord?.content ?? record?.content,
    );

    return readBoolean(
        rawRecord?.is_active ??
        record?.is_active ??
        record?.isActive ??
        content.is_active ??
        content.isActive,
        true,
    );
}

function isReviewableItem(type: LessonItemView["type"]) {
    return [
        "homework",
        "quiz",
        "survey",
        "forum",
    ].includes(type);
}

function getReviewLabel(type: LessonItemView["type"]) {
    if (type === "homework") return "Calificar";
    if (type === "quiz") return "Revisar";
    if (type === "survey") return "Respuestas";
    if (type === "forum") return "Participación";

    return "Vista previa";
}

function getReviewHelpText(type: LessonItemView["type"]) {
    if (type === "homework") {
        return "Revisar archivos enviados";
    }

    if (type === "quiz") {
        return "Revisar evaluación";
    }

    if (type === "survey") {
        return "Ver respuestas";
    }

    if (type === "forum") {
        return "Ver participaciones";
    }

    return "Abrir contenido";
}

export function ItemRow({
    mods,
    lesson,
    item,
}: ItemRowProps) {
    if (!shouldShowItemInModules(item)) {
        return null;
    }

    const itemIsActive = getItemIsActive(item);

    const itemDragState: DragState = {
        type: "item",
        id: item.id,
        lessonId: lesson.id,
    };

    const itemIsDragging =
        mods.isDraggingItem(itemDragState);

    const itemIsOver =
        mods.isDragOverItem(itemDragState);

    /*
     * Esta es la misma ruta que anteriormente se abría
     * al presionar el nombre de la actividad.
     */
    const editorHref =
        `${mods.itemEditorBasePath}/${item.id}`;

    const reviewHref =
        `${mods.itemEditorBasePath}/${item.id}/review`;

    const reviewable =
        isReviewableItem(item.type);

    return (
        <div
            draggable
            className={`group min-w-0 cursor-grab rounded-xl border px-3 py-2.5 shadow-sm transition active:cursor-grabbing sm:rounded-2xl sm:px-4 sm:py-3 ${itemIsActive
                    ? "bg-white"
                    : "bg-amber-50/70"
                } ${itemIsDragging
                    ? "opacity-50"
                    : ""
                } ${itemIsOver
                    ? "border-blue-500 ring-4 ring-blue-100"
                    : itemIsActive
                        ? "border-slate-200 hover:border-blue-100 hover:shadow-md"
                        : "border-amber-200 hover:border-amber-300 hover:shadow-md"
                }`}
            onDragStart={(event) =>
                mods.handleDragStart(
                    event,
                    itemDragState,
                )
            }
            onDragEnd={mods.resetDragState}
            onDragOver={(event) =>
                mods.handleDragOver(
                    event,
                    itemDragState,
                )
            }
            onDrop={(event) =>
                mods.handleDrop(
                    event,
                    itemDragState,
                )
            }
        >
            <div className="flex min-w-0 flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl ${reviewable
                                ? "bg-blue-50 text-[#172861] ring-1 ring-blue-100"
                                : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                            }`}
                    >
                        <ItemIcon
                            type={item.type}
                            className="h-4 w-4 sm:h-5 sm:w-5"
                        />
                    </span>

                    <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                            {/*
                              El nombre ahora es informativo.
                              Ya no es necesario presionarlo para entrar.
                            */}
                            <p
                                title={item.title}
                                className="max-w-full truncate text-xs font-black text-slate-950 sm:text-sm"
                            >
                                {item.title}
                            </p>

                            <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] sm:px-2.5 sm:py-1 sm:text-[10px] ${reviewable
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                            >
                                {getItemLabel(item.type)}
                            </span>

                            <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ring-1 sm:px-2.5 sm:py-1 sm:text-[10px] ${itemIsActive
                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                        : "bg-amber-100 text-amber-800 ring-amber-200"
                                    }`}
                            >
                                {itemIsActive
                                    ? "Activo"
                                    : "Inactivo"}
                            </span>
                        </div>

                        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs">
                            {getReviewHelpText(item.type)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end sm:gap-2">
                    {/*
                      Nuevo botón visible para ingresar a la actividad.
                    */}
                    <Link
                        href={editorHref}
                        title="Entrar a la actividad"
                        className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[10px] font-black !text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-[0.97] sm:h-10 sm:px-4 sm:text-xs"
                    >
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                        <span className="truncate">
                            Entrar
                        </span>
                    </Link>

                    {reviewable ? (
                        <Link
                            href={reviewHref}
                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-[10px] font-black !text-white shadow-sm transition hover:bg-[#0f1d48] active:scale-[0.97] sm:h-10 sm:px-4 sm:text-xs"
                            title={getReviewLabel(
                                item.type,
                            )}
                        >
                            <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-white sm:h-4 sm:w-4" />

                            <span className="truncate text-white">
                                {getReviewLabel(
                                    item.type,
                                )}
                            </span>
                        </Link>
                    ) : null}

                    <button
                        type="button"
                        onClick={() =>
                            mods.openEditItemModal(item)
                        }
                        className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-[10px] font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 active:scale-[0.96] sm:w-9 sm:px-0"
                        title="Editar actividad"
                    >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />

                        <span className="sm:hidden">
                            Editar
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            mods.openDeleteModal({
                                type: "item",
                                id: item.id,
                                title: item.title,
                            })
                        }
                        className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-[10px] font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 active:scale-[0.96] sm:w-9 sm:px-0"
                        title="Eliminar actividad"
                    >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />

                        <span className="sm:hidden">
                            Eliminar
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ItemRow;