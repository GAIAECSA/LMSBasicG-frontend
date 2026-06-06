import type { CourseRoomHook } from "../hook";

type ProgressCardProps = {
    room: CourseRoomHook;
};

export function ProgressCard({ room }: ProgressCardProps) {
    const safeProgress = Math.min(100, Math.max(0, room.progress));

    return (
        <div className="min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-3.5 shadow-sm sm:rounded-[22px] sm:p-4">
            <h3 className="text-sm font-black text-[var(--foreground)] sm:text-base">
                Progreso del curso
            </h3>

            <div className="mt-3 flex min-w-0 items-center gap-3">
                <div
                    className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full sm:h-[72px] sm:w-[72px]"
                    style={{
                        background: `conic-gradient(var(--primary) ${safeProgress}%, var(--muted) 0)`,
                    }}
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[11px] font-black text-[var(--foreground)] sm:h-12 sm:w-12 sm:text-xs">
                        {safeProgress}%
                    </div>
                </div>

                <div className="min-w-0">
                    <p className="break-words text-xl font-black text-[var(--foreground)]">
                        {room.completedCount} de {room.totalBlocks}
                    </p>

                    <p className="text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                        recursos completados
                    </p>
                </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${safeProgress}%` }}
                />
            </div>
        </div>
    );
}
