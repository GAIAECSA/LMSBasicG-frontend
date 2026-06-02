"use client";

import {
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    LockKeyhole,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import type { CourseRoomHook } from "../../hook";
import {
    getBlockTitle,
    getItemLabel,
    getLessonItemType,
} from "../../utils";
import { BlockIcon } from "../BlockButton";
import { ProgressCard } from "../ProgressCard";

type ActivitiesTabProps = {
    room: CourseRoomHook;
};

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return null;
    }

    return value as AnyRecord;
}

function readBoolean(
    value: unknown,
    fallback = false,
) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalizedValue = value
            .trim()
            .toLowerCase();

        if (
            [
                "true",
                "1",
                "yes",
                "si",
                "sí",
            ].includes(normalizedValue)
        ) {
            return true;
        }

        if (
            [
                "false",
                "0",
                "no",
            ].includes(normalizedValue)
        ) {
            return false;
        }
    }

    return fallback;
}

function getContentRecord(
    value: unknown,
): AnyRecord {
    if (!value) return {};

    if (
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        return value as AnyRecord;
    }

    if (typeof value === "string") {
        try {
            const parsedValue =
                JSON.parse(value) as unknown;

            if (
                parsedValue &&
                typeof parsedValue === "object" &&
                !Array.isArray(parsedValue)
            ) {
                return parsedValue as AnyRecord;
            }
        } catch {
            return {};
        }
    }

    return {};
}

function shouldShowInActivities(
    block: unknown,
) {
    const record = toRecord(block);

    if (!record) return true;

    const content =
        getContentRecord(record.content);

    const isActive = readBoolean(
        record.is_active ??
        record.isActive ??
        content.is_active ??
        content.isActive,
        true,
    );

    const isDefault = readBoolean(
        record.default ??
        record.is_default ??
        record.isDefault ??
        content.default ??
        content.is_default ??
        content.isDefault,
        true,
    );

    const isRequired = readBoolean(
        record.is_required ??
        record.required ??
        record.isRequired ??
        content.is_required ??
        content.required ??
        content.isRequired,
        false,
    );

    return (
        isActive &&
        isDefault &&
        !isRequired
    );
}

function readArray(value: unknown): unknown[] {
    return Array.isArray(value)
        ? value
        : [];
}

function getForumAlreadyAnswered(
    block: unknown,
) {
    const record = toRecord(block);

    if (!record) return false;

    const content =
        getContentRecord(record.content);

    const type = String(
        record.type ??
        record.itemType ??
        record.item_type ??
        content.type ??
        content.itemType ??
        content.item_type ??
        "",
    ).toLowerCase();

    const isForum =
        type.includes("forum") ||
        type.includes("foro") ||
        type.includes("discussion");

    if (!isForum) return false;

    const hasResponse = readBoolean(
        record.has_response ??
        record.hasResponse ??
        record.hasSubmission ??
        record.has_submission ??
        content.has_response ??
        content.hasResponse ??
        content.hasSubmission ??
        content.has_submission,
        false,
    );

    if (hasResponse) return true;

    const hasResponses =
        readArray(record.responses).length > 0 ||
        readArray(record.forumResponses).length > 0 ||
        readArray(record.forum_responses).length > 0 ||
        readArray(content.responses).length > 0 ||
        readArray(content.forumResponses).length > 0 ||
        readArray(content.forum_responses).length > 0;

    if (hasResponses) return true;

    const response =
        record.response ??
        record.forumResponse ??
        record.forum_response ??
        content.response ??
        content.forumResponse ??
        content.forum_response;

    return Boolean(response);
}

function getBlockIsCompleted(
    room: CourseRoomHook,
    block: {
        id: number;
    },
) {
    return (
        room.completedBlocks.includes(block.id) ||
        getForumAlreadyAnswered(block)
    );
}

function getBlockAvailableDate(
    block: unknown,
): Date | null {
    const record = toRecord(block);

    if (!record) return null;

    const content =
        getContentRecord(record.content);

    const rawDate =
        record.date_available ??
        record.dateAvailable ??
        content.date_available ??
        content.dateAvailable;

    if (
        typeof rawDate !== "string" ||
        !rawDate.trim()
    ) {
        return null;
    }

    const parsedDate = new Date(rawDate);

    if (
        Number.isNaN(parsedDate.getTime())
    ) {
        return null;
    }

    return parsedDate;
}

function isBlockAvailable(
    block: unknown,
    nowTimestamp: number,
) {
    const availableDate =
        getBlockAvailableDate(block);

    if (!availableDate) {
        return true;
    }

    return (
        availableDate.getTime() <=
        nowTimestamp
    );
}

function formatAvailableDate(
    block: unknown,
) {
    const availableDate =
        getBlockAvailableDate(block);

    if (!availableDate) return "";

    return new Intl.DateTimeFormat(
        "es-EC",
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(availableDate);
}

type UpcomingActivitiesCardProps = {
    room: CourseRoomHook;
    nowTimestamp: number;
};

function UpcomingActivitiesCard({
    room,
    nowTimestamp,
}: UpcomingActivitiesCardProps) {
    const upcomingBlocks = useMemo(
        () =>
            room.allBlocks
                .filter(
                    shouldShowInActivities,
                )
                .filter((block) => {
                    const availableDate =
                        getBlockAvailableDate(
                            block,
                        );

                    return (
                        availableDate !==
                        null &&
                        availableDate.getTime() >
                        nowTimestamp
                    );
                })
                .sort(
                    (
                        firstBlock,
                        secondBlock,
                    ) => {
                        const firstDate =
                            getBlockAvailableDate(
                                firstBlock,
                            );

                        const secondDate =
                            getBlockAvailableDate(
                                secondBlock,
                            );

                        return (
                            (firstDate?.getTime() ??
                                0) -
                            (secondDate?.getTime() ??
                                0)
                        );
                    },
                )
                .slice(0, 5),
        [
            room.allBlocks,
            nowTimestamp,
        ],
    );

    return (
        <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="border-b border-[var(--border)] bg-[var(--muted)] px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                        <CalendarClock className="h-5 w-5" />
                    </span>

                    <div>
                        <h3 className="text-sm font-black text-[var(--foreground)]">
                            Próximas actividades
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                            Contenidos programados de este curso.
                        </p>
                    </div>
                </div>
            </div>

            {upcomingBlocks.length === 0 ? (
                <div className="px-5 py-6 text-center">
                    <CalendarClock className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />

                    <p className="mt-3 text-sm font-bold text-[var(--muted-foreground)]">
                        No existen actividades próximas.
                    </p>
                </div>
            ) : (
                <div className="space-y-2 p-3">
                    {upcomingBlocks.map(
                        (block) => {
                            const type =
                                getLessonItemType(
                                    block,
                                );

                            return (
                                <div
                                    key={block.id}
                                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                                            <LockKeyhole className="h-4 w-4" />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-black text-amber-950">
                                                {getBlockTitle(
                                                    block,
                                                )}
                                            </p>

                                            <p className="mt-1 text-xs font-bold text-amber-700">
                                                {getItemLabel(
                                                    type,
                                                )}
                                            </p>

                                            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.08em] text-amber-800">
                                                Disponible desde:{" "}
                                                {formatAvailableDate(
                                                    block,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
            )}
        </section>
    );
}

export function ActivitiesTab({
    room,
}: ActivitiesTabProps) {
    const [
        nowTimestamp,
        setNowTimestamp,
    ] = useState(() => Date.now());

    useEffect(() => {
        const intervalId =
            window.setInterval(() => {
                setNowTimestamp(
                    Date.now(),
                );
            }, 60_000);

        return () => {
            window.clearInterval(
                intervalId,
            );
        };
    }, []);

    const visibleBlocks =
        room.allBlocks.filter(
            shouldShowInActivities,
        );

    const completedVisibleCount =
        visibleBlocks.filter(
            (block) =>
                getBlockIsCompleted(
                    room,
                    block,
                ),
        ).length;

    return (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-black text-[var(--foreground)]">
                            Actividades del curso
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                            Revisa tus recursos, evaluaciones y estados de avance.
                        </p>
                    </div>

                    <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black uppercase text-[var(--primary)]">
                        {completedVisibleCount}/
                        {visibleBlocks.length}{" "}
                        completados
                    </span>
                </div>

                {visibleBlocks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-8 text-center text-sm font-semibold text-[var(--muted-foreground)]">
                        Este curso todavía no tiene actividades.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visibleBlocks.map(
                            (block, index) => {
                                const type =
                                    getLessonItemType(
                                        block,
                                    );

                                const isCompleted =
                                    getBlockIsCompleted(
                                        room,
                                        block,
                                    );

                                const available =
                                    isBlockAvailable(
                                        block,
                                        nowTimestamp,
                                    );

                                return (
                                    <button
                                        key={block.id}
                                        type="button"
                                        disabled={
                                            !available
                                        }
                                        onClick={() => {
                                            if (
                                                !available
                                            ) {
                                                return;
                                            }

                                            room.handleSelectBlock(
                                                block,
                                            );

                                            if (
                                                type ===
                                                "forum"
                                            ) {
                                                room.setActiveTab(
                                                    "forum",
                                                );

                                                return;
                                            }

                                            if (
                                                type ===
                                                "survey"
                                            ) {
                                                room.setActiveTab(
                                                    "survey",
                                                );

                                                return;
                                            }

                                            room.setActiveTab(
                                                "content",
                                            );
                                        }}
                                        className={`flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition sm:flex-row sm:items-center ${available
                                                ? "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:shadow-sm"
                                                : "cursor-not-allowed border-amber-200 bg-amber-50 opacity-90"
                                            }`}
                                    >
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${!available
                                                    ? "bg-white text-amber-700"
                                                    : isCompleted
                                                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                                                        : "bg-[var(--secondary)] text-[var(--primary)]"
                                                }`}
                                        >
                                            {!available ? (
                                                <LockKeyhole className="h-5 w-5" />
                                            ) : isCompleted ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : (
                                                <BlockIcon
                                                    type={
                                                        type
                                                    }
                                                    className="h-5 w-5"
                                                />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`text-sm font-black ${available
                                                        ? "text-[var(--foreground)]"
                                                        : "text-amber-950"
                                                    }`}
                                            >
                                                {index +
                                                    1}
                                                .{" "}
                                                {getBlockTitle(
                                                    block,
                                                )}
                                            </p>

                                            {available ? (
                                                <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                                                    {getItemLabel(
                                                        type,
                                                    )}
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-xs font-bold text-amber-700">
                                                    Disponible desde:{" "}
                                                    {formatAvailableDate(
                                                        block,
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${!available
                                                    ? "bg-amber-100 text-amber-800"
                                                    : isCompleted
                                                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                                                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                                }`}
                                        >
                                            {!available
                                                ? "No disponible"
                                                : isCompleted
                                                    ? "Completado"
                                                    : "Pendiente"}
                                        </span>

                                        {available ? (
                                            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                                        ) : (
                                            <LockKeyhole className="h-4 w-4 text-amber-700" />
                                        )}
                                    </button>
                                );
                            },
                        )}
                    </div>
                )}
            </div>

            <aside className="space-y-5">
                <ProgressCard room={room} />

                <UpcomingActivitiesCard
                    room={room}
                    nowTimestamp={
                        nowTimestamp
                    }
                />
            </aside>
        </div>
    );
}

export default ActivitiesTab;