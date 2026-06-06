import {
    BookOpen,
    Clock3,
    DollarSign,
    Eye,
    GraduationCap,
    Layers3,
} from "lucide-react";
import type { ReactNode } from "react";
import { COURSE_PRESENTATION_THEME as theme } from "../constants";
import type {
    CourseModule,
    CourseSummary,
} from "../types";
import {
    formatMoney,
    hasDiscount,
    toCssImageUrl,
} from "../utils";

type CourseHeroProps = {
    course: CourseSummary;
    modules: CourseModule[];
    viewLabel: string;
};

export function CourseHero({
    course,
    modules,
    viewLabel,
}: CourseHeroProps) {
    return (
        <section
            className={`overflow-hidden rounded-2xl sm:rounded-[2rem] ${theme.card}`}
        >
            <div className="grid min-w-0 gap-0 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="relative min-h-[210px] bg-slate-100 sm:min-h-[240px] lg:min-h-full">
                    {course.imageUrl ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage:
                                    toCssImageUrl(
                                        course.imageUrl,
                                    ),
                            }}
                        />
                    ) : (
                        <div
                            className={`absolute inset-0 flex items-center justify-center ${theme.gradientSoft} ${theme.primaryText}`}
                        >
                            <BookOpen className="h-16 w-16 sm:h-20 sm:w-20" />
                        </div>
                    )}

                    <div
                        className={`absolute inset-0 ${theme.overlay}`}
                    />

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                        <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)] shadow-sm sm:px-3 sm:text-xs">
                            {viewLabel}
                        </span>

                        <h1 className="mt-2 line-clamp-2 break-words text-xl font-black leading-tight text-white sm:text-2xl lg:text-3xl">
                            {course.name}
                        </h1>
                    </div>
                </div>

                <div className="min-w-0 p-4 sm:p-5 lg:p-6 [@media(max-height:760px)]:lg:p-5">
                    <span
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] sm:px-3 sm:text-xs ${theme.primarySoft}`}
                    >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Presentación del curso
                    </span>

                    <h2 className="mt-3 break-words text-2xl font-black leading-tight text-[var(--foreground)] sm:text-3xl [@media(max-height:760px)]:lg:text-2xl">
                        {course.name}
                    </h2>

                    <p className="mt-2 line-clamp-4 max-w-4xl break-words text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:mt-3 sm:leading-7">
                        {course.description}
                    </p>

                    <div className="mt-4 grid min-w-0 grid-cols-2 gap-2.5 xl:grid-cols-4">
                        <MetricCard
                            icon={
                                <Clock3 className="h-4 w-4" />
                            }
                            label="Duración"
                            value={`${course.durationHours || 0} h`}
                        />

                        <MetricCard
                            icon={
                                <Layers3 className="h-4 w-4" />
                            }
                            label="Módulos"
                            value={modules.length}
                        />

                        <MetricCard
                            icon={
                                <GraduationCap className="h-4 w-4" />
                            }
                            label="Nivel"
                            value={course.level}
                            compact
                        />

                        <MetricCard
                            icon={
                                <DollarSign className="h-4 w-4" />
                            }
                            label="Precio"
                            value={
                                course.isFree
                                    ? "Gratis"
                                    : hasDiscount(course)
                                      ? formatMoney(
                                            course.discountPrice,
                                        )
                                      : formatMoney(
                                            course.price,
                                        )
                            }
                            secondaryValue={
                                hasDiscount(course)
                                    ? formatMoney(
                                          course.price,
                                      )
                                    : undefined
                            }
                            compact
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function MetricCard({
    icon,
    label,
    value,
    secondaryValue,
    compact = false,
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    secondaryValue?: string;
    compact?: boolean;
}) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
            <div className="flex min-w-0 items-center gap-1.5 text-[var(--muted-foreground)]">
                <span className="shrink-0">
                    {icon}
                </span>

                <p className="truncate text-[10px] font-black uppercase tracking-[0.1em] sm:text-xs sm:tracking-[0.12em]">
                    {label}
                </p>
            </div>

            <p
                className={`mt-1.5 break-words font-black text-[var(--foreground)] ${
                    compact
                        ? "text-sm sm:text-base"
                        : "text-xl sm:text-2xl"
                }`}
            >
                {value}
            </p>

            {secondaryValue ? (
                <p className="mt-0.5 text-[10px] font-bold text-slate-400 line-through sm:text-xs">
                    {secondaryValue}
                </p>
            ) : null}
        </div>
    );
}

export default CourseHero;
