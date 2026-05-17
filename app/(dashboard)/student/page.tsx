"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllCourses, type Course } from "@/services/courses.service";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

type CatalogFilter = "all" | "open" | "free" | "paid" | "closed";

type CourseWithStates = Course & {
    is_published?: boolean | null;
    open_enrollment?: boolean | null;
    is_free?: boolean | null;
};

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

function isCoursePublished(course: Course): boolean {
    const value = (course as CourseWithStates).is_published;

    return value !== false;
}

function isEnrollmentOpen(course: Course): boolean {
    const value = (course as CourseWithStates).open_enrollment;

    return value !== false;
}

function isFreeCourse(course: Course): boolean {
    return Boolean((course as CourseWithStates).is_free) || getRegularPrice(course) <= 0;
}

function getCoursePriceLabel(course: Course): string {
    if (isFreeCourse(course)) {
        return "Gratis";
    }

    return formatMoney(getRegularPrice(course), course.currency || "USD");
}

function hasDiscount(course: Course): boolean {
    const regular = getRegularPrice(course);
    const discount = getDiscountPrice(course);

    return !isFreeCourse(course) && discount > 0 && discount < regular;
}

function getFinalPrice(course: Course): number {
    if (hasDiscount(course)) {
        return getDiscountPrice(course);
    }

    return getRegularPrice(course);
}

function getDiscountPercentage(course: Course): number {
    const regular = getRegularPrice(course);
    const discount = getDiscountPrice(course);

    if (regular <= 0 || discount <= 0 || discount >= regular) {
        return 0;
    }

    return Math.round(((regular - discount) / regular) * 100);
}

export default function StudentPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");

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

    const publishedCourses = useMemo(() => {
        return courses.filter((course) => isCoursePublished(course));
    }, [courses]);

    const courseCounters = useMemo(() => {
        return {
            total: publishedCourses.length,
            open: publishedCourses.filter((course) => isEnrollmentOpen(course)).length,
            free: publishedCourses.filter((course) => isFreeCourse(course)).length,
            paid: publishedCourses.filter((course) => !isFreeCourse(course)).length,
            closed: publishedCourses.filter((course) => !isEnrollmentOpen(course)).length,
        };
    }, [publishedCourses]);

    const filteredCourses = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return publishedCourses.filter((course) => {
            const name = course.name?.toLowerCase() || "";
            const description = course.description?.toLowerCase() || "";
            const level = course.level?.toLowerCase() || "";

            const matchesSearch =
                !query ||
                name.includes(query) ||
                description.includes(query) ||
                level.includes(query);

            if (!matchesSearch) return false;

            if (catalogFilter === "open") {
                return isEnrollmentOpen(course);
            }

            if (catalogFilter === "free") {
                return isFreeCourse(course);
            }

            if (catalogFilter === "paid") {
                return !isFreeCourse(course);
            }

            if (catalogFilter === "closed") {
                return !isEnrollmentOpen(course);
            }

            return true;
        });
    }, [publishedCourses, searchTerm, catalogFilter]);

    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <div className="relative max-w-3xl">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Buscar cursos..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />

                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
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
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            Solo se muestran cursos publicados. La matrícula depende del estado configurado.
                        </p>
                    </div>

                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setCatalogFilter("all")}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold normal-case tracking-normal transition ${catalogFilter === "all"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        Todos ({courseCounters.total})
                    </button>

                    <button
                        type="button"
                        onClick={() => setCatalogFilter("free")}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold normal-case tracking-normal transition ${catalogFilter === "free"
                            ? "bg-cyan-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        Gratis ({courseCounters.free})
                    </button>

                    <button
                        type="button"
                        onClick={() => setCatalogFilter("paid")}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold normal-case tracking-normal transition ${catalogFilter === "paid"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        Pagados ({courseCounters.paid})
                    </button>


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

            {!loading && filteredCourses.length > 0 ? (
                <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {filteredCourses.map((course) => {
                        const isFree = isFreeCourse(course);
                        const enrollmentOpen = isEnrollmentOpen(course);
                        const courseHasDiscount = hasDiscount(course);
                        const discountPercentage =
                            getDiscountPercentage(course);

                        return (
                            <article
                                key={course.id}
                                className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                            >
                                <div className="relative h-[220px] w-full overflow-hidden bg-slate-100">
                                    <img
                                        src={resolveImageUrl(course.image_url)}
                                        alt={course.name}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/25 to-transparent" />

                                    {isFree ? (
                                        <div className="absolute inset-0 flex items-center justify-center px-4">
                                            <div className="rounded-3xl bg-emerald-500 px-7 py-4 text-center text-white shadow-2xl ring-4 ring-white/80">
                                                <span className="block text-xs font-black uppercase tracking-[0.25em] text-white/90">
                                                    Acceso
                                                </span>
                                                <span className="mt-1 block text-3xl font-black leading-none">
                                                    GRATIS
                                                </span>
                                            </div>
                                        </div>
                                    ) : courseHasDiscount ? (
                                        <>
                                            <div className="absolute left-4 top-4 rounded-2xl bg-white px-4 py-3 shadow-xl">
                                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                                                    Precio especial
                                                </span>

                                                <span className="mt-1 block text-2xl font-black leading-none text-slate-950">
                                                    {formatMoney(
                                                        getDiscountPrice(course),
                                                        course.currency || "USD",
                                                    )}
                                                </span>

                                                <span className="mt-1 block text-xs font-semibold text-slate-400 line-through">
                                                    Antes{" "}
                                                    {formatMoney(
                                                        getRegularPrice(course),
                                                        course.currency || "USD",
                                                    )}
                                                </span>
                                            </div>

                                            <div className="absolute right-4 top-4">
                                                <div className="rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 px-4 py-3 text-center text-white shadow-xl ring-2 ring-white/80">
                                                    <span className="block text-[10px] font-black uppercase tracking-[0.18em]">
                                                        Oferta
                                                    </span>
                                                    <span className="mt-1 block text-2xl font-black leading-none">
                                                        -{discountPercentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute left-4 top-4 rounded-2xl bg-blue-600 px-4 py-3 text-white shadow-xl ring-2 ring-white/80">
                                            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
                                                Precio
                                            </span>

                                            <span className="mt-1 block text-xl font-black leading-none">
                                                {getCoursePriceLabel(course)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                                        <span className="inline-flex rounded-full bg-slate-950/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                                            {course.level || "Nivel"}
                                        </span>

                                        {enrollmentOpen ? (
                                            <span className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                                                Matrícula abierta
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                                                Matrícula cerrada
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    <div className="min-h-[125px]">
                                        <h3 className="line-clamp-2 text-xl font-black leading-tight text-slate-950">
                                            {course.name}
                                        </h3>

                                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                                            {course.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        {enrollmentOpen ? (
                                            <Link
                                                href={`/student/enrollment/${course.id}`}
                                                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 hover:shadow-lg"
                                            >
                                                Matricularme ahora
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-5 text-sm font-black text-slate-500"
                                            >
                                                Matrícula cerrada
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : null}

            {!loading &&
                publishedCourses.length > 0 &&
                filteredCourses.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    No se encontraron cursos con esa búsqueda o filtro.
                </div>
            ) : null}

            {!loading && publishedCourses.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    Aún no hay cursos publicados disponibles.
                </div>
            ) : null}
        </section>
    );
}