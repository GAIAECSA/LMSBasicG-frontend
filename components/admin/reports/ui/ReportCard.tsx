import type { ElementType } from "react";
import type {
    CourseReportOption,
    CourseReportType,
} from "@/services/reports.service";

type ReportCardProps = {
    report: CourseReportOption;
    Icon: ElementType;
    onOpen: (
        reportType: CourseReportType,
    ) => void;
};

export function ReportCard({
    report,
    Icon,
    onOpen,
}: ReportCardProps) {
    return (
        <button
            type="button"
            onClick={() => onOpen(report.type)}
            className="group flex min-h-[106px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md active:scale-[0.98] sm:min-h-[116px] sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-4 lg:min-h-[124px]"
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#172861] transition group-hover:bg-[#172861] group-hover:text-white sm:h-10 sm:w-10 lg:h-11 lg:w-11">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>

            <span className="text-[11px] font-black leading-4 text-slate-800 sm:text-xs sm:leading-5">
                {report.label}
            </span>
        </button>
    );
}
