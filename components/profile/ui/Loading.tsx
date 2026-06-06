import { Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-3 py-4 sm:p-6">
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-xs font-bold text-[var(--muted-foreground)] shadow-sm sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)] sm:h-5 sm:w-5" />
                Cargando información del usuario...
            </div>
        </div>
    );
}

export default Loading;
