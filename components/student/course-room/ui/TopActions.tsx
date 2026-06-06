"use client";

import { GraduationCap } from "lucide-react";
import { StudentNotificationsBell } from "../../notifications/StudentNotificationsBell";

type TopActionsProps = {
    studentInitials: string;
};

export function TopActions({ studentInitials }: TopActionsProps) {
    return (
        <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <span className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-[11px] font-black text-[var(--foreground)] shadow-sm sm:h-10 sm:text-xs lg:text-sm">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] sm:h-4 sm:w-4" />

                <span className="truncate">
                    <span className="hidden md:inline">Rol: </span>
                    Estudiante
                </span>
            </span>

            <div className="flex shrink-0 items-center gap-2">
                <StudentNotificationsBell />

                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-black text-[var(--primary-foreground)] shadow-sm sm:h-10 sm:w-10 sm:text-xs"
                    aria-label={`Estudiante ${studentInitials}`}
                >
                    {studentInitials}
                </div>
            </div>
        </div>
    );
}

export default TopActions;
