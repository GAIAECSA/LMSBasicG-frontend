/* eslint-disable @next/next/no-img-element -- Logos y portadas son contenidos del backend, bajo el origen del tenant. */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import type { PublicCourse } from "@/lib/courses";
import type { TenantPublic } from "@/lib/tenant/types";

const EMPTY_IMAGE = "/course-placeholder.svg";

/** No permitir recursos javascript:/data: ni rutas internas arbitrarias en portadas. */
function resolveImageUrl(path?: string | null): string {
    if (!path) return EMPTY_IMAGE;
    if (path.startsWith("/uploads/") || path.startsWith("/api/v1/")) return path;
    try {
        const url = new URL(path);
        return url.protocol === "https:" ? url.href : EMPTY_IMAGE;
    } catch { return EMPTY_IMAGE; }
}

/** No se muestra ningún logo de ATHENA como fallback de otro tenant. */
function TenantLogo({ name, url }: { name: string; url: string | null }) {
    const [failed, setFailed] = useState(false);
    if (!url || failed) return <GraduationCap aria-label={`Identidad de ${name}`} className="h-full w-full text-blue-700" />;
    return <img src={url} alt={`Logo de ${name}`} className="h-full w-full object-contain" onError={() => setFailed(true)} />;
}

const getCourseName = (course: PublicCourse) => course.name;
const getCourseDescription = (course: PublicCourse) => course.description ?? "";
const getCourseImageUrl = (course: PublicCourse) => course.image_url;
const getCourseLevel = (course: PublicCourse) => course.level ?? "GENERAL";
const getCoursePrice = (course: PublicCourse) => Number(course.price) || 0;
const getCourseCurrency = (course: PublicCourse) => course.currency || "USD";
const getCourseDurationHours = (course: PublicCourse) => course.duration_hours ?? 0;

function formatMoney(value: number, currency = "USD") {
    try { return new Intl.NumberFormat("es-EC", { style: "currency", currency, minimumFractionDigits: 2 }).format(value); }
    catch { return `${currency} ${value.toFixed(2)}`; }
}
function hasDiscount(course: PublicCourse): boolean {
    const original = Number(course.price);
    const discount = Number(course.discount_price);
    return !course.is_free && course.discount_price != null && Number.isFinite(discount) && discount >= 0 && discount < original;
}
function getMainPriceLabel(course: PublicCourse): string {
    if (course.is_free) return "Gratis";
    return formatMoney(hasDiscount(course) ? Number(course.discount_price) : getCoursePrice(course), getCourseCurrency(course));
}
function normalizeText(value: string) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            className="h-10 w-10 shrink-0 text-blue-700 sm:h-11 sm:w-11"
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
            className="h-10 w-10 shrink-0 text-blue-700 sm:h-11 sm:w-11"
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
            className="h-10 w-10 shrink-0 text-blue-700 sm:h-11 sm:w-11"
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


/**
 * Portada original: HTML y composiciones se preservan de public-courses-view.tsx.
 * Tenancy, identidad y cursos llegan de SSR y son datos por petición; nunca del build.
 * Los colores Tailwind 'blue' se conectan a variables CSS del tenant (globals.css).
 */
export function HomeClient({ tenant, courses, coursesStatus }: {
    tenant: TenantPublic;
    courses: PublicCourse[];
    coursesStatus: "ok" | "unavailable";
}) {
    const publicCourses = courses;
    const [activeCourseIndex, setActiveCourseIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("TODOS");

    const courseLevels = useMemo(() => Array.from(new Set(publicCourses.map(getCourseLevel).filter(Boolean))), [publicCourses]);
    const visibleCourses = useMemo(() => {
        const search = normalizeText(searchTerm);
        return publicCourses.filter(course => (
            (!search || normalizeText(getCourseName(course)).includes(search) || normalizeText(getCourseDescription(course)).includes(search)) &&
            (selectedLevel === "TODOS" || getCourseLevel(course) === selectedLevel)
        ));
    }, [publicCourses, searchTerm, selectedLevel]);

    useEffect(() => {
        if (publicCourses.length <= 1) return;
        const interval = window.setInterval(() => setActiveCourseIndex(current => (current + 1) % publicCourses.length), 4500);
        return () => window.clearInterval(interval);
    }, [publicCourses.length]);
    const featuredCourse = publicCourses.length ? publicCourses[activeCourseIndex % publicCourses.length] : null;

    return (
        <>
            <style
                jsx
                global
            >{`
                @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap");

                html {
                    scroll-behavior: smooth;
                }

                .athena-public-page {
                    font-family:
                        "Roboto",
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                /*
                 * En celular y tablet el contenido se presenta en una
                 * columna centrada. Desde 1120 px se aprovecha el espacio
                 * lateral con una composición de dos columnas.
                 */
                @media (min-width: 1120px) {
                    .athena-hero-layout {
                        grid-template-columns:
                            minmax(0, 0.88fr)
                            minmax(0, 1.12fr);
                    }

                    .athena-hero-text {
                        margin-left: 0;
                        margin-right: 0;
                        max-width: none;
                        text-align: left;
                    }

                    .athena-hero-title,
                    .athena-hero-copy {
                        margin-left: 0;
                        margin-right: 0;
                    }

                    .athena-hero-actions,
                    .athena-students {
                        justify-content: flex-start;
                    }

                    .athena-hero-visual {
                        margin-left: auto;
                        max-width: none;
                    }

                    .athena-feature-frame {
                        margin-left: auto;
                        max-width: 760px;
                    }
                }

                @media (min-width: 1536px) {
                    .athena-hero-layout {
                        grid-template-columns:
                            minmax(0, 0.78fr)
                            minmax(0, 1.22fr);
                    }

                    .athena-feature-frame {
                        max-width: 840px;
                    }
                }

                /*
                 * En laptops de poca altura se conserva espacio cómodo.
                 * La página utiliza scroll vertical en lugar de aplastar
                 * títulos, botones y tarjetas.
                 */
                @media (min-width: 1024px) and (max-height: 760px) {
                    .athena-public-header-inner {
                        height: 68px !important;
                    }

                    .athena-public-main {
                        padding-top: 20px !important;
                        padding-bottom: 54px !important;
                    }

                    .athena-hero {
                        gap: 24px !important;
                        padding-top: 6px !important;
                        padding-bottom: 6px !important;
                    }

                    .athena-feature-image,
                    .athena-feature-empty {
                        height: 310px !important;
                    }

                    .athena-feature-content {
                        height: 164px !important;
                    }

                    .athena-routes {
                        margin-top: 26px !important;
                        gap: 14px !important;
                    }

                    .athena-route-card {
                        min-height: 82px !important;
                        padding: 16px !important;
                    }

                    .athena-courses {
                        margin-top: 34px !important;
                    }
                }
            `}</style>

            <section
                id="inicio"
                className="athena-public-page min-h-screen overflow-x-hidden bg-[var(--tenant-background)] text-slate-950"
            >
                <div className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute left-[-140px] top-[170px] h-[430px] w-[430px] rounded-full bg-blue-100/80 blur-3xl" />
                    <div className="absolute right-[-170px] top-[160px] h-[540px] w-[540px] rounded-full bg-indigo-100/80 blur-3xl" />
                    <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-sky-100/70 blur-3xl" />
                </div>

                <header className="athena-public-header sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
                    <div className="athena-public-header-inner mx-auto flex h-[68px] w-full max-w-[1480px] items-center justify-between gap-3 px-4 transition-all sm:h-[74px] sm:px-5 lg:h-[82px] lg:px-6 xl:px-8 2xl:px-10">
                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection(
                                    "inicio",
                                )
                            }
                            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
                        >
                            <div className="athena-public-logo flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm transition-all sm:h-12 sm:w-12 sm:rounded-2xl lg:h-14 lg:w-14 lg:p-2">
                                <TenantLogo name={tenant.name} url={tenant.logoUrl} />
                            </div>

                            <p className="athena-public-brand max-w-[240px] truncate text-lg font-black leading-none tracking-tight text-slate-950 sm:text-xl lg:text-2xl">
                                {tenant.name}
                            </p>
                        </button>

                        <nav className="hidden items-center gap-6 text-sm font-black text-slate-700 xl:flex 2xl:gap-11">
                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection(
                                        "cursos",
                                    )
                                }
                                className="transition hover:text-blue-700"
                            >
                                Cursos
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection(
                                        "rutas",
                                    )
                                }
                                className="transition hover:text-blue-700"
                            >
                                Rutas de aprendizaje
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection(
                                        "informacion",
                                    )
                                }
                                className="transition hover:text-blue-700"
                            >
                                Información
                            </button>
                        </nav>

                        <Link
                            href="/login"
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black tenant-on-primary tenant-header-shadow transition hover:-translate-y-0.5 hover:bg-blue-800 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm lg:h-12 lg:px-6"
                        >
                            <span className="sm:hidden">
                                Entrar
                            </span>

                            <span className="hidden sm:inline">
                                Iniciar sesión
                            </span>

                            <ArrowIcon />
                        </Link>
                    </div>
                </header>

                <main className="athena-public-main mx-auto w-full max-w-[1480px] px-4 pb-12 pt-5 sm:px-5 sm:pb-14 sm:pt-7 lg:px-6 lg:pb-16 lg:pt-8 xl:px-8 2xl:px-10">
                    <section
                        id="informacion"
                        className="athena-hero athena-hero-layout scroll-mt-24 grid min-h-0 items-center gap-8 py-3 sm:gap-10 sm:py-5 lg:py-6"
                    >
                        <div className="athena-hero-text relative mx-auto w-full max-w-[720px] text-center">
                            <div className="athena-hero-kicker mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 sm:mb-5 sm:px-5 sm:text-xs sm:tracking-[0.26em] lg:mb-6">
                                {tenant.hero.eyebrow}
                            </div>

                            <h1 className="athena-hero-title mx-auto max-w-[620px] text-[38px] font-black leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-[52px] md:text-[58px] lg:text-[60px] 2xl:mx-0 2xl:text-[70px]">
                                {tenant.hero.title.startsWith("Aprende con ") ? (
                                    <>Aprende con{" "}<span className="block text-blue-700">{tenant.hero.title.slice("Aprende con ".length)}</span></>
                                ) : tenant.hero.title}
                            </h1>

                            <p className="athena-hero-copy mx-auto mt-5 max-w-[610px] text-sm font-medium leading-6 text-slate-600 sm:mt-6 sm:text-[15px] sm:leading-7 md:text-[16px] lg:mt-7">
                                {tenant.hero.description}
                            </p>

                            <div className="athena-hero-actions mt-6 flex flex-wrap justify-center gap-3 sm:mt-7 sm:gap-4 lg:mt-8">
                                <button
                                    type="button"
                                    onClick={() =>
                                        scrollToSection(
                                            "cursos",
                                        )
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-xs font-black tenant-on-primary tenant-cta-shadow transition hover:-translate-y-0.5 hover:bg-blue-800 sm:h-14 sm:gap-3 sm:px-7 sm:text-sm"
                                >
                                    {tenant.hero.ctaText}
                                    <ArrowIcon />
                                </button>

                                <Link
                                    href="/login"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 sm:h-14 sm:gap-3 sm:px-7 sm:text-sm"
                                >
                                    Acceder al campus
                                    <UserIcon />
                                </Link>
                            </div>

                            <div className="athena-students mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-4">
                                <div className="flex -space-x-3">
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-100 sm:h-9 sm:w-9" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-200 sm:h-9 sm:w-9" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-100 sm:h-9 sm:w-9" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 sm:h-9 sm:w-9" />
                                </div>

                                <div className="text-left">
                                    <p className="text-sm font-black text-slate-950">
                                        {publicCourses.length} {publicCourses.length === 1 ? "curso publicado" : "cursos publicados"}
                                    </p>

                                    <p className="text-sm font-medium text-slate-500">
                                        en el campus de {tenant.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="athena-hero-visual relative mx-auto w-full max-w-[980px]">
                            <div className="absolute -right-14 top-10 hidden h-[340px] w-[340px] rounded-full bg-blue-200/40 blur-3xl lg:block" />

                            <div className="athena-feature-frame relative w-full overflow-hidden rounded-[24px] border-4 border-white bg-white shadow-[0_30px_90px_rgba(15,23,42,0.15)] sm:rounded-[30px] sm:border-[6px] lg:rounded-[34px] lg:border-[8px]">
                                {featuredCourse ? (
                                    <div className="athena-feature-image relative h-[290px] overflow-hidden rounded-[18px] bg-slate-100 sm:h-[350px] sm:rounded-[22px] lg:h-[360px] 2xl:h-[390px] 2xl:rounded-[25px]">
                                        <img
                                            src={resolveImageUrl(
                                                getCourseImageUrl(
                                                    featuredCourse,
                                                ),
                                            )}
                                            alt={getCourseName(
                                                featuredCourse,
                                            )}
                                            className="absolute inset-0 h-full w-full object-cover"
                                            onError={(
                                                event,
                                            ) => {
                                                if (!event.currentTarget.src.endsWith(EMPTY_IMAGE)) event.currentTarget.src = EMPTY_IMAGE;
                                            }}
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/25 via-slate-950/5 to-white/20" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                                        <div className="absolute left-3 top-3 flex max-w-[calc(100%-62px)] flex-wrap gap-2 sm:left-5 sm:top-5 sm:gap-3">
                                            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase text-slate-800 shadow-sm sm:px-5 sm:py-2 sm:text-xs">
                                                {getCourseLevel(
                                                    featuredCourse,
                                                )}
                                            </span>

                                            {hasDiscount(
                                                featuredCourse,
                                            ) ? (
                                                <span className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-sm sm:px-5 sm:py-2 sm:text-xs">
                                                    En oferta
                                                </span>
                                            ) : null}

                                            {getCourseDurationHours(
                                                featuredCourse,
                                            ) >
                                                0 ? (
                                                <span className="rounded-full bg-blue-700 px-3 py-1.5 text-[10px] font-black uppercase text-[var(--tenant-on-primary)] shadow-sm sm:px-5 sm:py-2 sm:text-xs">
                                                    {getCourseDurationHours(
                                                        featuredCourse,
                                                    )}{" "}
                                                    horas
                                                </span>
                                            ) : null}
                                        </div>

                                        <span aria-hidden="true" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-blue-700 shadow-sm sm:right-5 sm:top-5 sm:h-12 sm:w-12 sm:rounded-2xl">♡</span>

                                        <div className="absolute bottom-3 left-3 w-[465px] max-w-[calc(100%-24px)] sm:bottom-4 sm:left-5 sm:max-w-[calc(100%-40px)]">
                                            <div className="athena-feature-content flex h-[164px] flex-col overflow-hidden rounded-[18px] border border-white/60 bg-white/90 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.20)] backdrop-blur-xl sm:h-[182px] sm:rounded-[22px] sm:p-4 lg:h-[188px] lg:rounded-[24px]">
                                                <span className="w-fit rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                                                    Curso destacado
                                                </span>

                                                <h2 className="mt-2 line-clamp-1 text-base font-black leading-[1.2] tracking-[-0.02em] text-slate-950 sm:text-[20px]">
                                                    {getCourseName(
                                                        featuredCourse,
                                                    )}
                                                </h2>

                                                <p className="mt-1.5 line-clamp-2 h-[34px] max-w-[430px] text-[10px] font-medium leading-[16px] text-slate-600 sm:mt-2 sm:h-[38px] sm:text-[11px] sm:leading-[18px]">
                                                    {getCourseDescription(
                                                        featuredCourse,
                                                    ) ||
                                                        "Conoce los contenidos de este curso."}
                                                </p>

                                                <div className="mt-auto flex items-end justify-between gap-3">
                                                    <div className="rounded-xl bg-white px-3 py-1.5 shadow-sm sm:rounded-2xl sm:px-4 sm:py-2">
                                                        <p className="text-[10px] font-black uppercase text-slate-400">
                                                            Inversión
                                                        </p>

                                                        <p className="mt-0.5 text-base font-black text-slate-950">
                                                            {getMainPriceLabel(
                                                                featuredCourse,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <Link
                                                        href="/login"
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-3 text-xs font-black tenant-on-primary shadow-sm transition hover:bg-blue-800 sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-5 sm:text-sm"
                                                    >
                                                        Ver detalles
                                                        <ArrowIcon />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="athena-feature-empty flex h-[290px] items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-50 to-white p-6 sm:h-[350px] sm:rounded-[22px] sm:p-8 lg:h-[360px] 2xl:h-[390px] 2xl:rounded-[25px]">
                                        <div className="max-w-sm text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                                                <TenantLogo name={tenant.name} url={tenant.logoUrl} />
                                            </div>

                                            <h3 className="mt-5 text-2xl font-black text-slate-950">
                                                Catálogo de {tenant.name}
                                            </h3>

                                            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                                                Aquí se mostrarán los cursos publicados con matrícula abierta.
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
                                <p className="text-base font-black text-slate-950 sm:text-lg">
                                    {publicCourses.length}
                                    {" "}Cursos disponibles
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Consulta la oferta publicada
                                </p>
                            </div>
                        </div>

                        <div className="athena-route-card flex min-h-[86px] items-center gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5 lg:min-h-[92px] lg:gap-5 lg:rounded-[24px] lg:p-6">
                            <GlobeIcon />

                            <div>
                                <p className="text-base font-black text-slate-950 sm:text-lg">
                                    Campus virtual
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Accede a tus recursos de aprendizaje
                                </p>
                            </div>
                        </div>

                        <div className="athena-route-card flex min-h-[86px] items-center gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5 lg:min-h-[92px] lg:gap-5 lg:rounded-[24px] lg:p-6">
                            <ShieldIcon />

                            <div>
                                <p className="text-base font-black text-slate-950 sm:text-lg">
                                    Cursos y formación
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Revisa las condiciones de cada curso
                                </p>
                            </div>
                        </div>
                    </section>

                    <section
                        id="cursos"
                        className="athena-courses scroll-mt-24 mt-9 lg:mt-10"
                    >
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
                                        value={
                                            searchTerm
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setSearchTerm(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Buscar curso..."
                                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <select
                                    value={
                                        selectedLevel
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setSelectedLevel(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="TODOS">
                                        Todos los niveles
                                    </option>

                                    {courseLevels.map(
                                        (
                                            level,
                                        ) => (
                                            <option
                                                key={
                                                    level
                                                }
                                                value={
                                                    level
                                                }
                                            >
                                                {
                                                    level
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                        </div>

                        {coursesStatus === "unavailable" ? (
                            <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700 shadow-sm">
                                No se pudieron obtener los cursos. Vuelve a intentarlo más tarde.
                            </div>
                        ) : publicCourses.length ===
                            0 ? (
                            <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                                <p className="text-base font-black text-slate-800">
                                    No hay cursos públicos disponibles por ahora
                                </p>

                                <p className="mt-2 text-sm font-medium text-slate-500">
                                    Vuelve más tarde para revisar nuevos cursos publicados.
                                </p>
                            </div>
                        ) : visibleCourses.length ===
                            0 ? (
                            <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                                <p className="text-base font-black text-slate-800">
                                    No se encontraron cursos
                                </p>

                                <p className="mt-2 text-sm font-medium text-slate-500">
                                    Intenta con otro nombre o selecciona otro nivel.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {visibleCourses.map(
                                    (
                                        course,
                                    ) => (
                                        <article
                                            key={
                                                course.id
                                            }
                                            className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.14)]"
                                        >
                                            <div className="relative h-[145px] overflow-hidden rounded-[16px] bg-slate-100 sm:h-[160px]">
                                                <img
                                                    src={resolveImageUrl(
                                                        getCourseImageUrl(
                                                            course,
                                                        ),
                                                    )}
                                                    alt={getCourseName(
                                                        course,
                                                    )}
                                                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                                    onError={(
                                                        event,
                                                    ) => {
                                                        if (!event.currentTarget.src.endsWith(EMPTY_IMAGE)) event.currentTarget.src = EMPTY_IMAGE;
                                                    }}
                                                />

                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent" />

                                                <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-slate-800 shadow-sm">
                                                        {getCourseLevel(
                                                            course,
                                                        )}
                                                    </span>

                                                    {hasDiscount(
                                                        course,
                                                    ) ? (
                                                        <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-sm">
                                                            Oferta
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <span aria-hidden="true" className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-blue-700 shadow-sm">♡</span>
                                            </div>

                                            <div className="p-3">
                                                <h3 className="line-clamp-2 min-h-[44px] text-lg font-black leading-tight tracking-[-0.02em] text-slate-950">
                                                    {getCourseName(
                                                        course,
                                                    )}
                                                </h3>

                                                <p className="mt-2 line-clamp-3 min-h-[63px] text-[13px] font-medium leading-5 text-slate-500">
                                                    {getCourseDescription(
                                                        course,
                                                    ) ||
                                                        "Consulta los contenidos de este curso."}
                                                </p>

                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-black text-slate-950">
                                                            {getMainPriceLabel(
                                                                course,
                                                            )}
                                                        </p>

                                                        {hasDiscount(
                                                            course,
                                                        ) ? (
                                                            <p className="text-xs font-bold text-slate-400 line-through">
                                                                {formatMoney(
                                                                    getCoursePrice(
                                                                        course,
                                                                    ),
                                                                    getCourseCurrency(
                                                                        course,
                                                                    ),
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
                                    ),
                                )}
                            </div>
                        )}
                    </section>
                </main>
            </section>
        </>
    );
}
