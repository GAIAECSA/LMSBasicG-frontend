import { CheckCircle2, ClipboardList, FileCheck2, FileText, ImageIcon, MessageSquare, PlayCircle, Star } from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { LessonItemType } from "../types";
import { getBlockTitle, getItemLabel, getLessonItemType } from "../utils";

type BlockIconProps = { type: LessonItemType; className: string };

export function BlockIcon({ type, className }: BlockIconProps) {
    if (type === "video") return <PlayCircle className={className} />;
    if (type === "quiz") return <ClipboardList className={className} />;
    if (type === "homework") return <FileCheck2 className={className} />;
    if (type === "survey") return <Star className={className} />;
    if (type === "forum") return <MessageSquare className={className} />;
    if (type === "image") return <ImageIcon className={className} />;
    return <FileText className={className} />;
}

type BlockButtonProps = { block: LessonBlock; selectedBlockId: number | null; completedBlocks: number[]; onSelect: (block: LessonBlock) => void };

export function BlockButton({ block, selectedBlockId, completedBlocks, onSelect }: BlockButtonProps) {
    const type = getLessonItemType(block);
    const isSelected = selectedBlockId === block.id;
    const isCompleted = completedBlocks.includes(block.id);
    return <button type="button" onClick={() => onSelect(block)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${isSelected ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-transparent bg-[var(--muted)] text-[var(--foreground)] hover:border-[var(--border)] hover:bg-white"}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-white/15 text-white" : "bg-white text-[var(--primary)]"}`}>{isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <BlockIcon type={type} className="h-4 w-4" />}</div><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{getBlockTitle(block)}</span><span className={`block text-xs font-semibold ${isSelected ? "text-white/80" : "text-[var(--muted-foreground)]"}`}>{getItemLabel(type)}</span></span>{isCompleted ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}</button>;
}
