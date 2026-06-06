import { Inbox } from "lucide-react";

export function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:rounded-[2rem] sm:p-8 lg:p-10 [@media(max-height:760px)]:p-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:h-16 sm:w-16 sm:rounded-3xl">
                <Inbox className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>

            <h2 className="mt-4 text-lg font-black leading-6 text-slate-950 sm:mt-5 sm:text-xl">
                No hay estudiantes o entregas para
                revisar
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Verifica que el curso tenga estudiantes
                matriculados y que el ítem tenga respuestas
                o entregas registradas.
            </p>
        </div>
    );
}

export default EmptyState;
