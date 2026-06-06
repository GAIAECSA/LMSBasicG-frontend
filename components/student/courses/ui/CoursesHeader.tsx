import {
    BookOpen,
    GraduationCap,
} from "lucide-react";
import { StudentNotificationsBell } from "@/components/student/notifications/StudentNotificationsBell";

type CoursesHeaderProps = {
    roleLabel: string;
    initials: string;
};

export function CoursesHeader({
    roleLabel,
    initials,
}: CoursesHeaderProps) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3.5">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <BookOpen className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)] sm:text-xs">
                        Formación activa
                    </p>

                    <h1 className="mt-0.5 text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl">
                        Mis cursos
                    </h1>

                    <p className="mt-0.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Accede a tus aulas como estudiante o docente.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-black text-[var(--foreground)] shadow-sm sm:h-10 sm:rounded-2xl">
                    <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                    Rol: {roleLabel}
                </span>

                <StudentNotificationsBell />

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black text-white shadow-sm sm:h-10 sm:w-10 sm:text-sm">
                    {initials}
                </div>
            </div>
        </div>
    );
}

export default CoursesHeader;
