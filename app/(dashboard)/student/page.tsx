"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllCourses, type Course } from "@/services/courses.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

type CatalogFilter = "all" | "open" | "free" | "paid" | "closed";

type CourseWithStates = Course & {
    is_published?: boolean | null;
    open_enrollment?: boolean | null;
    is_free?: boolean | null;
};

type CurrentUser = {
    id: number;
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
    return (
        Boolean((course as CourseWithStates).is_free) ||
        getRegularPrice(course) <= 0
    );
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

function getDiscountPercentage(course: Course): number {
    const regular = getRegularPrice(course);
    const discount = getDiscountPrice(course);

    if (regular <= 0 || discount <= 0 || discount >= regular) {
        return 0;
    }

    return Math.round(((regular - discount) / regular) * 100);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const payload = token.split(".")[1];

        if (!payload) return null;

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(
            normalizedPayload.length +
            ((4 - (normalizedPayload.length % 4)) % 4),
            "=",
        );

        return JSON.parse(window.atob(paddedPayload)) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function getCurrentUserFromStorage(): CurrentUser | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) return null;

    try {
        const parsed = JSON.parse(rawSession) as Record<string, unknown>;

        const user =
            (parsed.user as Record<string, unknown> | undefined) ??
            ((parsed.data as Record<string, unknown> | undefined)?.user as
                | Record<string, unknown>
                | undefined) ??
            ((parsed.session as Record<string, unknown> | undefined)?.user as
                | Record<string, unknown>
                | undefined);

        const rawId =
            user?.id ??
            user?.user_id ??
            parsed.id ??
            parsed.user_id ??
            (parsed.data as Record<string, unknown> | undefined)?.id ??
            (parsed.data as Record<string, unknown> | undefined)?.user_id;

        const userId = Number(rawId);

        if (Number.isFinite(userId) && userId > 0) {
            return { id: userId };
        }

        const token =
            parsed.accessToken ??
            parsed.token ??
            parsed.access_token ??
            (parsed.data as Record<string, unknown> | undefined)?.accessToken ??
            (parsed.data as Record<string, unknown> | undefined)?.token ??
            (parsed.data as Record<string, unknown> | undefined)?.access_token;

        if (typeof token === "string") {
            const payload = decodeJwtPayload(token);
            const tokenUserId = Number(
                payload?.sub ?? payload?.id ?? payload?.user_id,
            );

            if (Number.isFinite(tokenUserId) && tokenUserId > 0) {
                return { id: tokenUserId };
            }
        }

        return null;
    } catch {
        const payload = decodeJwtPayload(rawSession);
        const tokenUserId = Number(payload?.sub ?? payload?.id ?? payload?.user_id);

        if (Number.isFinite(tokenUserId) && tokenUserId > 0) {
            return { id: tokenUserId };
        }

        return null;
    }
}

function getEnrollmentForCourse(
    enrollments: Enrollment[],
    courseId: number,
): Enrollment | null {
    return (
        enrollments.find(
            (enrollment) => Number(enrollment.course.id) === Number(courseId),
        ) ?? null
    );
}

function getEnrollmentButtonText(enrollment: Enrollment | null): string {
    if (!enrollment) return "Matricularme ahora";

    if (enrollment.accepted === true) return "Ya matriculado";
    if (enrollment.accepted === false) return "No aprobado";

    return "En revisión";
}

function getEnrollmentButtonClass(enrollment: Enrollment | null): string {
    if (!enrollment) {
        return "inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#172861] px-5 text-sm font-black !text-white shadow-sm transition hover:bg-[#0B163F] hover:shadow-lg";
    }

    if (enrollment.accepted === true) {
        return "inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black !text-white ring-1 ring-emerald-800";
    }

    if (enrollment.accepted === false) {
        return "inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-red-100 px-5 text-sm font-black text-red-700 ring-1 ring-red-200";
    }

    return "inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-amber-100 px-5 text-sm font-black text-amber-700 ring-1 ring-amber-200";
}

export default function StudentPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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
                    const currentUser = getCurrentUserFromStorage();

                    let userEnrollments: Enrollment[] = [];

                    if (currentUser?.id) {
                        userEnrollments = await getEnrollmentsByUser(
                            currentUser.id,
                        );
                    }

                    if (!isMounted) return;

                    setCourses(Array.isArray(response) ? response : []);
                    setEnrollments(
                        Array.isArray(userEnrollments) ? userEnrollments : [],
                    );
                    setError("");
                } catch (err) {
                    if (!isMounted) return;

                    setCourses([]);
                    setEnrollments([]);
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
            open: publishedCourses.filter((course) =>
                isEnrollmentOpen(course),
            ).length,
            free: publishedCourses.filter((course) => isFreeCourse(course))
                .length,
            paid: publishedCourses.filter((course) => !isFreeCourse(course))
                .length,
            closed: publishedCourses.filter(
                (course) => !isEnrollmentOpen(course),
            ).length,
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
        <section className="min-h-screen w-full max-w-none space-y-6 bg-[#f4f7fb] px-4 py-5 md:px-6 xl:px-8">
            <div className="w-full overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-[#07111F] via-[#172861] via-70% to-[#F97316] px-6 py-7 text-white md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                                Catálogo
                            </p>

                            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                                Cursos disponibles
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 px-6 py-5 md:px-8">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="relative w-full max-w-3xl">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Buscar cursos..."
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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

                        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
                            {filteredCourses.length} cursos
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setCatalogFilter("all")}
                            className={`rounded-2xl px-5 py-2 text-sm font-bold transition ${catalogFilter === "all"
                                ? "bg-[#172861] text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            Todos ({courseCounters.total})
                        </button>

                        <button
                            type="button"
                            onClick={() => setCatalogFilter("free")}
                            className={`rounded-2xl px-5 py-2 text-sm font-bold transition ${catalogFilter === "free"
                                ? "bg-[#172861] text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            Gratis ({courseCounters.free})
                        </button>

                        <button
                            type="button"
                            onClick={() => setCatalogFilter("paid")}
                            className={`rounded-2xl px-5 py-2 text-sm font-bold transition ${catalogFilter === "paid"
                                ? "bg-[#172861] text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            Pagados ({courseCounters.paid})
                        </button>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                    Cargando cursos...
                </div>
            ) : null}

            {!loading && filteredCourses.length > 0 ? (
                <div className="grid w-full items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {filteredCourses.map((course) => {
                        const isFree = isFreeCourse(course);
                        const enrollmentOpen = isEnrollmentOpen(course);
                        const courseHasDiscount = hasDiscount(course);
                        const discountPercentage =
                            getDiscountPercentage(course);
                        const enrollment = getEnrollmentForCourse(
                            enrollments,
                            Number(course.id),
                        );

                        return (
                            <article
                                key={course.id}
                                className="group flex h-full min-h-[390px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                            >
                                <div className="relative h-[170px] w-full overflow-hidden bg-slate-100">
                                    <img
                                        src={resolveImageUrl(course.image_url)}
                                        alt={course.name}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />

                                    {isFree ? (
                                        <div className="absolute left-4 top-4 rounded-2xl bg-white px-4 py-3 shadow-xl">
                                            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
                                                Acceso
                                            </span>
                                            <span className="mt-1 block text-xl font-black leading-none text-slate-950">
                                                Gratis
                                            </span>
                                        </div>
                                    ) : courseHasDiscount ? (
                                        <>
                                            <div className="absolute left-4 top-4 rounded-2xl bg-white px-4 py-3 shadow-xl">
                                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                                                    Oferta
                                                </span>

                                                <span className="mt-1 block text-xl font-black leading-none text-slate-950">
                                                    {formatMoney(
                                                        getDiscountPrice(course),
                                                        course.currency || "USD",
                                                    )}
                                                </span>
                                            </div>

                                            <div className="absolute right-4 top-4 rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 px-4 py-3 text-center text-white shadow-xl ring-2 ring-white/90">
                                                <span className="block text-[10px] font-black uppercase tracking-[0.18em]">
                                                    Oferta
                                                </span>

                                                <span className="mt-1 block text-xl font-black leading-none">
                                                    -{discountPercentage}%
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute left-4 top-4 rounded-2xl bg-white px-4 py-3 shadow-xl">
                                            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                                                Precio
                                            </span>

                                            <span className="mt-1 block text-xl font-black leading-none text-slate-950">
                                                {getCoursePriceLabel(course)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                                        <span className="inline-flex rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
                                            {course.level || "Nivel"}
                                        </span>

                                        {enrollmentOpen ? (
                                            <span className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
                                                Matrícula abierta
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
                                                Matrícula cerrada
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    <div>
                                        <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
                                            {course.name}
                                        </h3>

                                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                                            {course.description}
                                        </p>
                                    </div>


                                    <div className="mt-auto pt-5">
                                        {enrollment ? (
                                            <button
                                                type="button"
                                                disabled
                                                className={getEnrollmentButtonClass(
                                                    enrollment,
                                                )}
                                            >
                                                {getEnrollmentButtonText(
                                                    enrollment,
                                                )}
                                            </button>
                                        ) : enrollmentOpen ? (
                                            <Link
                                                href={`/student/enrollment/${course.id}`}
                                                className={getEnrollmentButtonClass(
                                                    null,
                                                )}
                                            >
                                                Matricularme ahora
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-5 text-sm font-black text-slate-500"
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
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                    No se encontraron cursos con esa búsqueda o filtro.
                </div>
            ) : null}

            {!loading && publishedCourses.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                    Aún no hay cursos publicados disponibles.
                </div>
            ) : null}
        </section>
    );
}