import { Lock } from "lucide-react";

export function EmptyBlock() {
    return <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Lock className="h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-black text-slate-950">Selecciona una lección</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Elige un contenido, video, imagen, PDF o evaluación desde el índice del curso.</p></div>;
}
