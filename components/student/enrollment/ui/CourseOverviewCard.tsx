/* eslint-disable @next/next/no-img-element */

import {
    Clock3,
    GraduationCap,
    ImageIcon,
    Layers3,
    Percent,
    UsersRound,
} from "lucide-react";
import type { CourseEnrollmentItem } from "../types";
import { SummaryItem } from "./SummaryItem";

type CourseOverviewCardProps = {
    course: CourseEnrollmentItem;
};

export function CourseOverviewCard({
    course,
}: CourseOverviewCardProps) {
    return (
        <article className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm sm:rounded-[26px]">
            <div className="grid min-w-0 gap-0 lg:grid-cols-[250px_minmax(0,1fr)] 2xl:grid-cols-[330px_minmax(0,1fr)]">
                <div className="relative h-[190px] overflow-hidden bg-[var(--muted)] sm:h-[230px] lg:h-full">
                    {course.imageUrl ? (
                        <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="h-full w-full object-cover object-center"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)]">
                            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                        </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

                    <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
                        <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--primary-foreground)] shadow-sm sm:px-3 sm:text-xs">
                            {course.category}
                        </span>

                        <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-sm sm:px-3 sm:text-xs ${
                                course.openEnrollment
                                    ? "bg-[var(--success)]"
                                    : "bg-slate-800"
                            }`}
                        >
                            {course.openEnrollment
                                ? "Matrícula abierta"
                                : "Matrícula cerrada"}
                        </span>
                    </div>

                    {course.hasDiscount ? (
                        <div className="absolute right-3 top-3 flex h-16 w-16 rotate-3 flex-col items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg ring-2 ring-white/30 sm:right-4 sm:top-4 sm:h-20 sm:w-20 sm:rounded-3xl sm:ring-4">
                            <Percent className="h-4 w-4 sm:h-5 sm:w-5" />

                            <span className="mt-0.5 text-sm font-black sm:mt-1 sm:text-lg">
                                -{course.discountPercentage}%
                            </span>
                        </div>
                    ) : null}

                    <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                        <p className="text-xs font-bold text-white/80 sm:text-sm">
                            Proceso de matrícula
                        </p>

                        <h2 className="mt-1 line-clamp-2 break-words text-lg font-black leading-tight text-white sm:text-xl">
                            {course.title}
                        </h2>
                    </div>
                </div>

                <div className="min-w-0 p-3 sm:p-4 lg:p-5 [@media(max-height:760px)]:lg:p-4">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${
                                course.isFree
                                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                                    : "bg-[var(--secondary)] text-[var(--primary)]"
                            }`}
                        >
                            {course.isFree
                                ? "Curso gratuito"
                                : "Curso de pago"}
                        </span>

                        {course.hasDiscount ? (
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black text-orange-700 sm:px-3 sm:text-xs">
                                Oferta activa
                            </span>
                        ) : null}
                    </div>

                    <h2 className="mt-3 break-words text-xl font-black leading-tight text-[var(--foreground)] sm:text-2xl">
                        {course.title}
                    </h2>

                    <p className="mt-2 max-h-[105px] overflow-y-auto whitespace-pre-wrap break-words text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:mt-3 sm:max-h-[130px] sm:text-sm sm:leading-6">
                        {course.description}
                    </p>

                    <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                        <SummaryItem
                            icon={<GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />}
                            title="Docente"
                            value={course.teacherName}
                        />

                        <SummaryItem
                            icon={<Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />}
                            title="Duración"
                            value={course.durationLabel}
                        />

                        <SummaryItem
                            icon={<Layers3 className="h-4 w-4 sm:h-5 sm:w-5" />}
                            title="Contenidos"
                            value={
                                course.totalLessons > 0
                                    ? `${course.totalLessons} lecciones`
                                    : "Por definir"
                            }
                        />

                        <SummaryItem
                            icon={<UsersRound className="h-4 w-4 sm:h-5 sm:w-5" />}
                            title="Estudiantes"
                            value={
                                course.totalStudents > 0
                                    ? `${course.totalStudents} inscritos`
                                    : "Sin inscritos"
                            }
                        />
                    </div>
                </div>
            </div>
        </article>
    );
}

export default CourseOverviewCard;
