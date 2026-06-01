import { Star } from "lucide-react";
import type { CourseRoomHook } from "../hook";

type GradeCardProps = { room: CourseRoomHook };

export function GradeCard({ room }: GradeCardProps) {
    return <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Star className="h-5 w-5" /></div><div><h3 className="text-base font-black text-[var(--foreground)]">Calificación actual</h3><p className="mt-2 text-sm font-black text-[var(--foreground)]">{room.averageScore > 0 ? `${room.averageScore} puntos` : "Sin calificar aún"}</p><p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">Completa las evaluaciones para obtener tu calificación.</p></div></div></div>;
}
