import { Inbox } from "lucide-react";

export function EmptyState() {
    return (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <Inbox className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
                No hay estudiantes o entregas para revisar
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                Verifica que el curso tenga estudiantes matriculados y que el ítem tenga respuestas o entregas registradas.
            </p>
        </div>
    );
}

export default EmptyState;