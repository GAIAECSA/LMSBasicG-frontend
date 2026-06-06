import { MoreVertical } from "lucide-react";
import type { CourseRoomHook } from "../hook";
import { getItemLabel } from "../utils";
import { BlockIcon } from "./BlockButton";

type BlockHeaderProps = {
    room: CourseRoomHook;
};

export function BlockHeader({ room }: BlockHeaderProps) {
    if (!room.selectedBlock) return null;

    const isCompleted = room.completedBlocks.includes(room.selectedBlock.id);

    return (
        <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-[var(--border)] pb-4 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:pb-5">
            <div className="min-w-0">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--secondary)] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--primary)] sm:text-xs">
                    <BlockIcon type={room.selectedType} className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{getItemLabel(room.selectedType)}</span>
                </div>

                <h2 className="mt-2 break-all text-xl font-black leading-7 text-[var(--foreground)] [overflow-wrap:anywhere] sm:mt-3 sm:text-2xl">
                    {room.selectedTitle || "Bloque"}
                </h2>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                    {isCompleted
                        ? "Este bloque ya está completado."
                        : "Completa este bloque para avanzar en tu curso."}
                </p>
            </div>

            <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition hover:bg-[var(--muted)] active:scale-[0.97] sm:h-10 sm:w-10 sm:rounded-2xl"
                aria-label="Más opciones"
            >
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
        </div>
    );
}
