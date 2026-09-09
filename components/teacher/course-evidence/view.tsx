"use client";

import {
    AlertTriangle,
    ArrowLeftRight,
    Loader2,
    RefreshCw,
} from "lucide-react";

import {
    useRouter,
} from "next/navigation";

import {
    useMdtEvidence,
} from "./hook";

import type {
    MdtEvidenceViewProps,
} from "./types";

import {
    EvidenceCard,
} from "./ui/EvidenceCard";

import {
    EvidenceEmpty,
} from "./ui/EvidenceEmpty";

import {
    EvidenceHero,
} from "./ui/EvidenceHero";

export function MdtEvidenceView({
    courseId,
}: MdtEvidenceViewProps) {
    const router =
        useRouter();

    const evidence =
        useMdtEvidence(
            courseId,
        );

    /* =====================================================
       CAMBIAR CURSO
    ===================================================== */

    function handleChangeCourse() {
        if (
            evidence.isAdminRoute
        ) {
            router.push(
                "/admin/mdt-evidence",
            );

            return;
        }

        router.push(
            "/teacher/courses",
        );
    }

    /* =====================================================
       CARGANDO
    ===================================================== */

    if (
        evidence.loading
    ) {
        return (
            <section className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
                <div className="mx-auto flex min-h-[400px] max-w-[1500px] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#172861]" />

                        <p className="mt-3 text-sm font-bold text-slate-500">
                            Cargando evidencias MDT...
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    /* =====================================================
       VISTA
    ===================================================== */

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-4 pb-8 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <div className="mx-auto w-full max-w-[1500px] space-y-4">

                {/* =========================================
                    HERO
                ========================================= */}

                <EvidenceHero
                    total={
                        evidence.totalCount
                    }
                    submitted={
                        evidence.submittedCount
                    }
                    approved={
                        evidence.approvedCount
                    }
                />

                {/* =========================================
                    CABECERA
                ========================================= */}

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        {/* INFORMACIÓN */}

                        <div>
                            <h2 className="text-lg font-black text-slate-950">
                                Evidencias requeridas
                            </h2>

                            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                                Adjunta los archivos
                                solicitados para este
                                curso.
                            </p>
                        </div>

                        {/* BOTONES */}

                        <div className="flex flex-wrap items-center gap-2">

                            {/* =============================
                                CAMBIAR CURSO
                            ============================= */}

                            {evidence.isAdminRoute ? (
                                <button
                                    type="button"
                                    onClick={
                                        handleChangeCourse
                                    }
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#203674] active:scale-[0.98]"
                                >
                                    <ArrowLeftRight className="h-4 w-4" />

                                    Cambiar curso
                                </button>
                            ) : null}

                            {/* =============================
                                ACTUALIZAR
                            ============================= */}

                            <button
                                type="button"
                                onClick={() => {
                                    void evidence.refresh();
                                }}
                                disabled={
                                    evidence.refreshing
                                }
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${evidence.refreshing
                                        ? "animate-spin"
                                        : ""
                                        }`}
                                />

                                {evidence.refreshing
                                    ? "Actualizando..."
                                    : "Actualizar"}
                            </button>
                        </div>
                    </div>
                </section>

                {/* =========================================
                    ERROR
                ========================================= */}

                {evidence.error ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                        <p className="text-sm font-semibold">
                            {
                                evidence.error
                            }
                        </p>
                    </div>
                ) : null}

                {/* =========================================
                    EVIDENCIAS
                ========================================= */}

                {evidence.items.length ===
                    0 ? (
                    <EvidenceEmpty />
                ) : (
                    <div className="space-y-3">
                        {evidence.items.map(
                            (
                                item,
                            ) => (
                                <EvidenceCard
                                    key={item.block.id}
                                    item={item}
                                    canUpload={
                                        evidence.canUpload
                                    }
                                    uploading={
                                        evidence.uploadingBlockId ===
                                        item.block.id
                                    }
                                    onUpload={
                                        evidence.handleUpload
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

export default MdtEvidenceView;