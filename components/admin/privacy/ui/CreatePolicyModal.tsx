"use client";

import type {
    ChangeEvent,
    FormEvent,
} from "react";
import {
    AlertCircle,
    CalendarDays,
    Loader2,
    Plus,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import type {
    PolicyFormSetter,
    PolicyFormState,
} from "../types";

type CreatePolicyModalProps = {
    open: boolean;
    saving: boolean;
    error: string;
    form: PolicyFormState;
    setForm: PolicyFormSetter;
    onClose: () => void;
    onFileChange: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
    onRemoveFile: () => void;
    onSubmit: (
        event: FormEvent<HTMLFormElement>,
    ) => void;
};

export function CreatePolicyModal({
    open,
    saving,
    error,
    form,
    setForm,
    onClose,
    onFileChange,
    onRemoveFile,
    onSubmit,
}: CreatePolicyModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[28px]">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#172861] sm:text-xs sm:tracking-[0.18em]">
                            Nueva política
                        </p>

                        <h2 className="mt-1.5 text-lg font-black text-slate-950 sm:mt-2 sm:text-xl">
                            Agregar nueva política
                        </h2>

                        <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                            Completa la información para registrar una nueva política.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                        aria-label="Cerrar modal"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
                >
                    {error ? (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                            <span>{error}</span>
                        </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        <label className="block min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 sm:text-xs sm:tracking-[0.12em]">
                                Título
                            </span>

                            <input
                                value={form.title}
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            title:
                                                event.target.value,
                                        }),
                                    )
                                }
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:mt-2 sm:h-11 sm:text-sm"
                            />
                        </label>

                        <label className="block min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 sm:text-xs sm:tracking-[0.12em]">
                                Versión
                            </span>

                            <input
                                value={form.version}
                                onChange={(event) =>
                                    setForm(
                                        (current) => ({
                                            ...current,
                                            version:
                                                event.target.value,
                                        }),
                                    )
                                }
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:mt-2 sm:h-11 sm:text-sm"
                            />
                        </label>

                        <label className="block min-w-0 sm:col-span-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 sm:text-xs sm:tracking-[0.12em]">
                                Fecha de vigencia
                            </span>

                            <div className="relative mt-1.5 sm:mt-2">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />

                                <input
                                    type="datetime-local"
                                    value={
                                        form.effective_date
                                    }
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                effective_date:
                                                    event.target.value,
                                            }),
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:pl-11 sm:pr-4 sm:text-sm"
                                />
                            </div>
                        </label>
                    </div>

                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:rounded-2xl sm:p-5">
                        <label className="block cursor-pointer text-center">
                            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#172861] shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl">
                                <UploadCloud className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>

                            <span
                                title={
                                    form.file?.name
                                }
                                className="mt-3 block truncate text-xs font-black text-slate-800 sm:text-sm"
                            >
                                {form.file
                                    ? form.file.name
                                    : "Seleccionar archivo"}
                            </span>

                            <span className="mt-1 block text-[11px] font-semibold text-slate-500 sm:text-xs">
                                PDF, DOC, DOCX o TXT
                            </span>

                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={onFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {form.file ? (
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 sm:rounded-2xl sm:px-4">
                            <div className="min-w-0">
                                <p
                                    title={
                                        form.file.name
                                    }
                                    className="truncate text-xs font-black text-blue-950 sm:text-sm"
                                >
                                    {form.file.name}
                                </p>

                                <p className="mt-0.5 text-[11px] font-semibold text-blue-700 sm:text-xs">
                                    {(
                                        form.file.size /
                                        1024
                                    ).toFixed(1)}{" "}
                                    KB
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onRemoveFile}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 transition hover:bg-red-50 active:scale-[0.97]"
                                aria-label="Quitar archivo"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ) : null}

                    <div className="mt-5 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-4 text-xs font-black text-white transition hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}

                            {saving
                                ? "Guardando..."
                                : "Crear política"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePolicyModal;
