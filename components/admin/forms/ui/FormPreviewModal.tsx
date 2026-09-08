"use client";

import {
    Printer,
    X,
} from "lucide-react";

import type {
    FormDocumentState,
} from "../hook";

import {
    PrintableDocument,
} from "../print/PrintableDocument";

interface FormPreviewModalProps {
    form: FormDocumentState;
}

export function FormPreviewModal({
    form,
}: FormPreviewModalProps) {
    if (!form.isPreviewOpen) {
        return null;
    }

    return (
        <div
            className="
                no-print
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-slate-950/60
                p-4
                backdrop-blur-sm
            "
        >
            <div
                className="
                    flex
                    max-h-[95vh]
                    w-full
                    max-w-[1500px]
                    flex-col
                    overflow-hidden
                    rounded-[24px]
                    bg-white
                    shadow-2xl
                "
            >
                {/* HEADER MODAL */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            Vista previa
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {form.config.title}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            form.closePreview
                        }
                        className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-xl
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            hover:text-slate-950
                        "
                        aria-label="Cerrar vista previa"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* DOCUMENTO */}
                <div className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
                    <div className="mx-auto min-w-[1000px] max-w-[1400px]">
                        <PrintableDocument
                            type={form.type}
                            state={
                                form.formState
                            }
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
                    <button
                        type="button"
                        onClick={
                            form.closePreview
                        }
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                        Cerrar
                    </button>

                    <button
                        type="button"
                        onClick={
                            form.handlePrint
                        }
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                        <Printer size={18} />

                        Imprimir / PDF
                    </button>
                </div>
            </div>
        </div>
    );
}