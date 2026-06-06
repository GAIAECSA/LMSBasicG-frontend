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
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
                <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]">
                            <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                                Descripción del curso
                            </h2>

                            <p className="mt-2 break-words whitespace-pre-wrap text-xs font-semibold leading-6 text-[var(--muted-foreground)] sm:text-sm">
                                {room.courseDescription}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                                Objetivos de aprendizaje
                            </h2>

                            <div className="mt-2 space-y-2">
                                {objectives.map((objective) => (
                                    <div
                                        key={objective}
                                        className="flex items-start gap-2 break-words text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm"
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

                <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                                Requisitos
                            </h2>

                            <ul className="mt-2 space-y-2 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
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

            <aside className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <ProgressCard room={room} />
                <UpcomingCard room={room} />
            </aside>
        </div>
    );
}
