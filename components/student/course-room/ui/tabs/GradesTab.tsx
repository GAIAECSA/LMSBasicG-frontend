import {
    ClipboardList,
    FileCheck2,
} from "lucide-react";

import type {
    LessonBlock,
} from "@/services/lessons.service";

import type {
    CourseRoomHook,
} from "../../hook";

import {
    MAX_QUIZ_ATTEMPTS,
} from "../../constants";

import {
    getQuizAttemptsCount,
    getQuizResponseForBlock,
} from "../../quiz";

import type {
    StudentBlockResponse,
} from "../../types";

import {
    getBlockTitle,
    getLessonItemType,
} from "../../utils";

import {
    GradeCard,
} from "../GradeCard";

import {
    ProgressCard,
} from "../ProgressCard";

type GradesTabProps = {
    room: CourseRoomHook;
};

type AnyRecord =
    Record<string, unknown>;

function toRecord(
    value: unknown,
): AnyRecord | null {
    if (
        !value ||
        typeof value !== "object"
    ) {
        return null;
    }

    return value as AnyRecord;
}

function toBoolean(
    value: unknown,
): boolean {
    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        return value === 1;
    }

    if (
        typeof value === "string"
    ) {
        return [
            "true",
            "1",
            "yes",
            "si",
            "sí",
        ].includes(
            value
                .trim()
                .toLowerCase(),
        );
    }

    return false;
}

function countsTowardFinalGrade(
    block: LessonBlock,
): boolean {
    const blockRecord =
        block as LessonBlock &
        AnyRecord;

    const contentRecord =
        toRecord(
            block.content,
        );

    return (
        toBoolean(
            blockRecord
                .counts_toward_grade,
        ) ||
        toBoolean(
            contentRecord
                ?.counts_toward_grade,
        ) ||
        toBoolean(
            contentRecord
                ?.countsTowardGrade,
        )
    );
}

function getResponseScore(
    response: unknown,
): number | null {
    const record =
        toRecord(response);

    if (!record) {
        return null;
    }

    const value =
        record.score ??
        record.grade ??
        record.final_grade ??
        record.finalGrade;

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const numericValue =
        Number(value);

    return Number.isFinite(
        numericValue,
    )
        ? numericValue
        : null;
}

function formatScore(
    score: number | null,
): string {
    if (score === null) {
        return "Sin nota";
    }

    return Number.isInteger(score)
        ? `${score} pts`
        : `${score.toFixed(2)} pts`;
}

function getHomeworkResponse(
    responses: Record<
        number,
        StudentBlockResponse | null
    >,
    blockId: number,
) {
    return (
        responses[blockId] ??
        null
    );
}

export function GradesTab({
    room,
}: GradesTabProps) {
    const gradedActivities =
        room.allBlocks.filter(
            countsTowardFinalGrade,
        );

    const activityRows =
        gradedActivities.map(
            (block) => {
                const type =
                    getLessonItemType(
                        block,
                    );

                const quizResponse =
                    type === "quiz"
                        ? getQuizResponseForBlock(
                            room.quizResponses,
                            block.id,
                        )
                        : null;

                const homeworkResponse =
                    type === "homework"
                        ? getHomeworkResponse(
                            room.homeworkResponses,
                            block.id,
                        )
                        : null;

                const response =
                    quizResponse ??
                    homeworkResponse;

                const score =
                    getResponseScore(
                        response,
                    );

                const attempts =
                    type === "quiz"
                        ? getQuizAttemptsCount(
                            quizResponse,
                        )
                        : null;

                let status =
                    "Pendiente";

                let statusClass =
                    "text-[var(--muted-foreground)]";

                if (
                    type === "quiz" &&
                    quizResponse
                        ?.is_passed ===
                    true
                ) {
                    status =
                        "Aprobada";

                    statusClass =
                        "text-[var(--success)]";
                } else if (
                    type === "quiz" &&
                    quizResponse
                ) {
                    status =
                        "No aprobada";

                    statusClass =
                        "text-[var(--warning)]";
                } else if (
                    type ===
                    "homework" &&
                    score !== null
                ) {
                    status =
                        "Calificada";

                    statusClass =
                        "text-[var(--success)]";
                } else if (
                    type ===
                    "homework" &&
                    homeworkResponse
                ) {
                    status =
                        "Pendiente de calificación";

                    statusClass =
                        "text-[var(--warning)]";
                } else if (
                    type ===
                    "homework"
                ) {
                    status =
                        "Pendiente de envío";
                }

                return {
                    block,
                    type,
                    score,
                    attempts,
                    status,
                    statusClass,
                    isCompleted:
                        score !== null,
                };
            },
        );

    const scoredRows =
        activityRows.filter(
            (row) =>
                row.score !== null,
        );

    const averageScore =
        scoredRows.length > 0
            ? Number(
                (
                    scoredRows.reduce(
                        (
                            total,
                            row,
                        ) =>
                            total +
                            (
                                row.score ??
                                0
                            ),
                        0,
                    ) /
                    scoredRows.length
                ).toFixed(2),
            )
            : null;

    return (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
                <section className="min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                        Calificaciones
                    </h2>

                    <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                        <Card
                            label="Promedio actual"
                            value={
                                averageScore ===
                                    null
                                    ? "-"
                                    : String(
                                        averageScore,
                                    )
                            }
                        />

                        <Card
                            label="Actividades evaluables"
                            value={String(
                                gradedActivities.length,
                            )}
                        />

                        <Card
                            label="Calificadas"
                            value={String(
                                scoredRows.length,
                            )}
                        />
                    </div>
                </section>

                <section className="min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <h3 className="text-sm font-black text-[var(--foreground)] sm:text-base">
                        Actividades que cuentan para la nota final
                    </h3>

                    {activityRows.length ===
                        0 ? (
                        <p className="mt-3 rounded-xl bg-[var(--muted)] p-3 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:rounded-2xl sm:text-sm">
                            Este curso todavía no
                            tiene actividades que
                            cuenten para la nota
                            final.
                        </p>
                    ) : (
                        <div className="mt-3 space-y-2.5">
                            {activityRows.map(
                                (row) => {
                                    const isHomework =
                                        row.type ===
                                        "homework";

                                    return (
                                        <button
                                            key={
                                                row
                                                    .block
                                                    .id
                                            }
                                            type="button"
                                            onClick={() => {
                                                room.handleSelectBlock(
                                                    row.block,
                                                );

                                                room.setActiveTab(
                                                    "content",
                                                );
                                            }}
                                            className="flex w-full min-w-0 flex-col gap-2.5 rounded-xl border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--primary)] active:scale-[0.99] sm:flex-row sm:items-center sm:rounded-2xl"
                                        >
                                            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${row.isCompleted
                                                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                                                            : "bg-[var(--warning-soft)] text-[var(--warning)]"
                                                        }`}
                                                >
                                                    {isHomework ? (
                                                        <FileCheck2 className="h-5 w-5" />
                                                    ) : (
                                                        <ClipboardList className="h-5 w-5" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="line-clamp-2 break-all text-xs font-black leading-5 text-[var(--foreground)] [overflow-wrap:anywhere] sm:text-sm">
                                                        {getBlockTitle(
                                                            row.block,
                                                        )}
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted-foreground)] sm:text-xs">
                                                        {row.type ===
                                                            "quiz"
                                                            ? `Evaluación · Intentos usados: ${row.attempts ?? 0} de ${MAX_QUIZ_ATTEMPTS}`
                                                            : row.type ===
                                                                "homework"
                                                                ? "Tarea calificable"
                                                                : "Actividad calificable"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border)] pt-2.5 sm:block sm:border-0 sm:pt-0 sm:text-right">
                                                <p className="text-xs font-black text-[var(--foreground)] sm:text-sm">
                                                    {formatScore(
                                                        row.score,
                                                    )}
                                                </p>

                                                <p
                                                    className={`text-[11px] font-black sm:text-xs ${row.statusClass}`}
                                                >
                                                    {
                                                        row.status
                                                    }
                                                </p>
                                            </div>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    )}
                </section>
            </div>

            <aside className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <GradeCard
                    room={room}
                    averageScore={
                        averageScore
                    }
                    gradedCount={
                        gradedActivities.length
                    }
                    scoredCount={
                        scoredRows.length
                    }
                />

                <ProgressCard
                    room={room}
                />
            </aside>
        </div>
    );
}

function Card({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 rounded-xl bg-[var(--muted)] p-3 sm:rounded-2xl">
            <p className="break-words text-[11px] font-bold text-[var(--muted-foreground)] sm:text-xs">
                {label}
            </p>

            <p className="mt-1.5 break-words text-xl font-black text-[var(--foreground)] sm:text-2xl">
                {value}
            </p>
        </div>
    );
}