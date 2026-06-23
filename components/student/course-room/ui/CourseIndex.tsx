import type { LessonBlock } from "@/services/lessons.service";
import type { CourseRoomHook } from "../hook";
import { getLessonItemType } from "../utils";
import { ModuleAccordion } from "./ModuleAccordion";

type CourseIndexProps = {
    room: CourseRoomHook;
};

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    return value as AnyRecord;
}

function readBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

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
    if (!value) {
        return {};
    }

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
        } catch {
            return {};
        }
    }

    return {};
}

function shouldShowBlockInCourseIndex(block: LessonBlock) {
    const record = toRecord(block);

    if (!record) {
        return true;
    }

    const itemType = getLessonItemType(block);

    /**
     * Foro normalmente va en su propia pestaña.
     * Si quieres que el foro también aparezca en el índice,
     * borra este if.
     */
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

    return isActive;
}

export function CourseIndex({ room }: CourseIndexProps) {
    const visibleModules = room.modules
        .map((moduleItem) => {
            const visibleLessons = moduleItem.lessons
                .map((lessonItem) => ({
                    ...lessonItem,
                    blocks: lessonItem.blocks.filter(
                        shouldShowBlockInCourseIndex,
                    ),
                }))
                .filter(
                    (lessonItem) =>
                        lessonItem.blocks.length > 0,
                );

            return {
                ...moduleItem,
                lessons: visibleLessons,
            };
        })
        .filter(
            (moduleItem) =>
                moduleItem.lessons.length > 0,
        );

    return (
        <aside className="min-w-0 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-sm sm:rounded-[24px] lg:sticky lg:top-3">
            <div className="border-b border-[var(--border)] p-3.5 sm:p-4">
                <h2 className="text-sm font-black text-[var(--foreground)] sm:text-base lg:text-lg">
                    Índice del curso
                </h2>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                    Selecciona un contenido para continuar.
                </p>
            </div>

            <div className="max-h-[340px] overflow-y-auto overscroll-contain p-2.5 sm:max-h-[430px] sm:p-3 lg:max-h-[calc(100vh-165px)]">
                {visibleModules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-3 text-center text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:rounded-2xl sm:p-4 sm:text-sm">
                        Este curso todavía no tiene contenidos disponibles.
                    </div>
                ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                        {visibleModules.map(
                            (
                                moduleItem,
                                moduleIndex,
                            ) => (
                                <ModuleAccordion
                                    key={
                                        moduleItem.id
                                    }
                                    moduleItem={
                                        moduleItem
                                    }
                                    moduleIndex={
                                        moduleIndex
                                    }
                                    room={
                                        room
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default CourseIndex;