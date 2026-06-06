"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllCourses, type Course } from "@/services/courses.service";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const EMPTY_IMAGE =
    "https://placehold.co/1200x720/eaf2ff/1d4ed8?text=ATHENA";

const HEADER_LOGO = "/images/athena.png";

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

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
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
    return asApiCourse(course).level ?? "INTERMEDIO";
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

function scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
}

function SearchIcon() {
    return (
        <svg
            className="h-5 w-5 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="m16.2 16.2 4.3 4.3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="m13 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M4 20a8 8 0 0 1 16 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function BookIcon() {
    return (
        <svg
            className="h-11 w-11 text-blue-700"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M4 6.5 12 3l8 3.5-8 3.5-8-3.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M4 10.5 12 14l8-3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4 14.5 12 18l8-3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function GlobeIcon() {
    return (
        <svg
            className="h-11 w-11 text-blue-700"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M3 12h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M12 3c2.2 2.4 3.4 5.4 3.4 9S14.2 18.6 12 21c-2.2-2.4-3.4-5.4-3.4-9S9.8 5.4 12 3Z"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg
            className="h-11 w-11 text-blue-700"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M12 3 20 6v6.1c0 4.7-3.3 7.6-8 8.9-4.7-1.3-8-4.2-8-8.9V6l8-3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="m8.5 12 2.2 2.2 4.8-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function PublicCoursesView() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [activeCourseIndex, setActiveCourseIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("TODOS");

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

    const courseLevels = useMemo(() => {
        const levels = publicCourses
            .map((course) => getCourseLevel(course))
            .filter(Boolean);

        return Array.from(new Set(levels));
    }, [publicCourses]);

    const visibleCourses = useMemo(() => {
        const normalizedSearch = normalizeText(searchTerm);

        return publicCourses.filter((course) => {
            const name = normalizeText(getCourseName(course));
            const description = normalizeText(getCourseDescription(course));
            const level = getCourseLevel(course);

            const matchesSearch =
                !normalizedSearch ||
                name.includes(normalizedSearch) ||
                description.includes(normalizedSearch);

            const matchesLevel =
                selectedLevel === "TODOS" || level === selectedLevel;

            return matchesSearch && matchesLevel;
        });
    }, [publicCourses, searchTerm, selectedLevel]);

    useEffect(() => {
        if (publicCourses.length <= 1) return;

        const interval = window.setInterval(() => {
            setActiveCourseIndex((current) => (current + 1) % publicCourses.length);
        }, 4500);

        return () => {
            window.clearInterval(interval);
        };
    }, [publicCourses.length]);

    const activeCoursePosition =
        publicCourses.length > 0 ? activeCourseIndex % publicCourses.length : 0;

    const featuredCourse =
        publicCourses.length > 0 ? publicCourses[activeCoursePosition] : null;

    return (
        <>
            <style jsx global>{`
                @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap");

                html {
                    scroll-behavior: smooth;
                }

                .athena-public-page {
                    font-family: "Roboto", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                /*
                 * Compacta únicamente la portada en laptops con poca altura,
                 * por ejemplo 1280 × 720 o 1366 × 768.
                 */
                @media (min-width: 1024px) and (max-height: 760px) {
                    .athena-public-header-inner {
                        height: 64px !important;
                    }

                    .athena-public-logo {
                        height: 44px !important;
                        width: 44px !important;
                        border-radius: 14px !important;
                    }

                    .athena-public-brand {
                        font-size: 20px !important;
                    }

                    .athena-public-main {
                        padding-top: 14px !important;
                        padding-bottom: 48px !important;
                    }

                    .athena-hero {
                        min-height: 0 !important;
                        gap: 24px !important;
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                    }

                    .athena-hero-kicker {
                        margin-bottom: 12px !important;
                        padding: 6px 14px !important;
                        font-size: 10px !important;
                    }

                    .athena-hero-title {
                        font-size: 52px !important;
                    }

                    .athena-hero-copy {
                        margin-top: 14px !important;
                        font-size: 14px !important;
                        line-height: 1.55 !important;
                    }

                    .athena-hero-actions {
                        margin-top: 16px !important;
                        gap: 10px !important;
                    }

                    .athena-hero-actions > * {
                        height: 46px !important;
                        padding-left: 18px !important;
                        padding-right: 18px !important;
                    }

                    .athena-students {
                        margin-top: 15px !important;
                    }

                    .athena-feature-frame {
                        border-width: 6px !important;
                        border-radius: 28px !important;
                    }

                    .athena-feature-image,
                    .athena-feature-empty {
                        height: 306px !important;
                    }

                    .athena-feature-content {
                        height: 166px !important;
                        padding: 12px !important;
                    }

                    .athena-routes {
                        margin-top: 18px !important;
                        gap: 14px !important;
                    }

                    .athena-route-card {
                        min-height: 74px !important;
                        gap: 14px !important;
                        padding: 15px !important;
                    }

                    .athena-courses {
                        margin-top: 28px !important;
                    }
                }
            `}</style>

            <section
                id="inicio"
                className="athena-public-page min-h-screen overflow-x-hidden bg-[#f7fbff] text-slate-950"
            >
                <div className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute left-[-140px] top-[170px] h-[430px] w-[430px] rounded-full bg-blue-100/80 blur-3xl" />
                    <div className="absolute right-[-170px] top-[160px] h-[540px] w-[540px] rounded-full bg-indigo-100/80 blur-3xl" />
                    <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-sky-100/70 blur-3xl" />
                </div>

                <header className="athena-public-header sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
                    <div className="athena-public-header-inner mx-auto flex h-[68px] max-w-[1360px] items-center justify-between gap-3 px-4 transition-all sm:h-[74px] sm:px-5 lg:h-[82px] lg:px-6 xl:px-8 2xl:px-0">
                        <button
                            type="button"
                            onClick={() => scrollToSection("inicio")}
                            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
                        >
                            <div className="athena-public-logo flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm transition-all sm:h-12 sm:w-12 sm:rounded-2xl lg:h-14 lg:w-14 lg:p-2">
                                <img
                                    src={HEADER_LOGO}
                                    alt="Logo ATHENA"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div className="text-left">
                                <p className="athena-public-brand text-lg font-black leading-none tracking-tight text-slate-950 sm:text-xl lg:text-2xl">
                                    ATHENA
                                </p>
                            </div>
                        </button>

                        <nav className="hidden items-center gap-5 text-xs font-black text-slate-700 lg:flex xl:gap-7 xl:text-sm 2xl:gap-11">
                            <button
                                type="button"
                                onClick={() => scrollToSection("cursos")}
                                className="transition hover:text-blue-700"
                            >
                                Cursos
                            </button>

                            <button
                                type="button"
                                onClick={() => scrollToSection("rutas")}
                                className="transition hover:text-blue-700"
                            >
                                Rutas de aprendizaje
                            </button>

                            <Link
                                href="/athena"
                                className="transition hover:text-blue-700"
                            >
                                Sobre ATHENA
                            </Link>

                            <button
                                type="button"
                                onClick={() => scrollToSection("informacion")}
                                className="transition hover:text-blue-700"
                            >
                                Información
                            </button>
                        </nav>

                        <Link
                            href="/login"
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black !text-white shadow-[0_14px_34px_rgba(29,78,216,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-800 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm lg:h-12 lg:px-6"
                        >
                            <span className="sm:hidden">Entrar</span>
                            <span className="hidden sm:inline">Iniciar sesión</span>
                            <ArrowIcon />
                        </Link>
                    </div>
                </header>

                <main className="athena-public-main mx-auto max-w-[1360px] px-4 pb-12 pt-5 sm:px-5 sm:pb-14 sm:pt-7 lg:px-6 lg:pb-16 lg:pt-8 xl:px-8 2xl:px-0">
                    <section
                        id="informacion"
                        className="athena-hero scroll-mt-24 grid min-h-0 items-center gap-7 py-2 sm:gap-8 sm:py-4 lg:min-h-[400px] lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 xl:min-h-[440px] xl:grid-cols-[0.78fr_1.22fr] xl:gap-10"
                    >
                        <div className="relative">
                            <div className="athena-hero-kicker mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 sm:mb-5 sm:px-5 sm:text-xs sm:tracking-[0.26em] lg:mb-6">
                                Sistema virtual de aprendizaje
                            </div>

                            <h1 className="athena-hero-title max-w-[620px] text-[42px] font-black leading-[0.95] tracking-[-0.04em] text-slate-950 xs:text-[48px] sm:text-[56px] md:text-[64px] xl:text-[70px]">
                                Aprende con{" "}
                                <span className="block text-blue-700">ATHENA</span>
                            </h1>

                            <p className="athena-hero-copy mt-5 max-w-[610px] text-sm font-medium leading-6 text-slate-600 sm:mt-6 sm:text-[15px] sm:leading-7 md:text-[16px] lg:mt-7">
                                Explora nuestro catálogo de cursos diseñados para ayudarte a adquirir
                                nuevas habilidades y crecer profesionalmente.
                            </p>

                            <div className="athena-hero-actions mt-6 flex flex-wrap gap-3 sm:mt-7 sm:gap-4 lg:mt-8">
                                <button
                                    type="button"
                                    onClick={() => scrollToSection("cursos")}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-xs font-black !text-white shadow-[0_16px_35px_rgba(29,78,216,0.25)] transition hover:-translate-y-0.5 hover:bg-blue-800 sm:h-14 sm:gap-3 sm:px-7 sm:text-sm"
                                >
                                    Explorar cursos
                                    <ArrowIcon />
                                </button>

                                <Link
                                    href="/login"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 sm:h-14 sm:gap-3 sm:px-7 sm:text-sm"
                                >
                                    Crear cuenta
                                    <UserIcon />
                                </Link>
                            </div>

                            <div className="athena-students mt-6 flex items-center gap-3 sm:mt-8 sm:gap-4">
                                <div className="flex -space-x-3">
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-[#bcdcff] sm:h-9 sm:w-9" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-[#a9dcff] sm:h-9 sm:w-9" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-[#b7c7ff] sm:h-9 sm:w-9" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-[#dce4ee] sm:h-9 sm:w-9" />
                                </div>

                                <div>
                                    <p className="text-sm font-black text-slate-950">
                                        +2,500 estudiantes
                                    </p>
                                    <p className="text-sm font-medium text-slate-500">
                                        ya están aprendiendo con ATHENA
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative lg:flex lg:justify-end">
                            <div className="absolute -right-14 top-10 hidden h-[340px] w-[340px] rounded-full bg-blue-200/40 blur-3xl lg:block" />

                            <div className="athena-feature-frame relative w-full max-w-[790px] overflow-hidden rounded-[24px] border-4 border-white bg-white shadow-[0_30px_90px_rgba(15,23,42,0.15)] sm:rounded-[30px] sm:border-[6px] lg:rounded-[34px] lg:border-[8px]">
                                {featuredCourse ? (
                                    <div className="athena-feature-image relative h-[300px] overflow-hidden rounded-[18px] bg-slate-100 sm:h-[340px] sm:rounded-[22px] lg:h-[360px] xl:h-[380px] xl:rounded-[25px]">
                                        <img
                                            src={resolveImageUrl(getCourseImageUrl(featuredCourse))}
                                            alt={getCourseName(featuredCourse)}
                                            className="absolute inset-0 h-full w-full object-cover"
                                            onError={(event) => {
                                                event.currentTarget.src = EMPTY_IMAGE;
                                            }}
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/25 via-slate-950/5 to-white/20" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                                        <div className="absolute left-3 top-3 flex max-w-[calc(100%-62px)] flex-wrap gap-2 sm:left-5 sm:top-5 sm:gap-3">
                                            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase text-slate-800 shadow-sm sm:px-5 sm:py-2 sm:text-xs">
                                                {getCourseLevel(featuredCourse)}
                                            </span>

                                            {hasDiscount(featuredCourse) ? (
                                                <span className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-sm sm:px-5 sm:py-2 sm:text-xs">
                                                    En oferta
                                                </span>
                                            ) : null}

                                            {getCourseDurationHours(featuredCourse) > 0 ? (
                                                <span className="rounded-full bg-blue-700 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-sm sm:px-5 sm:py-2 sm:text-xs">
                                                    {getCourseDurationHours(featuredCourse)} horas
                                                </span>
                                            ) : null}
                                        </div>

                                        <button
                                            type="button"
                                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-blue-700 shadow-sm sm:right-5 sm:top-5 sm:h-12 sm:w-12 sm:rounded-2xl"
                                            aria-label="Guardar curso"
                                        >
                                            ♡
                                        </button>

                                        <div className="absolute bottom-3 left-3 w-[465px] max-w-[calc(100%-24px)] sm:bottom-4 sm:left-5 sm:max-w-[calc(100%-40px)]">
                                            <div className="athena-feature-content flex h-[176px] flex-col overflow-hidden rounded-[18px] border border-white/60 bg-white/90 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.20)] backdrop-blur-xl sm:h-[190px] sm:rounded-[22px] sm:p-4 lg:h-[200px] lg:rounded-[24px]">
                                                <span className="w-fit rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                                                    Curso destacado
                                                </span>

                                                <h2 className="mt-2 line-clamp-1 text-base font-black leading-[1.2] tracking-[-0.02em] text-slate-950 sm:text-[20px]">
                                                    {getCourseName(featuredCourse)}
                                                </h2>

                                                <p className="mt-1.5 line-clamp-2 h-[34px] max-w-[430px] text-[10px] font-medium leading-[16px] text-slate-600 sm:mt-2 sm:h-[38px] sm:text-[11px] sm:leading-[18px]">
                                                    {getCourseDescription(featuredCourse) ||
                                                        "Curso disponible en la plataforma ATHENA."}
                                                </p>

                                                <div className="mt-auto flex items-end justify-between gap-3">
                                                    <div className="rounded-xl bg-white px-3 py-1.5 shadow-sm sm:rounded-2xl sm:px-4 sm:py-2">
                                                        <p className="text-[10px] font-black uppercase text-slate-400">
                                                            Inversión
                                                        </p>
                                                        <p className="mt-0.5 text-base font-black text-slate-950">
                                                            {getMainPriceLabel(featuredCourse)}
                                                        </p>
                                                    </div>

                                                    <Link
                                                        href="/login"
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-3 text-xs font-black !text-white shadow-sm transition hover:bg-blue-800 sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-5 sm:text-sm"
                                                    >
                                                        Ver detalles
                                                        <ArrowIcon />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="athena-feature-empty flex h-[300px] items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-50 to-white p-6 sm:h-[340px] sm:rounded-[22px] sm:p-8 lg:h-[360px] xl:h-[420px] xl:rounded-[25px]">
                                        <div className="max-w-sm text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                                                <img
                                                    src={HEADER_LOGO}
                                                    alt="Logo ATHENA"
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>

                                            <h3 className="mt-5 text-2xl font-black text-slate-950">
                                                Catálogo ATHENA
                                            </h3>

                                            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                                                Aquí se mostrarán los cursos publicados con matrícula
                                                abierta.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section
                        id="rutas"
                        className="athena-routes scroll-mt-24 mt-7 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:mt-8 lg:gap-5"
                    >
                        <div className="athena-route-card flex min-h-[86px] items-center gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5 lg:min-h-[92px] lg:gap-5 lg:rounded-[24px] lg:p-6">
                            <BookIcon />
                            <div>
                                <p className="text-lg font-black text-slate-950">
                                    {publicCourses.length}+ Cursos disponibles
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Contenido actualizado y de calidad
                                </p>
                            </div>
                        </div>

                        <div className="athena-route-card flex min-h-[86px] items-center gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5 lg:min-h-[92px] lg:gap-5 lg:rounded-[24px] lg:p-6">
                            <GlobeIcon />
                            <div>
                                <p className="text-lg font-black text-slate-950">
                                    Modalidad 100% Online
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Acceso en línea 24/7 desde cualquier lugar
                                </p>
                            </div>
                        </div>

                        <div className="athena-route-card flex min-h-[86px] items-center gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5 lg:min-h-[92px] lg:gap-5 lg:rounded-[24px] lg:p-6">
                            <ShieldIcon />
                            <div>
                                <p className="text-lg font-black text-slate-950">
                                    Requisitos mínimos
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Solo necesitas interés por aprender
                                </p>
                            </div>
                        </div>
                    </section>

                    <section id="cursos" className="athena-courses scroll-mt-24 mt-9 lg:mt-10">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.26em] text-blue-700">
                                    Oferta disponible
                                </p>
                                <h2 className="mt-2 text-[28px] font-black tracking-[-0.03em] text-slate-950 sm:mt-3 sm:text-[34px]">
                                    Cursos disponibles
                                </h2>
                                <p className="mt-2 text-sm font-medium text-slate-500">
                                    Busca un curso por nombre o descripción y filtra por nivel.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px] lg:w-[600px] xl:w-[620px] xl:grid-cols-[minmax(0,1fr)_220px]">
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                        <SearchIcon />
                                    </div>

                                    <input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Buscar curso..."
                                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <select
                                    value={selectedLevel}
                                    onChange={(event) => setSelectedLevel(event.target.value)}
                                    className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="TODOS">Todos los niveles</option>
                                    {courseLevels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-black text-slate-500 shadow-sm">
                                Cargando cursos...
                            </div>
                        ) : errorMessage ? (
                            <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700 shadow-sm">
                                {errorMessage}
                            </div>
                        ) : publicCourses.length === 0 ? (
                            <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                                <p className="text-base font-black text-slate-800">
                                    No hay cursos públicos disponibles por ahora
                                </p>

                                <p className="mt-2 text-sm font-medium text-slate-500">
                                    Vuelve más tarde para revisar nuevos cursos publicados.
                                </p>
                            </div>
                        ) : visibleCourses.length === 0 ? (
                            <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                                <p className="text-base font-black text-slate-800">
                                    No se encontraron cursos
                                </p>

                                <p className="mt-2 text-sm font-medium text-slate-500">
                                    Intenta con otro nombre o selecciona otro nivel.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-7 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
                                {visibleCourses.map((course) => (
                                    <article
                                        key={course.id}
                                        className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.14)]"
                                    >
                                        <div className="relative h-[145px] overflow-hidden rounded-[16px] bg-slate-100">
                                            <img
                                                src={resolveImageUrl(getCourseImageUrl(course))}
                                                alt={getCourseName(course)}
                                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                                onError={(event) => {
                                                    event.currentTarget.src = EMPTY_IMAGE;
                                                }}
                                            />

                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent" />

                                            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                                                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-slate-800 shadow-sm">
                                                    {getCourseLevel(course)}
                                                </span>

                                                {hasDiscount(course) ? (
                                                    <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-sm">
                                                        Oferta
                                                    </span>
                                                ) : null}
                                            </div>

                                            <button
                                                type="button"
                                                className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-blue-700 shadow-sm"
                                                aria-label="Guardar curso"
                                            >
                                                ♡
                                            </button>
                                        </div>

                                        <div className="p-3">
                                            <h3 className="line-clamp-2 min-h-[44px] text-lg font-black leading-tight tracking-[-0.02em] text-slate-950">
                                                {getCourseName(course)}
                                            </h3>

                                            <p className="mt-2 line-clamp-3 min-h-[63px] text-[13px] font-medium leading-5 text-slate-500">
                                                {getCourseDescription(course) ||
                                                    "Curso disponible en ATHENA para fortalecer tus conocimientos."}
                                            </p>

                                            <div className="mt-4 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-base font-black text-slate-950">
                                                        {getMainPriceLabel(course)}
                                                    </p>

                                                    {hasDiscount(course) ? (
                                                        <p className="text-xs font-bold text-slate-400 line-through">
                                                            {formatMoney(
                                                                getCoursePrice(course),
                                                                getCourseCurrency(course),
                                                            )}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <Link
                                                    href="/login"
                                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-xs font-black text-blue-700 transition hover:bg-blue-700 hover:text-white"
                                                >
                                                    Ver curso
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </section>
        </>
    );
}