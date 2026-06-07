import {
    ArchiveRestore,
    ArchiveX,
    Award,
    ExternalLink,
    FileText,
    Loader2,
    Trash2,
} from "lucide-react";
import type { MdtCertificate } from "@/services/mdt-certificates.service";
import type { MdtCertificatesTeacherState } from "../hook";
import {
    buildCertificateFileUrl,
    formatDate,
} from "../utils";

type CertificatesTableProps = {
    certs: MdtCertificatesTeacherState;
};

export function CertificatesTable({
    certs,
}: CertificatesTableProps) {
    return (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
            <div className="grid gap-2 border-b border-slate-200 px-3 py-3 sm:px-4 sm:py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                    <h2 className="text-sm font-black text-slate-950 sm:text-base">
                        Lista de certificados
                    </h2>

                    <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-xs">
                        Mostrando {certs.filteredCertificates.length} de{" "}
                        {certs.certificates.length} registro(s)
                    </p>
                </div>

                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 sm:px-3 sm:py-2 sm:text-xs">
                    <Award className="h-3.5 w-3.5 text-orange-500 sm:h-4 sm:w-4" />
                    Curso #{certs.numericCourseId || "-"}
                </span>
            </div>

            {certs.loading ? (
                <div className="flex items-center gap-2 p-4 text-xs font-bold text-slate-500 sm:p-5 sm:text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando certificados...
                </div>
            ) : null}

            {!certs.loading &&
            certs.filteredCertificates.length === 0 ? (
                <div className="m-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:m-4 sm:rounded-2xl sm:p-8">
                    <FileText className="mx-auto h-9 w-9 text-slate-400 sm:h-10 sm:w-10" />

                    <h3 className="mt-3 text-sm font-black text-slate-900 sm:mt-4 sm:text-base">
                        No hay certificados registrados
                    </h3>

                    <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                        Sube el primer certificado para que el estudiante pueda visualizarlo desde su aula.
                    </p>
                </div>
            ) : null}

            {!certs.loading &&
            certs.filteredCertificates.length > 0 ? (
                <>
                    <div className="space-y-3 p-3 lg:hidden">
                        {certs.filteredCertificates.map(
                            (certificate) => (
                                <CertificateCard
                                    key={certificate.id}
                                    certificate={certificate}
                                    processingId={certs.processingId}
                                    onToggleState={
                                        certs.toggleCertificateState
                                    }
                                    onDelete={(current) =>
                                        certs.setDeleteModal({
                                            certificate: current,
                                        })
                                    }
                                />
                            ),
                        )}
                    </div>

                    <div className="hidden min-w-0 overflow-x-auto overscroll-x-contain lg:block">
                        <table className="w-full min-w-[980px] table-fixed text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 sm:text-[10px]">
                                    <th className="w-[27%] px-3 py-3">
                                        Archivo
                                    </th>

                                    <th className="w-[15%] px-2 py-3">
                                        Identificación
                                    </th>

                                    <th className="w-[9%] px-2 py-3">
                                        Tipo
                                    </th>

                                    <th className="w-[10%] px-2 py-3">
                                        Estado
                                    </th>

                                    <th className="w-[17%] px-2 py-3">
                                        Fecha
                                    </th>

                                    <th className="w-[22%] px-3 py-3 text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {certs.filteredCertificates.map(
                                    (certificate) => (
                                        <CertificateRow
                                            key={certificate.id}
                                            certificate={certificate}
                                            processingId={
                                                certs.processingId
                                            }
                                            onToggleState={
                                                certs.toggleCertificateState
                                            }
                                            onDelete={(current) =>
                                                certs.setDeleteModal({
                                                    certificate:
                                                        current,
                                                })
                                            }
                                        />
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}
        </section>
    );
}

function CertificateCard({
    certificate,
    processingId,
    onToggleState,
    onDelete,
}: {
    certificate: MdtCertificate;
    processingId: number | null;
    onToggleState: (certificate: MdtCertificate) => void;
    onDelete: (certificate: MdtCertificate) => void;
}) {
    const fileUrl = buildCertificateFileUrl(
        certificate.file_url,
    );

    const processing = processingId === certificate.id;
    const anotherActionIsRunning =
        processingId !== null && !processing;

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FileText className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="break-words text-xs font-black text-slate-950 [overflow-wrap:anywhere] sm:text-sm">
                        {certificate.file_name ||
                            "Archivo sin nombre"}
                    </p>

                    <p className="mt-1 text-[11px] font-bold text-slate-600 sm:text-xs">
                        {certificate.id_number ||
                            "Sin identificación"}
                    </p>

                    {fileUrl ? (
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[#172861] hover:underline sm:text-xs"
                        >
                            Ver archivo
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    ) : (
                        <p className="mt-2 text-[11px] font-bold text-slate-400 sm:text-xs">
                            Sin archivo disponible
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <TypeBadge
                    type={
                        certificate.certificate_type || "MDT"
                    }
                />

                <StatusBadge
                    deleted={Boolean(certificate.deleted)}
                />

                <span className="text-[10px] font-bold text-slate-500 sm:text-[11px]">
                    {formatDate(certificate.created_at)}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <StateButton
                    certificate={certificate}
                    processing={processing}
                    disabled={anotherActionIsRunning}
                    onToggleState={onToggleState}
                />

                <button
                    type="button"
                    onClick={() => onDelete(certificate)}
                    disabled={processingId !== null}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-[11px] font-black text-red-700 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                </button>
            </div>
        </article>
    );
}

function CertificateRow({
    certificate,
    processingId,
    onToggleState,
    onDelete,
}: {
    certificate: MdtCertificate;
    processingId: number | null;
    onToggleState: (certificate: MdtCertificate) => void;
    onDelete: (certificate: MdtCertificate) => void;
}) {
    const fileUrl = buildCertificateFileUrl(
        certificate.file_url,
    );

    const processing = processingId === certificate.id;
    const anotherActionIsRunning =
        processingId !== null && !processing;

    return (
        <tr className="border-b border-slate-100 text-xs last:border-0">
            <td className="max-w-0 px-3 py-3">
                <div className="flex min-w-0 items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                        <p
                            title={certificate.file_name}
                            className="truncate font-black text-slate-950"
                        >
                            {certificate.file_name ||
                                "Archivo sin nombre"}
                        </p>

                        {fileUrl ? (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-[#172861] hover:underline"
                            >
                                Ver archivo
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        ) : (
                            <p className="mt-1 text-[10px] font-bold text-slate-400">
                                Sin archivo disponible
                            </p>
                        )}
                    </div>
                </div>
            </td>

            <td className="px-2 py-3">
                <span className="block truncate font-bold text-slate-700">
                    {certificate.id_number ||
                        "Sin identificación"}
                </span>
            </td>

            <td className="px-2 py-3">
                <TypeBadge
                    type={
                        certificate.certificate_type || "MDT"
                    }
                />
            </td>

            <td className="px-2 py-3">
                <StatusBadge
                    deleted={Boolean(certificate.deleted)}
                />
            </td>

            <td className="px-2 py-3 text-[11px] font-bold leading-4 text-slate-600">
                {formatDate(certificate.created_at)}
            </td>

            <td className="px-3 py-3">
                <div className="flex justify-end gap-2">
                    <StateButton
                        certificate={certificate}
                        processing={processing}
                        disabled={anotherActionIsRunning}
                        onToggleState={onToggleState}
                    />

                    <button
                        type="button"
                        onClick={() => onDelete(certificate)}
                        disabled={processingId !== null}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-red-50 px-2.5 text-[10px] font-black text-red-700 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    );
}

function StateButton({
    certificate,
    processing,
    disabled,
    onToggleState,
}: {
    certificate: MdtCertificate;
    processing: boolean;
    disabled: boolean;
    onToggleState: (certificate: MdtCertificate) => void;
}) {
    const restoring = Boolean(certificate.deleted);

    return (
        <button
            type="button"
            onClick={() => onToggleState(certificate)}
            disabled={disabled || processing}
            className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-[10px] font-black transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:rounded-xl sm:text-[11px] ${
                restoring
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
        >
            {processing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : restoring ? (
                <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
                <ArchiveX className="h-3.5 w-3.5" />
            )}

            {restoring ? "Restaurar" : "Ocultar"}
        </button>
    );
}

function StatusBadge({
    deleted,
}: {
    deleted: boolean;
}) {
    return (
        <span
            className={`inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-black ${
                deleted
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
            }`}
        >
            {deleted ? "Oculto" : "Activo"}
        </span>
    );
}

function TypeBadge({
    type,
}: {
    type: string;
}) {
    return (
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
            {type}
        </span>
    );
}

export default CertificatesTable;
