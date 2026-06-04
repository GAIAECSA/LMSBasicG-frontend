"use client";

import Link from "next/link";
import {
    Building2,
    CalendarDays,
    Download,
    ExternalLink,
    Eye,
    FileBadge2,
    FolderCheck,
    Hash,
    ShieldCheck,
} from "lucide-react";
import type { CertificateWithExtraFields } from "../types";
import {
    getCertificateCode,
    getCertificateCourseId,
    getCertificateDate,
    getCertificateFileUrl,
    getCertificateType,
    getCertificateTypeLabel,
    getCourseName,
} from "../utils";
import { CertificatePreviewCard } from "./CertificatePreviewCard";

type CertificateCardProps = {
    certificates: CertificateWithExtraFields[];
    onPreview: (certificate: CertificateWithExtraFields) => void;
};

function getCertificateReactKey(
    certificate: CertificateWithExtraFields,
    index: number,
) {
    const certificateType = getCertificateType(certificate);
    const courseId = getCertificateCourseId(certificate) ?? "sin-curso";
    const fileUrl = getCertificateFileUrl(certificate) || "sin-archivo";

    return `${certificateType}-${courseId}-${certificate.id}-${fileUrl}-${index}`;
}

function sortCertificates(
    certificates: CertificateWithExtraFields[],
) {
    return [...certificates].sort((first, second) => {
        const firstType = getCertificateType(first);
        const secondType = getCertificateType(second);

        if (firstType === secondType) return 0;

        /*
         * Cuando existen los dos tipos, se presenta primero
         * el certificado institucional.
         */
        return firstType === "institutional" ? -1 : 1;
    });
}

export function CertificateCard({
    certificates,
    onPreview,
}: CertificateCardProps) {
    if (certificates.length === 0) return null;

    const orderedCertificates = sortCertificates(certificates);
    const firstCertificate = orderedCertificates[0];

    const courseName = getCourseName(firstCertificate);
    const courseId = getCertificateCourseId(firstCertificate);
    const certificatesCount = orderedCertificates.length;

    return (
        <article className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] shadow-sm transition duration-200 hover:shadow-md">
            <header className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                        <FolderCheck className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <h2
                            title={courseName}
                            className="truncate text-lg font-black text-[var(--foreground)] sm:text-xl"
                        >
                            {courseName}
                        </h2>

                        <p className="mt-0.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)] sm:text-sm">
                            Documentos obtenidos al finalizar el curso.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-3 py-1 text-[11px] font-black text-[var(--success)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Disponible
                    </span>

                    <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-3 py-1 text-[11px] font-black text-[var(--muted-foreground)]">
                        {certificatesCount}{" "}
                        {certificatesCount === 1
                            ? "certificado"
                            : "certificados"}
                    </span>

                    {courseId ? (
                        <Link
                            href={`/student/courses/${courseId}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-black text-[var(--primary)] transition hover:bg-[var(--secondary)] hover:underline"
                        >
                            Ir al curso
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    ) : null}
                </div>
            </header>

            <div className="grid min-w-0 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(330px,420px)]">
                <div className="min-w-0 space-y-3">
                    {orderedCertificates.map((certificate, index) => {
                        const certificateType =
                            getCertificateType(certificate);

                        const certificateTypeLabel =
                            getCertificateTypeLabel(certificate);

                        const certificateCode =
                            getCertificateCode(certificate);

                        const fileUrl =
                            getCertificateFileUrl(certificate);

                        const isMdt = certificateType === "mdt";

                        return (
                            <section
                                key={getCertificateReactKey(
                                    certificate,
                                    index,
                                )}
                                className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/25 p-3"
                            >
                                <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_140px] md:items-center">
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                                            <div
                                                className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${isMdt
                                                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                                    : "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                                                    }`}
                                            >
                                                {isMdt ? (
                                                    <FileBadge2 className="h-3.5 w-3.5 shrink-0" />
                                                ) : (
                                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                )}

                                                <span className="truncate">
                                                    {certificateTypeLabel}
                                                </span>
                                            </div>

                                            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-black text-[var(--success)]">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                Emitido
                                            </span>
                                        </div>

                                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />

                                                <span className="shrink-0 font-semibold text-[var(--muted-foreground)]">
                                                    Emisión
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onPreview(certificate)
                                            }
                                            disabled={!fileUrl}
                                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 text-[11px] font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Eye className="h-3.5 w-3.5 shrink-0" />
                                            Ver PDF
                                        </button>

                                        {fileUrl ? (
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 text-[11px] font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                                            >
                                                <Download className="h-3.5 w-3.5 shrink-0" />
                                                Descargar
                                            </a>
                                        ) : (
                                            <div className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 text-[11px] font-black text-[var(--muted-foreground)]">
                                                Sin PDF
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>

                <CertificatePreviewCard certificate={firstCertificate} />
            </div>
        </article>
    );
}