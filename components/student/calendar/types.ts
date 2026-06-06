import type { LucideIcon } from "lucide-react";
import type { LessonCalendarActivity } from "@/services/lessons.service";

export type AnyRecord = Record<string, unknown>;

export type CalendarDay = {
    key: string;
    dayNumber: number;
    inCurrentMonth: boolean;
    isToday: boolean;
    activities: LessonCalendarActivity[];
};

export type CalendarSummaryTone =
    | "blue"
    | "green"
    | "red";

export type CalendarActivityStatus = {
    label: string;
    className: string;
    dotClassName: string;
    icon: LucideIcon;
};
