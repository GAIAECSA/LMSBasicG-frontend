import { WEEK_DAYS } from "../constants";

export function WeekDaysHeader() {
    return (
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--muted)]">
            {WEEK_DAYS.map((day) => (
                <div
                    key={day}
                    className="px-2 py-2.5 text-center text-[10px] font-black uppercase tracking-wide text-[var(--muted-foreground)] sm:px-3 sm:py-3 sm:text-xs"
                >
                    {day}
                </div>
            ))}
        </div>
    );
}

export default WeekDaysHeader;
