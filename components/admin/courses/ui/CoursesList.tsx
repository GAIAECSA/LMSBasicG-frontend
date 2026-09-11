/* eslint-disable @next/next/no-img-element */

import {
    Eye,
    Pencil,
    Trash2,
    UserRoundPlus,
} from "lucide-react";

import type {
    Category,
} from "@/services/categories.service";
import type {
    Course,
} from "@/services/courses.service";
import type {
    Subcategory,
} from "@/services/subcategories.service";

import {
    Pagination,
} from "./Pagination";
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
    onDelete: (course: Course) => void;
    onViewAsTeacher: (course: Course) => void;
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

    const category =
        subcategory
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
}: {
    course: Course;
}) {
    return (
        <div className="flex flex-wrap items-start gap-1.5">
            <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:text-[11px] ${getPublishedBadgeClass(
                    course,
                )}`}
            >
                {getCourseIsPublished(course)
                    ? "Publicado"
                    : "Borrador"}
            </span>

            <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black sm:text-[11px] ${getCourseIsMdt(course)
                    ? "bg-purple-100 text-purple-700"
                    : "bg-slate-100 text-slate-700"
                    }`}
            >
                {getCourseIsMdt(course)
                    ? "MDT"
                    : "Normal"}
            </span>

            {getCourseIsFree(course) ? (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700 sm:text-[11px]">
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
    onViewAsTeacher,
    onDelete,
}: CoursesListProps) {
    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
            {/*
             * Celulares, tabletas y laptops medianas:
             * Se utilizan tarjetas para evitar columnas comprimidas.
             * La tabla aparece únicamente cuando existe suficiente ancho real.
             */}
            <div className="2xl:hidden">
                {isLoading ? (
                    <ListMessage>
                        Cargando cursos, categorías y subcategorías...
                    </ListMessage>
                ) : filteredCount === 0 ? (
                    <ListMessage title="No hay cursos para mostrar.">
                        Crea un curso nuevo desde el botón superior.
                    </ListMessage>
                ) : (
                    <div className="grid min-w-0 gap-3 p-3 sm:p-4 md:grid-cols-2 xl:gap-4">
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
                                    className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="flex min-w-0 items-start gap-3 border-b border-slate-100 p-3 sm:p-4">
                                        <img
                                            src={resolveImageUrl(
                                                getCourseImageUrl(course),
                                            )}
                                            alt={getCourseName(course)}
                                            className="h-[72px] w-[92px] shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover sm:h-20 sm:w-[104px]"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p
                                                title={getCourseName(course)}
                                                className="line-clamp-2 break-words text-sm font-black leading-5 text-slate-950 sm:text-base sm:leading-6"
                                            >
                                                {getCourseName(course)}
                                            </p>

                                            <div className="mt-2">
                                                <CourseBadges course={course} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-3 bg-slate-50/70 p-3 text-xs sm:p-4 sm:text-sm">
                                        <MobileDetail
                                            label="Categoría"
                                            value={
                                                category?.name ||
                                                "Sin categoría"
                                            }
                                        />

                                        <MobileDetail
                                            label="Subcategoría"
                                            value={
                                                subcategory?.name ||
                                                (subcategoryId !== null
                                                    ? `#${subcategoryId}`
                                                    : "Sin subcategoría")
                                            }
                                        />

                                        <MobileDetail
                                            label="Nivel"
                                            value={getCourseLevel(course)}
                                        />

                                        <MobileDetail
                                            label="Precio"
                                            value={
                                                getCourseIsFree(course)
                                                    ? "Gratis"
                                                    : formatMoney(
                                                        getCoursePrice(course),
                                                        getCourseCurrency(course),
                                                    )
                                            }
                                        />

                                        <MobileDetail
                                            label="Duración"
                                            value={`${getCourseDurationHours(
                                                course,
                                            )} h`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-3 sm:p-4">
                                        <CourseActionButton
                                            variant="edit"
                                            label="Editar"
                                            onClick={() => onEdit(course)}
                                        />

                                        <CourseActionButton
                                            variant="teacher"
                                            label="Docente"
                                            onClick={() =>
                                                onAssignTeacher(course)
                                            }
                                        />

                                        <CourseActionButton
                                            variant="view"
                                            label="Ver como docente"
                                            onClick={() => onViewAsTeacher(course)}
                                        />

                                        <CourseActionButton
                                            variant="delete"
                                            label="Eliminar"
                                            onClick={() => onDelete(course)}
                                        />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/*
             * Monitores amplios:
             * La tabla conserva todos los botones con texto visible.
             */}
            <div className="hidden overflow-x-auto 2xl:block">
                <table className="w-full min-w-[1180px] table-fixed divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <TableHeader className="w-[23%]">
                                Curso
                            </TableHeader>

                            <TableHeader className="w-[18%]">
                                Organización
                            </TableHeader>

                            <TableHeader className="w-[10%]">
                                Nivel
                            </TableHeader>

                            <TableHeader className="w-[10%]">
                                Precio
                            </TableHeader>

                            <TableHeader className="w-[8%]">
                                Duración
                            </TableHeader>

                            <TableHeader className="w-[13%]">
                                Estado
                            </TableHeader>

                            <TableHeader className="w-[18%] text-right">
                                Acciones
                            </TableHeader>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-12 text-center text-sm font-semibold text-slate-500"
                                >
                                    Cargando cursos, categorías y subcategorías...
                                </td>
                            </tr>
                        ) : filteredCount === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-12 text-center"
                                >
                                    <p className="text-sm font-black text-slate-800">
                                        No hay cursos para mostrar.
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Crea un curso nuevo desde el botón superior.
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
                                        <td className="px-4 py-3.5">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <img
                                                    src={resolveImageUrl(
                                                        getCourseImageUrl(course),
                                                    )}
                                                    alt={getCourseName(course)}
                                                    className="h-14 w-[72px] shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover"
                                                />

                                                <p
                                                    title={getCourseName(course)}
                                                    className="line-clamp-2 break-words text-sm font-black leading-5 text-slate-950"
                                                >
                                                    {getCourseName(course)}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3.5 text-xs font-semibold leading-5 text-slate-700">
                                            <p className="line-clamp-1 break-words font-black">
                                                {category?.name ||
                                                    "Sin categoría"}
                                            </p>

                                            <p className="mt-0.5 line-clamp-1 break-words text-slate-500">
                                                {subcategory?.name ||
                                                    (subcategoryId !== null
                                                        ? `#${subcategoryId}`
                                                        : "Sin subcategoría")}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex max-w-full rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700">
                                                <span className="truncate">
                                                    {getCourseLevel(course)}
                                                </span>
                                            </span>
                                        </td>

                                        <td className="px-4 py-3.5 text-sm font-black text-slate-900">
                                            {getCourseIsFree(course)
                                                ? "Gratis"
                                                : formatMoney(
                                                    getCoursePrice(course),
                                                    getCourseCurrency(course),
                                                )}
                                        </td>

                                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">
                                            {getCourseDurationHours(course)} h
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <CourseBadges course={course} />
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-nowrap justify-end gap-2">
                                                <DesktopActionButton
                                                    variant="edit"
                                                    label=""
                                                    onClick={() =>
                                                        onEdit(course)
                                                    }
                                                />

                                                <DesktopActionButton
                                                    variant="teacher"
                                                    label=""
                                                    onClick={() =>
                                                        onAssignTeacher(course)
                                                    }
                                                />

                                                <CourseActionButton
                                                    variant="view"
                                                    label=""
                                                    onClick={() => onViewAsTeacher(course)}
                                                />

                                                <DesktopActionButton
                                                    variant="delete"
                                                    label=""
                                                    onClick={() =>
                                                        onDelete(course)
                                                    }
                                                />
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

function ListMessage({
    title,
    children,
}: {
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="px-4 py-10 text-center">
            {title ? (
                <p className="text-sm font-black text-slate-800">
                    {title}
                </p>
            ) : null}

            <p
                className={`${title ? "mt-1" : ""
                    } text-xs font-semibold leading-5 text-slate-500 sm:text-sm`}
            >
                {children}
            </p>
        </div>
    );
}

function MobileDetail({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">
                {label}
            </p>

            <p className="mt-1 break-words font-semibold leading-5 text-slate-700">
                {value}
            </p>
        </div>
    );
}

function CourseActionButton({
    variant,
    label,
    onClick,
}: {
    variant: "edit" | "teacher" | "view" | "delete";
    label: string;
    onClick: () => void;
}) {
    const styles = {
        edit: "border-blue-200 text-blue-700 hover:bg-blue-50",
        teacher: "border-orange-200 text-orange-700 hover:bg-orange-50",
        view: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
        delete: "border-red-200 text-red-600 hover:bg-red-50",
    }[variant];

    const Icon =
        variant === "edit"
            ? Pencil
            : variant === "teacher"
                ? UserRoundPlus
                : variant === "view"
                    ? Eye
                    : Trash2;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl border px-1.5 text-[10px] font-black transition active:scale-[0.97] sm:gap-1.5 sm:px-2 sm:text-xs ${styles}`}
        >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

            <span className="truncate">
                {label}
            </span>
        </button>
    );
}

function DesktopActionButton({
    variant,
    label,
    onClick,
}: {
    variant: "edit" | "teacher" | "delete";
    label: string;
    onClick: () => void;
}) {
    const styles = {
        edit: "border-blue-200 text-blue-700 hover:bg-blue-50",
        teacher:
            "border-orange-200 text-orange-700 hover:bg-orange-50",
        delete: "border-red-200 text-red-600 hover:bg-red-50",
    }[variant];

    const Icon =
        variant === "edit"
            ? Pencil
            : variant === "teacher"
                ? UserRoundPlus
                : Trash2;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition active:scale-[0.96] ${styles}`}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
        </button>
    );
}

function TableHeader({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <th
            className={`${className} px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-600`}
        >
            {children}
        </th>
    );
}

export default CoursesList;
