"use client";

import {
    CalendarDays,
    GraduationCap,
    RefreshCw,
} from "lucide-react";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";
import type { StudentCalendarState } from "../hook";

type CalendarHeaderProps = {
    calendar: StudentCalendarState;
};

export function CalendarHeader({
    calendar,
}: CalendarHeaderProps) {
    return (
        <header className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-[24px] sm:p-4 lg:flex-row lg:items-center lg:justify-between [@media(max-height:760px)]:py-3">
            <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--primary)] sm:px-3 sm:text-xs">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Agenda académica
                </div>

                <h1 className="mt-2 text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl lg:text-3xl [@media(max-height:760px)]:lg:text-2xl">
                    Calendario académico
                </h1>

                <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                    Visualiza tus actividades por día según la fecha configurada.
                </p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">

                <StudentNotificationsBell />

                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black text-[var(--primary-foreground)] shadow-sm sm:h-10 sm:w-10 sm:text-sm"
                    aria-label={`Estudiante ${calendar.initials}`}
                >
                    {calendar.initials}
                </div>

            </div>
        </header>
    );
}

export default CalendarHeader;
