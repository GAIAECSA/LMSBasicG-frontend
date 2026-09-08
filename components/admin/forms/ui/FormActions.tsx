import {
    Eye,
    FolderOpen,
    Printer,
    RotateCcw,
    Save,
} from "lucide-react";

import type {
    FormDocumentState,
} from "../hook";

export function FormActions({
    form,
}: {
    form: FormDocumentState;
}) {
    return (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">

            <div className="min-h-[20px]">
                {form.message && (
                    <span className="text-sm font-semibold text-emerald-600">
                        {form.message}
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-2">

                <button
                    type="button"
                    onClick={
                        form.handleLoad
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-50"
                >
                    <FolderOpen
                        size={17}
                    />

                    Cargar
                </button>

                <button
                    type="button"
                    onClick={
                        form.handleReset
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-50"
                >
                    <RotateCcw
                        size={17}
                    />

                    Reiniciar
                </button>

                <button
                    type="button"
                    onClick={
                        form.handleSave
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-50"
                >
                    <Save
                        size={17}
                    />

                    Guardar
                </button>

                {/* VISTA PREVIA */}
                <button
                    type="button"
                    onClick={
                        form.openPreview
                    }
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-blue-200
                        bg-blue-50
                        px-4
                        py-2.5
                        text-sm
                        font-bold
                        text-blue-700
                        transition
                        hover:bg-blue-100
                    "
                >
                    <Eye size={18} />

                    Vista previa
                </button>

                {/* IMPRIMIR */}
                <button
                    type="button"
                    onClick={
                        form.handlePrint
                    }
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                    <Printer size={18} />

                    Generar PDF / Imprimir
                </button>

            </div>
        </div>
    );
}