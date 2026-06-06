import { CheckCircle2, Loader2 } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getContentValue } from "../../utils";

type CompleteButtonProps = {
    blockId: number;
    label: string;
    completedBlocks: number[];
    progressSavingBlockId: number | null;
    onComplete: (blockId: number) => Promise<number[] | null>;
};

export function CompleteButton({
    blockId,
    label,
    completedBlocks,
    progressSavingBlockId,
    onComplete,
}: CompleteButtonProps) {
    const isCompleted = completedBlocks.includes(blockId);
    const isSaving = progressSavingBlockId === blockId;

    return (
        <button
            type="button"
            disabled={isCompleted || isSaving}
            onClick={() => void onComplete(blockId)}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-center text-xs font-bold text-[var(--primary-foreground)] transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:rounded-2xl sm:px-5 sm:text-sm"
        >
            {isSaving ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}

            <span className="min-w-0 break-words">
                {isCompleted ? "Bloque completado" : label}
            </span>
        </button>
    );
}

type TextBlockProps = {
    room: CourseRoomHook;
};

export function TextBlock({ room }: TextBlockProps) {
    if (!room.selectedBlock) return null;

    const body =
        getContentValue(room.selectedContent, "body") ||
        getContentValue(room.selectedContent, "text") ||
        getContentValue(room.selectedContent, "content_body");

    return (
        <div className="min-w-0 space-y-4">
            <div className="prose prose-slate min-w-0 max-w-none overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700 shadow-sm sm:rounded-[22px] sm:p-5 sm:text-sm sm:leading-7">
                {body ? (
                    <p className="break-words whitespace-pre-wrap">{body}</p>
                ) : (
                    <p className="break-words text-slate-500">
                        Este texto todavía no tiene información cargada.
                    </p>
                )}
            </div>

            <CompleteButton
                blockId={room.selectedBlock.id}
                label="Marcar texto como completado"
                completedBlocks={room.completedBlocks}
                progressSavingBlockId={room.progressSavingBlockId}
                onComplete={room.markBlockAsCompleted}
            />
        </div>
    );
}
