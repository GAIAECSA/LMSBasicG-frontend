import type { CourseRoomHook } from "../hook";
import { getBlockTitle, getItemLabel, getLessonItemType } from "../utils";
import { BlockIcon } from "./BlockButton";

type UpcomingCardProps = { room: CourseRoomHook };

export function UpcomingCard({ room }: UpcomingCardProps) {
    return <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h3 className="text-base font-black text-[var(--foreground)]">Próximas actividades</h3><span className="text-xs font-black text-[var(--primary)]">Ver calendario</span></div><div className="mt-4 space-y-4">{room.upcomingBlocks.length === 0 ? <p className="rounded-2xl bg-[var(--muted)] p-4 text-sm font-semibold text-[var(--muted-foreground)]">No tienes actividades pendientes.</p> : room.upcomingBlocks.map((block) => { const type = getLessonItemType(block); return <button key={block.id} type="button" onClick={() => room.handleSelectBlock(block)} className="flex w-full items-start gap-3 border-b border-[var(--border)] pb-4 text-left last:border-b-0 last:pb-0"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]"><BlockIcon type={type} className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-black text-[var(--foreground)]">{getBlockTitle(block)}</p><p className="text-xs font-semibold text-[var(--muted-foreground)]">{getItemLabel(type)}</p></div><span className="text-right text-xs font-bold text-[var(--muted-foreground)]">Pendiente</span></button>; })}</div></div>;
}
