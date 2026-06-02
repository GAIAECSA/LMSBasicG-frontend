import type { CourseRoomHook } from "../hook";
import { getBlockTitle, getItemLabel, getLessonItemType } from "../utils";
import { BlockIcon } from "./BlockButton";

type UpcomingCardProps = {
    room: CourseRoomHook;
};

export function UpcomingCard({ room }: UpcomingCardProps) {
    return (
        <div className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
                <h3 className="text-base font-black text-[var(--foreground)]">
                    Próximas actividades
                </h3>

                <span className="shrink-0 text-xs font-black text-[var(--primary)]">
                    Ver calendario
                </span>
            </div>

            <div className="mt-4 space-y-3 sm:space-y-4">
                {room.upcomingBlocks.length === 0 ? (
                    <p className="rounded-2xl bg-[var(--muted)] p-4 text-sm font-semibold text-[var(--muted-foreground)]">
                        No tienes actividades pendientes.
                    </p>
                ) : (
                    room.upcomingBlocks.map((block) => {
                        const type = getLessonItemType(block);

                        return (
                            <button
                                key={block.id}
                                type="button"
                                onClick={() => room.handleSelectBlock(block)}
                                className="flex w-full min-w-0 items-start gap-3 border-b border-[var(--border)] pb-3 text-left transition hover:opacity-80 last:border-b-0 last:pb-0 sm:pb-4"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]">
                                    <BlockIcon
                                        type={type}
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="break-words text-sm font-black text-[var(--foreground)]">
                                        {getBlockTitle(block)}
                                    </p>

                                    <p className="mt-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                                        {getItemLabel(type)}
                                    </p>
                                </div>

                                <span className="hidden shrink-0 rounded-full bg-[var(--muted)] px-2.5 py-1 text-right text-[10px] font-black text-[var(--muted-foreground)] sm:inline-flex">
                                    Pendiente
                                </span>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
