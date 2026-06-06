import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    GraduationCap,
    LockKeyhole,
    Percent,
    RefreshCw,
} from "lucide-react";
import type {
    CatalogCourse,
    CourseEnrollmentInfo,
} from "../types";
import {
    formatLevel,
    formatPrice,
    getCourseCategory,
    getCourseImage,
    getDiscountPercentage,
    getOriginalPrice,
    hasCourseOffer,
    isCourseOpen,
    isMdtCourse,
} from "../utils";

type CourseCatalogCardProps = {
    course: CatalogCourse;
    enrollmentInfo: CourseEnrollmentInfo;
    onEnroll: () => void;
};

export function CourseCatalogCard({
    course,
    enrollmentInfo,
    onEnroll,
}: CourseCatalogCardProps) {
    const imageUrl = getCourseImage(course);
    const originalPrice = getOriginalPrice(course);
    const hasOffer = hasCourseOffer(course);
    const openEnrollment = isCourseOpen(course);
    const isMdt = isMdtCourse(course);

    return (
        <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:rounded-[22px]">
            <div className="relative h-[170px] overflow-hidden bg-slate-100 sm:h-[180px]">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={course.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, 420px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-[#00469B]">
                        <BookOpen className="h-12 w-12" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />

                <div className="absolute left-3 top-3 flex max-w-[calc(100%-86px)] flex-wrap gap-1.5">
                    <Badge className="bg-[#00469B] text-white">
                        {formatLevel(course.level)}
                    </Badge>

                    {isMdt ? (
                        <Badge className="bg-purple-600 text-white">
                            MDT
                        </Badge>
                    ) : null}

                    {openEnrollment ? (
                        <Badge className="bg-emerald-500 text-white">
                            Matrícula abierta
                        </Badge>
                    ) : null}
                </div>

                {hasOffer ? (
                    <span className="absolute right-3 top-3 inline-flex min-h-[52px] min-w-[52px] flex-col items-center justify-center rounded-xl bg-orange-500 px-2 py-1 text-center text-[10px] font-black uppercase leading-4 text-white shadow-md ring-1 ring-orange-300">
                        Oferta
                        <strong className="block text-sm">
                            -{getDiscountPercentage(course)}%
                        </strong>
                    </span>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 p-3.5">
                    <p className="text-[10px] font-black text-white/80 sm:text-[11px]">
                        {getCourseCategory(course)}
                    </p>

                    <h3
                        title={course.name}
                        className="mt-0.5 line-clamp-2 break-words text-base font-black leading-5 text-white [overflow-wrap:anywhere] sm:text-lg sm:leading-6"
                    >
                        {course.name}
                    </h3>
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-4">
                <p className="line-clamp-3 min-h-[60px] break-words text-xs font-semibold leading-5 text-slate-500 [overflow-wrap:anywhere] sm:text-sm">
                    {course.description ||
                        "Curso disponible en la plataforma."}
                </p>

                <div className="mt-4 flex min-w-0 items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Precio
                        </p>

                        <div className="mt-1 flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
                            <p className="truncate text-xl font-black text-orange-600">
                                {formatPrice(course)}
                            </p>

                            {originalPrice ? (
                                <p className="truncate pb-0.5 text-xs font-bold text-slate-500 line-through">
                                    {originalPrice}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {hasOffer ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black text-orange-700">
                            <Percent className="h-3 w-3" />
                            -{getDiscountPercentage(course)}% OFF
                        </span>
                    ) : (
                        <EnrollmentBadge
                            state={enrollmentInfo.state}
                        />
                    )}
                </div>

                <div className="mt-4">
                    <CourseAction
                        course={course}
                        enrollmentInfo={enrollmentInfo}
                        onEnroll={onEnroll}
                    />
                </div>
            </div>
        </article>
    );
}

function Badge({
    children,
    className,
}: {
    children: React.ReactNode;
    className: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide shadow-sm ${className}`}
        >
            {children}
        </span>
    );
}

function EnrollmentBadge({
    state,
}: {
    state: CourseEnrollmentInfo["state"];
}) {
    if (state === "approved") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Activa
            </span>
        );
    }

    if (state === "pending") {
        return (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase text-orange-700">
                <Clock3 className="h-3 w-3" />
                Revisión
            </span>
        );
    }

    if (state === "rejected") {
        return (
            <span className="inline-flex shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase text-red-700">
                Rechazada
            </span>
        );
    }

    return null;
}

function CourseAction({
    course,
    enrollmentInfo,
    onEnroll,
}: CourseCatalogCardProps) {
    if (enrollmentInfo.state === "approved") {
        return (
            <Link
                href={`/student/courses/${course.id}`}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#00469B] px-4 text-sm font-black !text-white transition hover:bg-[#003A81] active:scale-[0.97]"
            >
                <GraduationCap className="h-4 w-4" />
                Entrar al aula
                <ArrowRight className="h-4 w-4" />
            </Link>
        );
    }

    if (enrollmentInfo.state === "pending") {
        return (
            <button
                type="button"
                disabled
                className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 text-sm font-black text-orange-700 ring-1 ring-orange-100"
            >
                <Clock3 className="h-4 w-4" />
                Solicitud pendiente
            </button>
        );
    }

    if (enrollmentInfo.state === "closed") {
        return (
            <button
                type="button"
                disabled
                className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-500"
            >
                <LockKeyhole className="h-4 w-4" />
                Matrícula cerrada
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onEnroll}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#00469B] px-4 text-sm font-black text-white transition hover:bg-[#003A81] active:scale-[0.97]"
        >
            {enrollmentInfo.state === "rejected" ? (
                <RefreshCw className="h-4 w-4" />
            ) : (
                <BookOpen className="h-4 w-4" />
            )}

            {enrollmentInfo.state === "rejected"
                ? "Solicitar nuevamente"
                : "Matricularme"}
        </button>
    );
}

export default CourseCatalogCard;
