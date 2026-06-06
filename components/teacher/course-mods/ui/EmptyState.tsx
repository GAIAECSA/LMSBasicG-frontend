import { Layers3, Plus } from "lucide-react";

type EmptyStateProps = {
    onCreateModule: () => void;
};

export function EmptyState({
    onCreateModule,
}: EmptyStateProps) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:rounded-[28px] sm:p-8 lg:p-10 [@media(max-height:760px)]:p-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#172861] sm:h-14 sm:w-14 sm:rounded-2xl">
                <Layers3 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <h3 className="mt-3 text-base font-black text-slate-950 sm:mt-4 sm:text-lg">
                Este curso todavía no tiene módulos
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Agrega el primer módulo para empezar a construir la estructura
                del curso.
            </p>

            <button
                type="button"
                onClick={onCreateModule}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] sm:mt-5 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
            >
                <Plus className="h-4 w-4" />
                Crear módulo
            </button>
        </div>
    );
}
