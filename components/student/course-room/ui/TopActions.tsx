"use client";

import {
    GraduationCap,
    RefreshCw,
} from "lucide-react";

import { StudentNotificationsBell } from "../../notifications/StudentNotificationsBell";

type TopActionsProps = {
    studentInitials: string;
    isRefreshing: boolean;
    onRefresh: () => void;
};

export function TopActions({
    studentInitials,
    isRefreshing,
    onRefresh,
}: TopActionsProps) {
    return (
        <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <div className="flex shrink-0 items-center gap-2">

                <StudentNotificationsBell />

                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-black text-[var(--primary-foreground)] shadow-sm sm:h-10 sm:w-10 sm:text-xs"
                    aria-label={`Estudiante ${studentInitials}`}
                    title={studentInitials}
                >
                    {studentInitials}
                </div>
            </div>
        </div>
    );
}

export default TopActions;
