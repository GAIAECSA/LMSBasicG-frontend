import {
    CalendarDays,
} from "lucide-react";

export function CalendarEmptyState() {
    return (
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-sm sm:rounded-[26px] sm:p-8">
            <CalendarDays className="mx-auto h-10 w-10 text-[var(--muted-foreground)] sm:h-12 sm:w-12" />

            <h2 className="mt-3 text-lg font-black text-[var(--foreground)] sm:text-xl">
                No hay actividades programadas
            </h2>

            <p className="mx-auto mt-1.5 max-w-2xl text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm sm:leading-6">
                Cuando se publiquen tareas,
                evaluaciones, encuestas u otras
                actividades con una fecha
                disponible, aparecerán en este
                calendario.
            </p>
        </div>
    );
}

export default CalendarEmptyState;