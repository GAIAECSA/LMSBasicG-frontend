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
            <div className="flex min-w-0 items-center gap-1 text-[11px] font-black sm:gap-1.5 sm:text-xs lg:text-sm">
                <Link
                    href="/student/courses"
                    className="shrink-0 text-[var(--primary)] transition hover:underline"
                >
                    Mis cursos
                </Link>

                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)] sm:h-4 sm:w-4" />

                <span
                    className="min-w-0 max-w-[52vw] truncate text-[var(--primary)] sm:max-w-[320px] lg:max-w-[420px]"
                    title={visibleCourseName}
                >
                    {visibleCourseName}
                </span>

                <ChevronRight className="hidden h-4 w-4 shrink-0 text-[var(--muted-foreground)] md:block" />

                <span className="hidden shrink-0 text-[var(--foreground)] md:block">
                    Aula del curso
                </span>
            </div>
        </nav>
    );
}
