import type { StudentCalendarState } from "../hook";
import { CalendarDayButton } from "./CalendarDayButton";
import { MonthToolbar } from "./MonthToolbar";
import { WeekDaysHeader } from "./WeekDaysHeader";

type CalendarBoardProps = {
    calendar: StudentCalendarState;
};

export function CalendarBoard({
    calendar,
}: CalendarBoardProps) {
    return (
        <section className="min-w-0 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] shadow-sm sm:rounded-[26px]">
            <MonthToolbar calendar={calendar} />

            <div className="overflow-x-auto overscroll-x-contain">
                <div className="min-w-[700px]">
                    <WeekDaysHeader />

                    <div className="grid grid-cols-7">
                        {calendar.calendarDays.map((day) => (
                            <CalendarDayButton
                                key={day.key}
                                day={day}
                                selected={
                                    calendar.selectedDayKey ===
                                    day.key
                                }
                                nowTimestamp={
                                    calendar.nowTimestamp
                                }
                                onSelect={() =>
                                    calendar.setSelectedDayKey(
                                        day.key,
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CalendarBoard;
