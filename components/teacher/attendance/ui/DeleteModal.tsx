import { Loader2, Trash2 } from "lucide-react";
import type { CourseAttendance } from "@/services/attendance.service";
import { formatDate } from "../utils";

type DeleteModalProps = {
    deleteSession: CourseAttendance;
    isSaving: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function DeleteModal({
    deleteSession,
    isSaving,
    onClose,
    onConfirm,
}: DeleteModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-[28px]">
                <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                    <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                        Eliminar asistencia
                    </h2>

                    <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-500 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                        Se eliminará la sesión del{" "}
                        <span className="font-black text-slate-800">
                            {formatDate(deleteSession.day)}
                        </span>
                        . Esta acción no se puede deshacer.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-2 p-4 xs:grid-cols-2 sm:gap-3 sm:p-6">
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

                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
