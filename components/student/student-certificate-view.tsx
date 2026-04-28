"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Award,
    BadgeCheck,
    BookOpen,
    CalendarDays,
    Download,
    Eye,
    ExternalLink,
    FileWarning,
    RefreshCw,
    ShieldCheck,
    ShieldX,
    Star,
    Trophy,
    X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
    getCertificatesByUser,
    type Certificate,
} from "@/services/certificates.service";

type CertificateStatusFilter = "all" | "valid" | "invalid";

function toNumericId(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Sin fecha";
    }

    return date.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatGrade(value: string) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return value || "N/A";
    }

    return String(Math.round(numericValue * 100) / 100);
}

function getCertificateStatusLabel(certificate: Certificate) {
    return certificate.is_valid ? "Válido" : "No válido";
}

function getFilteredCertificates(
    certificates: Certificate[],
    filter: CertificateStatusFilter,
) {
    if (filter === "valid") {
        return certificates.filter((certificate) => certificate.is_valid);
    }

    if (filter === "invalid") {
        return certificates.filter((certificate) => !certificate.is_valid);
    }

    return certificates;
}

function getProtectedPdfViewerUrl(url: string) {
    if (!url) return "";

    const cleanUrl = url.split("#")[0];

    return `${cleanUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
}

export function StudentCertificatesView() {
    const { user } = useAuth();

    const numericUserId = toNumericId(user?.id);

    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [selectedCertificate, setSelectedCertificate] =
        useState<Certificate | null>(null);
    const [statusFilter, setStatusFilter] =
        useState<CertificateStatusFilter>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const filteredCertificates = getFilteredCertificates(
        certificates,
        statusFilter,
    );

    const validCertificatesCount = certificates.filter(
        (certificate) => certificate.is_valid,
    ).length;

    const invalidCertificatesCount =
        certificates.length - validCertificatesCount;

    async function loadCertificates() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            if (!numericUserId) {
                setCertificates([]);
                setIsLoading(false);
                return;
            }

            const data = await getCertificatesByUser(numericUserId, {
                onlyValid: false,
            });

            setCertificates(Array.isArray(data) ? data : []);
        } catch (error) {
            setCertificates([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los certificados.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCertificates();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [numericUserId]);

    function openPreviewModal(certificate: Certificate) {
        if (!certificate.file_url) return;

        setSelectedCertificate(certificate);
    }

    function closePreviewModal() {
        setSelectedCertificate(null);
    }

    return (
        <>
            <section className="space-y-6">
                <div className="rounded-[30px] bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-7 text-white shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                <Award className="h-4 w-4" />
                                Área del estudiante
                            </span>

                            <h1 className="mt-4 text-3xl font-black">
                                Mis certificados
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                                Consulta, previsualiza y descarga todos los
                                certificados emitidos a tu nombre dentro de la
                                plataforma.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                    Total
                                </p>

                                <p className="mt-1 text-3xl font-black">
                                    {certificates.length}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                    Válidos
                                </p>

                                <p className="mt-1 text-3xl font-black">
                                    {validCertificatesCount}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                    No válidos
                                </p>

                                <p className="mt-1 text-3xl font-black">
                                    {invalidCertificatesCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={`h-10 rounded-2xl px-4 text-sm font-black transition ${statusFilter === "all"
                                    ? "bg-blue-700 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            Todos
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter("valid")}
                            className={`h-10 rounded-2xl px-4 text-sm font-black transition ${statusFilter === "valid"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            Válidos
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter("invalid")}
                            className={`h-10 rounded-2xl px-4 text-sm font-black transition ${statusFilter === "invalid"
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            No válidos
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadCertificates()}
                        disabled={isLoading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""
                                }`}
                        />
                        Actualizar
                    </button>
                </div>

                {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Certificados emitidos
                            </h2>
                        </div>

                        {!isLoading ? (
                            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                {filteredCertificates.length} resultado
                                {filteredCertificates.length === 1 ? "" : "s"}
                            </span>
                        ) : null}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

                            <p className="mt-4 text-sm font-bold text-slate-600">
                                Cargando certificados...
                            </p>
                        </div>
                    ) : filteredCertificates.length > 0 ? (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCertificates.map((certificate) => {
                                const isValid = certificate.is_valid;

                                return (
                                    <article
                                        key={certificate.id}
                                        className="group overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                                    >
                                        <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-5 py-5 text-white">
                                            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
                                            <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-white/10" />

                                            <div className="relative flex items-start justify-between gap-3">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                                    <Award className="h-7 w-7 text-white" />
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${isValid
                                                            ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-200/30"
                                                            : "bg-red-400/20 text-red-100 ring-1 ring-red-200/30"
                                                        }`}
                                                >
                                                    {isValid ? (
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ShieldX className="h-3.5 w-3.5" />
                                                    )}
                                                    {getCertificateStatusLabel(
                                                        certificate,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="relative mt-5">
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                                                    ¡Felicidades!
                                                </p>

                                                <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight">
                                                    Certificado emitido
                                                </h3>

                                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-blue-100">
                                                    Este documento acredita tu
                                                    participación y aprobación
                                                    dentro del curso.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-5">


                                            <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3">
                                                <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-500">
                                                    Código del certificado
                                                </p>

                                                <p className="mt-1 break-all text-sm font-black text-blue-950">
                                                    {certificate.certificate_code ||
                                                        "Sin código"}
                                                </p>
                                            </div>

                                            <div className="mt-5 grid gap-2">
                                                {certificate.file_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openPreviewModal(
                                                                certificate,
                                                            )
                                                        }
                                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Previsualizar
                                                        certificado
                                                    </button>
                                                ) : (
                                                    <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-700">
                                                        PDF no disponible
                                                    </div>
                                                )}


                                                <Link
                                                    href={`/student/courses/${certificate.course_id}`}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    <BookOpen className="h-4 w-4" />
                                                    Ver curso
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
                                <Trophy className="h-10 w-10" />
                            </div>

                            <h2 className="mt-6 text-2xl font-black text-slate-950">
                                Aún no tienes certificados emitidos
                            </h2>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                                Cuando completes un curso y tu certificado sea
                                generado, aparecerá aquí para que puedas
                                visualizarlo y descargarlo.
                            </p>

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href="/student/courses"
                                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800"
                                >
                                    Ir a mis cursos
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => void loadCertificates()}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Actualizar listado
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {selectedCertificate ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
                    <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-black text-slate-950">
                                Vista previa del certificado
                            </h2>

                            <div className="flex flex-wrap gap-2">
                                {selectedCertificate.file_url ? (
                                    <>
                                        <a
                                            href={selectedCertificate.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Abrir
                                        </a>

                                        <a
                                            href={selectedCertificate.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800"
                                        >
                                            <Download className="h-4 w-4" />
                                            Descargar
                                        </a>
                                    </>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={closePreviewModal}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-100 p-4">
                            {selectedCertificate.file_url ? (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <iframe
                                        src={getProtectedPdfViewerUrl(
                                            selectedCertificate.file_url,
                                        )}
                                        title={`Vista previa certificado ${selectedCertificate.certificate_code}`}
                                        className="h-[72vh] w-full bg-white"
                                    />
                                </div>
                            ) : (
                                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
                                    <FileWarning className="h-10 w-10 text-amber-600" />

                                    <p className="mt-4 text-sm font-black text-slate-700">
                                        PDF no disponible
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}