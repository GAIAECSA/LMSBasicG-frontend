"use client";

import { useReportsAdminPanel } from "./hook";
import { Alerts } from "./ui/Alerts";
import { CourseSelectionModal } from "./ui/CourseSelectionModal";
import { PreviewModal } from "./ui/PreviewModal";
import { ReportsGrid } from "./ui/ReportsGrid";
import { ReportsHero } from "./ui/ReportsHero";

export function ReportsAdminPanel() {
    const reports =
        useReportsAdminPanel();

    return (
        <>
            <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1450px] space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-3">
                    <ReportsHero
                        isLoadingCourses={
                            reports.isLoadingCourses
                        }
                        onRefreshCourses={() =>
                            void reports.handleRefreshCourses()
                        }
                    />

                    <Alerts
                        errorMessage={
                            reports.pageErrorMessage
                        }
                        successMessage={
                            reports.successMessage
                        }
                    />

                    <ReportsGrid
                        onOpen={
                            reports.openCoursesModal
                        }
                    />
                </div>
            </section>

            <CourseSelectionModal
                reports={reports}
            />

            <PreviewModal
                reports={reports}
            />
        </>
    );
}

export default ReportsAdminPanel;
