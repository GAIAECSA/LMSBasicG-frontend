import Link from "next/link";
import {
    ClipboardCheck,
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";
import type { DragState, LessonItemView, LessonView } from "../types";
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

    if (typeof value === "object") {
        return value as AnyRecord;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);

            return parsed && typeof parsed === "object"
                ? (parsed as AnyRecord)
                : {};
        } catch {
            return {};
        }
    }

    return {};
}

function shouldShowItemInModules(item: LessonItemView) {
    const record = toRecord(item);
    const rawRecord = toRecord(item.raw);

    if (!record && !rawRecord) return true;

    const content = getContentRecord(rawRecord?.content ?? record?.content);

    const isActive = readBoolean(
        rawRecord?.is_active ??
        record?.is_active ??
        record?.isActive ??
        content.is_active ??
        content.isActive,
        true,
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

    return isActive && isDefault && !isRequired;
}

function isReviewableItem(type: LessonItemView["type"]) {
    return ["homework", "quiz", "survey", "forum"].includes(type);
}

function getReviewLabel(type: LessonItemView["type"]) {
    if (type === "homework") return "Calificar";
    if (type === "quiz") return "Revisar";
    if (type === "survey") return "Respuestas";
    if (type === "forum") return "Participación";

    return "Vista previa";
}

function getReviewHelpText(type: LessonItemView["type"]) {
    if (type === "homework") return "Revisar archivos enviados";
    if (type === "quiz") return "Revisar evaluación";
    if (type === "survey") return "Ver respuestas";
    if (type === "forum") return "Ver participaciones";

    return "Abrir contenido";
}

export function ItemRow({ mods, lesson, item }: ItemRowProps) {
    if (!shouldShowItemInModules(item)) {
        return null;
    }

    const itemDragState: DragState = {
        type: "item",
        id: item.id,
        lessonId: lesson.id,
    };

    const itemIsDragging = mods.isDraggingItem(itemDragState);
    const itemIsOver = mods.isDragOverItem(itemDragState);

    const editorHref = `${mods.itemEditorBasePath}/${item.id}`;
    const reviewHref = `${mods.itemEditorBasePath}/${item.id}/review`;

    const reviewable = isReviewableItem(item.type);

    return (
        <div
            draggable
            className={`group cursor-grab rounded-2xl border bg-white px-4 py-3 shadow-sm transition active:cursor-grabbing ${itemIsDragging ? "opacity-50" : ""
                } ${itemIsOver
                    ? "border-blue-500 ring-4 ring-blue-100"
                    : "border-slate-200 hover:border-blue-100 hover:shadow-md"
                }`}
            onDragStart={(event) => mods.handleDragStart(event, itemDragState)}
            onDragEnd={mods.resetDragState}
            onDragOver={(event) => mods.handleDragOver(event, itemDragState)}
            onDrop={(event) => mods.handleDrop(event, itemDragState)}
        >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${reviewable
                            ? "bg-blue-50 text-[#172861] ring-1 ring-blue-100"
                            : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                            }`}
                    >
                        <ItemIcon type={item.type} className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={editorHref}
                                className="block truncate text-sm font-black text-slate-950 transition hover:text-[#172861] hover:underline"
                            >
                                {item.title}
                            </Link>

                            <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${reviewable
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                                    }`}
                            >
                                {getItemLabel(item.type)}
                            </span>
                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            {getReviewHelpText(item.type)}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
                    <Link
                        href={reviewHref}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black shadow-sm transition ${reviewable
                                ? "bg-[#172861] !text-white hover:bg-[#0f1d48]"
                                : "bg-white !text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                            }`}
                        title={getReviewLabel(item.type)}
                    >
                        {reviewable ? (
                            <ClipboardCheck
                                className={`h-4 w-4 ${reviewable ? "text-white" : "text-slate-700"
                                    }`}
                            />
                        ) : (
                            <Eye className="h-4 w-4 text-slate-700" />
                        )}

                        <span
                            className={`${reviewable ? "text-white" : "text-slate-700"
                                }`}
                        >
                            {getReviewLabel(item.type)}
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => mods.openEditItemModal(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                        title="Editar"
                    >
                        <Pencil className="h-4 w-4" />
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
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ItemRow;