import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    GraduationCap,
} from "lucide-react";
import type {
    CourseCardMode,
    DashboardCourse,
} from "../types";
import {
    formatLevel,
    formatPrice,
    getCourseImage,
    getCourseProgress,
    getCourseRoomHref,
} from "../utils";
import { STUDENT_LINKS } from "../constants";

type CourseCardProps = {
    course: DashboardCourse;
    mode: CourseCardMode;
};

export function CourseCard({
    course,
    mode,
}: CourseCardProps) {
    const imageUrl =
        getCourseImage(course);

    const progress =
        getCourseProgress(course);

    const href =
        mode === "enrolled"
            ? getCourseRoomHref(
                  course.id,
              )
            : STUDENT_LINKS.catalog;

    return (
        <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:rounded-2xl">
            <div className="relative h-24 overflow-hidden bg-slate-100 sm:h-28">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={course.name}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 360px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-[#172861]">
                        <BookOpen className="h-8 w-8" />
                    </div>
                )}

                <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                    {course.is_mdt ? (
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-[9px] font-black uppercase text-purple-700 shadow-sm">
                            MDT
                        </span>
                    ) : null}

                    <span className="rounded-full bg-white/90 px-2 py-1 text-[9px] font-black uppercase text-slate-700 shadow-sm backdrop-blur">
                        {formatLevel(
                            course.level,
                        )}
                    </span>
                </div>
            </div>

            <div className="p-3 sm:p-3.5">
                <h3
                    title={course.name}
                    className="line-clamp-1 text-xs font-black text-slate-950 sm:text-sm"
                >
                    {course.name}
                </h3>

                <p className="mt-1 line-clamp-2 min-h-[32px] text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs">
                    {course.description ||
                        "Curso disponible en la plataforma."}
                </p>

                {mode === "enrolled" ? (
                    <div className="mt-3">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-black text-slate-500 sm:text-[11px]">
                            <span>Progreso</span>
                            <span>
                                {progress}%
                            </span>
                        </div>

                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-[#172861]"
                                style={{
                                    width: `${progress}%`,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                        {formatPrice(course)}
                    </div>
                )}

                <Link
                    href={href}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-xs font-black !text-white transition hover:bg-[#0B163F] active:scale-[0.97]"
                >
                    {mode === "enrolled" ? (
                        <GraduationCap className="h-4 w-4" />
                    ) : (
                        <BookOpen className="h-4 w-4" />
                    )}

                    {mode === "enrolled"
                        ? "Entrar al aula"
                        : "Ver catálogo"}

                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </article>
    );
}

export default CourseCard;
