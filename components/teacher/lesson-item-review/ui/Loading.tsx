import { Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-8 [@media(max-height:760px)]:p-4">
            <div className="flex items-center gap-3 text-slate-700">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />

                <p className="text-xs font-black sm:text-sm">
                    Cargando revisión del ítem...
                </p>
            </div>
        </div>
    );
}

export default Loading;
