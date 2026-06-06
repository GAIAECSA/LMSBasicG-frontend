import {
    ArchiveRestore,
    ArchiveX,
    Award,
    ExternalLink,
    FileText,
    Loader2,
    Pencil,
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
                <div className="min-w-0 overflow-x-auto overscroll-x-contain">
                    <table className="w-full min-w-[860px] table-fixed text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 sm:text-[10px]">
                                <th className="w-[29%] px-3 py-3">
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
                                        onEdit={
                                            certs.openEditModal
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
            ) : null}
        </section>
    );
}

function CertificateRow({
    certificate,
    processingId,
    onEdit,
    onToggleState,
    onDelete,
}: {
    certificate: MdtCertificate;
    processingId: number | null;
    onEdit: (certificate: MdtCertificate) => void;
    onToggleState: (certificate: MdtCertificate) => void;
    onDelete: (certificate: MdtCertificate) => void;
}) {
    const fileUrl = buildCertificateFileUrl(
        certificate.file_url,
    );

    const processing = processingId === certificate.id;

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
                        certificate.certificate_type ||
                        "MDT"
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

        </tr>
    );
}

function StatusBadge({
    deleted,
}: {
    deleted: boolean;
}) {
    return (
        <span
            className={`inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-black ${deleted
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
