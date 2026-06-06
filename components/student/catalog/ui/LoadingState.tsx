import { Loader2 } from "lucide-react";

export function LoadingState() {
    return (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#172861]" />

            <p className="mt-3 text-sm font-black text-slate-600">
                Cargando catálogo de cursos...
            </p>
        </div>
    );
}

export default LoadingState;
