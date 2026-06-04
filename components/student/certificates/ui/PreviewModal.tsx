"use client";

import { Download, ExternalLink, FileBadge2, FileWarning, X } from "lucide-react";
import type { CertificateWithExtraFields } from "../types";
import {
    getCertificateCode,
    getCertificateFileUrl,
    getCertificateTypeLabel,
    getCourseName,
    getProtectedPdfViewerUrl,
} from "../utils";

type PreviewModalProps = {
    certificate: CertificateWithExtraFields | null;
    onClose: () => void;
};

export function PreviewModal({ certificate, onClose }: PreviewModalProps) {
    if (!certificate) return null;

    const fileUrl = getCertificateFileUrl(certificate);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--primary)] px-5 py-4 text-[var(--primary-foreground)]">
                    <div className="min-w-0">
                        <h2 className="text-lg font-black">
                            Vista previa del certificado
                        </h2>

                        <p className="mt-1 truncate text-xs font-semibold text-white/80">
                            {getCourseName(certificate)}
                        </p>

                        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
                            <FileBadge2 className="h-4 w-4" />
                            {getCertificateTypeLabel(certificate)}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        {fileUrl ? (
                            <>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir
                                </a>

                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[var(--primary)] transition hover:bg-white/90"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar
                                </a>
                            </>
                        ) : null}

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="bg-[var(--muted)] p-4">
                    {fileUrl ? (
                        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                            <iframe
                                src={getProtectedPdfViewerUrl(fileUrl)}
                                title={`Vista previa certificado ${getCertificateCode(
                                    certificate,
                                )}`}
                                className="h-[72vh] w-full bg-white"
                            />
                        </div>
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white text-center">
                            <FileWarning className="h-10 w-10 text-[var(--warning)]" />

                            <p className="mt-4 text-sm font-black text-[var(--foreground)]">
                                PDF no disponible
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}