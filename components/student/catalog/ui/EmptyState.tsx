import {
    BookOpen,
    SearchX,
} from "lucide-react";

export function EmptyState() {
    return (
        <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:rounded-[24px] sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <SearchX className="h-6 w-6" />
            </div>

            <h2 className="mt-3 text-base font-black text-slate-950 sm:text-lg">
                No encontramos cursos
            </h2>

            <p className="mx-auto mt-1.5 max-w-xl text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                Cambia los filtros o escribe otro término de búsqueda para revisar más opciones.
            </p>

            <BookOpen className="mx-auto mt-4 h-5 w-5 text-[#172861]" />
        </div>
    );
}

export default EmptyState;
