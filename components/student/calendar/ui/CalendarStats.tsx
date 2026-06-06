import type { StudentCalendarState } from "../hook";
import { SummaryCard } from "./SummaryCard";

type CalendarStatsProps = {
    calendar: StudentCalendarState;
};

export function CalendarStats({
    calendar,
}: CalendarStatsProps) {
    return (
        <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
            <SummaryCard
                title="Actividades"
                value={calendar.activities.length}
                detail="Con fecha disponible"
                tone="blue"
            />

            <SummaryCard
                title="Próximas"
                value={calendar.nextActivities.length}
                detail="Pendientes por realizar"
                tone="green"
            />

            <SummaryCard
                title="Vencidas"
                value={calendar.expiredActivities.length}
                detail="Ya pasaron su fecha"
                tone="red"
            />
        </div>
    );
}

export default CalendarStats;
