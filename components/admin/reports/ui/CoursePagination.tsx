import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type CoursePaginationProps = {
    filteredCoursesLength: number;
    firstVisibleCourse: number;
    lastVisibleCourse: number;
    safeCoursePage: number;
    totalCoursePages: number;
    loadingCourseId: number | null;
    onPrevious: () => void;
    onNext: () => void;
};

export function CoursePagination({
    filteredCoursesLength,
    firstVisibleCourse,
    lastVisibleCourse,
    safeCoursePage,
    totalCoursePages,
    loadingCourseId,
    onPrevious,
    onNext,
}: CoursePaginationProps) {
    return (
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-[11px] font-bold text-slate-500 sm:text-xs">
                {filteredCoursesLength === 0
                    ? "No hay cursos MDT disponibles"
                    : `Mostrando ${firstVisibleCourse} - ${lastVisibleCourse} de ${filteredCoursesLength} cursos MDT`}
            </p>

            {totalCoursePages > 1 ? (
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onPrevious}
                        disabled={
                            safeCoursePage === 1 ||
                            loadingCourseId !== null
                        }
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:rounded-xl sm:px-3 sm:text-xs"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Anterior
                    </button>

                    <span className="px-1.5 text-[11px] font-black text-slate-600 sm:px-2 sm:text-xs">
                        {safeCoursePage} de{" "}
                        {totalCoursePages}
                    </span>

                    <button
                        type="button"
                        onClick={onNext}
                        disabled={
                            safeCoursePage ===
                                totalCoursePages ||
                            loadingCourseId !== null
                        }
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:rounded-xl sm:px-3 sm:text-xs"
                    >
                        Siguiente
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
