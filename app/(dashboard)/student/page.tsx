"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllCourses, type Course } from "@/services/courses.service";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

function resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) {
        return "https://placehold.co/1200x800/e2e8f0/64748b?text=Curso";
    }

    const trimmed = imageUrl.trim();

    if (!trimmed) {
        return "https://placehold.co/1200x800/e2e8f0/64748b?text=Curso";
    }

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

function toSafeNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
}

function formatMoney(value: number, currency = "USD"): string {
    try {
        return new Intl.NumberFormat("es-EC", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

function getDiscountPrice(course: Course): number {
    return toSafeNumber(course.discount_price ?? 0, 0);
}

function getRegularPrice(course: Course): number {
    return toSafeNumber(course.price ?? 0, 0);
}

function getCoursePriceLabel(course: Course): string {
    if (course.is_free || getRegularPrice(course) <= 0) {
        return "Gratis";
    }

    return formatMoney(getRegularPrice(course), course.currency || "USD");
}

function hasDiscount(course: Course): boolean {
    const regular = getRegularPrice(course);
    const discount = getDiscountPrice(course);

    return !course.is_free && discount > 0 && discount < regular;
}

export default function StudentPage() {
    const { user } = useAuth();


    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let isMounted = true;

        const timer = window.setTimeout(() => {
            const loadCourses = async () => {
                try {
                    const response = await getAllCourses();

                    if (!isMounted) return;

                    setCourses(Array.isArray(response) ? response : []);
                    setError("");
                } catch (err) {
                    if (!isMounted) return;

                    setCourses([]);
                    setError(
                        err instanceof Error
                            ? err.message
                            : "No se pudieron cargar los cursos.",
                    );
                } finally {
                    if (!isMounted) return;
                    setLoading(false);
                }
            };

            void loadCourses();
        }, 0);

        return () => {
            isMounted = false;
            window.clearTimeout(timer);
        };
    }, []);

    return (
        <section className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                    <input
                        type="text"
                        placeholder="Buscar cursos..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"  
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <span className="mt-1 text-xs text-slate-500">
                        Explora nuestra variedad de cursos disponibles.
                    </span>

                    <div className="mt-4 flex items-center gap-4">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                            <span className="text-xs font-bold uppercase tracking-wide">Total de cursos</span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                {courses.length}
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    Cargando cursos...
                </div>
            ) : null}

            {!loading && courses.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {courses.map((course) => (
                        <article
                            key={course.id}
                            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                <img
                                    src={resolveImageUrl(course.image_url)}
                                    alt={course.name}
                                    className="h-full w-full object-cover transition duration-300"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-900/10 to-transparent" />

                                <div className="absolute left-4 top-4">
                                    <span className="inline-flex rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow-lg">
                                        {course.is_free ? "Gratis" : getCoursePriceLabel(course)}
                                    </span>
                                </div>

                                {hasDiscount(course) ? (
                                    <div className="absolute right-4 top-4">
                                        <div className="relative rotate-[-6deg] rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 px-4 py-2 text-white shadow-[0_12px_30px_rgba(239,68,68,0.35)] ring-2 ring-white/80">
                                            <div className="absolute -inset-1 rounded-[18px] border border-white/25" />
                                            <div className="relative flex flex-col items-center leading-none">
                                                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/95">
                                                    En oferta
                                                </span>
                                                <span className="mt-1 text-lg font-black">
                                                    {formatMoney(
                                                        getDiscountPrice(course),
                                                        course.currency || "USD",
                                                    )}
                                                </span>
                                                <span className="mt-1 text-[11px] font-semibold text-white/80 line-through">
                                                    {formatMoney(
                                                        getRegularPrice(course),
                                                        course.currency || "USD",
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <div className="inline-flex rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                                        {course.level}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 p-5">
                                <div>
                                    <h3 className="line-clamp-2 text-lg font-bold text-slate-950">
                                        {course.name}
                                    </h3>
                                    <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                                        {course.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    

                                    <Link
                                        href={`/student/enrollment/${course.id}`}
                                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,99,216,0.25)]"
                                    >
                                        Matricularme
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}

            {!loading && courses.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    Aún no hay cursos disponibles.
                </div>
            ) : null}
        </section>
    );
}