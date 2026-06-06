import {
    Loader2,
    Trash2,
} from "lucide-react";
import type { MdtRequiredFilesState } from "../hook";
import { getBlockTitle } from "../utils";

type DeleteModalProps = {
    files: MdtRequiredFilesState;
};

export function DeleteModal({
    files,
}: DeleteModalProps) {
    if (!files.deleteModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-[28px]">
                <div className="border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 sm:h-12 sm:w-12 sm:rounded-2xl">
                        <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <h2 className="mt-3 text-lg font-black text-slate-950 sm:mt-4 sm:text-xl">
                        Eliminar archivo obligatorio
                    </h2>

                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                        Se eliminará{" "}
                        <strong className="break-words text-slate-900 [overflow-wrap:anywhere]">
                            {getBlockTitle(
                                files.deleteModal.block,
                            )}
                        </strong>
                        . Esta acción no se puede deshacer.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 sm:gap-3 sm:p-5">
                    <button
                        type="button"
                        onClick={files.closeDeleteModal}
                        disabled={files.isSaving}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            void files.handleConfirmDelete()
                        }
                        disabled={files.isSaving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-xs font-black text-white transition hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {files.isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}

                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
