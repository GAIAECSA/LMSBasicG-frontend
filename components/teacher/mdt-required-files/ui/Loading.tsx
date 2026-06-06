import { Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:rounded-[2rem]">
            <div>
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#172861]" />

                <p className="mt-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Cargando archivos MDT...
                </p>
            </div>
        </div>
    );
}
