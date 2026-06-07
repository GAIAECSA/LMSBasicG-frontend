import { ReceiptText } from "lucide-react";
import type { CourseEnrollmentItem } from "../types";
import { formatPrice } from "../utils";

type PaymentSummaryCardProps = {
    course: CourseEnrollmentItem;
    discountAmount: number;
    totalPayable: number;
};

export function PaymentSummaryCard({
    course,
    discountAmount,
    totalPayable,
}: PaymentSummaryCardProps) {
    return (
        <article className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:rounded-[24px] sm:p-4 lg:p-5 [@media(max-height:760px)]:lg:p-4">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <ReceiptText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <h2 className="text-base font-black text-[var(--foreground)] sm:text-lg">
                        Resumen de pago
                    </h2>

                    <p className="text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                        Valores generados para esta
                        matrícula.
                    </p>
                </div>
            </div>

            <div className="mt-3 space-y-2.5 rounded-xl bg-[var(--muted)] p-3 sm:mt-4 sm:rounded-2xl sm:p-4">
                <SummaryRow
                    label="Precio del curso"
                    value={
                        course.isFree
                            ? "Gratis"
                            : formatPrice(course.price)
                    }
                />

                <SummaryRow
                    label="Descuento aplicado"
                    value={
                        discountAmount > 0
                            ? `-${formatPrice(discountAmount)}`
                            : formatPrice(0)
                    }
                    valueClassName={
                        discountAmount > 0
                            ? "text-orange-600"
                            : "text-[var(--muted-foreground)]"
                    }
                />

                <div className="border-t border-[var(--border)] pt-2.5 sm:pt-3">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="text-sm font-black text-[var(--foreground)] sm:text-base">
                            Total a pagar
                        </span>

                        <span
                            className={`break-words text-xl font-black sm:text-2xl ${
                                totalPayable === 0
                                    ? "text-[var(--success)]"
                                    : "text-[var(--primary)]"
                            }`}
                        >
                            {totalPayable === 0
                                ? "Gratis"
                                : formatPrice(totalPayable)}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}

function SummaryRow({
    label,
    value,
    valueClassName = "text-[var(--foreground)]",
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="min-w-0 break-words font-semibold text-[var(--muted-foreground)]">
                {label}
            </span>

            <span
                className={`shrink-0 font-black ${valueClassName}`}
            >
                {value}
            </span>
        </div>
    );
}

export default PaymentSummaryCard;
