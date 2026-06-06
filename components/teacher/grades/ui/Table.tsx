import {
    ClipboardList,
    Eye,
    FileCheck2,
    Loader2,
    RotateCcw,
    UserRound,
    XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import type { EnrollmentGroup } from "../types";
import {
    formatDate,
    getCertificateFinalGrade,
    isValidGroupForCertificate,
    openCertificateByRoute,
} from "../utils";
import { Pagination } from "./Pagination";

type TableProps = {
    groupedGradesLength: number;
    paginatedGroups: EnrollmentGroup[];
    startItem: number;
    endItem: number;
    activePage: number;
    totalPages: number;
    generatingCertificateUserId: number | null;
    setCurrentPage: (value: number | ((page: number) => number)) => void;
    openGroupModal: (group: EnrollmentGroup) => void;
    handleGenerateOrReissueCertificate: (
        group: EnrollmentGroup,
    ) => Promise<void>;
};

export function Table({
    groupedGradesLength,
    paginatedGroups,
    startItem,
    endItem,
    activePage,
    totalPages,
    generatingCertificateUserId,
    setCurrentPage,
    openGroupModal,
    handleGenerateOrReissueCertificate,
}: TableProps) {
    if (groupedGradesLength === 0) {
        return <EmptyTable />;
    }

    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] table-fixed divide-y divide-slate-200 text-xs xl:text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <HeaderCell className="w-[21%]">
                                Estudiante
                            </HeaderCell>

                            <HeaderCell className="w-[8%] text-center">
                                Actividades
                            </HeaderCell>

                            <HeaderCell className="w-[8%] text-center">
                                Promedio
                            </HeaderCell>

                            <HeaderCell className="w-[8%] text-center">
                                Aprobadas
                            </HeaderCell>

                            <HeaderCell className="w-[10%] text-center">
                                No aprobadas
                            </HeaderCell>

                            <HeaderCell className="w-[12%]">
                                Última respuesta
                            </HeaderCell>

                            <HeaderCell className="w-[14%] text-center">
                                Certificado
                            </HeaderCell>

                            <HeaderCell className="w-[19%] text-right">
                                Acciones
                            </HeaderCell>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedGroups.map((group) => (
                            <DesktopRow
                                key={`${group.enrollmentId}-${group.userId}`}
                                group={group}
                                generatingCertificateUserId={
                                    generatingCertificateUserId
                                }
                                openGroupModal={openGroupModal}
                                handleGenerateOrReissueCertificate={
                                    handleGenerateOrReissueCertificate
                                }
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                startItem={startItem}
                endItem={endItem}
                totalItems={groupedGradesLength}
                activePage={activePage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
            />
        </div>
    );
}

function DesktopRow({
    group,
    generatingCertificateUserId,
    openGroupModal,
    handleGenerateOrReissueCertificate,
}: {
    group: EnrollmentGroup;
    generatingCertificateUserId: number | null;
    openGroupModal: (group: EnrollmentGroup) => void;
    handleGenerateOrReissueCertificate: (
        group: EnrollmentGroup,
    ) => Promise<void>;
}) {
    const processing = generatingCertificateUserId === group.userId;
    const certificateGrade = getCertificateFinalGrade(group.certificate);

    return (
        <tr className="align-middle transition hover:bg-blue-50/40">
            <td className="px-2.5 py-2.5 xl:px-3">
                <StudentIdentity group={group} />
            </td>

            <td className="px-3 py-3 text-center font-bold text-slate-950 xl:px-4">
                {group.rows.length}
            </td>

            <td className="px-3 py-3 text-center xl:px-4">
                <ScoreBadge value={certificateGrade || group.averageScore} />
            </td>

            <td className="px-3 py-3 text-center xl:px-4">
                <CountBadge value={group.passedCount} tone="success" />
            </td>

            <td className="px-3 py-3 text-center xl:px-4">
                <CountBadge value={group.failedCount} tone="danger" />
            </td>

            <td className="px-2.5 py-2.5 text-[10px] font-semibold leading-4 text-slate-500 xl:px-3 xl:text-xs">
                {formatDate(group.lastDate)}
            </td>

            <td className="px-3 py-3 text-center xl:px-4">
                <CertificateBadge generated={Boolean(group.certificate)} />
            </td>

            <td className="px-3 py-3 xl:px-4">
                <div className="flex justify-end gap-1.5">
                    <ActionButton
                        icon={<Eye className="h-3.5 w-3.5" />}
                        label="Resumen"
                        title="Ver resumen"
                        className="border-[#172861] bg-[#172861] text-white hover:bg-[#0B163F]"
                        onClick={() => openGroupModal(group)}
                    />

                    {group.certificate?.certificate_code ? (
                        <ActionButton
                            icon={<Eye className="h-3.5 w-3.5" />}
                            label="Certificado"
                            title="Ver certificado"
                            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            onClick={() =>
                                openCertificateByRoute(group.certificate)
                            }
                        />
                    ) : null}

                    <ActionButton
                        icon={
                            processing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : group.certificate ? (
                                <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                                <FileCheck2 className="h-3.5 w-3.5" />
                            )
                        }
                        label={
                            processing
                                ? "Procesando"
                                : group.certificate
                                    ? "Reemitir"
                                    : "Generar"
                        }
                        title={
                            group.failedCount > 0
                                ? "El estudiante tiene actividades no aprobadas."
                                : group.certificate
                                    ? "Reemitir certificado"
                                    : "Generar certificado"
                        }
                        disabled={
                            processing || !isValidGroupForCertificate(group)
                        }
                        className={
                            group.certificate
                                ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
                                : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        }
                        onClick={() =>
                            void handleGenerateOrReissueCertificate(group)
                        }
                    />
                </div>
            </td>
        </tr>
    );
}

function MobileCard({
    group,
    generatingCertificateUserId,
    openGroupModal,
    handleGenerateOrReissueCertificate,
}: {
    group: EnrollmentGroup;
    generatingCertificateUserId: number | null;
    openGroupModal: (group: EnrollmentGroup) => void;
    handleGenerateOrReissueCertificate: (
        group: EnrollmentGroup,
    ) => Promise<void>;
}) {
    const processing = generatingCertificateUserId === group.userId;
    const certificateGrade = getCertificateFinalGrade(group.certificate);

    return (
        <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
            <div className="flex min-w-0 items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-white sm:h-10 sm:w-10 sm:rounded-2xl">
                    <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="break-words text-xs font-black leading-5 text-slate-950 [overflow-wrap:anywhere] sm:text-sm">
                        {group.studentName}
                    </p>

                    <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
                        Matrícula #{group.enrollmentId || "N/D"}
                    </p>
                </div>

                <CertificateBadge generated={Boolean(group.certificate)} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 xs:grid-cols-4">
                <MobileMetric label="Actividades" value={group.rows.length} />
                <MobileMetric
                    label="Promedio"
                    value={certificateGrade || group.averageScore}
                />
                <MobileMetric label="Aprobadas" value={group.passedCount} />
                <MobileMetric label="No aprobadas" value={group.failedCount} />
            </div>

            <p className="mt-3 text-[10px] font-semibold text-slate-500 sm:text-xs">
                Última respuesta: {formatDate(group.lastDate)}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => openGroupModal(group)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-2 text-[10px] font-bold text-white transition hover:bg-[#0B163F] active:scale-[0.97] sm:text-xs"
                >
                    <Eye className="h-3.5 w-3.5" />
                    Ver resumen
                </button>

                {group.certificate?.certificate_code ? (
                    <button
                        type="button"
                        onClick={() => openCertificateByRoute(group.certificate)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] sm:text-xs"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Ver certificado
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={() =>
                        void handleGenerateOrReissueCertificate(group)
                    }
                    disabled={processing || !isValidGroupForCertificate(group)}
                    title={
                        group.failedCount > 0
                            ? "El estudiante tiene actividades no aprobadas."
                            : undefined
                    }
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[10px] font-bold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs ${group.certificate
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-emerald-600 hover:bg-emerald-700"
                        } col-span-2`}
                >
                    {processing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : group.certificate ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                        <FileCheck2 className="h-3.5 w-3.5" />
                    )}

                    {processing
                        ? "Procesando..."
                        : group.certificate
                            ? "Reemitir certificado"
                            : "Generar certificado"}
                </button>
            </div>
        </article>
    );
}

function StudentIdentity({ group }: { group: EnrollmentGroup }) {
    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#172861] text-white">
                <UserRound className="h-4 w-4" />
            </div>

            <div className="min-w-0">
                <p
                    title={group.studentName}
                    className="truncate text-xs font-bold text-slate-950"
                >
                    {group.studentName}
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                    Matrícula #{group.enrollmentId || "N/D"}
                </p>
            </div>
        </div>
    );
}

function HeaderCell({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <th
            className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4 ${className}`}
        >
            {children}
        </th>
    );
}

function ScoreBadge({ value }: { value: string | number }) {
    return (
        <span className="inline-flex rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 xl:rounded-xl xl:px-3 xl:py-1 xl:text-xs">
            {value}
        </span>
    );
}

function CountBadge({
    value,
    tone,
}: {
    value: number;
    tone: "success" | "danger";
}) {
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold xl:rounded-xl xl:px-3 xl:py-1 xl:text-xs ${tone === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
                }`}
        >
            {value}
        </span>
    );
}

function CertificateBadge({ generated }: { generated: boolean }) {
    return generated ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 xl:rounded-xl xl:px-3 xl:py-1 xl:text-[10px]">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Generado</span>
        </span>
    ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 xl:rounded-xl xl:px-3 xl:py-1 xl:text-[10px]">
            <XCircle className="h-3.5 w-3.5" />
            <span>No generado</span>
        </span>
    );
}

function ActionButton({
    icon,
    label,
    title,
    className,
    disabled = false,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    title: string;
    className: string;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={title}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 2xl:w-auto 2xl:gap-1 2xl:px-2 ${className}`}
        >
            {icon}

            <span className="hidden 2xl:inline">
                {label}
            </span>
        </button>
    );
}

function MobileMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="min-w-0 rounded-xl bg-slate-50 px-2.5 py-2">
            <p className="truncate text-[9px] font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 truncate text-xs font-black text-slate-800">
                {value}
            </p>
        </div>
    );
}

function EmptyTable() {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center shadow-sm sm:rounded-3xl sm:p-8 [@media(max-height:760px)]:p-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#172861] sm:h-12 sm:w-12 sm:rounded-2xl">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <h2 className="mt-3 text-base font-bold text-slate-950 sm:mt-4 sm:text-lg">
                No hay respuestas de actividades para este curso
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Cuando los estudiantes respondan pruebas o tareas del curso,
                aparecerá el resumen por matrícula.
            </p>
        </div>
    );
}
