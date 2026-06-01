"use client";

import Link from "next/link";
import {
    CalendarDays,
    Clock3,
    Download,
    ExternalLink,
    Eye,
    Hash,
    ShieldCheck,
    ShieldX,
} from "lucide-react";
import type { CertificateWithExtraFields } from "../types";
import {
    getCertificateCode,
    getCertificateCourseId,
    getCertificateDate,
    getCertificateFileUrl,
    getCertificateStatusLabel,
    getCertificateStatusStyles,
    getCourseName,
} from "../utils";
import { CertificatePreviewCard } from "./CertificatePreviewCard";

type CertificateCardProps = {
    certificate: CertificateWithExtraFields;
    onPreview: (certificate: CertificateWithExtraFields) => void;
};

export function CertificateCard({
    certificate,
    onPreview,
}: CertificateCardProps) {
    const fileUrl = getCertificateFileUrl(certificate);
    const statusStyles = getCertificateStatusStyles(certificate);
    const courseName = getCourseName(certificate);
    const certificateCode = getCertificateCode(certificate);
    const courseId = getCertificateCourseId(certificate);

    return (
        <article
            className={`overflow-hidden rounded-[26px] border bg-[var(--card)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusStyles.border}`}
        >
            <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className="bg-[var(--muted)] p-4">
                    <CertificatePreviewCard certificate={certificate} />
                </div>

                <div className="flex min-w-0 flex-col justify-between p-5">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${statusStyles.badge}`}
                            >
                                {certificate.is_valid ? (
                                    <ShieldCheck className="h-4 w-4" />
                                ) : (
                                    <Clock3 className="h-4 w-4" />
                                )}
                                {getCertificateStatusLabel(certificate)}
                            </span>
                        </div>

                        <h2 className="mt-3 line-clamp-2 text-xl font-black text-[var(--foreground)]">
                            {courseName}
                        </h2>

                        <div className="mt-5 grid gap-3 text-sm">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="h-5 w-5 text-[var(--muted-foreground)]" />

                                <span className="text-[var(--muted-foreground)]">
                                    Fecha de emisión
                                </span>

                                <span className="ml-auto font-black text-[var(--foreground)]">
                                    {getCertificateDate(certificate)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Hash className="h-5 w-5 text-[var(--muted-foreground)]" />

                                <span className="text-[var(--muted-foreground)]">
                                    ID de certificado
                                </span>

                                <span className="ml-auto max-w-[180px] truncate font-black text-[var(--foreground)]">
                                    {certificateCode}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {certificate.is_valid ? (
                                    <ShieldCheck className="h-5 w-5 text-[var(--success)]" />
                                ) : (
                                    <ShieldX className="h-5 w-5 text-[var(--warning)]" />
                                )}

                                <span className="text-[var(--muted-foreground)]">
                                    Verificación
                                </span>

                                <Link
                                    href={`/certificates/verify/${certificateCode}`}
                                    className="ml-auto font-black text-[var(--primary)]"
                                >
                                    Verificar autenticidad
                                </Link>
                            </div>
                        </div>
                    </div>

                    {certificate.is_valid ? (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => onPreview(certificate)}
                                disabled={!fileUrl}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Eye className="h-4 w-4" />
                                Ver certificado
                            </button>

                            {fileUrl ? (
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar PDF
                                </a>
                            ) : (
                                <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 text-sm font-black text-[var(--muted-foreground)]">
                                    PDF no disponible
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-[var(--primary)]">
                            Tu certificado está siendo revisado. Te notificaremos
                            cuando esté disponible.
                        </div>
                    )}

                    {courseId ? (
                        <Link
                            href={`/student/courses/${courseId}`}
                            className="mt-3 inline-flex w-fit items-center gap-2 text-sm font-black text-[var(--primary)]"
                        >
                            Ir al curso
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
