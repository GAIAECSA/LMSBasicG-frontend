"use client";

import { useStudentDashboard } from "./hook";
import { DashboardAlert } from "./ui/DashboardAlert";
import { DashboardLoading } from "./ui/DashboardLoading";
import { MyCoursesSection } from "./ui/MyCoursesSection";
import { PendingEnrollmentsPanel } from "./ui/PendingEnrollmentsPanel";
import { RecommendedCourses } from "./ui/RecommendedCourses";
import { StudentHero } from "./ui/StudentHero";
import { SummaryCards } from "./ui/SummaryCards";

export function StudentDashboardView() {
    const dashboard =
        useStudentDashboard();

    if (dashboard.loading) {
        return <DashboardLoading />;
    }

    return (
        <section className="min-h-screen w-full bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1450px] space-y-3 sm:space-y-4">
                <StudentHero
                    studentName={
                        dashboard.studentName
                    }
                    initials={
                        dashboard.initials
                    }
                    refreshing={
                        dashboard.refreshing
                    }
                    onRefresh={() =>
                        void dashboard.loadDashboard(
                            true,
                        )
                    }
                />

                <DashboardAlert
                    error={dashboard.error}
                />

                <SummaryCards
                    summary={
                        dashboard.summary
                    }
                />

                <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_310px]">
                    <MyCoursesSection
                        courses={
                            dashboard.myCourses
                        }
                    />

                    <PendingEnrollmentsPanel
                        enrollments={
                            dashboard.pendingEnrollments
                        }
                    />
                </div>

                <RecommendedCourses
                    courses={
                        dashboard.recommendedCourses
                    }
                />
            </div>
        </section>
    );
}

export default StudentDashboardView;
