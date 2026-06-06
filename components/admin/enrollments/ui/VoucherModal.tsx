/* eslint-disable @next/next/no-img-element */

import {
    ExternalLink,
    X,
} from "lucide-react";

type VoucherModalProps = {
    url: string | null;
    title: string;
    onClose: () => void;
};

export function VoucherModal({
    url,
    title,
    onClose,
}: VoucherModalProps) {
    if (!url) return null;

    const isPdf = url
        .toLowerCase()
        .split("?")[0]
        .endsWith(".pdf");

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="voucher-modal-title"
                className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                Vista previa
                            </p>

                            <h3
                                id="voucher-modal-title"
                                title={title}
                                className="mt-1.5 break-words text-base font-bold leading-6 text-white [overflow-wrap:anywhere] sm:mt-2 sm:text-lg"
                            >
                                {title}
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-blue-50 sm:text-sm">
                                Comprobante registrado en la
                                matrícula del estudiante.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.96] sm:h-10 sm:w-10 sm:rounded-2xl"
                            aria-label="Cerrar vista previa"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 bg-slate-100 p-3 sm:p-4">
                    {isPdf ? (
                        <iframe
                            src={url}
                            title={title}
                            className="h-[64dvh] w-full rounded-xl border border-slate-200 bg-white sm:h-[70vh] sm:rounded-2xl [@media(max-height:760px)]:h-[58vh]"
                        />
                    ) : (
                        <div className="flex h-[64dvh] items-center justify-center sm:h-[70vh] [@media(max-height:760px)]:h-[58vh]">
                            <img
                                src={url}
                                alt={title}
                                className="max-h-full max-w-full rounded-xl object-contain shadow-sm sm:rounded-2xl"
                            />
                        </div>
                    )}
                </div>

                <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-white p-4 xs:grid-cols-2 sm:flex sm:justify-end sm:gap-3">
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] sm:text-sm"
                    >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        Abrir en otra pestaña
                    </a>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-[#172861] px-4 text-xs font-bold text-white transition hover:bg-[#0B163F] active:scale-[0.97] sm:text-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
