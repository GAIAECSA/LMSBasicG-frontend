"use client";

import {
    Download,
    Loader2,
    X,
} from "lucide-react";
import { getCourseReportOption } from "@/services/reports.service";
import type { ReportsAdminPanelState } from "../hook";

type PreviewModalProps = {
    reports: ReportsAdminPanelState;
};

export function PreviewModal({
    reports,
}: PreviewModalProps) {
    if (!reports.preview) {
        return null;
    }

    const preview = reports.preview;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-3 lg:p-4"
        >
            <div className="flex h-[97dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[94vh] sm:rounded-3xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500 sm:text-xs sm:tracking-[0.18em]">
                            Vista previa
                        </p>

                        <h2
                            id="preview-modal-title"
                            className="mt-1 truncate text-base font-black text-slate-950 sm:text-lg"
                        >
                            {
                                getCourseReportOption(
                                    preview.reportType,
                                ).label
                            }
                        </h2>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-500 sm:text-sm">
                            {preview.course.name}
                        </p>

                        {preview.reportType ===
                        "mdt_certificates" ? (
                            <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-orange-600 sm:text-xs">
                                Certificado:{" "}
                                {preview.certificateType ===
                                "MDT"
                                    ? "MDT"
                                    : "Institucional"}
                            </p>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={reports.closePreview}
                        disabled={
                            reports.isDownloading
                        }
                        aria-label="Cerrar vista previa"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 bg-slate-100 p-2 sm:p-3 lg:p-4">
                    <iframe
                        title={`Vista previa del reporte de ${preview.course.name}`}
                        src={preview.url}
                        className="h-full w-full rounded-xl border border-slate-200 bg-white sm:rounded-2xl"
                    />
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 px-4 py-3 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:px-5 sm:py-4">
                    <button
                        type="button"
                        onClick={reports.closePreview}
                        disabled={
                            reports.isDownloading
                        }
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5 sm:text-sm"
                    >
                        Cerrar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            void reports.handleDownloadFromPreview()
                        }
                        disabled={
                            reports.isDownloading
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0f1d48] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                    >
                        {reports.isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}

                        Descargar PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PreviewModal;
