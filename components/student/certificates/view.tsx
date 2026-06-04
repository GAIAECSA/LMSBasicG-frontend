"use client";

import { useMemo } from "react";
import {
    Award,
    Building2,
    FileBadge2,
    ShieldCheck,
} from "lucide-react";
import { useStudentCertificates } from "./hook";
import type { CertificateWithExtraFields } from "./types";
import {
    getCertificateCourseId,
    getCertificateFileUrl,
    getCertificateType,
} from "./utils";
import { Alert } from "./ui/Alert";
import { CertificateCard } from "./ui/CertificateCard";
import { CertificatesToolbar } from "./ui/CertificatesToolbar";
import { EmptyState } from "./ui/EmptyState";
import { Loading } from "./ui/Loading";
import { PreviewModal } from "./ui/PreviewModal";
import { SummaryCard } from "./ui/SummaryCard";
import { TopActions } from "./ui/TopActions";

type CertificateCourseGroup = {
    key: string;
    certificates: CertificateWithExtraFields[];
};

function getCertificateGroupKey(
    certificate: CertificateWithExtraFields,
) {
    const courseId = getCertificateCourseId(certificate);

    /*
     * Los certificados MDT e institucionales del mismo curso deben
     * mostrarse dentro de una misma tarjeta.
     */
    if (courseId !== null) {
        return `course-${courseId}`;
    }

    /*
     * Evita mezclar certificados que no tengan course_id.
     */
    const certificateType = getCertificateType(certificate);
    const fileUrl = getCertificateFileUrl(certificate) || "sin-archivo";

    return `certificate-${certificateType}-${certificate.id}-${fileUrl}`;
}

function groupCertificatesByCourse(
    certificates: CertificateWithExtraFields[],
) {
    const groupsMap = new Map<string, CertificateCourseGroup>();

    certificates.forEach((certificate) => {
        const groupKey = getCertificateGroupKey(certificate);
        const existingGroup = groupsMap.get(groupKey);

        if (existingGroup) {
            existingGroup.certificates.push(certificate);
            return;
        }

        groupsMap.set(groupKey, {
            key: groupKey,
            certificates: [certificate],
        });
    });

    return Array.from(groupsMap.values());
}

export function StudentCertificatesView() {
    const {
        selectedCertificate,
        statusFilter,
        setStatusFilter,
        searchTerm,
        setSearchTerm,
        isLoading,
        isRefreshing,
        errorMessage,
        validCertificatesCount,
        mdtCertificatesCount,
        institutionalCertificatesCount,
        filteredCertificates,
        refreshCertificates,
        openPreviewModal,
        closePreviewModal,
        initials,
    } = useStudentCertificates();

    const groupedCertificates = useMemo(
        () => groupCertificatesByCourse(filteredCertificates),
        [filteredCertificates],
    );

    return (
        <>
            <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
                <div className="mx-auto w-full max-w-[1680px]">
                    <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                                Mis certificados
                            </h1>

                            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                                Consulta los certificados MDT e institucionales
                                que has obtenido al finalizar tus cursos.
                            </p>
                        </div>

                        <TopActions initials={initials} />
                    </div>

                    <div className="mb-5 grid gap-4 lg:grid-cols-3">
                        <SummaryCard
                            title="Certificados obtenidos"
                            value={String(validCertificatesCount)}
                            detail="Total de certificados emitidos"
                            tone="green"
                            icon={<Award className="h-7 w-7" />}
                        />

                        <SummaryCard
                            title="Certificados MDT"
                            value={String(mdtCertificatesCount)}
                            detail="Certificados MDT emitidos"
                            tone="blue"
                            icon={<FileBadge2 className="h-7 w-7" />}
                        />

                        <SummaryCard
                            title="Institucionales"
                            value={String(institutionalCertificatesCount)}
                            detail="Certificados institucionales"
                            tone="orange"
                            icon={<Building2 className="h-7 w-7" />}
                        />
                    </div>

                    <CertificatesToolbar
                        totalCertificates={validCertificatesCount}
                        mdtCertificatesCount={mdtCertificatesCount}
                        institutionalCertificatesCount={
                            institutionalCertificatesCount
                        }
                        statusFilter={statusFilter}
                        searchTerm={searchTerm}
                        isRefreshing={isRefreshing}
                        onStatusFilterChange={setStatusFilter}
                        onSearchTermChange={setSearchTerm}
                        onRefresh={() => void refreshCertificates()}
                    />

                    <Alert message={errorMessage} />

                    {isLoading ? (
                        <Loading />
                    ) : groupedCertificates.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-5">
                            {groupedCertificates.map((group) => (
                                <CertificateCard
                                    key={group.key}
                                    certificates={group.certificates}
                                    onPreview={openPreviewModal}
                                />
                            ))}
                        </div>
                    )}

                    {!isLoading && groupedCertificates.length > 0 ? (
                        <div className="mt-5 flex items-center justify-center gap-2 px-4 text-center text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--primary)]" />

                            <span>
                                Todos los certificados incluyen un código único
                                de verificación para validar su autenticidad.
                            </span>
                        </div>
                    ) : null}
                </div>
            </section>

            <PreviewModal
                certificate={selectedCertificate}
                onClose={closePreviewModal}
            />
        </>
    );
}

export default StudentCertificatesView;