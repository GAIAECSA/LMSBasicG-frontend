import type { CalendarDay } from "../types";
import {
    formatShortTime,
    getActivityStatus,
} from "../utils";

type CalendarDayButtonProps = {
    day: CalendarDay;
    selected: boolean;
    nowTimestamp: number;
    onSelect: () => void;
};

export function CalendarDayButton({
    day,
    selected,
    nowTimestamp,
    onSelect,
}: CalendarDayButtonProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`min-h-[92px] min-w-0 border-b border-r border-[var(--border)] p-1.5 text-left transition hover:bg-[var(--secondary)]/60 sm:min-h-[108px] sm:p-2 [@media(max-height:760px)]:sm:min-h-[94px] ${
                selected
                    ? "bg-[var(--secondary)]"
                    : "bg-white"
            } ${
                !day.inCurrentMonth
                    ? "opacity-45"
                    : ""
            }`}
        >
            <div className="mb-1.5 flex min-w-0 items-center justify-between gap-1 sm:mb-2">
                <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black sm:h-7 sm:w-7 sm:text-xs ${
                        day.isToday
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "text-[var(--foreground)]"
                    }`}
                >
                    {day.dayNumber}
                </span>

                {day.activities.length > 0 ? (
                    <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[9px] font-black text-[var(--primary-foreground)] sm:px-2 sm:text-[10px]">
                        {day.activities.length}
                    </span>
                ) : null}
            </div>

            <div className="space-y-1">
                {day.activities
                    .slice(0, 2)
                    .map((activity) => {
                        const status =
                            getActivityStatus(
                                activity,
                                nowTimestamp,
                            );

                        const time =
                            formatShortTime(
                                activity.date_available,
                            );

                        return (
                            <div
                                key={activity.id}
                                className="truncate rounded-lg bg-[var(--card)] px-1.5 py-1 text-[9px] font-black text-[var(--foreground)] shadow-sm sm:rounded-xl sm:px-2 sm:text-[10px]"
                                title={activity.title}
                            >
                                <span
                                    className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
                                />

                                {time
                                    ? `${time} `
                                    : ""}

                                {activity.title}
                            </div>
                        );
                    })}

                {day.activities.length > 2 ? (
                    <div className="truncate rounded-lg bg-[var(--muted)] px-1.5 py-1 text-[9px] font-black text-[var(--muted-foreground)] sm:rounded-xl sm:px-2 sm:text-[10px]">
                        +{day.activities.length - 2} más
                    </div>
                ) : null}
            </div>
        </button>
    );
}

export default CalendarDayButton;
