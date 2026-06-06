import {
    ExternalLink,
    Loader2,
    Pencil,
    UploadCloud,
    X,
} from "lucide-react";
import type { MdtCertificatesTeacherState } from "../hook";
import { CERTIFICATE_TYPES } from "../constants";
import { buildCertificateFileUrl } from "../utils";

type EditModalProps = {
    certs: MdtCertificatesTeacherState;
};

export function EditModal({
    certs,
}: EditModalProps) {
    if (!certs.editModal) return null;

    const currentFileUrl = buildCertificateFileUrl(
        certs.editModal.certificate.file_url,
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <form
                onSubmit={certs.updateCertificate}
                className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[28px]"
            >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100 sm:text-xs">
                            Certificados MDT
                        </p>

                        <h2 className="mt-1 text-lg font-black sm:text-xl">
                            Editar certificado
                        </h2>

                        <p className="mt-1 hidden text-xs font-semibold leading-5 text-blue-50 sm:block sm:text-sm sm:leading-6">
                            Actualiza la identificación, el tipo o reemplaza el archivo.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={certs.closeEditModal}
                        disabled={certs.editing}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:rounded-2xl"
                        aria-label="Cerrar modal"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 lg:p-6">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 sm:text-xs">
                            Archivo actual
                        </p>

                        <p
                            title={certs.editModal.certificate.file_name}
                            className="mt-1 truncate text-xs font-black text-blue-950 sm:text-sm"
                        >
                            {certs.editModal.certificate.file_name ||
                                "Archivo sin nombre"}
                        </p>

                        {currentFileUrl ? (
                            <a
                                href={currentFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-black text-[#172861] hover:underline sm:text-sm"
                            >
                                Ver archivo actual
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-xs font-black text-slate-700 sm:text-sm">
                                Identificación
                            </span>

                            <input
                                value={certs.editModal.idNumber}
                                onChange={(event) =>
                                    certs.setEditModal(
                                        (current) => {
                                            if (!current) return current;

                                            return {
                                                ...current,
                                                idNumber:
                                                    event.target.value,
                                            };
                                        },
                                    )
                                }
                                disabled={certs.editing}
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-black text-slate-700 sm:text-sm">
                                Tipo de certificado
                            </span>

                            <select
                                value={
                                    certs.editModal
                                        .certificateType
                                }
                                onChange={(event) =>
                                    certs.setEditModal(
                                        (current) => {
                                            if (!current) return current;

                                            return {
                                                ...current,
                                                certificateType:
                                                    event.target.value,
                                            };
                                        },
                                    )
                                }
                                disabled={certs.editing}
                                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                            >
                                {CERTIFICATE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center sm:rounded-2xl sm:p-5">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-11 sm:w-11 sm:rounded-2xl">
                            <UploadCloud className="h-5 w-5" />
                        </div>

                        <h3 className="mt-2 text-sm font-black text-slate-950 sm:text-base">
                            Reemplazar archivo
                        </h3>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                            Es opcional. Selecciona un archivo únicamente si deseas reemplazar el actual.
                        </p>

                        <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm">
                            <UploadCloud className="h-4 w-4" />
                            Elegir nuevo archivo

                            <input
                                type="file"
                                accept={certs.acceptedFiles}
                                onChange={certs.selectEditFile}
                                disabled={certs.editing}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {certs.editModal.file ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-950 sm:text-sm">
                                        Nuevo archivo
                                    </p>

                                    <p className="mt-1 truncate text-xs font-bold text-slate-600 sm:text-sm">
                                        {certs.editModal.file.name}
                                    </p>

                                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                        {Math.max(
                                            certs.editModal.file.size /
                                                1024,
                                            1,
                                        ).toFixed(0)}{" "}
                                        KB
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        certs.setEditModal(
                                            (current) => {
                                                if (!current) return current;

                                                return {
                                                    ...current,
                                                    file: null,
                                                };
                                            },
                                        )
                                    }
                                    disabled={certs.editing}
                                    className="shrink-0 text-xs font-black text-red-600 hover:underline disabled:opacity-60"
                                >
                                    Quitar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:gap-3 sm:px-5 lg:px-6">
                    <button
                        type="button"
                        onClick={certs.closeEditModal}
                        disabled={certs.editing}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={certs.editing}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {certs.editing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Pencil className="h-4 w-4" />
                        )}

                        Guardar cambios
                    </button>
                </div>
            </form>
        </div>
    );
}
