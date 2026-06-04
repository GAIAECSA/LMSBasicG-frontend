import Link from "next/link";
import { Trophy } from "lucide-react";

export function EmptyState() {
    return (
        <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
            <Trophy className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />

            <h2 className="mt-4 text-xl font-black text-[var(--foreground)]">
                No se encontraron certificados
            </h2>

            <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
                Cuando finalices un curso y el certificado sea generado,
                aparecerá aquí automáticamente.
            </p>

            <Link
                href="/student/courses"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-black !text-white transition hover:opacity-95"
            >
                Ir a mis cursos
            </Link>
        </div>
    );
}
