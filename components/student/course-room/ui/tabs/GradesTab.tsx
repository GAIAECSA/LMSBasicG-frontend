import { ClipboardList } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { MAX_QUIZ_ATTEMPTS } from "../../constants";
import { getQuizAttemptsCount, getQuizResponseForBlock } from "../../quiz";
import { getBlockTitle } from "../../utils";
import { GradeCard } from "../GradeCard";
import { ProgressCard } from "../ProgressCard";

type GradesTabProps = {
    room: CourseRoomHook;
};

export function GradesTab({ room }: GradesTabProps) {
    return (
        <div className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4 sm:space-y-5">
                <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                    <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                        Calificaciones
                    </h2>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
                        <Card
                            label="Promedio actual"
                            value={
                                room.averageScore > 0
                                    ? String(room.averageScore)
                                    : "-"
                            }
                        />

                        <Card
                            label="Evaluaciones"
                            value={String(room.quizBlocks.length)}
                        />

                        <Card
                            label="Aprobadas"
                            value={String(
                                room.quizResponses.filter(
                                    (response) =>
                                        response.is_passed === true,
                                ).length,
                            )}
                        />
                    </div>
                </section>

                <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                    <h3 className="text-base font-black text-[var(--foreground)]">
                        Evaluaciones registradas
                    </h3>

                    {room.quizBlocks.length === 0 ? (
                        <p className="mt-4 rounded-2xl bg-[var(--muted)] p-4 text-sm font-semibold text-[var(--muted-foreground)]">
                            Este curso todavía no tiene evaluaciones.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {room.quizBlocks.map((block) => {
                                const response = getQuizResponseForBlock(
                                    room.quizResponses,
                                    block.id,
                                );

                                const attempts =
                                    getQuizAttemptsCount(response);

                                const isPassed =
                                    response?.is_passed === true;

                                return (
                                    <button
                                        key={block.id}
                                        type="button"
                                        onClick={() => {
                                            room.handleSelectBlock(block);
                                            room.setActiveTab("content");
                                        }}
                                        className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--primary)] sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                                    >
                                        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                                    isPassed
                                                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                                                        : "bg-[var(--warning-soft)] text-[var(--warning)]"
                                                }`}
                                            >
                                                <ClipboardList className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="break-words text-sm font-black text-[var(--foreground)]">
                                                    {getBlockTitle(block)}
                                                </p>

                                                <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                                                    Intentos usados:{" "}
                                                    {attempts} de{" "}
                                                    {MAX_QUIZ_ATTEMPTS}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-left sm:block sm:border-0 sm:pt-0 sm:text-right">
                                            <p className="text-sm font-black text-[var(--foreground)]">
                                                {response
                                                    ? `${response.score} pts`
                                                    : "Sin nota"}
                                            </p>

                                            <p
                                                className={`text-xs font-black ${
                                                    isPassed
                                                        ? "text-[var(--success)]"
                                                        : "text-[var(--muted-foreground)]"
                                                }`}
                                            >
                                                {isPassed
                                                    ? "Aprobada"
                                                    : "Pendiente"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <aside className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-1">
                <GradeCard room={room} />
                <ProgressCard room={room} />
            </aside>
        </div>
    );
}

function Card({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-2xl bg-[var(--muted)] p-4">
            <p className="break-words text-xs font-bold text-[var(--muted-foreground)]">
                {label}
            </p>

            <p className="mt-2 break-words text-2xl font-black text-[var(--foreground)] sm:text-3xl">
                {value}
            </p>
        </div>
    );
}
