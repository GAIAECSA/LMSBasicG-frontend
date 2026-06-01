import { Layers3, Plus } from "lucide-react";

type EmptyStateProps = {
    onCreateModule: () => void;
};

export function EmptyState({ onCreateModule }: EmptyStateProps) {
    return (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#172861]">
                <Layers3 className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-950">
                Este curso todavía no tiene módulos
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Agrega el primer módulo para empezar a construir la estructura
                del curso.
            </p>

            <button
                type="button"
                onClick={onCreateModule}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F]"
            >
                <Plus className="h-4 w-4" />
                Crear módulo
            </button>
        </div>
    );
}