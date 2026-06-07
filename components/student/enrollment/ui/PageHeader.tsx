import Link from "next/link";
import {
    ChevronRight,
    GraduationCap,
} from "lucide-react";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";
import { STUDENT_ENROLLMENT_LINKS } from "../constants";

type PageHeaderProps = {
    initials: string;
};

export function PageHeader({
    initials,
}: PageHeaderProps) {
    return (
        <header className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
                <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-black sm:gap-2 sm:text-sm">
                    <Link
                        href={
                            STUDENT_ENROLLMENT_LINKS.catalog
                        }
                        className="text-[var(--primary)] transition hover:underline"
                    >
                        Catálogo
                    </Link>

                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />

                    <span className="text-[var(--foreground)]">
                        Matrícula
                    </span>
                </nav>

                <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-[var(--foreground)] sm:mt-3 sm:text-3xl lg:text-4xl [@media(max-height:760px)]:lg:text-3xl">
                    Matricularme en el curso
                </h1>

                <p className="mt-1.5 max-w-3xl break-words text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:mt-2 sm:text-sm sm:leading-6">
                    Revisa la información académica,
                    confirma el método de pago y
                    registra tu matrícula.
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <StudentNotificationsBell />

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black text-[var(--primary-foreground)] shadow-sm sm:h-11 sm:w-11 sm:text-sm">
                    {initials}
                </div>
            </div>
        </header>
    );
}

export default PageHeader;
