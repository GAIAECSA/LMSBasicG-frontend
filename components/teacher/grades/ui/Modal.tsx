import type { Dispatch, SetStateAction } from "react";
import {
    Eye,
    FileCheck2,
    Loader2,
    RotateCcw,
    Save,
    X,
} from "lucide-react";
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
import { Activity, ActivityContent } from "./Activity";

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

    const group = groupModal.group;
    const processingCertificate =
        generatingCertificateUserId === group.userId;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-3xl">
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6 [@media(max-height:760px)]:py-4">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:text-xs sm:tracking-[0.25em]">
                                Resumen
                            </p>

                            <h2 className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-xl">
                                Resumen de actividades
                            </h2>

                            <p className="mt-1 break-words text-xs font-semibold leading-5 text-blue-50 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
                                {group.studentName} · Matrícula #
                                {group.enrollmentId || "N/D"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeGroupModal}
                            disabled={Boolean(
                                savingResponseId ||
                                    generatingCertificateUserId,
                            )}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 [@media(max-height:760px)]:p-4">
                    {modalError ? (
                        <div className="mb-3 break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700 [overflow-wrap:anywhere] sm:mb-4 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            {modalError}
                        </div>
                    ) : null}

                    <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
                        <ModalMetric
                            label="Actividades"
                            value={group.rows.length}
                        />

                        <ModalMetric
                            label="Promedio certificado"
                            value={getCertificateFinalGradeLabel(
                                group.certificate,
                            )}
                            active={Boolean(
                                getCertificateFinalGrade(group.certificate),
                            )}
                        />

                        <ModalMetric
                            label="Aprobadas"
                            value={group.passedCount}
                            color="green"
                        />

                        <ModalMetric
                            label="No aprobadas"
                            value={group.failedCount}
                            color="red"
                        />

                        <ModalMetric
                            label="Certificado"
                            value={group.certificate ? "Generado" : "No generado"}
                            color={group.certificate ? "green" : "gray"}
                        />
                    </div>

                    <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mb-4 sm:rounded-2xl sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-950 sm:text-sm">
                                Certificado del estudiante
                            </p>

                            <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs sm:leading-5">
                                Se genera usando la plantilla guardada del curso
                                y el promedio final devuelto por el certificado.
                            </p>
                        </div>

                        <div className="grid shrink-0 grid-cols-1 gap-2 xs:grid-cols-2 lg:flex">
                            {group.certificate?.certificate_code ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        openCertificateByRoute(group.certificate)
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] sm:h-10 sm:px-4 sm:text-xs"
                                >
                                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Ver certificado
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={() =>
                                    void handleGenerateOrReissueCertificate(group)
                                }
                                disabled={
                                    processingCertificate ||
                                    !isValidGroupForCertificate(group)
                                }
                                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-bold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-xs ${
                                    group.certificate
                                        ? "bg-orange-500 hover:bg-orange-600"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                            >
                                {processingCertificate ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                                ) : group.certificate ? (
                                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                ) : (
                                    <FileCheck2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}

                                {processingCertificate
                                    ? "Procesando..."
                                    : group.certificate
                                      ? "Reemitir certificado"
                                      : "Generar certificado"}
                            </button>
                        </div>
                    </div>

                    <div className="hidden overflow-hidden rounded-xl border border-slate-200 lg:block lg:rounded-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] table-fixed divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="w-[32%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                            Actividad
                                        </th>
                                        <th className="w-[11%] px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                            Nota
                                        </th>
                                        <th className="w-[11%] px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                            Mínimo
                                        </th>
                                        <th className="w-[16%] px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                            Estado
                                        </th>
                                        <th className="w-[14%] px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                            Editar nota
                                        </th>
                                        <th className="w-[16%] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600 xl:px-4">
                                            Acción
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {group.rows.map((row) => (
                                        <DesktopActivityRow
                                            key={`${row.kind}-${row.response.id}`}
                                            row={row}
                                            savingResponseId={savingResponseId}
                                            editScores={editScores}
                                            editPassed={editPassed}
                                            setEditScores={setEditScores}
                                            setEditPassed={setEditPassed}
                                            setModalError={setModalError}
                                            handleSaveGrade={handleSaveGrade}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid gap-3 lg:hidden">
                        {group.rows.map((row) => (
                            <MobileActivityCard
                                key={`${row.kind}-${row.response.id}`}
                                row={row}
                                savingResponseId={savingResponseId}
                                editScores={editScores}
                                editPassed={editPassed}
                                setEditScores={setEditScores}
                                setEditPassed={setEditPassed}
                                setModalError={setModalError}
                                handleSaveGrade={handleSaveGrade}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DesktopActivityRow({
    row,
    savingResponseId,
    editScores,
    editPassed,
    setEditScores,
    setEditPassed,
    setModalError,
    handleSaveGrade,
}: ActivityEditorProps) {
    const details = getActivityEditorDetails(row);
    const saving = savingResponseId === details.responseId;

    return (
        <tr className="align-top transition hover:bg-blue-50/40">
            <Activity row={row} />

            <td className="px-3 py-3 text-center xl:px-4 xl:py-4">
                <ScoreValue value={details.scoreLabel} />
            </td>

            <td className="px-3 py-3 text-center text-xs font-bold text-slate-800 xl:px-4 xl:py-4">
                {details.minimumLabel}
            </td>

            <td className="px-3 py-3 text-center xl:px-4 xl:py-4">
                <PassedCheckbox
                    responseId={details.responseId}
                    checked={editPassed[details.responseId] ?? false}
                    saving={saving}
                    setEditPassed={setEditPassed}
                />
            </td>

            <td className="px-3 py-3 xl:px-4 xl:py-4">
                <ScoreInput
                    responseId={details.responseId}
                    value={editScores[details.responseId] ?? ""}
                    minimumScore={details.minimumScore}
                    saving={saving}
                    setEditScores={setEditScores}
                    setEditPassed={setEditPassed}
                    setModalError={setModalError}
                />
            </td>

            <td className="px-3 py-3 text-right xl:px-4 xl:py-4">
                <SaveGradeButton
                    saving={saving}
                    onClick={() => void handleSaveGrade(row)}
                />
            </td>
        </tr>
    );
}

function MobileActivityCard({
    row,
    savingResponseId,
    editScores,
    editPassed,
    setEditScores,
    setEditPassed,
    setModalError,
    handleSaveGrade,
}: ActivityEditorProps) {
    const details = getActivityEditorDetails(row);
    const saving = savingResponseId === details.responseId;

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
            <ActivityContent row={row} />

            <div className="mt-3 grid grid-cols-2 gap-2">
                <MobileMetric label="Nota" value={details.scoreLabel} />
                <MobileMetric label="Mínimo" value={details.minimumLabel} />
            </div>

            <div className="mt-3 grid gap-2 xs:grid-cols-[minmax(0,1fr)_120px] xs:items-end">
                <div className="min-w-0">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Estado
                    </p>

                    <PassedCheckbox
                        responseId={details.responseId}
                        checked={editPassed[details.responseId] ?? false}
                        saving={saving}
                        setEditPassed={setEditPassed}
                    />
                </div>

                <div className="min-w-0">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Editar nota
                    </p>

                    <ScoreInput
                        responseId={details.responseId}
                        value={editScores[details.responseId] ?? ""}
                        minimumScore={details.minimumScore}
                        saving={saving}
                        setEditScores={setEditScores}
                        setEditPassed={setEditPassed}
                        setModalError={setModalError}
                        fullWidth
                    />
                </div>
            </div>

            <div className="mt-3">
                <SaveGradeButton
                    saving={saving}
                    onClick={() => void handleSaveGrade(row)}
                    fullWidth
                />
            </div>
        </article>
    );
}

type ActivityEditorProps = {
    row: GradeRow;
    savingResponseId: number | null;
    editScores: Record<number, string>;
    editPassed: Record<number, boolean>;
    setEditScores: Dispatch<SetStateAction<Record<number, string>>>;
    setEditPassed: Dispatch<SetStateAction<Record<number, boolean>>>;
    setModalError: (value: string) => void;
    handleSaveGrade: (row: GradeRow) => Promise<void>;
};

function getActivityEditorDetails(row: GradeRow) {
    const questions = row.kind === "quiz" ? getQuizQuestions(row) : [];
    const maxScore = row.kind === "quiz" ? getMaxScore(questions) : 0;
    const minimumScore = getMinimumScore(row);

    return {
        responseId: row.response.id,
        minimumScore,
        scoreLabel: `${getScore(row)}${maxScore > 0 ? ` / ${maxScore}` : ""}`,
        minimumLabel: `${minimumScore}${maxScore > 0 ? ` / ${maxScore}` : ""}`,
    };
}

function ScoreValue({ value }: { value: string }) {
    return (
        <span className="inline-flex rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
            {value}
        </span>
    );
}

function PassedCheckbox({
    responseId,
    checked,
    saving,
    setEditPassed,
}: {
    responseId: number;
    checked: boolean;
    saving: boolean;
    setEditPassed: Dispatch<SetStateAction<Record<number, boolean>>>;
}) {
    return (
        <label className="inline-flex h-9 w-fit items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-bold text-slate-700 sm:h-10 sm:gap-2 sm:px-3 sm:text-xs">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                    setEditPassed((current) => ({
                        ...current,
                        [responseId]: event.target.checked,
                    }))
                }
                className="h-4 w-4 accent-[#172861]"
                disabled={saving}
            />

            {checked ? "Aprobado" : "No aprobado"}
        </label>
    );
}

function ScoreInput({
    responseId,
    value,
    minimumScore,
    saving,
    setEditScores,
    setEditPassed,
    setModalError,
    fullWidth = false,
}: {
    responseId: number;
    value: string;
    minimumScore: number;
    saving: boolean;
    setEditScores: Dispatch<SetStateAction<Record<number, string>>>;
    setEditPassed: Dispatch<SetStateAction<Record<number, boolean>>>;
    setModalError: (value: string) => void;
    fullWidth?: boolean;
}) {
    return (
        <input
            type="number"
            min={0}
            value={value}
            onChange={(event) => {
                const nextValue = event.target.value;

                setEditScores((current) => ({
                    ...current,
                    [responseId]: nextValue,
                }));

                const numericValue = Number(nextValue);

                setEditPassed((current) => ({
                    ...current,
                    [responseId]:
                        Number.isFinite(numericValue) &&
                        numericValue >= minimumScore,
                }));

                setModalError("");
            }}
            className={`h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-10 sm:text-sm ${
                fullWidth ? "w-full" : "w-20 xl:w-24"
            }`}
            disabled={saving}
        />
    );
}

function SaveGradeButton({
    saving,
    onClick,
    fullWidth = false,
}: {
    saving: boolean;
    onClick: () => void;
    fullWidth?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={saving}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-[10px] font-bold text-white transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-xs ${
                fullWidth ? "w-full" : ""
            }`}
        >
            {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
            ) : (
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}

            {saving ? "Guardando..." : "Guardar"}
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
        <div className="rounded-xl bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-xs font-black text-slate-800">{value}</p>
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
        <div className={`rounded-xl border px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3 ${classes[color]}`}>
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.12em]">
                {label}
            </p>

            <p className="mt-1 break-words text-base font-bold leading-5 [overflow-wrap:anywhere] sm:text-lg">
                {value}
            </p>
        </div>
    );
}
