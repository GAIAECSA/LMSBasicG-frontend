import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Loader2, Save, X } from "lucide-react";
import type { AttendanceFormState, AttendanceModalMode } from "../types";

type SessionModalProps = {
    modalMode: AttendanceModalMode;
    formState: AttendanceFormState;
    isSaving: boolean;
    setFormState: Dispatch<SetStateAction<AttendanceFormState>>;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SessionModal({
    modalMode,
    formState,
    isSaving,
    setFormState,
    onClose,
    onSubmit,
}: SessionModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
                <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-white">
                                {modalMode === "create"
                                    ? "Nueva asistencia"
                                    : "Editar asistencia"}
                            </h2>

                            <p className="mt-1 text-sm font-semibold leading-6 text-blue-50">
                                Configura la fecha y horario de la sesión.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-5 p-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-700">
                            Fecha
                        </label>

                        <input
                            type="date"
                            value={formState.day}
                            onChange={(event) =>
                                setFormState((current) => ({
                                    ...current,
                                    day: event.target.value,
                                }))
                            }
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            disabled={isSaving}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-700">
                                Hora de inicio
                            </label>

                            <input
                                type="time"
                                value={formState.start_time}
                                onChange={(event) =>
                                    setFormState((current) => ({
                                        ...current,
                                        start_time: event.target.value,
                                    }))
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                disabled={isSaving}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-700">
                                Hora de fin
                            </label>

                            <input
                                type="time"
                                value={formState.end_time}
                                onChange={(event) =>
                                    setFormState((current) => ({
                                        ...current,
                                        end_time: event.target.value,
                                    }))
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}