import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
} from "lucide-react";
import type { DashboardCourse } from "../types";
import { STUDENT_LINKS } from "../constants";
import { CourseCard } from "./CourseCard";

type MyCoursesSectionProps = {
    courses: DashboardCourse[];
};

export function MyCoursesSection({
    courses,
}: MyCoursesSectionProps) {
    return (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 sm:text-xs">
                        Formación activa
                    </p>

                    <h2 className="mt-1 text-base font-black text-slate-950 sm:text-lg">
                        Mis cursos
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        Continúa aprendiendo desde el punto donde te quedaste.
                    </p>
                </div>

                <Link
                    href={STUDENT_LINKS.courses}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-[#172861] transition hover:bg-blue-50 active:scale-[0.97] sm:text-xs"
                >
                    Ver todos
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:mt-4 sm:rounded-2xl">
                    <BookOpen className="mx-auto h-7 w-7 text-slate-400" />

                    <p className="mt-2 text-xs font-black text-slate-700 sm:text-sm">
                        No tienes cursos aprobados todavía.
                    </p>

                    <Link
                        href={STUDENT_LINKS.catalog}
                        className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-[#172861] px-3 text-xs font-black !text-white transition hover:bg-[#0B163F]"
                    >
                        Explorar catálogo
                    </Link>
                </div>
            ) : (
                <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                    {courses.map(
                        (course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                mode="enrolled"
                            />
                        ),
                    )}
                </div>
            )}
        </section>
    );
}

export default MyCoursesSection;
