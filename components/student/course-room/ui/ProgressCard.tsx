import type { CourseRoomHook } from "../hook";

type ProgressCardProps = { room: CourseRoomHook };

export function ProgressCard({ room }: ProgressCardProps) {
    return <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"><h3 className="text-base font-black text-[var(--foreground)]">Progreso del curso</h3><div className="mt-4 flex items-center gap-4"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${room.progress}%, var(--muted) 0)` }}><div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-black">{room.progress}%</div></div><div><p className="text-2xl font-black text-[var(--foreground)]">{room.completedCount} de {room.totalBlocks}</p><p className="text-sm font-semibold text-[var(--muted-foreground)]">recursos completados</p></div></div><div className="mt-4 h-2 rounded-full bg-[var(--muted)]"><div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${room.progress}%` }} /></div></div>;
}
