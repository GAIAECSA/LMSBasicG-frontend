"use client";

import {
    StudentNotificationsBell,
} from "@/components/student/notifications/StudentNotificationsBell";

type TopActionsProps = {
    initials: string;
};

export function TopActions({
    initials,
}: TopActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <StudentNotificationsBell />

            <div
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)] shadow-sm"
                aria-label={`Estudiante ${initials}`}
                title={initials}
            >
                {initials}
            </div>
        </div>
    );
}

export default TopActions;