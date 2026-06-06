import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CourseSummary } from "../types";
import { StatusBadge } from "./StatusBadge";

type CourseToolbarProps = {
    course: CourseSummary;
    backHref: string;
    backLabel: string;
};

export function CourseToolbar({
    course,
    backHref,
    backLabel,
}: CourseToolbarProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href={backHref}
                    className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {backLabel}
                </Link>

                <div className="flex flex-wrap gap-2">
                    <StatusBadge
                        active={course.isPublished}
                        activeText="Publicado"
                        inactiveText="No publicado"
                    />

                    <StatusBadge
                        active={course.openEnrollment}
                        activeText="Matrícula abierta"
                        inactiveText="Matrícula cerrada"
                    />
                </div>
            </div>
        </div>
    );
}

export default CourseToolbar;
