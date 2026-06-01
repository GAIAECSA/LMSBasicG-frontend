import { CheckCircle2, ChevronRight } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getBlockTitle, getItemLabel, getLessonItemType } from "../../utils";
import { BlockIcon } from "../BlockButton";
import { ProgressCard } from "../ProgressCard";
import { UpcomingCard } from "../UpcomingCard";

type ActivitiesTabProps = {
    room: CourseRoomHook;
};

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
}

function readBoolean(value: unknown, fallback = false) {
    if (typeof value === "boolean") return value;

    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}

function getContentRecord(value: unknown): AnyRecord {
    if (!value) return {};

    if (typeof value === "object" && !Array.isArray(value)) {
        return value as AnyRecord;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return parsed as AnyRecord;
            }
        } catch {
            return {};
        }
    }

    return {};
}

function shouldShowInActivities(block: unknown) {
    const record = toRecord(block);

    if (!record) return true;

    const content = getContentRecord(record.content);

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

    return isActive && isDefault && !isRequired;
}

function readArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function getForumAlreadyAnswered(block: unknown) {
    const record = toRecord(block);

    if (!record) return false;

    const content = getContentRecord(record.content);

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

    const responses =
        readArray(record.responses).length > 0 ||
        readArray(record.forumResponses).length > 0 ||
        readArray(record.forum_responses).length > 0 ||
        readArray(content.responses).length > 0 ||
        readArray(content.forumResponses).length > 0 ||
        readArray(content.forum_responses).length > 0;

    if (responses) return true;

    const response =
        record.response ??
        record.forumResponse ??
        record.forum_response ??
        content.response ??
        content.forumResponse ??
        content.forum_response;

    return Boolean(response);
}

function getBlockIsCompleted(room: CourseRoomHook, block: { id: number }) {
    return room.completedBlocks.includes(block.id) || getForumAlreadyAnswered(block);
}

export function ActivitiesTab({ room }: ActivitiesTabProps) {
    const visibleBlocks = room.allBlocks.filter(shouldShowInActivities);

    const completedVisibleCount = visibleBlocks.filter((block) =>
        getBlockIsCompleted(room, block),
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
                            Revisa tus recursos, evaluaciones y estados de
                            avance.
                        </p>
                    </div>

                    <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black uppercase text-[var(--primary)]">
                        {completedVisibleCount}/{visibleBlocks.length}{" "}
                        completados
                    </span>
                </div>

                {visibleBlocks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-8 text-center text-sm font-semibold text-[var(--muted-foreground)]">
                        Este curso todavía no tiene actividades.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visibleBlocks.map((block, index) => {
                            const type = getLessonItemType(block);
                            const isCompleted = getBlockIsCompleted(room, block);

                            return (
                                <button
                                    key={block.id}
                                    type="button"
                                    onClick={() => {
                                        room.handleSelectBlock(block);

                                        if (type === "forum") {
                                            room.setActiveTab("forum");
                                            return;
                                        }

                                        if (type === "survey") {
                                            room.setActiveTab("survey");
                                            return;
                                        }

                                        room.setActiveTab("content");
                                    }}
                                    className="flex w-full flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition hover:border-[var(--primary)] hover:shadow-sm sm:flex-row sm:items-center"
                                >
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isCompleted
                                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                                            : "bg-[var(--secondary)] text-[var(--primary)]"
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <BlockIcon
                                                type={type}
                                                className="h-5 w-5"
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-[var(--foreground)]">
                                            {index + 1}. {getBlockTitle(block)}
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                                            {getItemLabel(type)}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${isCompleted
                                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                            }`}
                                    >
                                        {isCompleted
                                            ? "Completado"
                                            : "Pendiente"}
                                    </span>

                                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <aside className="space-y-5">
                <ProgressCard room={room} />
                <UpcomingCard room={room} />
            </aside>
        </div>
    );
}

export default ActivitiesTab;