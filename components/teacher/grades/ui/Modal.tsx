import type { Dispatch, SetStateAction } from "react";
import { Eye, FileCheck2, Loader2, RotateCcw, Save, X } from "lucide-react";
import type { EnrollmentGroup, GradeRow, GroupModalState } from "../types";
import {
    getCertificateFinalGrade,
    getCertificateFinalGradeLabel,
    getMaxScore,
    getMinimumScore,
    getQuizQuestions,
    getScore,
    isValidGroupForCertificate,
    openCertificateByRoute,
} from "../utils";
import { Activity } from "./Activity";

type ModalProps = {
    groupModal: GroupModalState | null;
    modalError: string;
    savingResponseId: number | null;
    generatingCertificateUserId: number | null;
    editScores: Record<number, string>;
    editPassed: Record<number, boolean>;
    closeGroupModal: () => void;
    setEditScores: Dispatch<SetStateAction<Record<number, string>>>;
    setEditPassed: Dispatch<SetStateAction<Record<number, boolean>>>;
    setModalError: (value: string) => void;
    handleSaveGrade: (row: GradeRow) => Promise<void>;
    handleGenerateOrReissueCertificate: (
        group: EnrollmentGroup,
    ) => Promise<void>;
};

export function Modal({
    groupModal,
    modalError,
    savingResponseId,
    generatingCertificateUserId,
    editScores,
    editPassed,
    closeGroupModal,
    setEditScores,
    setEditPassed,
    setModalError,
    handleSaveGrade,
    handleGenerateOrReissueCertificate,
}: ModalProps) {
    if (!groupModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                                Resumen
                            </p>

                            <h2 className="mt-2 text-xl font-bold">
                                Resumen de actividades
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-blue-50">
                                {groupModal.group.studentName} · Matrícula #
                                {groupModal.group.enrollmentId || "N/D"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeGroupModal}
                            disabled={Boolean(
                                savingResponseId ||
                                generatingCertificateUserId,
                            )}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-5">
                    {modalError ? (
                        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {modalError}
                        </div>
                    ) : null}

                    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <ModalMetric
                            label="Actividades"
                            value={groupModal.group.rows.length}
                        />

                        <ModalMetric
                            label="Promedio certificado"
                            value={getCertificateFinalGradeLabel(
                                groupModal.group.certificate,
                            )}
                            active={Boolean(
                                getCertificateFinalGrade(
                                    groupModal.group.certificate,
                                ),
                            )}
                        />

                        <ModalMetric
                            label="Aprobadas"
                            value={groupModal.group.passedCount}
                            color="green"
                        />

                        <ModalMetric
                            label="No aprobadas"
                            value={groupModal.group.failedCount}
                            color="red"
                        />

                        <ModalMetric
                            label="Certificado"
                            value={
                                groupModal.group.certificate
                                    ? "Generado"
                                    : "No generado"
                            }
                            color={
                                groupModal.group.certificate ? "green" : "gray"
                            }
                        />
                    </div>

                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-950">
                                Certificado del estudiante
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Se genera usando la plantilla guardada del curso
                                y el promedio final devuelto por el certificado.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            {groupModal.group.certificate?.certificate_code ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        openCertificateByRoute(
                                            groupModal.group.certificate,
                                        )
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Eye className="h-4 w-4" />
                                    Ver certificado
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={() =>
                                    void handleGenerateOrReissueCertificate(
                                        groupModal.group,
                                    )
                                }
                                disabled={
                                    generatingCertificateUserId ===
                                    groupModal.group.userId ||
                                    !isValidGroupForCertificate(
                                        groupModal.group,
                                    )
                                }
                                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${groupModal.group.certificate
                                        ? "bg-orange-500 hover:bg-orange-600"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                    }`}
                            >
                                {generatingCertificateUserId ===
                                    groupModal.group.userId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : groupModal.group.certificate ? (
                                    <RotateCcw className="h-4 w-4" />
                                ) : (
                                    <FileCheck2 className="h-4 w-4" />
                                )}

                                {generatingCertificateUserId ===
                                    groupModal.group.userId
                                    ? "Procesando..."
                                    : groupModal.group.certificate
                                        ? "Reemitir certificado"
                                        : "Generar certificado"}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                            Actividad
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                            Nota
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                            Mínimo
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                            Estado
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                            Editar nota
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                                            Acción
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {groupModal.group.rows.map((row) => {
                                        const questions =
                                            row.kind === "quiz"
                                                ? getQuizQuestions(row)
                                                : [];
                                        const maxScore =
                                            row.kind === "quiz"
                                                ? getMaxScore(questions)
                                                : 0;
                                        const minimumScore =
                                            getMinimumScore(row);
                                        const responseId = row.response.id;

                                        return (
                                            <tr
                                                key={`${row.kind}-${responseId}`}
                                                className="align-top transition hover:bg-blue-50/40"
                                            >
                                                <Activity row={row} />

                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex rounded-xl bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                                                        {getScore(row)}
                                                        {maxScore > 0
                                                            ? ` / ${maxScore}`
                                                            : ""}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-bold text-slate-800">
                                                        {minimumScore}
                                                        {maxScore > 0
                                                            ? ` / ${maxScore}`
                                                            : ""}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                editPassed[
                                                                responseId
                                                                ] ?? false
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                setEditPassed(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [responseId]:
                                                                            event
                                                                                .target
                                                                                .checked,
                                                                    }),
                                                                )
                                                            }
                                                            className="h-4 w-4 accent-[#172861]"
                                                            disabled={
                                                                savingResponseId ===
                                                                responseId
                                                            }
                                                        />

                                                        {editPassed[responseId]
                                                            ? "Aprobado"
                                                            : "No aprobado"}
                                                    </label>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={
                                                            editScores[
                                                            responseId
                                                            ] ?? ""
                                                        }
                                                        onChange={(event) => {
                                                            const value =
                                                                event.target
                                                                    .value;

                                                            setEditScores(
                                                                (current) => ({
                                                                    ...current,
                                                                    [responseId]:
                                                                        value,
                                                                }),
                                                            );

                                                            const numericValue =
                                                                Number(value);

                                                            setEditPassed(
                                                                (current) => ({
                                                                    ...current,
                                                                    [responseId]:
                                                                        Number.isFinite(
                                                                            numericValue,
                                                                        ) &&
                                                                        numericValue >=
                                                                        minimumScore,
                                                                }),
                                                            );

                                                            setModalError("");
                                                        }}
                                                        className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                        disabled={
                                                            savingResponseId ===
                                                            responseId
                                                        }
                                                    />
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleSaveGrade(
                                                                row,
                                                            )
                                                        }
                                                        disabled={
                                                            savingResponseId ===
                                                            responseId
                                                        }
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-bold text-white transition hover:bg-[#0B163F] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {savingResponseId ===
                                                            responseId ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                        Guardar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ModalMetric({
    label,
    value,
    active = false,
    color = "gray",
}: {
    label: string;
    value: string | number;
    active?: boolean;
    color?: "gray" | "green" | "red";
}) {
    const classes = {
        gray: active
            ? "border-blue-100 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-slate-50 text-slate-500",
        green: "border-emerald-100 bg-emerald-50 text-emerald-700",
        red: "border-red-100 bg-red-50 text-red-700",
    };

    return (
        <div className={`rounded-2xl border px-4 py-3 ${classes[color]}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]">
                {label}
            </p>
            <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
    );
}