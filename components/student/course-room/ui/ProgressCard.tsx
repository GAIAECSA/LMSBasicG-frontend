import type { CourseRoomHook } from "../hook";

type ProgressCardProps = {
    room: CourseRoomHook;
};

export function ProgressCard({ room }: ProgressCardProps) {
    const safeProgress = Math.min(100, Math.max(0, room.progress));

    return (
        <div className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5">
            <h3 className="text-base font-black text-[var(--foreground)]">
                Progreso del curso
            </h3>

            <div className="mt-4 flex min-w-0 items-center gap-3 sm:gap-4">
                <div
                    className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full sm:h-20 sm:w-20"
                    style={{
                        background: `conic-gradient(var(--primary) ${safeProgress}%, var(--muted) 0)`,
                    }}
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-black text-[var(--foreground)] sm:h-14 sm:w-14 sm:text-sm">
                        {safeProgress}%
                    </div>
                </div>

                <div className="min-w-0">
                    <p className="break-words text-xl font-black text-[var(--foreground)] sm:text-2xl">
                        {room.completedCount} de {room.totalBlocks}
                    </p>

                    <p className="text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                        recursos completados
                    </p>
                </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                    className="h-2 rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${safeProgress}%` }}
                />
            </div>
        </div>
    );
}
