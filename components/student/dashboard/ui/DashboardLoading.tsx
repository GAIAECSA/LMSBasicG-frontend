import { Loader2 } from "lucide-react";

export function DashboardLoading() {
    return (
        <section className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 lg:px-6">
            <div className="mx-auto flex min-h-[55vh] w-full max-w-[1450px] items-center justify-center">
                <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[#172861] sm:h-5 sm:w-5" />
                    Cargando panel del estudiante...
                </div>
            </div>
        </section>
    );
}

export default DashboardLoading;
