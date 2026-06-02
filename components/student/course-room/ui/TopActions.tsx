"use client";

import { GraduationCap } from "lucide-react";
import { StudentNotificationsBell } from "../../notifications/StudentNotificationsBell";

type TopActionsProps = {
    studentInitials: string;
};

export function TopActions({ studentInitials }: TopActionsProps) {
    return (
        <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-3">
            <span className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-black text-[var(--foreground)] shadow-sm sm:px-4 sm:text-sm">
                <GraduationCap className="h-4 w-4 shrink-0 text-[var(--primary)]" />

                <span className="truncate">
                    <span className="hidden sm:inline">Rol: </span>
                    Estudiante
                </span>
            </span>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <StudentNotificationsBell />

                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black text-[var(--primary-foreground)] shadow-sm sm:h-11 sm:w-11 sm:text-sm"
                    aria-label={`Estudiante ${studentInitials}`}
                >
                    {studentInitials}
                </div>
            </div>
        </div>
    );
}

export default TopActions;
