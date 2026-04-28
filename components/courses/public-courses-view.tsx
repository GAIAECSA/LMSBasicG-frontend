"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllCourses, type Course } from "@/services/courses.service";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const EMPTY_IMAGE =
    "https://placehold.co/1200x700/e5e7eb/64748b?text=GaiaTech";

const HEADER_LOGO = "/images/logo.jpg";

type ApiCourseFields = Course & {
    name?: string;
    description?: string;
    price?: number | string;
    discount_price?: number | string | null;
    currency?: string;
    image_url?: string | null;
    level?: string;
    duration_hours?: number;
    is_free?: boolean;
    is_published?: boolean;
    open_enrollment?: boolean;
};

function asApiCourse(course: Course): ApiCourseFields {
    return course as ApiCourseFields;
}

function resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return EMPTY_IMAGE;

    const trimmed = imageUrl.trim();

    if (!trimmed) return EMPTY_IMAGE;

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }

    if (trimmed.startsWith("/")) {
        return `${API_BASE_URL}${trimmed}`;
    }

    return `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
}

function formatMoney(value: number, currency = "USD") {
    try {
        return new Intl.NumberFormat("es-EC", {
            style: "currency",
            currency: currency || "USD",
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency || "USD"} ${value.toFixed(2)}`;
    }
}

function getCourseName(course: Course): string {
    return asApiCourse(course).name ?? "";
}

function getCourseDescription(course: Course): string {
    return asApiCourse(course).description ?? "";
}

function getCourseImageUrl(course: Course): string {
    return asApiCourse(course).image_url ?? "";
}

function getCourseLevel(course: Course): string {
    return asApiCourse(course).level ?? "PRINCIPIANTE";
}

function getCoursePrice(course: Course): number {
    return toNumber(asApiCourse(course).price, 0);
}

function getCourseDiscountPrice(course: Course): number {
    return toNumber(asApiCourse(course).discount_price, 0);
}

function getCourseCurrency(course: Course): string {
    return asApiCourse(course).currency ?? "USD";
}

function getCourseDurationHours(course: Course): number {
    return asApiCourse(course).duration_hours ?? 0;
}

function getCourseIsFree(course: Course): boolean {
    return asApiCourse(course).is_free ?? false;
}

function getCourseIsPublished(course: Course): boolean {
    return asApiCourse(course).is_published ?? false;
}

function getCourseOpenEnrollment(course: Course): boolean {
    return asApiCourse(course).open_enrollment ?? true;
}

function hasDiscount(course: Course): boolean {
    const price = getCoursePrice(course);
    const discount = getCourseDiscountPrice(course);

    return !getCourseIsFree(course) && discount > 0 && discount < price;
}

function getMainPriceLabel(course: Course): string {
    if (getCourseIsFree(course)) return "Gratis";

    if (hasDiscount(course)) {
        return formatMoney(getCourseDiscountPrice(course), getCourseCurrency(course));
    }

    return formatMoney(getCoursePrice(course), getCourseCurrency(course));
}

export function PublicCoursesView() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [activeCourseIndex, setActiveCourseIndex] = useState(0);

    useEffect(() => {
        let mounted = true;

        const loadCourses = async () => {
            try {
                setLoading(true);
                setErrorMessage("");

                const data = await getAllCourses();

                if (!mounted) return;

                setCourses(Array.isArray(data) ? data : []);
            } catch (error) {
                if (!mounted) return;

                setCourses([]);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "No se pudieron cargar los cursos.",
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        void loadCourses();

        return () => {
            mounted = false;
        };
    }, []);

    const publicCourses = useMemo(() => {
        return courses.filter(
            (course) =>
                getCourseIsPublished(course) && getCourseOpenEnrollment(course),
        );
    }, [courses]);


    useEffect(() => {
        if (publicCourses.length <= 1) return;

        const interval = window.setInterval(() => {
            setActiveCourseIndex((current) => (current + 1) % publicCourses.length);
        }, 4200);

        return () => {
            window.clearInterval(interval);
        };
    }, [publicCourses.length]);

    const activeCoursePosition =
        publicCourses.length > 0 ? activeCourseIndex % publicCourses.length : 0;

    const featuredCourse =
        publicCourses.length > 0 ? publicCourses[activeCoursePosition] : null;

    function goToPreviousCourse() {
        if (publicCourses.length === 0) return;

        setActiveCourseIndex((current) => {
            const currentPosition = current % publicCourses.length;
            return currentPosition === 0
                ? publicCourses.length - 1
                : currentPosition - 1;
        });
    }

    function goToNextCourse() {
        if (publicCourses.length === 0) return;

        setActiveCourseIndex((current) => {
            const currentPosition = current % publicCourses.length;
            return (currentPosition + 1) % publicCourses.length;
        });
    }

    return (
        <section className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#f8fafc_38%,_#eef2ff_68%,_#e2e8f0_100%)]">
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8 lg:px-12">
                    <Link href="/login" className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                            <img
                                src={HEADER_LOGO}
                                alt="Logo GaiaTech"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <div>
                            <p className="text-base font-black leading-tight text-slate-950">
                                GaiaTech
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                                Cursos en línea
                            </p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
                        <a href="#cursos" className="transition hover:text-blue-600">
                            Cursos
                        </a>
                        <a href="#informacion" className="transition hover:text-blue-600">
                            Información
                        </a>
                    </nav>

                    <Link
                        href="/login"
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        Iniciar sesión
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 lg:px-12">
                <section
                    id="informacion"
                    className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
                >
                    <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="px-6 py-8 md:px-10 md:py-12">
                            <div className="mb-6 flex items-center gap-4">

                                <div>
                                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                        Catálogo de cursos
                                    </span>

                                    <p className="mt-2 text-sm font-semibold text-slate-500">
                                        Formación online para nuevos aprendizajes
                                    </p>
                                </div>
                            </div>

                            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                                Cursos GaiaTech
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                                Explora nuestros cursos disponibles y encuentra la mejor
                                opción para fortalecer tus conocimientos. Para ver más
                                información o matricularte, inicia sesión en la plataforma.
                            </p>

                            <div className="mt-6 space-y-3 text-sm text-slate-700 md:text-base">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 text-lg font-bold text-blue-600">
                                        ✓
                                    </span>
                                    <p>Accede a cursos con contenido práctico y actual.</p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 text-lg font-bold text-blue-600">
                                        ✓
                                    </span>
                                    <p>Aprende a tu ritmo con una experiencia sencilla.</p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 text-lg font-bold text-blue-600">
                                        ✓
                                    </span>
                                    <p>Descubre cursos publicados con matrícula abierta.</p>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/login"
                                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    Iniciar sesión
                                </Link>

                                <Link
                                    href="/login"
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Ver cursos
                                </Link>
                            </div>
                        </div>

                        <div className="relative h-[420px] overflow-hidden border-t border-slate-200 bg-slate-100 lg:h-[520px] lg:border-l lg:border-t-0">
                            {featuredCourse ? (
                                <>
                                    <img
                                        src={resolveImageUrl(getCourseImageUrl(featuredCourse))}
                                        alt={getCourseName(featuredCourse)}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                                    <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-800 shadow">
                                            {getCourseLevel(featuredCourse)}
                                        </span>

                                        {hasDiscount(featuredCourse) ? (
                                            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                                                En oferta
                                            </span>
                                        ) : null}
                                    </div>

                                    {publicCourses.length > 1 ? (
                                        <div className="absolute right-5 top-5 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={goToPreviousCourse}
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg font-black text-slate-800 shadow transition hover:bg-white"
                                                aria-label="Curso anterior"
                                            >
                                                ‹
                                            </button>

                                            <button
                                                type="button"
                                                onClick={goToNextCourse}
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg font-black text-slate-800 shadow transition hover:bg-white"
                                                aria-label="Curso siguiente"
                                            >
                                                ›
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                        <div className="min-h-[190px] rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                                                Curso destacado
                                            </p>

                                            <h2 className="mt-2 line-clamp-2 text-2xl font-black leading-tight text-white">
                                                {getCourseName(featuredCourse)}
                                            </h2>

                                            <p className="mt-2 h-[44px] overflow-hidden text-sm leading-5 text-white/85">
                                                <span className="line-clamp-2 block break-words">
                                                    {getCourseDescription(featuredCourse) ||
                                                        "Curso disponible en la plataforma."}
                                                </span>
                                            </p>

                                            <div className="mt-4 flex items-center justify-between gap-3">
                                                <div className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-950 shadow">
                                                    {getMainPriceLabel(featuredCourse)}
                                                </div>

                                                <Link
                                                    href="/login"
                                                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                                                >
                                                    Acceder
                                                </Link>
                                            </div>

                                            {publicCourses.length > 1 ? (
                                                <div className="mt-4 flex items-center gap-2">
                                                    {publicCourses.map((course, index) => (
                                                        <button
                                                            key={course.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setActiveCourseIndex(index)
                                                            }
                                                            className={`h-2 rounded-full transition-all ${index === activeCoursePosition
                                                                ? "w-8 bg-white"
                                                                : "w-2 bg-white/45 hover:bg-white/70"
                                                                }`}
                                                            aria-label={`Mostrar curso ${index + 1
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full min-h-[390px] items-center justify-center bg-gradient-to-br from-blue-100 via-white to-slate-100 p-8">
                                    <div className="max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                                            <img
                                                src={HEADER_LOGO}
                                                alt="Logo GaiaTech"
                                                className="h-full w-full object-contain"
                                            />
                                        </div>

                                        <h3 className="mt-4 text-xl font-black text-slate-900">
                                            Cursos GaiaTech
                                        </h3>

                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            Explora la oferta académica disponible e inicia
                                            sesión para ver más detalles.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Cursos disponibles
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                            {publicCourses.length}
                        </p>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Modalidad
                        </p>
                        <p className="mt-2 text-lg font-black text-slate-950">
                            Acceso en línea
                        </p>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Requisito
                        </p>
                        <p className="mt-2 text-lg font-black text-slate-950">
                            Inicio de sesión
                        </p>
                    </div>
                </section>

                {loading ? (
                    <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
                        Cargando cursos...
                    </div>
                ) : errorMessage ? (
                    <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700 shadow-sm">
                        {errorMessage}
                    </div>
                ) : publicCourses.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <p className="text-base font-bold text-slate-800">
                            No hay cursos públicos disponibles por ahora
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Vuelve más tarde para revisar nuevos cursos publicados.
                        </p>
                    </div>
                ) : (
                    <section id="cursos" className="space-y-6">
                        <div className="flex flex-col gap-3">
                            <h2 className="text-3xl font-black tracking-tight text-slate-950">
                                Cursos disponibles
                            </h2>

                        </div>

                        <div className="grid justify-center gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {publicCourses.map((course) => (
                                <article
                                    key={course.id}
                                    className="group w-full max-w-[380px] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.14)]"
                                >
                                    <div className="relative h-60 overflow-hidden bg-slate-100">
                                        <img
                                            src={resolveImageUrl(getCourseImageUrl(course))}
                                            alt={getCourseName(course)}
                                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-transparent" />

                                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-800 shadow">
                                                {getCourseLevel(course)}
                                            </span>

                                            {hasDiscount(course) ? (
                                                <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                                                    En oferta
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="absolute inset-x-0 bottom-0 p-4">
                                            <div className="flex items-end justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                                                        Curso
                                                    </p>

                                                    <h3 className="mt-1 line-clamp-2 text-2xl font-black leading-tight text-white drop-shadow-sm">
                                                        {getCourseName(course)}
                                                    </h3>
                                                </div>

                                                <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-right shadow-lg">
                                                    <p className="text-base font-black text-slate-950">
                                                        {getMainPriceLabel(course)}
                                                    </p>

                                                    {hasDiscount(course) ? (
                                                        <p className="text-xs font-semibold text-slate-400 line-through">
                                                            {formatMoney(
                                                                getCoursePrice(course),
                                                                getCourseCurrency(course),
                                                            )}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 p-6">
                                        <p className="min-h-[84px] overflow-hidden break-words text-sm leading-7 text-slate-600">
                                            <span className="line-clamp-3 block">
                                                {getCourseDescription(course) ||
                                                    "Curso disponible en la plataforma para fortalecer tus conocimientos."}
                                            </span>
                                        </p>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Link
                                                href="/login"
                                                className="flex min-h-[52px] items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                                            >
                                                Ver curso
                                            </Link>

                                            <Link
                                                href="/login"
                                                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                                            >
                                                Matricularme
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </section>
    );
}