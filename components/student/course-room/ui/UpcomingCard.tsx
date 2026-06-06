import type { CourseRoomHook } from "../hook";
import { getBlockTitle, getItemLabel, getLessonItemType } from "../utils";
import { BlockIcon } from "./BlockButton";

type UpcomingCardProps = {
    room: CourseRoomHook;
};

export function UpcomingCard({ room }: UpcomingCardProps) {
    return (
        <div className="min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-3.5 shadow-sm sm:rounded-[22px] sm:p-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[var(--foreground)] sm:text-base">
                    Próximas actividades
                </h3>

                <span className="shrink-0 text-[11px] font-black text-[var(--primary)] sm:text-xs">
                    Ver calendario
                </span>
            </div>

            <div className="mt-3 space-y-2.5">
                {room.upcomingBlocks.length === 0 ? (
                    <p className="rounded-xl bg-[var(--muted)] p-3 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:rounded-2xl sm:text-sm">
                        No tienes actividades pendientes.
                    </p>
                ) : (
                    room.upcomingBlocks.slice(0, 4).map((block) => {
                        const type = getLessonItemType(block);

                        return (
                            <button
                                key={block.id}
                                type="button"
                                onClick={() => room.handleSelectBlock(block)}
                                className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2.5 border-b border-[var(--border)] pb-2.5 text-left transition hover:opacity-80 last:border-b-0 last:pb-0"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]">
                                    <BlockIcon type={type} className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                    <p className="line-clamp-2 break-all text-xs font-black leading-4 text-[var(--foreground)] [overflow-wrap:anywhere] sm:text-sm sm:leading-5">
                                        {getBlockTitle(block)}
                                    </p>

                                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted-foreground)] sm:text-xs">
                                        {getItemLabel(type)}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
