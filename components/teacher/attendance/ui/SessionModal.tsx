"use client";

import {
    useEffect,
    useRef,
    type Dispatch,
    type FormEvent,
    type SetStateAction,
} from "react";

import { Loader2, Save, X } from "lucide-react";

import type {
    AttendanceFormState,
    AttendanceModalMode,
} from "../types";

type SessionModalProps = {
    modalMode: AttendanceModalMode;
    formState: AttendanceFormState;
    isSaving: boolean;

    /*
     * Se utilizan para evitar cerrar el modal cuando
     * el backend devuelve un error.
     */
    errorMessage: string;
    actionError: string;

    setFormState: Dispatch<
        SetStateAction<AttendanceFormState>
    >;

    onClose: () => void;

    onSubmit: (
        event: FormEvent<HTMLFormElement>,
    ) => void;
};

export function SessionModal({
    modalMode,
    formState,
    isSaving,
    errorMessage,
    actionError,
    setFormState,
    onClose,
    onSubmit,
}: SessionModalProps) {
    /*
     * Permite saber si realmente se inició un proceso
     * de guardado antes de intentar cerrar el modal.
     */
    const saveProcessStartedRef =
        useRef(false);

    useEffect(() => {
        /*
         * Mientras el backend esté procesando el guardado,
         * registramos que el proceso comenzó.
         */
        if (isSaving) {
            saveProcessStartedRef.current =
                true;

            return;
        }

        /*
         * Evita cerrar el modal apenas se abre.
         */
        if (
            !saveProcessStartedRef.current
        ) {
            return;
        }

        saveProcessStartedRef.current =
            false;

        /*
         * Si el backend devolvió un error, el modal
         * debe permanecer abierto para corregir los datos.
         */
        if (
            errorMessage.trim() ||
            actionError.trim()
        ) {
            return;
        }

        /*
         * Cerramos el modal después de finalizar
         * correctamente el guardado.
         *
         * setTimeout evita ejecutar el cierre de forma
         * síncrona dentro del efecto.
         */
        const timeoutId =
            window.setTimeout(() => {
                onClose();
            }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        isSaving,
        errorMessage,
        actionError,
        onClose,
    ]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex max-h-[96dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[28px]">
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <h2 className="text-lg font-black text-white sm:text-xl">
                                {modalMode ===
                                    "create"
                                    ? "Nueva asistencia"
                                    : "Editar asistencia"}
                            </h2>

                            <p className="mt-1 text-xs font-semibold leading-5 text-blue-50 sm:text-sm sm:leading-6">
                                Configura la fecha y
                                horario de la sesión.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={
                                isSaving
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-5 lg:p-6 [@media(max-height:760px)]:space-y-3 [@media(max-height:760px)]:p-4">
                        {errorMessage ||
                            actionError ? (
                            <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 [overflow-wrap:anywhere] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                                {actionError ||
                                    errorMessage}
                            </div>
                        ) : null}

                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="block text-xs font-black text-slate-700 sm:text-sm">
                                Fecha
                            </label>

                            <input
                                type="date"
                                value={
                                    formState.day
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setFormState(
                                        (
                                            current,
                                        ) => ({
                                            ...current,
                                            day: event
                                                .target
                                                .value,
                                        }),
                                    )
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                                disabled={
                                    isSaving
                                }
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="block text-xs font-black text-slate-700 sm:text-sm">
                                    Hora de inicio
                                </label>

                                <input
                                    type="time"
                                    value={
                                        formState.start_time
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setFormState(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                start_time:
                                                    event
                                                        .target
                                                        .value,
                                            }),
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                                    disabled={
                                        isSaving
                                    }
                                />
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="block text-xs font-black text-slate-700 sm:text-sm">
                                    Hora de fin
                                </label>

                                <input
                                    type="time"
                                    value={
                                        formState.end_time
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setFormState(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                end_time:
                                                    event
                                                        .target
                                                        .value,
                                            }),
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-10"
                                    disabled={
                                        isSaving
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-100 bg-white p-4 xs:grid-cols-2 sm:gap-3 sm:px-5 lg:flex lg:justify-end lg:px-6 [@media(max-height:760px)]:py-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={
                                isSaving
                            }
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                isSaving
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            {isSaving
                                ? "Guardando..."
                                : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}