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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-black text-slate-950">
                        Eliminar asistencia
                    </h2>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Se eliminará la sesión del{" "}
                        <span className="font-black text-slate-800">
                            {formatDate(deleteSession.day)}
                        </span>
                        . Esta acción no se puede deshacer.
                    </p>
                </div>

                <div className="flex flex-col-reverse gap-3 p-6 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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