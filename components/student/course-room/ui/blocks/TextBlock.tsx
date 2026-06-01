import { CheckCircle2, Loader2 } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getContentValue } from "../../utils";

type CompleteButtonProps = { blockId: number; label: string; completedBlocks: number[]; progressSavingBlockId: number | null; onComplete: (blockId: number) => Promise<number[] | null> };

export function CompleteButton({ blockId, label, completedBlocks, progressSavingBlockId, onComplete }: CompleteButtonProps) {
    const isCompleted = completedBlocks.includes(blockId);
    const isSaving = progressSavingBlockId === blockId;
    return <button type="button" disabled={isCompleted || isSaving} onClick={() => void onComplete(blockId)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-bold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{isCompleted ? "Bloque completado" : label}</button>;
}

type TextBlockProps = { room: CourseRoomHook };

export function TextBlock({ room }: TextBlockProps) {
    if (!room.selectedBlock) return null;
    const body = getContentValue(room.selectedContent, "body") || getContentValue(room.selectedContent, "text") || getContentValue(room.selectedContent, "content_body");
    return <div className="space-y-5">{getContentValue(room.selectedContent, "description") ? <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">{getContentValue(room.selectedContent, "description")}</div> : null}<div className="prose prose-slate max-w-none rounded-[24px] border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700">{body ? <p className="whitespace-pre-line">{body}</p> : <p className="text-slate-500">Este texto todavía no tiene información cargada.</p>}</div><CompleteButton blockId={room.selectedBlock.id} label="Marcar texto como completado" completedBlocks={room.completedBlocks} progressSavingBlockId={room.progressSavingBlockId} onComplete={room.markBlockAsCompleted} /></div>;
}
