import { Award } from "lucide-react";
import type { CertificateWithExtraFields } from "../types";
import {
    getCertificateFileUrl,
    getCourseName,
    getProtectedPdfViewerUrl,
} from "../utils";

type CertificatePreviewCardProps = {
    certificate: CertificateWithExtraFields;
};

export function CertificatePreviewCard({
    certificate,
}: CertificatePreviewCardProps) {
    const fileUrl = getCertificateFileUrl(certificate);
    const courseName = getCourseName(certificate);

    if (fileUrl) {
        return (
            <div className="relative h-[190px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white md:h-[210px]">
                <iframe
                    src={getProtectedPdfViewerUrl(fileUrl)}
                    title={`Vista previa ${courseName}`}
                    className="h-[420px] w-full origin-top scale-[0.52] bg-white md:scale-[0.58]"
                    tabIndex={-1}
                />

                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
            </div>
        );
    }

    return (
        <div className="relative flex h-[190px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-white md:h-[210px]">
            <div className="absolute left-0 top-0 h-24 w-24 rounded-br-[60px] bg-[var(--primary)]" />
            <div className="absolute bottom-0 right-0 h-24 w-24 rounded-tl-[60px] bg-[var(--primary)]" />

            <Award className="relative h-12 w-12 text-[var(--primary)]" />

            <p className="relative mt-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--foreground)]">
                Certificado
            </p>

            <p className="relative mt-1 max-w-[220px] truncate text-center text-xs font-bold text-[var(--muted-foreground)]">
                {courseName}
            </p>
        </div>
    );
}
