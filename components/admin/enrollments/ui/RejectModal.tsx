import {
    Ban,
    Loader2,
    X,
} from "lucide-react";

import type {
    EnrollmentsAdminPanelState,
} from "../hook";

import {
    getEnrollmentStudentName,
} from "../utils";

type RejectModalProps = {
    panel: EnrollmentsAdminPanelState;
};

export function RejectModal({
    panel,
}: RejectModalProps) {
    if (!panel.rejectModalOpen) {
        return null;
    }

    function handleBackdropClick() {
        panel.closeRejectModal();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={handleBackdropClick}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reject-modal-title"
                className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                Revisión de matrícula
                            </p>

                            <h3
                                id="reject-modal-title"
                                className="mt-1.5 text-lg font-bold leading-6 text-white sm:mt-2 sm:text-xl"
                            >
                                No aprobar matrícula
                            </h3>

                            <p className="mt-1 break-words text-xs leading-5 text-blue-50 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                                Agrega el motivo por el cual
                                esta matrícula no será
                                aprobada.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                panel.closeRejectModal()
                            }
                            disabled={panel.isSaving}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-5 lg:p-6">
                    <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                        <div className="flex items-start gap-2">
                            <Ban className="mt-0.5 h-4 w-4 shrink-0" />

                            <p className="min-w-0 break-words [overflow-wrap:anywhere]">
                                Estudiante:{" "}
                                <span className="font-bold">
                                    {panel.selectedEnrollment
                                        ? getEnrollmentStudentName(
                                              panel.selectedEnrollment,
                                          )
                                        : "Sin estudiante seleccionado"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 sm:text-[13px]">
                            Motivo
                        </label>

                        <textarea
                            value={
                                panel.rejectReason
                            }
                            onChange={(event) =>
                                panel.setRejectReason(
                                    event.target.value,
                                )
                            }
                            rows={4}
                            placeholder="Ej: Comprobante ilegible, datos incorrectos, pago no identificado..."
                            className="mt-1.5 min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-100 bg-white p-4 xs:grid-cols-2 sm:gap-3 sm:px-5 lg:flex lg:justify-end lg:px-6">
                    <button
                        type="button"
                        onClick={() =>
                            panel.closeRejectModal()
                        }
                        disabled={panel.isSaving}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            void panel.handleNoApprove()
                        }
                        disabled={panel.isSaving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                    >
                        {panel.isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}

                        {panel.isSaving
                            ? "Guardando..."
                            : "Confirmar no aprobación"}
                    </button>
                </div>
            </div>
        </div>
    );
}
