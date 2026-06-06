import { CalendarDays } from "lucide-react";
import type { StudentCalendarState } from "../hook";
import { ActivityCard } from "./ActivityCard";

type DayActivitiesPanelProps = {
    calendar: StudentCalendarState;
};

export function DayActivitiesPanel({
    calendar,
}: DayActivitiesPanelProps) {
    return (
        <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-[26px] sm:p-4">
            <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="text-sm font-black text-[var(--foreground)] sm:text-base">
                        Actividades del día
                    </h3>

                    <p className="mt-0.5 truncate text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                        {calendar.selectedDayKey ||
                            "Selecciona un día"}
                    </p>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]">
                    <CalendarDays className="h-4 w-4" />
                </span>
            </div>

            <div className="mt-3 max-h-[470px] space-y-2.5 overflow-y-auto pr-0.5 xl:max-h-[calc(100vh-250px)]">
                {calendar.selectedDayActivities.length ===
                0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-4 text-center sm:rounded-2xl sm:p-5">
                        <CalendarDays className="mx-auto h-7 w-7 text-[var(--muted-foreground)] sm:h-8 sm:w-8" />

                        <p className="mt-2 text-xs font-bold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                            No hay actividades para este día.
                        </p>
                    </div>
                ) : (
                    calendar.selectedDayActivities.map(
                        (activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                nowTimestamp={
                                    calendar.nowTimestamp
                                }
                            />
                        ),
                    )
                )}
            </div>
        </section>
    );
}

export default DayActivitiesPanel;
