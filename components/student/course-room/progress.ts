import type {
    BlockProgress,
} from "@/services/progress.service";

type AnyRecord =
    Record<string, unknown>;

function normalizeLessonBlockId(
    value: unknown,
): number | null {
    const numericValue =
        Number(value);

    if (
        !Number.isFinite(
            numericValue,
        ) ||
        numericValue <= 0
    ) {
        return null;
    }

    return numericValue;
}

function toBoolean(
    value: unknown,
): boolean {
    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        return value === 1;
    }

    if (
        typeof value === "string"
    ) {
        const normalized =
            value
                .trim()
                .toLowerCase();

        return [
            "true",
            "1",
            "yes",
            "si",
            "sí",
            "completed",
            "completado",
        ].includes(normalized);
    }

    return false;
}

export function getProgressLessonBlockId(
    progress: BlockProgress,
): number | null {
    const record =
        progress as unknown as AnyRecord;

    return normalizeLessonBlockId(
        record.lesson_block_id ??
        record.lessonBlockId ??
        record.block_id ??
        record.blockId,
    );
}

export function isProgressCompleted(
    progress: BlockProgress,
): boolean {
    const record =
        progress as unknown as AnyRecord;

    if (
        "is_completed" in record
    ) {
        return toBoolean(
            record.is_completed,
        );
    }

    if (
        "isCompleted" in record
    ) {
        return toBoolean(
            record.isCompleted,
        );
    }

    if (
        "completed" in record
    ) {
        return toBoolean(
            record.completed,
        );
    }

    return Boolean(
        record.completed_at ??
        record.completedAt,
    );
}

export function includesLessonBlockId(
    blockIds:
        Array<number | string>,
    lessonBlockId:
        number | string,
): boolean {
    const normalizedLessonBlockId =
        normalizeLessonBlockId(
            lessonBlockId,
        );

    if (
        normalizedLessonBlockId ===
        null
    ) {
        return false;
    }

    return blockIds.some(
        (blockId) =>
            normalizeLessonBlockId(
                blockId,
            ) ===
            normalizedLessonBlockId,
    );
}

export function getCompletedBlockIds(
    progressRecords:
        BlockProgress[],
): number[] {
    const completedIds =
        progressRecords
            .filter(
                isProgressCompleted,
            )
            .map(
                getProgressLessonBlockId,
            )
            .filter(
                (
                    lessonBlockId,
                ): lessonBlockId is number =>
                    lessonBlockId !==
                    null,
            );

    return Array.from(
        new Set(
            completedIds,
        ),
    );
}

export function hasProgressRecord(
    progressRecords:
        BlockProgress[],
    lessonBlockId: number,
): boolean {
    return progressRecords.some(
        (progress) =>
            getProgressLessonBlockId(
                progress,
            ) ===
            Number(
                lessonBlockId,
            ),
    );
}

export function hasCompletedProgressRecord(
    progressRecords:
        BlockProgress[],
    lessonBlockId:
        number | string,
): boolean {
    const normalizedLessonBlockId =
        normalizeLessonBlockId(
            lessonBlockId,
        );

    if (
        normalizedLessonBlockId ===
        null
    ) {
        return false;
    }

    return progressRecords.some(
        (progress) =>
            isProgressCompleted(
                progress,
            ) &&
            getProgressLessonBlockId(
                progress,
            ) ===
            normalizedLessonBlockId,
    );
}