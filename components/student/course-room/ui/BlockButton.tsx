import {
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    FileCheck2,
    FileText,
    ImageIcon,
    LockKeyhole,
    MessageSquare,
    PlayCircle,
    Star,
} from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { LessonItemType } from "../types";
import {
    getBlockAvailableDateLabel,
    getBlockTitle,
    getItemLabel,
    getLessonItemType,
    isBlockAvailable,
} from "../utils";

type BlockIconProps = {
    type: LessonItemType;
    className: string;
};

export function BlockIcon({
    type,
    className,
}: BlockIconProps) {
    if (type === "video") {
        return <PlayCircle className={className} />;
    }

    if (type === "quiz") {
        return <ClipboardList className={className} />;
    }

    if (type === "homework") {
        return <FileCheck2 className={className} />;
    }

    if (type === "survey") {
        return <Star className={className} />;
    }

    if (type === "forum") {
        return <MessageSquare className={className} />;
    }

    if (type === "image") {
        return <ImageIcon className={className} />;
    }

    return <FileText className={className} />;
}

type BlockButtonProps = {
    block: LessonBlock;
    selectedBlockId: number | null;
    completedBlocks: number[];
    onSelect: (block: LessonBlock) => void;
};

export function BlockButton({
    block,
    selectedBlockId,
    completedBlocks,
    onSelect,
}: BlockButtonProps) {
    const type = getLessonItemType(block);

    const available = isBlockAvailable(block);
    const availableDateLabel =
        getBlockAvailableDateLabel(block);

    const isSelected =
        available && selectedBlockId === block.id;

    const isCompleted =
        available && completedBlocks.includes(block.id);

    function handleSelect() {
        if (!available) return;

        onSelect(block);
    }

    return (
        <button
            type="button"
            disabled={!available}
            onClick={handleSelect}
            title={
                available
                    ? getBlockTitle(block)
                    : `Disponible desde: ${availableDateLabel}`
            }
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${!available
                    ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-900 opacity-90"
                    : isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "border-transparent bg-[var(--muted)] text-[var(--foreground)] hover:border-[var(--border)] hover:bg-white"
                }`}
        >
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${!available
                        ? "bg-white text-amber-700"
                        : isSelected
                            ? "bg-white/15 text-white"
                            : "bg-white text-[var(--primary)]"
                    }`}
            >
                {!available ? (
                    <LockKeyhole className="h-4 w-4" />
                ) : isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <BlockIcon
                        type={type}
                        className="h-4 w-4"
                    />
                )}
            </div>

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">
                    {getBlockTitle(block)}
                </span>

                {available ? (
                    <span
                        className={`block text-xs font-semibold ${isSelected
                                ? "text-white/80"
                                : "text-[var(--muted-foreground)]"
                            }`}
                    >
                        {getItemLabel(type)}
                    </span>
                ) : (
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0" />

                        Disponible desde: {availableDateLabel}
                    </span>
                )}
            </span>

            {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : null}
        </button>
    );
}

export default BlockButton;