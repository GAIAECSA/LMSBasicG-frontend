/* eslint-disable @next/next/no-img-element */

import {
    Pencil,
    Trash2,
    UserRoundPlus,
} from "lucide-react";
import type { Category } from "@/services/categories.service";
import type { Course } from "@/services/courses.service";
import type { Subcategory } from "@/services/subcategories.service";
import { Pagination } from "./Pagination";
import {
    formatMoney,
    getCourseCurrency,
    getCourseDurationHours,
    getCourseImageUrl,
    getCourseIsFree,
    getCourseIsMdt,
    getCourseIsPublished,
    getCourseLevel,
    getCourseName,
    getCoursePrice,
    getCourseSubcategoryId,
    getPublishedBadgeClass,
    resolveImageUrl,
} from "../utils";

type CoursesListProps = {
    isLoading: boolean;
    paginatedCourses: Course[];
    filteredCount: number;
    activePage: number;
    totalPages: number;
    categoryMap: Map<number, Category>;
    subcategoryMap: Map<number, Subcategory>;
    onPrevious: () => void;
    onNext: () => void;
    onEdit: (course: Course) => void;
    onAssignTeacher: (course: Course) => void;
    onDelete: (courseId: number) => void;
};

function getCourseCategoryData(
    course: Course,
    categoryMap: Map<number, Category>,
    subcategoryMap: Map<number, Subcategory>,
) {
    const subcategoryId =
        getCourseSubcategoryId(course);

    const subcategory =
        subcategoryId !== null
            ? subcategoryMap.get(subcategoryId)
            : undefined;

    const category = subcategory
        ? categoryMap.get(subcategory.category_id)
        : undefined;

    return {
        subcategoryId,
        subcategory,
        category,
    };
}

function CourseBadges({
    course,
    compact = false,
}: {
    course: Course;
    compact?: boolean;
}) {
    return (
        <div
            className={
                compact
                    ? "flex flex-col items-start gap-1"
                    : "flex flex-wrap gap-1.5"
            }
        >
            <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold sm:px-2.5 sm:py-1 sm:text-[10px] ${getPublishedBadgeClass(
                    course,
                )}`}
            >
                {getCourseIsPublished(course)
                    ? "Publicado"
                    : "Borrador"}
            </span>

            <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold sm:px-2.5 sm:py-1 sm:text-[10px] ${getCourseIsMdt(course)
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
            >
                {getCourseIsMdt(course)
                    ? "MDT"
                    : "Normal"}
            </span>

            {getCourseIsFree(course) ? (
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 sm:px-2.5 sm:py-1 sm:text-[10px]">
                    Gratis
                </span>
            ) : null}
        </div>
    );
}

export function CoursesList({
    isLoading,
    paginatedCourses,
    filteredCount,
    activePage,
    totalPages,
    categoryMap,
    subcategoryMap,
    onPrevious,
    onNext,
    onEdit,
    onAssignTeacher,
    onDelete,
}: CoursesListProps) {
    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
            {/* Tarjetas para celulares y tablets */}
            <div className="xl:hidden">
                {isLoading ? (
                    <div className="px-4 py-10 text-center text-xs font-semibold text-slate-500 sm:text-sm">
                        Cargando cursos, categorías y
                        subcategorías...
                    </div>
                ) : filteredCount === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <p className="text-sm font-bold text-slate-800">
                            No hay cursos para mostrar.
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Crea un curso nuevo desde el botón
                            superior.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {paginatedCourses.map((course) => {
                            const {
                                category,
                                subcategory,
                                subcategoryId,
                            } = getCourseCategoryData(
                                course,
                                categoryMap,
                                subcategoryMap,
                            );

                            return (
                                <article
                                    key={course.id}
                                    className="space-y-3 p-3 sm:p-4"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <img
                                            src={resolveImageUrl(
                                                getCourseImageUrl(
                                                    course,
                                                ),
                                            )}
                                            alt={getCourseName(
                                                course,
                                            )}
                                            className="h-14 w-[72px] shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover sm:h-16 sm:w-20"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p
                                                className="line-clamp-2 text-xs font-bold leading-5 text-slate-950 sm:text-sm"
                                                title={getCourseName(
                                                    course,
                                                )}
                                            >
                                                {getCourseName(
                                                    course,
                                                )}
                                            </p>

                                            <div className="mt-2">
                                                <CourseBadges
                                                    course={
                                                        course
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-[10px] sm:text-xs">
                                        <div className="min-w-0">
                                            <p className="font-bold uppercase tracking-wide text-slate-400">
                                                Categoría
                                            </p>

                                            <p className="mt-1 break-words font-semibold text-slate-700">
                                                {category?.name ||
                                                    "Sin categoría"}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-bold uppercase tracking-wide text-slate-400">
                                                Subcategoría
                                            </p>

                                            <p className="mt-1 break-words font-semibold text-slate-700">
                                                {subcategory?.name ||
                                                    (subcategoryId !==
                                                        null
                                                        ? `#${subcategoryId}`
                                                        : "Sin subcategoría")}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-bold uppercase tracking-wide text-slate-400">
                                                Nivel
                                            </p>

                                            <p className="mt-1 break-words font-semibold text-slate-700">
                                                {getCourseLevel(
                                                    course,
                                                )}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-bold uppercase tracking-wide text-slate-400">
                                                Precio
                                            </p>

                                            <p className="mt-1 break-words font-semibold text-slate-700">
                                                {getCourseIsFree(
                                                    course,
                                                )
                                                    ? "Gratis"
                                                    : formatMoney(
                                                        getCoursePrice(
                                                            course,
                                                        ),
                                                        getCourseCurrency(
                                                            course,
                                                        ),
                                                    )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onEdit(course)
                                            }
                                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-xl border border-blue-200 px-1.5 text-[10px] font-bold text-blue-700 transition hover:bg-blue-50 active:scale-[0.97] sm:h-10 sm:px-2 sm:text-xs"
                                        >
                                            <Pencil className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                                            <span className="truncate">
                                                Editar
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onAssignTeacher(
                                                    course,
                                                )
                                            }
                                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-xl border border-orange-200 px-1.5 text-[10px] font-bold text-orange-700 transition hover:bg-orange-50 active:scale-[0.97] sm:h-10 sm:px-2 sm:text-xs"
                                        >
                                            <UserRoundPlus className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                                            <span className="truncate">
                                                Docente
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onDelete(
                                                    course.id,
                                                )
                                            }
                                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-xl border border-red-200 px-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.97] sm:h-10 sm:px-2 sm:text-xs"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                                            <span className="truncate">
                                                Eliminar
                                            </span>
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Tabla compacta para laptops y monitores */}
            <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[900px] table-fixed divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="w-[28%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:w-[24%]">
                                Curso
                            </th>

                            <th className="w-[18%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:hidden">
                                Organización
                            </th>

                            <th className="hidden w-[11%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:table-cell">
                                Categoría
                            </th>

                            <th className="hidden w-[12%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:table-cell">
                                Subcategoría
                            </th>

                            <th className="w-[10%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:w-[8%]">
                                Nivel
                            </th>

                            <th className="w-[9%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:w-[8%]">
                                Precio
                            </th>

                            <th className="w-[8%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:w-[7%]">
                                Duración
                            </th>

                            <th className="w-[12%] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:w-[11%]">
                                Estado
                            </th>

                            <th className="w-[15%] px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600 2xl:w-[19%]">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-10 text-center text-xs font-semibold text-slate-500 sm:text-sm"
                                >
                                    Cargando cursos, categorías y
                                    subcategorías...
                                </td>
                            </tr>
                        ) : filteredCount === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-10 text-center"
                                >
                                    <p className="text-sm font-bold text-slate-800">
                                        No hay cursos para
                                        mostrar.
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                        Crea un curso nuevo desde
                                        el botón superior.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            paginatedCourses.map((course) => {
                                const {
                                    category,
                                    subcategory,
                                    subcategoryId,
                                } = getCourseCategoryData(
                                    course,
                                    categoryMap,
                                    subcategoryMap,
                                );

                                return (
                                    <tr
                                        key={course.id}
                                        className="align-middle transition hover:bg-blue-50/40"
                                    >
                                        <td className="px-3 py-2.5 [@media(max-height:760px)]:py-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <img
                                                    src={resolveImageUrl(
                                                        getCourseImageUrl(
                                                            course,
                                                        ),
                                                    )}
                                                    alt={getCourseName(
                                                        course,
                                                    )}
                                                    className="h-9 w-11 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover 2xl:h-10 2xl:w-12"
                                                />

                                                <div className="min-w-0">
                                                    <p
                                                        className="truncate text-[11px] font-bold text-slate-950 2xl:text-xs"
                                                        title={getCourseName(
                                                            course,
                                                        )}
                                                    >
                                                        {getCourseName(
                                                            course,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2.5 text-[10px] font-semibold leading-4 text-slate-700 2xl:hidden [@media(max-height:760px)]:py-2">
                                            <p className="line-clamp-1 break-words">
                                                {category?.name ||
                                                    "Sin categoría"}
                                            </p>

                                            <p className="mt-0.5 line-clamp-1 break-words text-slate-500">
                                                {subcategory?.name ||
                                                    (subcategoryId !==
                                                        null
                                                        ? `#${subcategoryId}`
                                                        : "Sin subcategoría")}
                                            </p>
                                        </td>

                                        <td className="hidden px-3 py-2.5 text-[10px] font-semibold leading-4 text-slate-700 2xl:table-cell">
                                            <p className="line-clamp-2 break-words">
                                                {category?.name ||
                                                    "Sin categoría"}
                                            </p>
                                        </td>

                                        <td className="hidden px-3 py-2.5 text-[10px] font-semibold leading-4 text-slate-700 2xl:table-cell">
                                            <p className="line-clamp-2 break-words">
                                                {subcategory?.name ||
                                                    (subcategoryId !==
                                                        null
                                                        ? `#${subcategoryId}`
                                                        : "Sin subcategoría")}
                                            </p>
                                        </td>

                                        <td className="px-3 py-2.5 [@media(max-height:760px)]:py-2">
                                            <span className="inline-flex max-w-full rounded-full bg-blue-100 px-2 py-0.5 text-[8px] font-bold text-blue-700 2xl:text-[9px]">
                                                <span className="truncate">
                                                    {getCourseLevel(
                                                        course,
                                                    )}
                                                </span>
                                            </span>
                                        </td>

                                        <td className="px-3 py-2.5 text-[10px] font-bold text-slate-900 2xl:text-[11px] [@media(max-height:760px)]:py-2">
                                            {getCourseIsFree(
                                                course,
                                            )
                                                ? "Gratis"
                                                : formatMoney(
                                                    getCoursePrice(
                                                        course,
                                                    ),
                                                    getCourseCurrency(
                                                        course,
                                                    ),
                                                )}
                                        </td>

                                        <td className="px-3 py-2.5 text-[10px] font-semibold text-slate-700 2xl:text-[11px] [@media(max-height:760px)]:py-2">
                                            {getCourseDurationHours(
                                                course,
                                            )}{" "}
                                            h
                                        </td>

                                        <td className="px-3 py-2.5 [@media(max-height:760px)]:py-2">
                                            <CourseBadges
                                                course={course}
                                                compact
                                            />
                                        </td>

                                        <td className="px-3 py-2.5 [@media(max-height:760px)]:py-2">
                                            <div className="flex flex-nowrap justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onEdit(
                                                            course,
                                                        )
                                                    }
                                                    title="Editar curso"
                                                    aria-label={`Editar ${getCourseName(
                                                        course,
                                                    )}`}
                                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 text-blue-700 transition hover:bg-blue-50 active:scale-[0.96] 2xl:w-auto 2xl:gap-1 2xl:px-2"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 shrink-0" />

                                                    <span className="hidden text-[10px] font-bold 2xl:inline">
                                                        Editar
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onAssignTeacher(
                                                            course,
                                                        )
                                                    }
                                                    title="Asignar docente"
                                                    aria-label={`Asignar docente a ${getCourseName(
                                                        course,
                                                    )}`}
                                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-200 text-orange-700 transition hover:bg-orange-50 active:scale-[0.96] 2xl:w-auto 2xl:gap-1 2xl:px-2"
                                                >
                                                    <UserRoundPlus className="h-3.5 w-3.5 shrink-0" />

                                                    <span className="hidden text-[10px] font-bold 2xl:inline">
                                                        Docente
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDelete(
                                                            course.id,
                                                        )
                                                    }
                                                    title="Eliminar curso"
                                                    aria-label={`Eliminar ${getCourseName(
                                                        course,
                                                    )}`}
                                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 active:scale-[0.96] 2xl:w-auto 2xl:gap-1 2xl:px-2"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 shrink-0" />

                                                    <span className="hidden text-[10px] font-bold 2xl:inline">
                                                        Eliminar
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                activePage={activePage}
                totalPages={totalPages}
                currentItems={paginatedCourses.length}
                totalItems={filteredCount}
                itemLabel="cursos"
                onPrevious={onPrevious}
                onNext={onNext}
            />
        </div>
    );
}