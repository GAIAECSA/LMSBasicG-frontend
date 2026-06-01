import { MoreVertical } from "lucide-react";
import type { CourseRoomHook } from "../hook";
import { getItemLabel } from "../utils";
import { BlockIcon } from "./BlockButton";

type BlockHeaderProps = { room: CourseRoomHook };

export function BlockHeader({ room }: BlockHeaderProps) {
    if (!room.selectedBlock) return null;
    return <div className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black uppercase tracking-wide text-[var(--primary)]"><BlockIcon type={room.selectedType} className="h-3.5 w-3.5" />{getItemLabel(room.selectedType)}</div><h2 className="mt-3 text-2xl font-black text-[var(--foreground)]">{room.selectedTitle || "Bloque"}</h2><p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">{room.completedBlocks.includes(room.selectedBlock.id) ? "Este bloque ya está completado." : "Completa este bloque para avanzar en tu curso."}</p></div><button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm hover:bg-[var(--muted)]"><MoreVertical className="h-5 w-5" /></button></div>;
}
