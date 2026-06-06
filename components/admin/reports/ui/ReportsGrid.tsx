import { COURSE_REPORT_OPTIONS } from "@/services/reports.service";
import { REPORT_VISUALS } from "../constants";
import type { CourseReportType } from "@/services/reports.service";
import { ReportCard } from "./ReportCard";

type ReportsGridProps = {
    onOpen: (
        reportType: CourseReportType,
    ) => void;
};

export function ReportsGrid({
    onOpen,
}: ReportsGridProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-4 lg:p-5">
            <div>
                <h2 className="text-base font-black text-slate-950 sm:text-lg lg:text-xl">
                    Tipos de reportes
                </h2>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                    Presiona una opción para seleccionar el curso.
                </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 [@media(max-height:760px)]:gap-2.5">
                {COURSE_REPORT_OPTIONS.map(
                    (report) => {
                        const visual =
                            REPORT_VISUALS[
                                report.type
                            ];

                        return (
                            <ReportCard
                                key={report.type}
                                report={report}
                                Icon={visual.icon}
                                onOpen={onOpen}
                            />
                        );
                    },
                )}
            </div>
        </section>
    );
}
