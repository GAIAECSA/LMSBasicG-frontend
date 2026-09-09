import {
    FileCheck2,
} from "lucide-react";

export function EvidenceEmpty() {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FileCheck2 className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
                No hay evidencias configuradas
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-500">
                Cuando se creen bloques de evidencia MDT,
                aparecerán aquí automáticamente.
            </p>
        </div>
    );
}