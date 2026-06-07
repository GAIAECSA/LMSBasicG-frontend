/* eslint-disable @next/next/no-img-element */

import {
    CheckCircle2,
    FileCheck2,
    FileImage,
    FileWarning,
    Info,
    UploadCloud,
    X,
} from "lucide-react";

import type {
    StudentEnrollmentState,
} from "../hook";

type VoucherModalProps = {
    enrollment: StudentEnrollmentState;
};

export function VoucherModal({
    enrollment,
}: VoucherModalProps) {
    if (
        !enrollment.isVoucherModalOpen
    ) {
        return null;
    }

    const hasReferenceCode =
        Boolean(
            enrollment.tempReferenceCode.trim(),
        );

    const hasVoucherFile =
        Boolean(
            enrollment.tempVoucherFile,
        );

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-[28px]">
                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary)] px-4 py-4 text-[var(--primary-foreground)] sm:px-5 sm:py-5">
                    <div className="min-w-0">
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/70 sm:text-xs sm:tracking-[0.18em]">
                            Comprobante de pago
                        </p>

                        <h3 className="mt-1 truncate text-lg font-black sm:text-xl">
                            Cargar comprobante
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={
                            enrollment.closeVoucherModal
                        }
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-[0.97] sm:h-10 sm:w-10 sm:rounded-2xl"
                        aria-label="Cerrar modal"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 [@media(max-height:760px)]:p-4">
                    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="min-w-0 space-y-4">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 sm:rounded-2xl sm:p-4">
                                <p className="text-[10px] font-black uppercase tracking-wide text-[var(--muted-foreground)] sm:text-xs">
                                    Número de comprobante
                                </p>

                                <p className="mt-1.5 break-words text-xs font-black text-[var(--foreground)] sm:mt-2 sm:text-sm">
                                    {enrollment.voucherNumber ||
                                        "Se generará automáticamente al guardar"}
                                </p>
                            </div>

                            <BankTransferDetails />

                            <div className="grid gap-3">
                                <label className="block min-w-0">
                                    <span className="mb-1.5 block text-xs font-black text-[var(--foreground)] sm:mb-2 sm:text-sm">
                                        Código de referencia

                                        {!hasReferenceCode ? (
                                            <span className="ml-1 text-red-600">
                                                *
                                            </span>
                                        ) : null}
                                    </span>

                                    <input
                                        type="text"
                                        required
                                        aria-required="true"
                                        value={
                                            enrollment.tempReferenceCode
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            enrollment.setTempReferenceCode(
                                                event.target.value,
                                            );
                                        }}
                                        placeholder="Ej: TRX-2026-001"
                                        className={`h-10 w-full rounded-xl border bg-white px-3 text-xs font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm ${hasReferenceCode
                                                ? "border-[var(--border)]"
                                                : "border-red-200"
                                            }`}
                                    />

                                    {!hasReferenceCode ? (
                                        <p className="mt-1.5 text-[11px] font-semibold leading-5 text-red-600 sm:text-xs">
                                            Ingresa el
                                            código que
                                            aparece en tu
                                            comprobante.
                                        </p>
                                    ) : null}
                                </label>

                                <label className="block min-w-0">
                                    <span className="mb-1.5 block text-xs font-black text-[var(--foreground)] sm:mb-2 sm:text-sm">
                                        Observaciones
                                    </span>

                                    <textarea
                                        value={
                                            enrollment.tempObservations
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            enrollment.setTempObservations(
                                                event.target.value,
                                            );
                                        }}
                                        placeholder="Agrega una nota opcional para administración."
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-xs font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="min-w-0 space-y-3 sm:space-y-4">
                            <div>
                                <p className="mb-1.5 text-xs font-black text-[var(--foreground)] sm:mb-2 sm:text-sm">
                                    Archivo del comprobante

                                    {!hasVoucherFile ? (
                                        <span className="ml-1 text-red-600">
                                            *
                                        </span>
                                    ) : null}
                                </p>

                                <label className="flex min-h-[145px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--primary)]/30 bg-[var(--secondary)] p-4 text-center transition hover:bg-[var(--secondary)]/70 sm:min-h-[170px] sm:rounded-[24px] sm:p-5">
                                    <input
                                        type="file"
                                        required
                                        aria-required="true"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={
                                            enrollment.handleTempVoucherChange
                                        }
                                    />

                                    <UploadCloud className="h-9 w-9 text-[var(--primary)] sm:h-11 sm:w-11" />

                                    <p className="mt-2 text-xs font-black text-[var(--primary)] sm:mt-3 sm:text-sm">
                                        Seleccionar
                                        comprobante
                                    </p>

                                    <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--muted-foreground)] sm:text-xs">
                                        Imagen o PDF.
                                        Máximo 10 MB.
                                    </p>
                                </label>

                                {!hasVoucherFile ? (
                                    <p className="mt-1.5 text-[11px] font-semibold leading-5 text-red-600 sm:text-xs">
                                        Selecciona el
                                        archivo del
                                        comprobante.
                                    </p>
                                ) : null}
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 sm:rounded-2xl sm:p-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    {hasVoucherFile ? (
                                        <FileCheck2 className="h-5 w-5 shrink-0 text-[var(--success)]" />
                                    ) : (
                                        <FileWarning className="h-5 w-5 shrink-0 text-[var(--warning)]" />
                                    )}

                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] sm:text-xs">
                                            Archivo
                                            seleccionado
                                        </p>

                                        <p
                                            className="mt-1 truncate text-xs font-black text-[var(--foreground)] sm:text-sm"
                                            title={
                                                enrollment.tempVoucherFile
                                                    ?.name ||
                                                "Aún no has seleccionado un archivo"
                                            }
                                        >
                                            {enrollment.tempVoucherFile
                                                ?.name ||
                                                "Aún no has seleccionado un archivo"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {enrollment.tempVoucherPreview ? (
                                <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white sm:rounded-2xl">
                                    <img
                                        src={
                                            enrollment.tempVoucherPreview
                                        }
                                        alt="Vista previa temporal del comprobante"
                                        className="max-h-[220px] w-full object-contain sm:max-h-[270px]"
                                    />
                                </div>
                            ) : (
                                <div className="flex min-h-[125px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-3 text-center sm:min-h-[160px] sm:rounded-2xl">
                                    <FileImage className="h-8 w-8 text-[var(--muted-foreground)] sm:h-9 sm:w-9" />

                                    <p className="mt-2 text-xs font-bold text-[var(--muted-foreground)] sm:mt-3 sm:text-sm">
                                        La vista previa
                                        aparecerá aquí
                                    </p>
                                </div>
                            )}

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
                                <div className="flex min-w-0 gap-2">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                                    <p className="min-w-0 break-words">
                                        Verifica que el
                                        comprobante sea
                                        claro y que el valor
                                        coincida con el total
                                        a pagar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-[var(--border)] bg-white p-4 sm:flex sm:justify-end sm:gap-3 sm:px-5">
                    <button
                        type="button"
                        onClick={
                            enrollment.closeVoucherModal
                        }
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black text-[var(--foreground)] transition hover:bg-[var(--muted)] active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={
                            enrollment.saveVoucherData
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-5 sm:text-sm"
                    >
                        <CheckCircle2 className="h-4 w-4" />

                        Guardar comprobante
                    </button>
                </div>
            </div>
        </div>
    );
}

function BankTransferDetails() {
    return (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white sm:rounded-2xl">
            <div className="border-b border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 sm:px-4 sm:py-3">
                <h4 className="text-xs font-black text-[var(--foreground)] sm:text-sm">
                    Datos para transferencia
                </h4>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 sm:gap-3 sm:p-4">
                <TransferItem
                    label="Banco"
                    value="Banco Pichincha"
                />

                <TransferItem
                    label="Tipo de cuenta"
                    value="Ahorros"
                />

                <div className="sm:col-span-2">
                    <TransferItem
                        label="Titular"
                        value="Santic Education Cía. Ltda."
                    />
                </div>

                <div className="rounded-xl bg-[var(--secondary)] p-3 sm:col-span-2">
                    <p className="text-[10px] font-bold text-[var(--primary)] sm:text-xs">
                        Número de cuenta
                    </p>

                    <p className="mt-1 break-all text-xl font-black text-[var(--primary)] sm:text-2xl">
                        2201456789
                    </p>
                </div>
            </div>
        </div>
    );
}

function TransferItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-[var(--muted)] p-3">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] sm:text-xs">
                {label}
            </p>

            <p className="mt-1 break-words text-xs font-black text-[var(--foreground)] sm:text-sm">
                {value}
            </p>
        </div>
    );
}

export default VoucherModal;