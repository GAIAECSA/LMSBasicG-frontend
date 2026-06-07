import Link from "next/link";
import {
    BookOpen,
    SearchX,
} from "lucide-react";

import type {
    CourseFilter,
} from "../types";

type EmptyStateProps = {
    totalActiveCourses: number;
    activeFilter: CourseFilter;
    searchTerm: string;
};

export function EmptyState({
    totalActiveCourses,
    activeFilter,
    searchTerm,
}: EmptyStateProps) {
    const normalizedSearchTerm =
        searchTerm.trim();

    const hasSearch =
        Boolean(
            normalizedSearchTerm,
        );

    const hasActiveCourses =
        totalActiveCourses > 0;

    const hasActiveFilter =
        activeFilter !== "all";

    const isFilteredState =
        hasActiveCourses &&
        (
            hasSearch ||
            hasActiveFilter
        );

    function getFilteredTitle() {
        if (hasSearch) {
            return "No encontramos coincidencias";
        }

        if (
            activeFilter ===
            "progress"
        ) {
            return "No tienes cursos en progreso";
        }

        if (
            activeFilter ===
            "completed"
        ) {
            return "No tienes cursos completados";
        }

        return "No encontramos cursos";
    }

    function getFilteredDescription() {
        if (hasSearch) {
            return `No existen cursos que coincidan con “${normalizedSearchTerm}”. Prueba con otra palabra o cambia el filtro seleccionado.`;
        }

        if (
            activeFilter ===
            "progress"
        ) {
            return "Actualmente no tienes cursos en progreso. Puedes revisar todos tus cursos o explorar nuevas opciones en el catálogo.";
        }

        if (
            activeFilter ===
            "completed"
        ) {
            return "Todavía no tienes cursos completados. Continúa aprendiendo para finalizar tu primer curso.";
        }

        return "No existen cursos disponibles con el filtro seleccionado.";
    }

    if (isFilteredState) {
        return (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center shadow-sm sm:rounded-3xl sm:p-7">
                <SearchX className="mx-auto h-8 w-8 text-[var(--muted-foreground)] sm:h-10 sm:w-10" />

                <h2 className="mt-3 text-base font-black text-[var(--foreground)] sm:text-lg">
                    {getFilteredTitle()}
                </h2>

                <p className="mx-auto mt-1.5 max-w-2xl text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm sm:leading-6">
                    {getFilteredDescription()}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center shadow-sm sm:rounded-3xl sm:p-7">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--muted-foreground)] sm:h-10 sm:w-10" />

            <h2 className="mt-3 text-base font-black text-[var(--foreground)] sm:text-lg">
                No tienes cursos activos
            </h2>

            <p className="mx-auto mt-1.5 max-w-2xl text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm sm:leading-6">
                Para acceder a un aula como
                estudiante, primero debes
                matricularte desde el catálogo y
                esperar la aprobación.
            </p>

            <Link
                href="/student/catalog"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-[var(--primary-foreground)] transition hover:opacity-95 active:scale-[0.97] sm:rounded-2xl sm:text-sm"
            >
                Ir al catálogo
            </Link>
        </div>
    );
}

export default EmptyState;