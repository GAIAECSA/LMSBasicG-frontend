"use client";

import {
    BookOpen,
    FileUp,
    Loader2,
    Save,
    X,
} from "lucide-react";
import type { ChangeEvent } from "react";
import type { StudentCatalogState } from "../hook";
import {
    formatPrice,
    getCourseCategory,
} from "../utils";

type EnrollmentModalProps = {
    catalog: StudentCatalogState;
};

export function EnrollmentModal({
    catalog,
}: EnrollmentModalProps) {
    const course = catalog.selectedCourse;

    if (!course) return null;

    const isPaidCourse = !course.is_free;

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        catalog.setVoucherFile(
            event.target.files?.[0] ?? null,
        );

        catalog.setModalError("");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex max-h-[96dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[28px]">
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
                                Solicitud de matrícula
                            </p>

                            <h2 className="mt-1 break-words text-lg font-black leading-6 text-white sm:text-xl">
                                {course.name}
                            </h2>

                            <p className="mt-1 text-xs font-semibold leading-5 text-blue-50 sm:text-sm">
                                {getCourseCategory(course)} · {formatPrice(course)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={catalog.closeEnrollmentModal}
                            disabled={catalog.savingEnrollment}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={catalog.handleSubmitEnrollment}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                        {catalog.modalError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                                {catalog.modalError}
                            </div>
                        ) : null}

                        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#172861]">
                                <BookOpen className="h-4 w-4" />
                            </span>

                            <p className="text-xs font-semibold leading-5 text-blue-800">
                                {isPaidCourse
                                    ? "Adjunta el comprobante de pago. La solicitud quedará pendiente hasta que el administrador la revise."
                                    : "Envía la solicitud para que el administrador revise y apruebe tu matrícula."}
                            </p>
                        </div>

                        {isPaidCourse ? (
                            <>
                                <label className="block">
                                    <span className="text-xs font-black text-slate-700 sm:text-sm">
                                        Código o referencia
                                    </span>

                                    <input
                                        value={catalog.referenceCode}
                                        onChange={(event) => {
                                            catalog.setReferenceCode(
                                                event.target.value,
                                            );

                                            catalog.setModalError("");
                                        }}
                                        placeholder="Ej: TRANSF-001245"
                                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                    />
                                </label>

                                <div>
                                    <span className="text-xs font-black text-slate-700 sm:text-sm">
                                        Comprobante de pago
                                    </span>

                                    <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center transition hover:border-blue-300 hover:bg-blue-50 sm:rounded-2xl">
                                        <FileUp className="h-7 w-7 text-blue-600" />

                                        <span className="mt-2 text-xs font-black text-slate-800 sm:text-sm">
                                            Seleccionar comprobante
                                        </span>

                                        <span className="mt-1 text-[11px] font-semibold text-slate-500">
                                            PDF, JPG, PNG o WEBP
                                        </span>

                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>

                                    {catalog.voucherFile ? (
                                        <div className="mt-2 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-black text-slate-700">
                                                    {catalog.voucherFile.name}
                                                </p>

                                                <p className="text-[10px] font-semibold text-slate-500">
                                                    {(catalog.voucherFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    catalog.setVoucherFile(null)
                                                }
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 transition hover:bg-red-100"
                                                aria-label="Quitar comprobante"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        ) : null}

                        <label className="block">
                            <span className="text-xs font-black text-slate-700 sm:text-sm">
                                Comentario opcional
                            </span>

                            <textarea
                                value={catalog.comment}
                                onChange={(event) =>
                                    catalog.setComment(event.target.value)
                                }
                                rows={3}
                                placeholder="Agrega una observación si lo necesitas..."
                                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:rounded-2xl sm:px-4 sm:text-sm"
                            />
                        </label>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-white p-4 sm:gap-3 sm:px-5">
                        <button
                            type="button"
                            onClick={catalog.closeEnrollmentModal}
                            disabled={catalog.savingEnrollment}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={catalog.savingEnrollment}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                            {catalog.savingEnrollment ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            {catalog.savingEnrollment
                                ? "Enviando..."
                                : "Enviar solicitud"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EnrollmentModal;
