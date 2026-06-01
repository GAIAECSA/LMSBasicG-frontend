import { Loader2 } from "lucide-react";

export function Loading() {
    return <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /><p className="mt-4 text-sm font-bold text-[var(--muted-foreground)]">Cargando curso...</p></div>;
}
