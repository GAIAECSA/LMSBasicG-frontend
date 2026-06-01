import type { LessonBlock } from "@/services/lessons.service";
import type { CourseRoomHook } from "../hook";
import { getLessonItemType } from "../utils";
import { ModuleAccordion } from "./ModuleAccordion";

type CourseIndexProps = {
    room: CourseRoomHook;
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
        } catch {
            return {};
        }
    }

    return {};
}

function shouldShowBlockInCourseIndex(block: LessonBlock) {
    const record = toRecord(block);

    if (!record) return true;

    const itemType = getLessonItemType(block);

    if (itemType === "forum") {
        return false;
    }

    const content = getContentRecord(record.content);

    const isActive = readBoolean(
        record.is_active ??
        record.isActive ??
        content.is_active ??
        content.isActive,
        true,
    );

    const isDefault = readBoolean(
        record.default ??
        record.is_default ??
        record.isDefault ??
        content.default ??
        content.is_default ??
        content.isDefault,
        true,
    );

    const isRequired = readBoolean(
        record.is_required ??
        record.required ??
        record.isRequired ??
        content.is_required ??
        content.required ??
        content.isRequired,
        false,
    );

    return isActive && isDefault && !isRequired;
}

export function CourseIndex({ room }: CourseIndexProps) {
    const visibleModules = room.modules
        .map((moduleItem) => {
            const visibleLessons = moduleItem.lessons
                .map((lessonItem) => {
                    const visibleBlocks = lessonItem.blocks.filter(
                        shouldShowBlockInCourseIndex,
                    );

                    return {
                        ...lessonItem,
                        blocks: visibleBlocks,
                    };
                })
                .filter((lessonItem) => lessonItem.blocks.length > 0);

            return {
                ...moduleItem,
                lessons: visibleLessons,
            };
        })
        .filter((moduleItem) => moduleItem.lessons.length > 0);

    return (
        <aside className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="border-b border-[var(--border)] p-5">
                <h2 className="text-lg font-black text-[var(--foreground)]">
                    Índice del curso
                </h2>
            </div>

            <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-4">
                {visibleModules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-5 text-center text-sm font-semibold text-[var(--muted-foreground)]">
                        Este curso todavía no tiene contenidos disponibles.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visibleModules.map((moduleItem, moduleIndex) => (
                            <ModuleAccordion
                                key={moduleItem.id}
                                moduleItem={moduleItem}
                                moduleIndex={moduleIndex}
                                room={room}
                            />
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default CourseIndex;