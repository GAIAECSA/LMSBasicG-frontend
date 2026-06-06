import type { ReactNode } from "react";
import {
    ClipboardCheck,
    Download,
    Eye,
    FileCheck2,
    Loader2,
    MessageSquare,
    RefreshCcw,
    Save,
    Search,
    ShieldCheck,
    UploadCloud,
    UserRoundCheck,
    X,
    XCircle,
} from "lucide-react";
import type { MdtRequiredFilesState } from "../hook";
import {
    DEFAULT_UPLOAD_ACCEPT_TYPES,
    REVIEW_STATUS_OPTIONS,
} from "../constants";
import {
    getBlockAcceptedTypes,
    getBlockTitle,
    getEmptyUploadForm,
    getEnrollmentId,
    getStatusBadgeClass,
    getStatusLabel,
    getSubmissionDate,
    getSubmissionFileName,
    getSubmissionFileUrl,
    getSubmissionId,
    getSubmissionStatus,
    getStudentEmail,
    getStudentName,
    getUploadRowKey,
    formatDate,
    getReviewInitialForm,
} from "../utils";
import type { VerificationSummary } from "../types";

type VerifyModalProps = {
    files: MdtRequiredFilesState;
};

export function VerifyModal({
    files,
}: VerifyModalProps) {
    if (!files.verifyModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-3 lg:p-4">
            <div className="flex max-h-[97dvh] w-full max-w-[1240px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-[28px]">
                <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between lg:px-6">
                    <div className="min-w-0">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 sm:px-3 sm:text-xs">
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            Revisión de documentos
                        </span>

                        <h2 className="mt-2 truncate text-lg font-black text-slate-950 sm:text-xl lg:text-2xl">
                            {getBlockTitle(files.verifyModal.block)}
                        </h2>

                        <p className="mt-1 hidden max-w-3xl text-xs font-semibold leading-5 text-slate-500 sm:block sm:text-sm sm:leading-6">
                            Revisa los documentos enviados, registra observaciones y actualiza archivos cuando sea necesario.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                void files.loadVerificationData(
                                    files.verifyModal!.block,
                                )
                            }
                            disabled={
                                files.isLoadingVerifications ||
                                Boolean(files.savingReviewId) ||
                                Boolean(files.savingUploadKey)
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                        >
                            {files.isLoadingVerifications ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-4 w-4" />
                            )}

                            Actualizar
                        </button>

                        <button
                            type="button"
                            onClick={files.closeVerifyModal}
                            disabled={
                                files.isLoadingVerifications ||
                                Boolean(files.savingReviewId) ||
                                Boolean(files.savingUploadKey)
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                        >
                            <X className="h-4 w-4" />
                            Cerrar
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
                    <SummaryCards
                        summary={files.verificationSummary}
                    />

                    <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="relative min-w-0 lg:max-w-[620px]">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <input
                                value={files.verificationSearch}
                                onChange={(event) =>
                                    files.setVerificationSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Buscar estudiante, correo, estado o archivo..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:pl-11 sm:pr-4 sm:text-sm"
                            />
                        </div>

                        <span className="inline-flex h-8 w-fit items-center rounded-full bg-slate-100 px-3 text-[11px] font-black text-slate-700 sm:text-xs">
                            Mostrando {files.verificationRows.length}
                        </span>
                    </div>

                    {files.isLoadingVerifications ? (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500 sm:rounded-2xl sm:text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando documentos enviados...
                        </div>
                    ) : null}

                    {!files.isLoadingVerifications &&
                    files.verificationRows.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:rounded-2xl sm:p-8">
                            <UserRoundCheck className="mx-auto h-9 w-9 text-slate-400 sm:h-10 sm:w-10" />

                            <h3 className="mt-3 text-sm font-black text-slate-900 sm:text-base">
                                No hay estudiantes para revisar
                            </h3>

                            <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                                Verifica que el curso tenga estudiantes matriculados y aprobados.
                            </p>
                        </div>
                    ) : null}

                    {!files.isLoadingVerifications &&
                    files.verificationRows.length > 0 ? (
                        <div className="mt-4 grid gap-3">
                            {files.verificationRows.map((row) => (
                                <VerificationCard
                                    key={`${getEnrollmentId(row.enrollment)}-${getSubmissionId(row.submission) || "empty"}`}
                                    files={files}
                                    row={row}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function SummaryCards({
    summary,
}: {
    summary: VerificationSummary;
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <SummaryCard
                icon={<UserRoundCheck className="h-4 w-4" />}
                label="Matriculados"
                value={summary.total}
                className="bg-blue-50 text-blue-700"
            />

            <SummaryCard
                icon={<FileCheck2 className="h-4 w-4" />}
                label="Subidos"
                value={summary.submitted}
                className="bg-emerald-50 text-emerald-700"
            />

            <SummaryCard
                icon={<XCircle className="h-4 w-4" />}
                label="Pendientes"
                value={summary.pending}
                className="bg-amber-50 text-amber-700"
            />

            <SummaryCard
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Aprobados"
                value={summary.approved}
                className="bg-emerald-50 text-emerald-700"
            />
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    className,
}: {
    icon: ReactNode;
    label: string;
    value: number;
    className: string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-3 sm:rounded-2xl sm:px-4">
            <div className="flex items-center gap-2">
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${className}`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">
                        {label}
                    </p>

                    <p className="text-base font-black text-slate-950 sm:text-lg">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function VerificationCard({
    files,
    row,
}: {
    files: MdtRequiredFilesState;
    row: MdtRequiredFilesState["verificationRows"][number];
}) {
    if (!files.verifyModal) return null;

    const submissionId = getSubmissionId(row.submission);
    const fileUrl = getSubmissionFileUrl(row.submission);
    const fileName = getSubmissionFileName(row.submission);
    const status = getSubmissionStatus(row.submission);

    const currentForm = submissionId
        ? files.reviewForms[String(submissionId)] ??
          getReviewInitialForm(row.submission)
        : getReviewInitialForm(null);

    const uploadRowKey = getUploadRowKey(row);

    const uploadForm =
        files.uploadForms[uploadRowKey] ??
        getEmptyUploadForm();

    const isSavingReview =
        files.savingReviewId === submissionId;

    const isSavingUpload =
        files.savingUploadKey === uploadRowKey;

    const hasAnotherUploadSaving = Boolean(
        files.savingUploadKey &&
            files.savingUploadKey !== uploadRowKey,
    );

    const uploadAcceptTypes =
        getBlockAcceptedTypes(files.verifyModal.block) ||
        DEFAULT_UPLOAD_ACCEPT_TYPES;

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="grid gap-3 min-[1080px]:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] min-[1080px]:items-start">
                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 sm:h-11 sm:w-11 sm:rounded-2xl">
                            <UserRoundCheck className="h-5 w-5" />
                        </div>

                        <div className="min-w-[160px] flex-1">
                            <h3 className="truncate text-sm font-black text-slate-950 sm:text-base">
                                {getStudentName(row.enrollment)}
                            </h3>

                            <p className="truncate text-[11px] font-bold text-slate-500 sm:text-xs">
                                {getStudentEmail(row.enrollment)}
                            </p>
                        </div>

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 sm:text-xs">
                            Matrícula #{getEnrollmentId(row.enrollment) || "-"}
                        </span>

                        <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black sm:text-xs ${getStatusBadgeClass(status)}`}
                        >
                            {getStatusLabel(status)}
                        </span>
                    </div>

                    {fileUrl ? (
                        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 sm:rounded-2xl sm:px-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 sm:text-xs">
                                Documento subido
                            </p>

                            <p className="mt-1 truncate text-xs font-black text-emerald-950 sm:text-sm">
                                {fileName || "Archivo del estudiante"}
                            </p>

                            <p className="mt-1 text-[10px] font-bold text-emerald-700 sm:text-xs">
                                Enviado: {formatDate(getSubmissionDate(row.submission))}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 text-[11px] font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 sm:h-9 sm:rounded-xl sm:px-3 sm:text-xs"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Ver
                                </a>

                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 text-[11px] font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 sm:h-9 sm:rounded-xl sm:px-3 sm:text-xs"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Descargar
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 sm:rounded-2xl sm:px-4">
                            <div className="flex items-center gap-2 text-xs font-black leading-5 text-slate-500 sm:text-sm">
                                <XCircle className="h-4 w-4 shrink-0" />
                                El estudiante aún no ha subido este documento.
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-500" />

                        <p className="text-xs font-black text-slate-900 sm:text-sm">
                            Revisión docente
                        </p>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_92px]">
                        <label className="block min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                                Estado
                            </span>

                            <select
                                value={currentForm.status}
                                disabled={!row.submission || isSavingReview}
                                onChange={(event) => {
                                    if (!row.submission) return;

                                    files.updateReviewForm(row.submission, {
                                        status: event.target.value,
                                    });
                                }}
                                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                                {REVIEW_STATUS_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                                Nota
                            </span>

                            <input
                                value={currentForm.score}
                                disabled={!row.submission || isSavingReview}
                                type="number"
                                min="0"
                                max="10"
                                step="0.01"
                                onChange={(event) => {
                                    if (!row.submission) return;

                                    files.updateReviewForm(row.submission, {
                                        score: event.target.value,
                                    });
                                }}
                                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                        </label>
                    </div>

                    <label className="mt-2 block">
                        <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Observación
                        </span>

                        <textarea
                            value={currentForm.feedback}
                            disabled={!row.submission || isSavingReview}
                            rows={2}
                            onChange={(event) => {
                                if (!row.submission) return;

                                files.updateReviewForm(row.submission, {
                                    feedback: event.target.value,
                                });
                            }}
                            placeholder="Agrega una observación..."
                            className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </label>

                    <details className="mt-2 rounded-xl border border-dashed border-slate-300 bg-white p-2.5">
                        <summary className="cursor-pointer text-[11px] font-black text-slate-600 sm:text-xs">
                            {fileUrl
                                ? "Actualizar archivo"
                                : "Subir archivo faltante"}
                        </summary>

                        <div className="mt-2 grid gap-2">
                            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-100 sm:rounded-xl sm:px-3 sm:text-xs">
                                <UploadCloud className="h-3.5 w-3.5" />
                                Seleccionar archivo

                                <input
                                    type="file"
                                    accept={uploadAcceptTypes}
                                    disabled={
                                        isSavingUpload ||
                                        hasAnotherUploadSaving ||
                                        Boolean(files.savingReviewId)
                                    }
                                    onChange={(event) => {
                                        const file =
                                            event.target.files?.[0] ?? null;

                                        files.updateUploadForm(row, {
                                            file,
                                        });

                                        event.target.value = "";
                                    }}
                                    className="hidden"
                                />
                            </label>

                            {uploadForm.file ? (
                                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-[11px] font-black text-slate-800 sm:text-xs">
                                                {uploadForm.file.name}
                                            </p>

                                            <p className="text-[10px] font-semibold text-slate-500">
                                                {Math.max(
                                                    uploadForm.file.size / 1024,
                                                    1,
                                                ).toFixed(0)}{" "}
                                                KB
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                files.updateUploadForm(row, {
                                                    file: null,
                                                })
                                            }
                                            disabled={isSavingUpload}
                                            className="shrink-0 text-[10px] font-black text-red-600 hover:underline disabled:opacity-60"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <button
                                type="button"
                                onClick={() =>
                                    void files.handleUploadStudentFile(row)
                                }
                                disabled={
                                    !uploadForm.file ||
                                    isSavingUpload ||
                                    hasAnotherUploadSaving ||
                                    Boolean(files.savingReviewId)
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-black text-white transition hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-xl sm:px-3 sm:text-xs"
                            >
                                {isSavingUpload ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <UploadCloud className="h-3.5 w-3.5" />
                                )}

                                {fileUrl
                                    ? "Actualizar archivo"
                                    : "Subir archivo"}
                            </button>
                        </div>
                    </details>

                    <button
                        type="button"
                        onClick={() =>
                            void files.handleSaveReview(row.submission)
                        }
                        disabled={
                            !row.submission ||
                            isSavingReview ||
                            Boolean(files.savingReviewId) ||
                            Boolean(files.savingUploadKey)
                        }
                        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {isSavingReview ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        Guardar revisión
                    </button>
                </div>
            </div>
        </article>
    );
}
