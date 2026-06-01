import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbProps = { courseName: string };

export function Breadcrumb({ courseName }: BreadcrumbProps) {
    return <div className="flex flex-wrap items-center gap-2 text-sm font-black"><Link href="/student/courses" className="text-[var(--primary)]">Mis cursos</Link><ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" /><span className="text-[var(--primary)]">{courseName || "Curso"}</span><ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" /><span className="text-[var(--foreground)]">Aula del curso</span></div>;
}
