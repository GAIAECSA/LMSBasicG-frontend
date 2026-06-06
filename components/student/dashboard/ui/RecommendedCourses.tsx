"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Pause,
    Play,
    Sparkles,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type { DashboardCourse } from "../types";
import { STUDENT_LINKS } from "../constants";
import { CourseCard } from "./CourseCard";

type RecommendedCoursesProps = {
    courses: DashboardCourse[];
};

const AUTO_SCROLL_DELAY = 4500;

export function RecommendedCourses({
    courses,
}: RecommendedCoursesProps) {
    const carouselRef =
        useRef<HTMLDivElement | null>(null);

    const touchResumeTimeoutRef =
        useRef<number | null>(null);

    const [isPaused, setIsPaused] =
        useState(false);

    const [isHovering, setIsHovering] =
        useState(false);

    const canMove = courses.length > 1;

    const getScrollStep = useCallback(() => {
        const carousel =
            carouselRef.current;

        if (!carousel) return 0;

        const firstCard =
            carousel.firstElementChild as
            | HTMLElement
            | null;

        if (!firstCard) return 0;

        const styles =
            window.getComputedStyle(carousel);

        const gap =
            Number.parseFloat(
                styles.columnGap ||
                styles.gap ||
                "0",
            ) || 0;

        return (
            firstCard.offsetWidth + gap
        );
    }, []);

    const moveCarousel = useCallback(
        (
            direction: "previous" | "next",
        ) => {
            const carousel =
                carouselRef.current;

            if (!carousel || !canMove) {
                return;
            }

            const step =
                getScrollStep();

            if (step <= 0) return;

            const maxScroll =
                carousel.scrollWidth -
                carousel.clientWidth;

            if (maxScroll <= 4) return;

            if (direction === "next") {
                const reachedEnd =
                    carousel.scrollLeft +
                    step >=
                    maxScroll - 6;

                carousel.scrollTo({
                    left: reachedEnd
                        ? 0
                        : carousel.scrollLeft +
                        step,
                    behavior: "smooth",
                });

                return;
            }

            const reachedStart =
                carousel.scrollLeft -
                step <=
                6;

            carousel.scrollTo({
                left: reachedStart
                    ? maxScroll
                    : carousel.scrollLeft -
                    step,
                behavior: "smooth",
            });
        },
        [canMove, getScrollStep],
    );

    useEffect(() => {
        if (
            !canMove ||
            isPaused ||
            isHovering
        ) {
            return;
        }

        const intervalId =
            window.setInterval(() => {
                moveCarousel("next");
            }, AUTO_SCROLL_DELAY);

        return () => {
            window.clearInterval(
                intervalId,
            );
        };
    }, [
        canMove,
        isHovering,
        isPaused,
        moveCarousel,
    ]);

    useEffect(() => {
        return () => {
            if (
                touchResumeTimeoutRef.current !==
                null
            ) {
                window.clearTimeout(
                    touchResumeTimeoutRef.current,
                );
            }
        };
    }, []);

    function pauseTemporarilyOnTouch() {
        if (
            touchResumeTimeoutRef.current !==
            null
        ) {
            window.clearTimeout(
                touchResumeTimeoutRef.current,
            );
        }

        setIsHovering(true);
    }

    function resumeAfterTouch() {
        if (
            touchResumeTimeoutRef.current !==
            null
        ) {
            window.clearTimeout(
                touchResumeTimeoutRef.current,
            );
        }

        touchResumeTimeoutRef.current =
            window.setTimeout(() => {
                setIsHovering(false);
            }, 1800);
    }

    if (courses.length === 0) {
        return null;
    }

    return (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0 text-orange-500" />

                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-600 sm:text-xs">
                            Descubre más
                        </p>
                    </div>

                    <h2 className="mt-1 text-base font-black text-slate-950 sm:text-lg">
                        Cursos recomendados
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        Explora nuevas opciones
                        disponibles en el catálogo.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canMove ? (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    moveCarousel(
                                        "previous",
                                    )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.94]"
                                aria-label="Mostrar cursos anteriores"
                                title="Cursos anteriores"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsPaused(
                                        (current) =>
                                            !current,
                                    )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.94]"
                                aria-label={
                                    isPaused
                                        ? "Reanudar carrusel"
                                        : "Pausar carrusel"
                                }
                                title={
                                    isPaused
                                        ? "Reanudar movimiento"
                                        : "Pausar movimiento"
                                }
                            >
                                {isPaused ? (
                                    <Play className="h-4 w-4" />
                                ) : (
                                    <Pause className="h-4 w-4" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    moveCarousel(
                                        "next",
                                    )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.94]"
                                aria-label="Mostrar cursos siguientes"
                                title="Cursos siguientes"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </>
                    ) : null}

                    <Link
                        href={
                            STUDENT_LINKS.catalog
                        }
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.97] sm:text-xs"
                    >
                        Ver catálogo
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            <div
                ref={carouselRef}
                onMouseEnter={() =>
                    setIsHovering(true)
                }
                onMouseLeave={() =>
                    setIsHovering(false)
                }
                onTouchStart={
                    pauseTemporarilyOnTouch
                }
                onTouchEnd={resumeAfterTouch}
                className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 sm:mt-4 lg:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="h-auto shrink-0 snap-start basis-[82%] xs:basis-[70%] sm:basis-[47%] md:basis-[31%] lg:basis-[calc((100%-3rem)/4)] 2xl:basis-[calc((100%-4rem)/5)]"
                    >
                        <CourseCard
                            course={course}
                            mode="recommended"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-1 flex items-center justify-between gap-3 px-1">
                <p className="text-[10px] font-semibold text-slate-400 sm:text-[11px]">
                    Desliza horizontalmente para
                    explorar más cursos.
                </p>

                {canMove ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                        {isPaused
                            ? "Carrusel pausado"
                            : "Movimiento automático"}
                    </span>
                ) : null}
            </div>
        </section>
    );
}

export default RecommendedCourses;