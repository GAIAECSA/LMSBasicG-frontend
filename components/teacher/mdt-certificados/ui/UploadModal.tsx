import {
    FolderUp,
    Loader2,
    RefreshCcw,
    UploadCloud,
    X,
} from "lucide-react";
import type { MdtCertificatesTeacherState } from "../hook";
import { CERTIFICATE_TYPES } from "../constants";
import {
    getFileKey,
    getIdNumberFromFileName,
    getStudentName,
} from "../utils";

type UploadModalProps = {
    certs: MdtCertificatesTeacherState;
};

export function UploadModal({
    certs,
}: UploadModalProps) {
    if (!certs.uploadModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <form
                onSubmit={certs.submitUpload}
                className="flex max-h-[97dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[93vh] sm:rounded-[28px]"
            >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100 sm:text-xs">
                            Certificados MDT
                        </p>

                        <h2 className="mt-1 text-lg font-black sm:text-xl">
                            Subir certificado
                        </h2>

                        <p className="mt-1 hidden text-xs font-semibold leading-5 text-blue-50 sm:block sm:text-sm sm:leading-6">
                            Registra uno o varios certificados para el curso seleccionado.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={certs.closeUploadModal}
                        disabled={certs.uploading}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                        aria-label="Cerrar modal"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 lg:p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-xs font-black text-slate-700 sm:text-sm">
                                Tipo de certificado
                            </span>

                            <select
                                value={certs.certificateType}
                                onChange={(event) =>
                                    certs.setCertificateType(
                                        event.target.value,
                                    )
                                }
                                disabled={certs.uploading}
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                            >
                                {CERTIFICATE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {certs.lockCourse ? (
                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 sm:text-xs">
                                    Curso
                                </p>

                                <p className="mt-1 text-base font-black text-blue-950 sm:text-lg">
                                    #{certs.numericCourseId || "-"}
                                </p>
                            </div>
                        ) : (
                            <label className="block">
                                <span className="text-xs font-black text-slate-700 sm:text-sm">
                                    ID del curso
                                </span>

                                <input
                                    value={certs.courseId}
                                    onChange={(event) =>
                                        certs.setCourseId(
                                            event.target.value,
                                        )
                                    }
                                    disabled={certs.uploading}
                                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                />
                            </label>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                certs.changeUploadType("individual")
                            }
                            disabled={certs.uploading}
                            className={`rounded-xl border px-3 py-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-4 ${
                                certs.uploadType === "individual"
                                    ? "border-blue-200 bg-blue-50 text-blue-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            <p className="text-xs font-black sm:text-sm">
                                Carga individual
                            </p>

                            <p className="mt-1 hidden text-xs font-semibold leading-5 sm:block">
                                Selecciona un estudiante y sube su certificado.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                certs.changeUploadType("bulk")
                            }
                            disabled={certs.uploading}
                            className={`rounded-xl border px-3 py-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-4 ${
                                certs.uploadType === "bulk"
                                    ? "border-blue-200 bg-blue-50 text-blue-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            <p className="text-xs font-black sm:text-sm">
                                Carga masiva
                            </p>

                            <p className="mt-1 hidden text-xs font-semibold leading-5 sm:block">
                                Sube varios archivos nombrados con la cédula.
                            </p>
                        </button>
                    </div>

                    {certs.uploadType === "individual" ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                <label className="block min-w-0">
                                    <span className="text-xs font-black text-slate-700 sm:text-sm">
                                        Estudiante del curso
                                    </span>

                                    <select
                                        value={
                                            certs.selectedEnrollmentId
                                        }
                                        onChange={(event) =>
                                            certs.setSelectedEnrollmentId(
                                                event.target.value,
                                            )
                                        }
                                        disabled={
                                            certs.uploading ||
                                            certs.loadingStudents
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                    >
                                        <option value="">
                                            Selecciona un estudiante
                                        </option>

                                        {certs.students.map((student) => (
                                            <option
                                                key={`${student.enrollmentId}-${student.userId}`}
                                                value={student.enrollmentId}
                                            >
                                                {getStudentName(student)} -{" "}
                                                {student.idnumber ||
                                                    "Sin identificación"}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void certs.loadStudents()
                                    }
                                    disabled={
                                        certs.loadingStudents
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                                >
                                    {certs.loadingStudents ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCcw className="h-4 w-4" />
                                    )}

                                    Actualizar
                                </button>
                            </div>

                            {certs.selectedStudent ? (
                                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 sm:text-xs">
                                        Identificación
                                    </p>

                                    <p className="mt-1 text-xs font-black text-blue-950 sm:text-sm">
                                        {certs.selectedStudent.idnumber ||
                                            "Sin identificación"}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-semibold leading-5 text-blue-900 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            Cada archivo debe tener el número de cédula en el nombre. Ejemplo:{" "}
                            <strong>1312345678.pdf</strong>.
                        </div>
                    )}

                    <div
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={certs.dropFiles}
                        className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center sm:rounded-2xl sm:p-5"
                    >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-11 sm:w-11 sm:rounded-2xl">
                            {certs.uploadType === "bulk" ? (
                                <FolderUp className="h-5 w-5" />
                            ) : (
                                <UploadCloud className="h-5 w-5" />
                            )}
                        </div>

                        <h3 className="mt-2 text-sm font-black text-slate-950 sm:text-base">
                            Arrastra tus archivos aquí
                        </h3>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                            Formatos permitidos: PDF, JPG, PNG y WEBP.
                        </p>

                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    certs.filesInputRef.current?.click()
                                }
                                disabled={certs.uploading}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                            >
                                <UploadCloud className="h-4 w-4" />
                                Elegir archivo
                            </button>

                            {certs.uploadType === "bulk" ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        certs.multipleFilesInputRef.current?.click()
                                    }
                                    disabled={certs.uploading}
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                                >
                                    <FolderUp className="h-4 w-4" />
                                    Elegir varios
                                </button>
                            ) : null}
                        </div>

                        <input
                            ref={certs.filesInputRef}
                            type="file"
                            accept={certs.acceptedFiles}
                            multiple={certs.uploadType === "bulk"}
                            onChange={certs.selectFiles}
                            className="hidden"
                        />

                        <input
                            ref={certs.multipleFilesInputRef}
                            type="file"
                            accept={certs.acceptedFiles}
                            multiple
                            onChange={certs.selectFiles}
                            className="hidden"
                        />
                    </div>

                    {certs.selectedFiles.length > 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-black text-slate-950 sm:text-sm">
                                    Archivos capturados
                                </p>

                                <button
                                    type="button"
                                    onClick={certs.clearFiles}
                                    disabled={certs.uploading}
                                    className="text-[11px] font-black text-red-600 hover:underline disabled:opacity-60 sm:text-xs"
                                >
                                    Limpiar todo
                                </button>
                            </div>

                            <div className="mt-2 max-h-[160px] space-y-2 overflow-y-auto pr-1">
                                {certs.selectedFiles.map((currentFile) => (
                                    <div
                                        key={getFileKey(currentFile)}
                                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 sm:rounded-xl sm:px-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-[11px] font-black text-slate-800 sm:text-xs">
                                                {currentFile.name}
                                            </p>

                                            <p className="text-[10px] font-semibold text-slate-500">
                                                {Math.max(
                                                    currentFile.size / 1024,
                                                    1,
                                                ).toFixed(0)}{" "}
                                                KB
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1.5">
                                            {certs.uploadType === "bulk" ? (
                                                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                                                    {getIdNumberFromFileName(
                                                        currentFile.name,
                                                    ) || "Sin cédula"}
                                                </span>
                                            ) : null}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    certs.removeCapturedFile(
                                                        currentFile,
                                                    )
                                                }
                                                disabled={certs.uploading}
                                                className="inline-flex h-7 items-center justify-center rounded-lg bg-red-50 px-2 text-[10px] font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:gap-3 sm:px-5 lg:px-6">
                    <button
                        type="button"
                        onClick={certs.closeUploadModal}
                        disabled={certs.uploading}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={certs.uploading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {certs.uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="h-4 w-4" />
                        )}

                        Subir certificado
                    </button>
                </div>
            </form>
        </div>
    );
}
