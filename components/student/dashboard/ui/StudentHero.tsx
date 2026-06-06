"use client";

import { GraduationCap } from "lucide-react";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";

type StudentHeroProps = {
    studentName: string;
    initials: string;
    refreshing: boolean;
    onRefresh: () => void;
};

export function StudentHero({
    studentName,
    initials,
}: StudentHeroProps) {
    const visibleName =
        studentName.trim() || "Estudiante";

    const visibleInitials =
        initials.trim() || "ES";

    return (
        <section className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500 sm:text-sm">
                    Bienvenido de nuevo,
                </p>

                <h1 className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl [@media(max-height:760px)]:lg:text-4xl">
                    <span className="min-w-0 break-words">
                        {visibleName}
                    </span>

                    <span
                        className="inline-block shrink-0 text-3xl sm:text-4xl lg:text-5xl [@media(max-height:760px)]:lg:text-4xl"
                        aria-hidden="true"
                    >
                        👋
                    </span>
                </h1>

                <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-500 sm:text-base">
                    Continúa tus cursos, revisa matrículas pendientes y
                    encuentra nuevos cursos disponibles.
                </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3 lg:pt-1">
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 shadow-sm sm:h-11 sm:px-4 sm:text-sm">
                    <GraduationCap className="h-4 w-4 shrink-0 text-[#00469B]" />

                    <span>
                        <span className="hidden xs:inline">
                            Rol:{" "}
                        </span>

                        Estudiante
                    </span>
                </span>

                <StudentNotificationsBell />

                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00469B] text-xs font-black text-white shadow-sm sm:h-11 sm:w-11 sm:text-sm"
                    aria-label={`Estudiante ${visibleName}`}
                    title={visibleName}
                >
                    {visibleInitials}
                </div>
            </div>
        </section>
    );
}

export default StudentHero;