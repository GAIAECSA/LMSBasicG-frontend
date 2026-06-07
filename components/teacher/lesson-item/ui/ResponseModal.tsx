"use client";

import { MessageSquareText, X } from "lucide-react";

type ResponseModalProps = {
    open: boolean;
    student: string;
    date: string;
    content: string;
    onClose: () => void;
};

export function ResponseModal({
    open,
    student,
    date,
    content,
    onClose,
}: ResponseModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de la respuesta"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl sm:rounded-[28px]">
                <header className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#172861] to-blue-900 px-4 py-4 text-white sm:px-6 sm:py-5">
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,132,40,0.4),transparent_50%)]" />

                    <div className="relative flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 sm:h-12 sm:w-12 sm:rounded-2xl">
                                <MessageSquareText className="h-5 w-5 sm:h-6 sm:w-6" />
                            </span>

                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 sm:text-xs">
                                    ATHENA · Respuesta registrada
                                </p>

                                <h2 className="mt-1 truncate text-lg font-black text-white sm:text-xl">
                                    {student}
                                </h2>

                                <p className="mt-1 text-xs font-semibold text-blue-100 sm:text-sm">
                                    {date}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Cerrar detalle"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <div className="max-h-[62vh] overflow-y-auto p-4 sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                        Contenido enviado
                    </p>

                    <div className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold leading-6 text-slate-700 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm">
                        {content || "Sin contenido."}
                    </div>
                </div>

                <footer className="flex justify-end border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#172861] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#0f1d48] active:scale-[0.98] sm:w-auto sm:min-w-[120px] sm:text-sm"
                    >
                        Cerrar
                    </button>
                </footer>
            </section>
        </div>
    );
}

export default ResponseModal;
