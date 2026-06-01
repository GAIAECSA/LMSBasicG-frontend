import { CheckCircle2, ClipboardList, FileText } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { ProgressCard } from "../ProgressCard";
import { UpcomingCard } from "../UpcomingCard";

type SummaryTabProps = {
    room: CourseRoomHook;
};

export function SummaryTab({ room }: SummaryTabProps) {
    const objectives = [
        "Revisar los contenidos principales del curso.",
        "Completar los recursos y actividades de cada módulo.",
        "Aprobar las evaluaciones necesarias para obtener el certificado.",
    ];

    const requirements = [
        "Contar con acceso activo al curso.",
        "Revisar los materiales en el orden sugerido.",
        "Completar videos, lecturas, imágenes, PDF y evaluaciones.",
    ];

    return (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
                <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                            <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-black text-[var(--foreground)]">
                                Descripción del curso
                            </h2>

                            <p className="mt-3 break-words whitespace-pre-wrap text-sm font-semibold leading-7 text-[var(--muted-foreground)]">
                                {room.courseDescription}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--success-soft)] text-[var(--success)]">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-black text-[var(--foreground)]">
                                Objetivos de aprendizaje
                            </h2>

                            <div className="mt-3 space-y-2">
                                {objectives.map((objective) => (
                                    <div
                                        key={objective}
                                        className="flex items-start gap-2 break-words text-sm font-semibold text-[var(--muted-foreground)]"
                                    >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />

                                        <span className="min-w-0 break-words">
                                            {objective}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-black text-[var(--foreground)]">
                                Requisitos
                            </h2>

                            <ul className="mt-3 space-y-2 text-sm font-semibold text-[var(--muted-foreground)]">
                                {requirements.map((requirement) => (
                                    <li
                                        key={requirement}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="shrink-0">•</span>

                                        <span className="min-w-0 break-words">
                                            {requirement}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </div>

            <aside className="space-y-5">
                <ProgressCard room={room} />
                <UpcomingCard room={room} />
            </aside>
        </div>
    );
}