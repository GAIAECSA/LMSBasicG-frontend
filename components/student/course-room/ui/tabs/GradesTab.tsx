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
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
                <section className="min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                        Calificaciones
                    </h2>

                    <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                        <Card
                            label="Promedio actual"
                            value={room.averageScore > 0 ? String(room.averageScore) : "-"}
                        />
                        <Card
                            label="Evaluaciones"
                            value={String(room.quizBlocks.length)}
                        />
                        <Card
                            label="Aprobadas"
                            value={String(
                                room.quizResponses.filter(
                                    (response) => response.is_passed === true,
                                ).length,
                            )}
                        />
                    </div>
                </section>

                <section className="min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <h3 className="text-sm font-black text-[var(--foreground)] sm:text-base">
                        Evaluaciones registradas
                    </h3>

                    {room.quizBlocks.length === 0 ? (
                        <p className="mt-3 rounded-xl bg-[var(--muted)] p-3 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:rounded-2xl sm:text-sm">
                            Este curso todavía no tiene evaluaciones.
                        </p>
                    ) : (
                        <div className="mt-3 space-y-2.5">
                            {room.quizBlocks.map((block) => {
                                const response = getQuizResponseForBlock(
                                    room.quizResponses,
                                    block.id,
                                );

                                const attempts = getQuizAttemptsCount(response);
                                const isPassed = response?.is_passed === true;

                                return (
                                    <button
                                        key={block.id}
                                        type="button"
                                        onClick={() => {
                                            room.handleSelectBlock(block);
                                            room.setActiveTab("content");
                                        }}
                                        className="flex w-full min-w-0 flex-col gap-2.5 rounded-xl border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--primary)] active:scale-[0.99] sm:flex-row sm:items-center sm:rounded-2xl"
                                    >
                                        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                    isPassed
                                                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                                                        : "bg-[var(--warning-soft)] text-[var(--warning)]"
                                                }`}
                                            >
                                                <ClipboardList className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 break-all text-xs font-black leading-5 text-[var(--foreground)] [overflow-wrap:anywhere] sm:text-sm">
                                                    {getBlockTitle(block)}
                                                </p>

                                                <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted-foreground)] sm:text-xs">
                                                    Intentos usados: {attempts} de{" "}
                                                    {MAX_QUIZ_ATTEMPTS}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border)] pt-2.5 sm:block sm:border-0 sm:pt-0 sm:text-right">
                                            <p className="text-xs font-black text-[var(--foreground)] sm:text-sm">
                                                {response
                                                    ? `${response.score} pts`
                                                    : "Sin nota"}
                                            </p>

                                            <p
                                                className={`text-[11px] font-black sm:text-xs ${
                                                    isPassed
                                                        ? "text-[var(--success)]"
                                                        : "text-[var(--muted-foreground)]"
                                                }`}
                                            >
                                                {isPassed ? "Aprobada" : "Pendiente"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <aside className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <GradeCard room={room} />
                <ProgressCard room={room} />
            </aside>
        </div>
    );
}

function Card({ label, value }: { label: string; value: string }) {
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
