/* eslint-disable @next/next/no-img-element */

import {
    AlertCircle,
    BookOpen,
    CreditCard,
    Loader2,
    ReceiptText,
    UploadCloud,
} from "lucide-react";

import type {
    StudentEnrollmentState,
} from "../hook";

type EnrollmentMethodCardProps = {
    enrollment: StudentEnrollmentState;
};

export function EnrollmentMethodCard({
    enrollment,
}: EnrollmentMethodCardProps) {
    const { course } =
        enrollment;

    if (!course) {
        return null;
    }

    return (
        <article
            id="enrollment-method"
            className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-[24px] sm:p-4 lg:p-5 [@media(max-height:760px)]:lg:p-4"
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <CreditCard className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                        Método de matrícula
                    </h2>

                    <p className="text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Completa el paso requerido.
                    </p>
                </div>
            </div>

            <div className="mt-3 sm:mt-4">
                {course.isFree ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success-soft)] p-3 sm:rounded-2xl sm:p-4">
                        <input
                            type="radio"
                            name="paymentMethod"
                            checked={
                                enrollment.paymentMethod ===
                                "gratis"
                            }
                            onChange={() => {
                                enrollment.setPaymentMethod(
                                    "gratis",
                                );
                            }}
                            className="mt-1 h-4 w-4 accent-[var(--success)]"
                        />

                        <div className="min-w-0">
                            <p className="text-xs font-black text-[var(--success)] sm:text-sm">
                                Matrícula directa
                            </p>

                            <p className="mt-1 break-words text-xs font-semibold leading-5 text-[var(--success)]/80">
                                Este curso no requiere
                                pago. Confirma la
                                matrícula para solicitar
                                el acceso.
                            </p>
                        </div>
                    </label>
                ) : (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-3 transition hover:bg-[var(--muted)] sm:rounded-2xl sm:p-4">
                        <input
                            type="radio"
                            name="paymentMethod"
                            checked={
                                enrollment.paymentMethod ===
                                "transferencia"
                            }
                            onChange={() => {
                                enrollment.setPaymentMethod(
                                    "transferencia",
                                );
                            }}
                            className="mt-1 h-4 w-4 accent-[var(--primary)]"
                        />

                        <div className="min-w-0">
                            <p className="text-xs font-black text-[var(--foreground)] sm:text-sm">
                                Transferencia bancaria
                            </p>

                            <p className="mt-1 break-words text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                                Realiza el pago, sube tu
                                comprobante y espera la
                                validación administrativa.
                            </p>
                        </div>
                    </label>
                )}
            </div>

            {enrollment.paymentMethod ===
                "transferencia" &&
                !course.isFree ? (
                <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 sm:mt-4 sm:rounded-2xl sm:p-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="text-xs font-black text-[var(--foreground)] sm:text-sm">
                                Comprobante de transferencia
                            </h3>

                            <p className="mt-1 break-words text-[11px] font-semibold leading-5 text-[var(--muted-foreground)] sm:text-xs">
                                Archivo requerido para
                                validar tu matrícula.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                enrollment.openVoucherModal
                            }
                            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 active:scale-[0.97] sm:w-auto"
                        >
                            <UploadCloud className="h-4 w-4" />

                            {enrollment.voucherFile
                                ? "Editar"
                                : "Cargar"}
                        </button>
                    </div>

                    <div className="mt-3 space-y-2.5 rounded-xl bg-white p-3 sm:rounded-2xl sm:p-4">
                        <VoucherRow
                            label="Número"
                            value={
                                enrollment.voucherNumber ||
                                "Pendiente de generar"
                            }
                        />

                        <VoucherRow
                            label="Archivo"
                            value={
                                enrollment.voucherFile
                                    ?.name ||
                                "Pendiente"
                            }
                        />

                        <VoucherRow
                            label="Estado"
                            value={
                                enrollment.voucherFile
                                    ? "Pendiente de validación"
                                    : "Pendiente"
                            }
                            valueClassName={
                                enrollment.voucherFile
                                    ? "text-[var(--warning)]"
                                    : "text-[var(--muted-foreground)]"
                            }
                        />
                    </div>

                    {enrollment.voucherPreview ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-white sm:rounded-2xl">
                            <img
                                src={
                                    enrollment.voucherPreview
                                }
                                alt="Vista previa del comprobante"
                                className="max-h-[180px] w-full object-contain sm:max-h-[220px]"
                            />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {enrollment.submitError ? (
                <Feedback
                    message={
                        enrollment.submitError
                    }
                />
            ) : null}

            <button
                type="button"
                onClick={() => {
                    void enrollment.handleSubmitEnrollment();
                }}
                disabled={
                    !enrollment.canSubmit
                }
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:px-5 sm:text-sm"
            >
                {enrollment.submittingEnrollment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : course.isFree ? (
                    <BookOpen className="h-4 w-4" />
                ) : (
                    <ReceiptText className="h-4 w-4" />
                )}

                {enrollment.submittingEnrollment
                    ? "Registrando matrícula..."
                    : course.isFree
                        ? "Confirmar matrícula"
                        : enrollment.existingEnrollmentState
                            .type ===
                            "rejected"
                            ? "Enviar nuevamente"
                            : "Enviar matrícula"}
            </button>
        </article>
    );
}

function VoucherRow({
    label,
    value,
    valueClassName =
    "text-[var(--foreground)]",
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3 text-[11px] sm:text-xs">
            <span className="shrink-0 font-semibold text-[var(--muted-foreground)]">
                {label}
            </span>

            <span
                className={`min-w-0 truncate text-right font-black ${valueClassName}`}
                title={value}
            >
                {value}
            </span>
        </div>
    );
}

function Feedback({
    message,
}: {
    message: string;
}) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="mt-3 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-3 text-xs font-bold leading-5 text-[var(--danger)] sm:rounded-2xl sm:p-4 sm:text-sm"
        >
            <div className="flex min-w-0 gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />

                <span className="min-w-0 break-words">
                    {message}
                </span>
            </div>
        </div>
    );
}

export default EnrollmentMethodCard;