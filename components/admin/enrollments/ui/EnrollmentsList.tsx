import type { ReactNode } from "react";

import {
    Ban,
    CheckCircle2,
    Eye,
    RotateCcw,
    Trash2,
} from "lucide-react";

import {
    resolveEnrollmentVoucherUrl,
    type Enrollment,
} from "@/services/enrollments.service";

import {
    getEnrollmentInitials,
    getEnrollmentStudentName,
    getStatusBadgeClass,
    getStatusText,
} from "../utils";

import { Pagination } from "./Pagination";

type EnrollmentsListProps = {
    isLoading: boolean;
    allEnrollmentsCount: number;
    filteredCount: number;
    paginatedEnrollments: Enrollment[];
    activePage: number;
    totalPages: number;
    updatingId: number | null;
    deletingId: number | null;
    onApprove: (
        enrollment: Enrollment,
    ) => void;
    onRevision: (
        enrollment: Enrollment,
    ) => void;
    onReject: (
        enrollment: Enrollment,
    ) => void;
    onDelete: (
        enrollmentId: number,
    ) => void;
    onOpenVoucher: (
        url: string,
        title: string,
    ) => void;
    onPrevious: () => void;
    onNext: () => void;
};

function getCourseLabel(
    enrollment: Enrollment,
) {
    return (
        enrollment.course.name ||
        `Curso #${enrollment.course.id}`
    );
}

export function EnrollmentsList({
    isLoading,
    allEnrollmentsCount,
    filteredCount,
    paginatedEnrollments,
    activePage,
    totalPages,
    updatingId,
    deletingId,
    onApprove,
    onRevision,
    onReject,
    onDelete,
    onOpenVoucher,
    onPrevious,
    onNext,
}: EnrollmentsListProps) {
    const empty =
        !isLoading &&
        filteredCount === 0;

    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[920px] table-fixed divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="w-[18%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                Curso
                            </th>

                            <th className="w-[20%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                Estudiante
                            </th>

                            <th className="w-[15%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                Código
                            </th>

                            <th className="w-[11%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                Estado
                            </th>

                            <th className="w-[13%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                Comprobante
                            </th>

                            <th className="w-[23%] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-10 text-center text-xs font-semibold text-slate-500"
                                >
                                    Cargando matrículas...
                                </td>
                            </tr>
                        ) : empty ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-10 text-center"
                                >
                                    <EmptyMessage
                                        hasEnrollments={
                                            allEnrollmentsCount >
                                            0
                                        }
                                    />
                                </td>
                            </tr>
                        ) : (
                            paginatedEnrollments.map(
                                (enrollment) => (
                                    <EnrollmentTableRow
                                        key={
                                            enrollment.id
                                        }
                                        enrollment={
                                            enrollment
                                        }
                                        updating={
                                            updatingId ===
                                            enrollment.id
                                        }
                                        deleting={
                                            deletingId ===
                                            enrollment.id
                                        }
                                        onApprove={
                                            onApprove
                                        }
                                        onRevision={
                                            onRevision
                                        }
                                        onReject={
                                            onReject
                                        }
                                        onDelete={
                                            onDelete
                                        }
                                        onOpenVoucher={
                                            onOpenVoucher
                                        }
                                    />
                                ),
                            )
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
                {isLoading ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs font-semibold text-slate-500">
                        Cargando matrículas...
                    </div>
                ) : empty ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                        <EmptyMessage
                            hasEnrollments={
                                allEnrollmentsCount >
                                0
                            }
                        />
                    </div>
                ) : (
                    paginatedEnrollments.map(
                        (enrollment) => (
                            <EnrollmentMobileCard
                                key={enrollment.id}
                                enrollment={
                                    enrollment
                                }
                                updating={
                                    updatingId ===
                                    enrollment.id
                                }
                                deleting={
                                    deletingId ===
                                    enrollment.id
                                }
                                onApprove={
                                    onApprove
                                }
                                onRevision={
                                    onRevision
                                }
                                onReject={
                                    onReject
                                }
                                onDelete={
                                    onDelete
                                }
                                onOpenVoucher={
                                    onOpenVoucher
                                }
                            />
                        ),
                    )
                )}
            </div>

            <Pagination
                activePage={activePage}
                totalPages={totalPages}
                visibleCount={
                    paginatedEnrollments.length
                }
                totalCount={filteredCount}
                onPrevious={onPrevious}
                onNext={onNext}
            />
        </div>
    );
}

function EnrollmentTableRow({
    enrollment,
    updating,
    deleting,
    onApprove,
    onRevision,
    onReject,
    onDelete,
    onOpenVoucher,
}: {
    enrollment: Enrollment;
    updating: boolean;
    deleting: boolean;
    onApprove: (
        enrollment: Enrollment,
    ) => void;
    onRevision: (
        enrollment: Enrollment,
    ) => void;
    onReject: (
        enrollment: Enrollment,
    ) => void;
    onDelete: (
        enrollmentId: number,
    ) => void;
    onOpenVoucher: (
        url: string,
        title: string,
    ) => void;
}) {
    const voucherUrl =
        resolveEnrollmentVoucherUrl(
            enrollment.voucher_url,
        );

    const disabled =
        updating || deleting;

    return (
        <tr className="align-middle transition hover:bg-blue-50/40">
            <td className="px-3 py-3 xl:px-4">
                <p
                    title={getCourseLabel(
                        enrollment,
                    )}
                    className="truncate text-xs font-bold text-slate-950"
                >
                    {getCourseLabel(
                        enrollment,
                    )}
                </p>
            </td>

            <td className="px-3 py-3 xl:px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-[10px] font-bold uppercase text-white">
                        {getEnrollmentInitials(
                            enrollment,
                        )}
                    </div>

                    <p
                        title={getEnrollmentStudentName(
                            enrollment,
                        )}
                        className="truncate text-xs font-bold text-slate-950"
                    >
                        {getEnrollmentStudentName(
                            enrollment,
                        )}
                    </p>
                </div>
            </td>

            <td className="px-3 py-3 xl:px-4">
                <p className="break-all text-[11px] font-semibold leading-4 text-slate-700 [overflow-wrap:anywhere]">
                    {enrollment.reference_code ||
                        "Sin código"}
                </p>
            </td>

            <td className="px-3 py-3 xl:px-4">
                <StatusBadge
                    accepted={
                        enrollment.accepted
                    }
                />
            </td>

            <td className="px-3 py-3 xl:px-4">
                {voucherUrl ? (
                    <button
                        type="button"
                        onClick={() =>
                            onOpenVoucher(
                                voucherUrl,
                                `Comprobante - ${getEnrollmentStudentName(
                                    enrollment,
                                )}`,
                            )
                        }
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.97]"
                        title="Ver comprobante"
                    >
                        <Eye className="h-3.5 w-3.5 shrink-0" />

                        <span className="hidden xl:inline">
                            Ver
                        </span>
                    </button>
                ) : (
                    <span className="text-[10px] font-semibold text-slate-400">
                        Sin comprobante
                    </span>
                )}
            </td>

            <td className="px-3 py-3 xl:px-4">
                <div className="flex justify-end gap-1.5">
                    {enrollment.accepted ===
                    true ? (
                        <ActionButton
                            label="A revisión"
                            title="Enviar a revisión"
                            icon={
                                <RotateCcw className="h-3.5 w-3.5" />
                            }
                            tone="warning"
                            disabled={disabled}
                            onClick={() =>
                                onRevision(
                                    enrollment,
                                )
                            }
                        />
                    ) : (
                        <ActionButton
                            label="Aprobar"
                            title="Aprobar matrícula"
                            icon={
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            }
                            tone="success"
                            disabled={disabled}
                            onClick={() =>
                                onApprove(
                                    enrollment,
                                )
                            }
                        />
                    )}

                    <ActionButton
                        label="No aprobar"
                        title="No aprobar matrícula"
                        icon={
                            <Ban className="h-3.5 w-3.5" />
                        }
                        tone="danger"
                        disabled={disabled}
                        onClick={() =>
                            onReject(enrollment)
                        }
                    />

                    <ActionButton
                        label={
                            deleting
                                ? "Eliminando..."
                                : "Eliminar"
                        }
                        title="Eliminar matrícula"
                        icon={
                            <Trash2 className="h-3.5 w-3.5" />
                        }
                        tone="neutral"
                        disabled={disabled}
                        onClick={() =>
                            onDelete(
                                enrollment.id,
                            )
                        }
                    />
                </div>
            </td>
        </tr>
    );
}

function EnrollmentMobileCard({
    enrollment,
    updating,
    deleting,
    onApprove,
    onRevision,
    onReject,
    onDelete,
    onOpenVoucher,
}: {
    enrollment: Enrollment;
    updating: boolean;
    deleting: boolean;
    onApprove: (
        enrollment: Enrollment,
    ) => void;
    onRevision: (
        enrollment: Enrollment,
    ) => void;
    onReject: (
        enrollment: Enrollment,
    ) => void;
    onDelete: (
        enrollmentId: number,
    ) => void;
    onOpenVoucher: (
        url: string,
        title: string,
    ) => void;
}) {
    const voucherUrl =
        resolveEnrollmentVoucherUrl(
            enrollment.voucher_url,
        );

    const disabled =
        updating || deleting;

    return (
        <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex min-w-0 items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-[10px] font-bold uppercase text-white">
                    {getEnrollmentInitials(
                        enrollment,
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p
                        title={getEnrollmentStudentName(
                            enrollment,
                        )}
                        className="break-words text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere]"
                    >
                        {getEnrollmentStudentName(
                            enrollment,
                        )}
                    </p>

                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        Usuario #{enrollment.user.id}
                    </p>
                </div>

                <StatusBadge
                    accepted={
                        enrollment.accepted
                    }
                />
            </div>

            <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 xs:grid-cols-2">
                <InfoItem
                    label="Curso"
                    value={getCourseLabel(
                        enrollment,
                    )}
                />

                <InfoItem
                    label="Código"
                    value={
                        enrollment.reference_code ||
                        "Sin código"
                    }
                />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                {voucherUrl ? (
                    <button
                        type="button"
                        onClick={() =>
                            onOpenVoucher(
                                voucherUrl,
                                `Comprobante - ${getEnrollmentStudentName(
                                    enrollment,
                                )}`,
                            )
                        }
                        className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.97]"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Ver comprobante
                    </button>
                ) : (
                    <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-slate-400">
                        Sin comprobante
                    </div>
                )}

                {enrollment.accepted ===
                true ? (
                    <MobileActionButton
                        label="A revisión"
                        icon={
                            <RotateCcw className="h-3.5 w-3.5" />
                        }
                        tone="warning"
                        disabled={disabled}
                        onClick={() =>
                            onRevision(
                                enrollment,
                            )
                        }
                    />
                ) : (
                    <MobileActionButton
                        label="Aprobar"
                        icon={
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        }
                        tone="success"
                        disabled={disabled}
                        onClick={() =>
                            onApprove(
                                enrollment,
                            )
                        }
                    />
                )}

                <MobileActionButton
                    label="No aprobar"
                    icon={
                        <Ban className="h-3.5 w-3.5" />
                    }
                    tone="danger"
                    disabled={disabled}
                    onClick={() =>
                        onReject(enrollment)
                    }
                />

                <MobileActionButton
                    label={
                        deleting
                            ? "Eliminando..."
                            : "Eliminar"
                    }
                    icon={
                        <Trash2 className="h-3.5 w-3.5" />
                    }
                    tone="neutral"
                    disabled={disabled}
                    onClick={() =>
                        onDelete(enrollment.id)
                    }
                    className="col-span-2"
                />
            </div>
        </article>
    );
}

function StatusBadge({
    accepted,
}: {
    accepted: boolean | null;
}) {
    return (
        <span
            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold sm:px-2.5 sm:py-1 sm:text-[10px] ${getStatusBadgeClass(
                accepted,
            )}`}
        >
            {getStatusText(accepted)}
        </span>
    );
}

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                {label}
            </p>

            <p className="mt-1 break-words text-[11px] font-bold leading-4 text-slate-700 [overflow-wrap:anywhere]">
                {value}
            </p>
        </div>
    );
}

function ActionButton({
    label,
    title,
    icon,
    tone,
    disabled,
    onClick,
}: {
    label: string;
    title: string;
    icon: ReactNode;
    tone:
        | "success"
        | "warning"
        | "danger"
        | "neutral";
    disabled: boolean;
    onClick: () => void;
}) {
    const toneClass =
        tone === "success"
            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            : tone === "warning"
              ? "border-orange-200 text-orange-700 hover:bg-orange-50"
              : tone === "danger"
                ? "border-red-200 text-red-700 hover:bg-red-50"
                : "border-slate-200 text-slate-600 hover:bg-slate-50";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={title}
            className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2 text-[10px] font-bold transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
        >
            {icon}

            <span className="hidden 2xl:inline">
                {label}
            </span>
        </button>
    );
}

function MobileActionButton({
    label,
    icon,
    tone,
    disabled,
    onClick,
    className = "",
}: {
    label: string;
    icon: ReactNode;
    tone:
        | "success"
        | "warning"
        | "danger"
        | "neutral";
    disabled: boolean;
    onClick: () => void;
    className?: string;
}) {
    const toneClass =
        tone === "success"
            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            : tone === "warning"
              ? "border-orange-200 text-orange-700 hover:bg-orange-50"
              : tone === "danger"
                ? "border-red-200 text-red-700 hover:bg-red-50"
                : "border-slate-200 text-slate-600 hover:bg-slate-50";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-[10px] font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`}
        >
            {icon}

            <span className="truncate">
                {label}
            </span>
        </button>
    );
}

function EmptyMessage({
    hasEnrollments,
}: {
    hasEnrollments: boolean;
}) {
    return (
        <>
            <p className="text-xs font-bold text-slate-800 sm:text-sm">
                No hay matrículas para mostrar.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {hasEnrollments
                    ? "No se encontraron matrículas con ese criterio de búsqueda."
                    : "Registra una matrícula desde el botón superior."}
            </p>
        </>
    );
}
