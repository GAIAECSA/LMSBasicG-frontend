"use client";

import {
    CalendarAlert,
} from "./ui/CalendarAlert";
import {
    CalendarBoard,
} from "./ui/CalendarBoard";
import {
    CalendarEmptyState,
} from "./ui/CalendarEmptyState";
import {
    CalendarHeader,
} from "./ui/CalendarHeader";
import {
    CalendarSkeleton,
} from "./ui/CalendarSkeleton";
import {
    CalendarStats,
} from "./ui/CalendarStats";
import {
    DayActivitiesPanel,
} from "./ui/DayActivitiesPanel";
import {
    useStudentCalendar,
} from "./hook";

export function StudentCalendarView() {
    const calendar =
        useStudentCalendar();

    return (
        <section className="min-h-screen overflow-x-hidden bg-[var(--background)] px-3 py-4 pt-16 text-[var(--foreground)] sm:px-5 sm:py-5 md:px-6 md:pt-6 lg:px-8 xl:px-10 [@media(max-height:760px)]:py-3 [@media(max-height:760px)]:md:pt-4">
            <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 sm:space-y-5">
                <CalendarHeader
                    calendar={
                        calendar
                    }
                />

                <CalendarAlert
                    message={
                        calendar.errorMessage
                    }
                />

                {calendar.isLoading ? (
                    <CalendarSkeleton />
                ) : (
                    <>
                        <CalendarStats
                            calendar={
                                calendar
                            }
                        />

                        {calendar.activities
                            .length ===
                            0 ? (
                            <CalendarEmptyState />
                        ) : (
                            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
                                <CalendarBoard
                                    calendar={
                                        calendar
                                    }
                                />

                                <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                                    <DayActivitiesPanel
                                        calendar={
                                            calendar
                                        }
                                    />
                                </aside>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

export default StudentCalendarView;