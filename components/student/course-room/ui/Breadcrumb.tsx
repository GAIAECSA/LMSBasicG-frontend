import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbProps = {
    courseName: string;
};

export function Breadcrumb({ courseName }: BreadcrumbProps) {
    const visibleCourseName = courseName || "Curso";

    return (
        <nav
            aria-label="Ruta de navegación"
            className="min-w-0 overflow-hidden"
        >
            <div className="flex min-w-0 items-center gap-1.5 text-xs font-black sm:gap-2 sm:text-sm">
                <Link
                    href="/student/courses"
                    className="shrink-0 text-[var(--primary)] transition hover:underline"
                >
                    Mis cursos
                </Link>

                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />

                <span
                    className="min-w-0 max-w-[58vw] truncate text-[var(--primary)] sm:max-w-[420px]"
                    title={visibleCourseName}
                >
                    {visibleCourseName}
                </span>

                <ChevronRight className="hidden h-4 w-4 shrink-0 text-[var(--muted-foreground)] sm:block" />

                <span className="hidden shrink-0 text-[var(--foreground)] sm:block">
                    Aula del curso
                </span>
            </div>
        </nav>
    );
}
