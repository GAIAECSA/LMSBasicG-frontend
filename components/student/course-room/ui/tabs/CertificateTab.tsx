import { CheckCircle2 } from "lucide-react";
import type { CourseRoomHook } from "../../hook";
import { getQuizResponseForBlock } from "../../quiz";
import { CertificatePanel } from "../CertificatePanel";
import { ProgressCard } from "../ProgressCard";

type CertificateTabProps = {
    room: CourseRoomHook;
};

export function CertificateTab({ room }: CertificateTabProps) {
    const quizRequirementsCompleted =
        room.quizBlocks.length === 0 ||
        room.quizBlocks.every(
            (block) =>
                getQuizResponseForBlock(room.quizResponses, block.id)
                    ?.is_passed === true,
        );

    const requirements = [
        {
            label: "Completar todos los contenidos del curso",
            completed: room.courseCompleted,
        },
        {
            label: "Aprobar las evaluaciones del curso",
            completed: quizRequirementsCompleted,
        },
        {
            label: "Mantener matrícula activa y aprobada",
            completed: Boolean(room.enrollmentId),
        },
    ];

    return (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
                <div className="min-w-0 overflow-hidden">
                    <CertificatePanel room={room} />
                </div>

                <section className="min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[22px]">
                    <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                        Requisitos del certificado
                    </h2>

                    <div className="mt-3 space-y-2.5">
                        {requirements.map((requirement) => (
                            <div
                                key={requirement.label}
                                className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 sm:rounded-2xl"
                            >
                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                        requirement.completed
                                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                    }`}
                                >
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>

                                <p className="min-w-0 break-words text-xs font-black leading-5 text-[var(--foreground)] sm:text-sm">
                                    {requirement.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <aside className="min-w-0">
                <ProgressCard room={room} />
            </aside>
        </div>
    );
}
