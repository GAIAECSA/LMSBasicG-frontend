import { Lock } from "lucide-react";

export function EmptyBlock() {
    return (
        <div className="flex min-h-[220px] min-w-0 flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:min-h-[280px] sm:rounded-[24px] sm:p-7 lg:min-h-[320px]">
            <Lock className="h-8 w-8 shrink-0 text-slate-400 sm:h-9 sm:w-9" />

            <h2 className="mt-3 break-words text-base font-black text-slate-950 sm:text-lg">
                Selecciona una lección
            </h2>

            <p className="mt-2 max-w-xl break-words text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Elige un contenido, video, imagen, PDF o evaluación desde el
                índice del curso.
            </p>
        </div>
    );
}
