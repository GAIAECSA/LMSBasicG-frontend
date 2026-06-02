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
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-bold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
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

    const description = getContentValue(
        room.selectedContent,
        "description",
    );

    return (
        <div className="min-w-0 space-y-4 sm:space-y-5">
            {/*  {description ? (
                <div className="min-w-0 break-words whitespace-pre-wrap rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                    {description}
                </div>
            ) : null} */}

            <div className="prose prose-slate min-w-0 max-w-none overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm sm:rounded-[24px] sm:p-6">
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
