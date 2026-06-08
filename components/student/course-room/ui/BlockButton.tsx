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

import type {
    LessonBlock,
} from "@/services/lessons.service";

import type {
    LessonItemType,
} from "../types";

import {
    includesLessonBlockId,
} from "../progress";

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
        return (
            <PlayCircle
                className={className}
            />
        );
    }

    if (type === "quiz") {
        return (
            <ClipboardList
                className={className}
            />
        );
    }

    if (type === "homework") {
        return (
            <FileCheck2
                className={className}
            />
        );
    }

    if (type === "survey") {
        return (
            <Star
                className={className}
            />
        );
    }

    if (type === "forum") {
        return (
            <MessageSquare
                className={className}
            />
        );
    }

    if (type === "image") {
        return (
            <ImageIcon
                className={className}
            />
        );
    }

    return (
        <FileText
            className={className}
        />
    );
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
    const type =
        getLessonItemType(block);

    const available =
        isBlockAvailable(block);

    const availableDateLabel =
        getBlockAvailableDateLabel(
            block,
        );

    const isSelected =
        available &&
        Number(selectedBlockId) ===
        Number(block.id);

    const isCompleted =
        available &&
        includesLessonBlockId(
            completedBlocks,
            block.id,
        );

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
            className={`grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${!available
                ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-900 opacity-90"
                : isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-transparent bg-[var(--muted)] text-[var(--foreground)] hover:border-[var(--border)] hover:bg-white"
                }`}
        >
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${!available
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

            <span className="min-w-0">
                <span className="line-clamp-2 break-all text-xs font-black leading-4 [overflow-wrap:anywhere] sm:text-sm sm:leading-5">
                    {getBlockTitle(block)}
                </span>

                {available ? (
                    <span
                        className={`mt-0.5 block text-[11px] font-semibold sm:text-xs ${isSelected
                            ? "text-white/80"
                            : "text-[var(--muted-foreground)]"
                            }`}
                    >
                        {getItemLabel(type)}
                    </span>
                ) : (
                    <span className="mt-1 flex min-w-0 items-start gap-1 text-[10px] font-bold leading-4 text-amber-700 sm:text-[11px]">
                        <CalendarClock className="mt-0.5 h-3 w-3 shrink-0" />

                        <span className="min-w-0 break-words">
                            Disponible desde:{" "}
                            {availableDateLabel}
                        </span>
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
