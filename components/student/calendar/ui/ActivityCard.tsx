import Link from "next/link";
import {
    ArrowRight,
    CalendarClock,
} from "lucide-react";
import type { LessonCalendarActivity } from "@/services/lessons.service";
import {
    formatDate,
    getActivityStatus,
    getActivityTypeLabel,
} from "../utils";

type ActivityCardProps = {
    activity: LessonCalendarActivity;
    nowTimestamp: number;
};

export function ActivityCard({
    activity,
    nowTimestamp,
}: ActivityCardProps) {
    const status = getActivityStatus(
        activity,
        nowTimestamp,
    );

    const StatusIcon = status.icon;

    return (
        <article className="min-w-0 rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm sm:rounded-2xl sm:p-3.5">
            <div className="flex min-w-0 flex-wrap gap-1.5">
                <span className="rounded-full bg-[var(--secondary)] px-2 py-1 text-[9px] font-black uppercase text-[var(--primary)] sm:px-2.5 sm:text-[10px]">
                    {getActivityTypeLabel(
                        activity.type_key,
                    )}
                </span>

                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black uppercase sm:px-2.5 sm:text-[10px] ${status.className}`}
                >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                </span>
            </div>

            <h4 className="mt-2 break-words text-xs font-black leading-5 text-[var(--foreground)] sm:text-sm">
                {activity.title}
            </h4>

            <p className="mt-1 flex min-w-0 items-start gap-1 text-[10px] font-bold leading-4 text-[var(--muted-foreground)] sm:text-xs">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                <span className="min-w-0 break-words">
                    {formatDate(
                        activity.date_available,
                    )}
                </span>
            </p>

            {activity.url !== "#" ? (
                <Link
                    href={activity.url}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 text-xs font-black !text-white transition hover:opacity-95 active:scale-[0.97]"
                >
                    Ver actividad
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            ) : null}
        </article>
    );
}

export default ActivityCard;
