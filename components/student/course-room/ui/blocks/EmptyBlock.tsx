import { Lock } from "lucide-react";

export function EmptyBlock() {
    return (
        <div className="flex min-h-[240px] min-w-0 flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:min-h-[320px] sm:rounded-[28px] sm:p-8 lg:min-h-[360px]">
            <Lock className="h-9 w-9 shrink-0 text-slate-400 sm:h-10 sm:w-10" />

            <h2 className="mt-4 break-words text-lg font-black text-slate-950 sm:text-xl">
                Selecciona una lección
            </h2>

            <p className="mt-2 max-w-xl break-words text-sm leading-6 text-slate-500">
                Elige un contenido, video, imagen, PDF o evaluación desde el
                índice del curso.
            </p>
        </div>
    );
}
