import { Loader2, Trash2, X } from "lucide-react";
import type { DeleteModalState } from "../types";

type DeleteModalProps = {
    deleteModal: DeleteModalState;
    isSaving: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function DeleteModal({
    deleteModal,
    isSaving,
    onClose,
    onConfirm,
}: DeleteModalProps) {
    function handleBackdropClick() {
        if (isSaving) return;

        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={handleBackdropClick}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[28px]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2
                                    id="delete-modal-title"
                                    className="text-lg font-black text-slate-950 sm:text-xl"
                                >
                                    Confirmar eliminación
                                </h2>

                                <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                                    Se eliminará el siguiente elemento:
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                aria-label="Cerrar modal"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/*
                            El nombre se muestra dentro de una caja controlada.
                            break-all evita que una palabra extensa rompa el modal.
                            max-h-28 agrega scroll interno cuando el texto es excesivo.
                        */}
                        <div className="mt-3 max-h-28 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                            <p className="break-all text-xs font-bold leading-5 text-slate-800 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                                {deleteModal.title}
                            </p>
                        </div>

                        <p className="mt-3 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>

                <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-white p-4 xs:grid-cols-2 sm:gap-3 sm:p-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}

                        {isSaving
                            ? "Eliminando..."
                            : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}