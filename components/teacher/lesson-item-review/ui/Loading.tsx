import { Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-slate-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm font-black">
                    Cargando revisión del ítem...
                </p>
            </div>
        </div>
    );
}

export default Loading;