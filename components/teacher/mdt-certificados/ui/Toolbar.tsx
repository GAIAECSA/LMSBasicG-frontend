import {
    ArrowLeftRight,
    Eye,
    EyeOff,
    Loader2,
    Plus,
    RefreshCcw,
    Search,
} from "lucide-react";
import type { MdtCertificatesTeacherState } from "../hook";

type ToolbarProps = {
    certs: MdtCertificatesTeacherState;
};

export function Toolbar({
    certs,
}: ToolbarProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-950 sm:text-lg">
                        Certificados registrados
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                        Busca, consulta y administra los certificados del curso.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <button
                        type="button"
                        onClick={certs.consultAll}
                        disabled={certs.loading}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-xs font-black text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        {certs.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="h-4 w-4" />
                        )}

                        Actualizar
                    </button>

                    {certs.isAdminRoute ? (
                        <button
                            type="button"
                            onClick={certs.changeAdminCourse}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-xs font-black text-[#172861] shadow-sm transition hover:bg-blue-50 active:scale-[0.97] sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                            Cambiar curso
                        </button>
                    ) : null}

                    <button
                        type="button"
                        onClick={certs.openUploadModal}
                        disabled={
                            certs.loading ||
                            !Number.isFinite(certs.numericCourseId) ||
                            certs.numericCourseId <= 0
                        }
                        className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Subir certificado
                    </button>
                </div>
            </div>

            {!certs.lockCourse ? (
                <label className="mt-3 block lg:max-w-[260px]">
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
                        placeholder="Ejemplo: 1"
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                    />
                </label>
            ) : null}

            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="relative min-w-0 lg:max-w-[620px]">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                        value={certs.searchTerm}
                        onChange={(event) =>
                            certs.setSearchTerm(
                                event.target.value,
                            )
                        }
                        placeholder="Buscar por archivo, identificación o tipo..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:pl-11 sm:pr-4 sm:text-sm"
                    />
                </div>

                <button
                    type="button"
                    onClick={() =>
                        certs.setShowDeleted(
                            (current) => !current,
                        )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                    {certs.showDeleted ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}

                    {certs.showDeleted
                        ? "Ocultar eliminados"
                        : "Ver todos"}
                </button>
            </div>
        </section>
    );
}
