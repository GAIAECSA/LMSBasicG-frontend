import { Loader2 } from "lucide-react";

type LoadingProps = {
    label?: string;
};

export function Loading({
    label = "Cargando información...",
}: LoadingProps) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:rounded-3xl">
            <div>
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#172861]" />

                <p className="mt-3 text-xs font-bold text-slate-600 sm:text-sm">
                    {label}
                </p>
            </div>
        </div>
    );
}
