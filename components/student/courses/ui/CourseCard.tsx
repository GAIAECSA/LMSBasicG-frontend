import Link from "next/link";
import {
    CheckCircle2,
    ChevronRight,
    Folder,
} from "lucide-react";
import type {
    CourseCardData,
    EnrollmentWithExtraFields,
} from "../types";
import {
    getAccessRoleLabel,
    getCourseCategory,
    getCourseDescription,
    getCourseImage,
    getCourseTitle,
    getCourseWorkspaceHref,
    getEnrollmentCourseId,
    getStatusLabel,
} from "../utils";
import {
    ImageWithFallback,
} from "./ImageWithFallback";

export function CourseCard({
    enrollment,
    course,
    accessRole,
    progress,
}: CourseCardData) {
    const displayCourse =
        course ??
        (
            enrollment as EnrollmentWithExtraFields
        ).course ??
        null;

    const completed =
        progress >= 100;

    const courseId =
        getEnrollmentCourseId(
            enrollment,
        );

    const courseName =
        getCourseTitle(
            enrollment,
            displayCourse,
        );

    const description =
        getCourseDescription(
            enrollment,
            displayCourse,
        );

    const imageUrl =
        getCourseImage(
            displayCourse,
        );

    const category =
        getCourseCategory(
            displayCourse,
        );

    const accessRoleLabel =
        getAccessRoleLabel(
            accessRole,
        );

    const href =
        getCourseWorkspaceHref(
            courseId,
            accessRole,
        );

    const isTeacher =
        accessRole === "teacher";

    return (
        <article
            className={`group overflow-hidden rounded-2xl border bg-[var(--card)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl ${isTeacher
                    ? "border-green-200"
                    : "border-[var(--border)]"
                }`}
        >
            <div className="grid min-w-0 gap-0 lg:h-[178px] lg:grid-cols-[185px_minmax(0,1fr)_165px] xl:h-[184px] xl:grid-cols-[205px_minmax(0,1fr)_175px] min-[1440px]:h-[205px] min-[1440px]:grid-cols-[245px_minmax(0,1fr)_205px]">
                <div className="relative h-[150px] overflow-hidden bg-[var(--muted)] sm:h-[170px] lg:h-full">
                    <ImageWithFallback
                        src={imageUrl}
                        alt={courseName}
                        className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                        <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-sm sm:text-[10px] ${isTeacher
                                    ? "bg-green-600"
                                    : "bg-[var(--primary)]"
                                }`}
                        >
                            {
                                accessRoleLabel
                            }
                        </span>

                        {!isTeacher ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-[var(--foreground)] shadow-sm sm:text-[10px]">
                                {progress}%
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="flex min-w-0 flex-col justify-center p-3 sm:p-4 lg:h-full lg:p-3.5 min-[1440px]:p-5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide sm:text-[10px] ${isTeacher
                                    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                    : completed
                                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                                        : "bg-[var(--secondary)] text-[var(--primary)]"
                                }`}
                        >
                            {isTeacher
                                ? "Docente asignado"
                                : getStatusLabel(
                                    progress,
                                    accessRole,
                                )}
                        </span>

                        <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-[var(--muted)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[var(--muted-foreground)] sm:text-[10px]">
                            <Folder className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                                {category}
                            </span>
                        </span>
                    </div>

                    <h2
                        title={
                            courseName
                        }
                        className="mt-2 line-clamp-1 text-base font-black tracking-tight text-[var(--foreground)] sm:text-lg min-[1440px]:mt-3 min-[1440px]:text-xl"
                    >
                        {courseName}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[var(--muted-foreground)] min-[1440px]:mt-2 min-[1440px]:text-sm min-[1440px]:leading-6">
                        {description}
                    </p>

                    {!isTeacher ? (
                        <div className="mt-2.5 min-[1440px]:mt-4">
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <span className="text-[9px] font-black uppercase tracking-wide text-[var(--muted-foreground)] sm:text-[10px]">
                                    Progreso
                                </span>

                                <span
                                    className={`text-xs font-black ${completed
                                            ? "text-[var(--success)]"
                                            : "text-[var(--primary)]"
                                        }`}
                                >
                                    {
                                        progress
                                    }
                                    %
                                </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${completed
                                            ? "bg-[var(--success)]"
                                            : "bg-[var(--primary)]"
                                        }`}
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="mt-2.5 line-clamp-2 rounded-xl bg-[var(--muted)]/70 px-2.5 py-2 text-[11px] font-semibold leading-4 text-[var(--muted-foreground)]">
                            Administra módulos, actividades y estudiantes.
                        </p>
                    )}
                </div>

                <aside className="flex gap-2 border-t border-[var(--border)] bg-[var(--background)]/60 p-3 lg:h-full lg:flex-col lg:justify-between lg:border-l lg:border-t-0 lg:p-3 min-[1440px]:p-4">
                    <div
                        className={`min-w-0 flex-1 rounded-xl border px-3 py-2 lg:flex-none min-[1440px]:rounded-2xl min-[1440px]:py-3 ${isTeacher
                                ? "border-green-200 bg-green-50"
                                : "border-[var(--border)] bg-[var(--card)]"
                            }`}
                    >
                        <p
                            className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wide sm:text-[10px] ${isTeacher
                                    ? "text-green-700"
                                    : "text-[var(--primary)]"
                                }`}
                        >
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Acceso
                        </p>

                        <p className="mt-1 truncate text-sm font-black leading-tight text-[var(--foreground)] min-[1440px]:mt-2 min-[1440px]:text-base">
                            {
                                accessRoleLabel
                            }
                        </p>

                        <p className="mt-1 hidden line-clamp-2 text-[10px] font-semibold leading-4 text-[var(--muted-foreground)] lg:block min-[1440px]:mt-2 min-[1440px]:text-[11px] min-[1440px]:leading-5">
                            {isTeacher
                                ? "Administrar el curso."
                                : "Continuar desde el aula."}
                        </p>
                    </div>

                    <Link
                        href={href}
                        className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-black !text-white shadow-sm transition hover:opacity-95 active:scale-[0.97] [&_svg]:!text-white sm:text-xs lg:w-full min-[1440px]:h-10 min-[1440px]:rounded-2xl ${isTeacher
                                ? "bg-green-600"
                                : "bg-[var(--primary)]"
                            }`}
                    >
                        Ir al curso
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </aside>
            </div>
        </article>
    );
}

export default CourseCard;
