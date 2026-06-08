import {
    Star,
} from "lucide-react";

import type {
    CourseRoomHook,
} from "../hook";

type GradeCardProps = {
    room: CourseRoomHook;
    averageScore?: number | null;
    gradedCount?: number;
    scoredCount?: number;
};

export function GradeCard({
    room,
    averageScore,
    gradedCount = 0,
    scoredCount = 0,
}: GradeCardProps) {
    const resolvedAverageScore =
        averageScore === undefined
            ? room.averageScore > 0
                ? room.averageScore
                : null
            : averageScore;

    return (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Star className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <h3 className="text-base font-black text-[var(--foreground)]">
                        Calificación actual
                    </h3>

                    <p className="mt-2 text-sm font-black text-[var(--foreground)]">
                        {resolvedAverageScore ===
                            null
                            ? "Sin calificar aún"
                            : `${resolvedAverageScore} puntos`}
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                        {gradedCount === 0
                            ? "Este curso todavía no tiene actividades que cuenten para la nota final."
                            : `Se han calificado ${scoredCount} de ${gradedCount} actividades evaluables.`}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default GradeCard;