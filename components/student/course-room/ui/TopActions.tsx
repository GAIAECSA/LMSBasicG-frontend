"use client";

import { GraduationCap } from "lucide-react";
import { StudentNotificationsBell } from "../../notifications/StudentNotificationsBell";

type TopActionsProps = {
    studentInitials: string;
};

export function TopActions({ studentInitials }: TopActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                Rol: Estudiante
            </span>

            <StudentNotificationsBell />

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)] shadow-sm">
                {studentInitials}
            </div>
        </div>
    );
}

export default TopActions;