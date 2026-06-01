import type { BlockProgress } from "@/services/progress.service";

export function getCompletedBlockIds(progressRecords: BlockProgress[]) {
    return progressRecords.filter((item) => item.is_completed).map((item) => item.lesson_block_id);
}

export function hasProgressRecord(progressRecords: BlockProgress[], lessonBlockId: number) {
    return progressRecords.some((item) => item.lesson_block_id === lessonBlockId);
}
