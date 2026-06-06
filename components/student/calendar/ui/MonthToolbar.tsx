import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import type { StudentCalendarState } from "../hook";
import { formatMonthLabel } from "../utils";

type MonthToolbarProps = {
    calendar: StudentCalendarState;
};

export function MonthToolbar({
    calendar,
}: MonthToolbarProps) {
    return (
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 [@media(max-height:760px)]:sm:py-3">
            <div className="min-w-0">
                <h2 className="truncate text-base font-black capitalize text-[var(--foreground)] sm:text-lg">
                    {formatMonthLabel(
                        calendar.currentMonthKey,
                    )}
                </h2>

                <p className="mt-0.5 text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                    Selecciona un día para ver sus actividades.
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={calendar.goToPreviousMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition hover:bg-[var(--muted)] active:scale-[0.96] sm:h-10 sm:w-10 sm:rounded-2xl"
                    aria-label="Mes anterior"
                >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <button
                    type="button"
                    onClick={calendar.goToToday}
                    className="h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-black text-[var(--foreground)] transition hover:bg-[var(--muted)] active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    Hoy
                </button>

                <button
                    type="button"
                    onClick={calendar.goToNextMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition hover:bg-[var(--muted)] active:scale-[0.96] sm:h-10 sm:w-10 sm:rounded-2xl"
                    aria-label="Mes siguiente"
                >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </div>
        </div>
    );
}

export default MonthToolbar;
