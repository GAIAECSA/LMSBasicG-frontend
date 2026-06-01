import {
    ClipboardList,
    Eye,
    FileCheck2,
    Loader2,
    RotateCcw,
    UserRound,
    XCircle,
} from "lucide-react";
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
        return (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#172861]">
                    <ClipboardList className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-950">
                    No hay respuestas de actividades para este curso
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Cuando los estudiantes respondan pruebas o tareas del curso,
                    aparecerá el resumen por matrícula.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                Estudiante
                            </th>
                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                Actividades
                            </th>
                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                Promedio
                            </th>
                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                Aprobadas
                            </th>
                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                No aprobadas
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                Última respuesta
                            </th>
                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                Certificado
                            </th>
                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                Acción
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedGroups.map((group) => (
                            <tr
                                key={`${group.enrollmentId}-${group.userId}`}
                                className="transition hover:bg-blue-50/40"
                            >
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-white">
                                            <UserRound className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="font-bold text-slate-950">
                                                {group.studentName}
                                            </p>
                                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                Matrícula #
                                                {group.enrollmentId || "N/D"}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-5 py-4 text-center">
                                    <span className="font-bold text-slate-950">
                                        {group.rows.length}
                                    </span>
                                </td>

                                <td className="px-5 py-4 text-center">
                                    {getCertificateFinalGrade(
                                        group.certificate,
                                    ) ? (
                                        <span className="inline-flex rounded-xl bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                                            {getCertificateFinalGrade(
                                                group.certificate,
                                            )}
                                        </span>
                                    ) : (
                                        <span className="inline-flex rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                            {group.averageScore}
                                        </span>
                                    )}
                                </td>

                                <td className="px-5 py-4 text-center">
                                    <span className="inline-flex rounded-xl bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                                        {group.passedCount}
                                    </span>
                                </td>

                                <td className="px-5 py-4 text-center">
                                    <span className="inline-flex rounded-xl bg-red-50 px-3 py-1 text-sm font-bold text-red-700">
                                        {group.failedCount}
                                    </span>
                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                    {formatDate(group.lastDate)}
                                </td>

                                <td className="px-5 py-4 text-center">
                                    {group.certificate ? (
                                        <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                            <FileCheck2 className="h-4 w-4" />
                                            Generado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                            <XCircle className="h-4 w-4" />
                                            No generado
                                        </span>
                                    )}
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openGroupModal(group)
                                            }
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white transition hover:bg-[#0B163F]"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Ver resumen
                                        </button>

                                        {group.certificate
                                            ?.certificate_code ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openCertificateByRoute(
                                                        group.certificate,
                                                    )
                                                }
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Ver certificado
                                            </button>
                                        ) : null}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleGenerateOrReissueCertificate(
                                                    group,
                                                )
                                            }
                                            disabled={
                                                generatingCertificateUserId ===
                                                group.userId ||
                                                !isValidGroupForCertificate(
                                                    group,
                                                )
                                            }
                                            title={
                                                group.failedCount > 0
                                                    ? "El estudiante tiene actividades no aprobadas."
                                                    : undefined
                                            }
                                            className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${group.certificate
                                                    ? "bg-orange-500 hover:bg-orange-600"
                                                    : "bg-emerald-600 hover:bg-emerald-700"
                                                }`}
                                        >
                                            {generatingCertificateUserId ===
                                                group.userId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : group.certificate ? (
                                                <RotateCcw className="h-4 w-4" />
                                            ) : (
                                                <FileCheck2 className="h-4 w-4" />
                                            )}

                                            {generatingCertificateUserId ===
                                                group.userId
                                                ? "Procesando..."
                                                : group.certificate
                                                    ? "Reemitir"
                                                    : "Generar"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
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