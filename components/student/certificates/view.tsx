"use client";

import { Award, CheckCircle2, Clock3 } from "lucide-react";
import { useStudentCertificates } from "./hook";
import { Alert } from "./ui/Alert";
import { CertificateCard } from "./ui/CertificateCard";
import { CertificatesToolbar } from "./ui/CertificatesToolbar";
import { EmptyState } from "./ui/EmptyState";
import { Loading } from "./ui/Loading";
import { PreviewModal } from "./ui/PreviewModal";
import { SummaryCard } from "./ui/SummaryCard";
import { TopActions } from "./ui/TopActions";

export function StudentCertificatesView() {
    const {
        certificates,
        selectedCertificate,
        statusFilter,
        setStatusFilter,
        searchTerm,
        setSearchTerm,
        isLoading,
        isRefreshing,
        errorMessage,
        validCertificatesCount,
        filteredCertificates,
        refreshCertificates,
        openPreviewModal,
        closePreviewModal,
        initials,
    } = useStudentCertificates();

    return (
        <>
            <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
                <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                            Mis certificados
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                            Aquí aparecerán únicamente los certificados generados
                            después de finalizar un curso.
                        </p>
                    </div>

                    <TopActions initials={initials} />
                </div>

                <div className="mb-7 grid gap-4 lg:grid-cols-3">
                    <SummaryCard
                        title="Certificados obtenidos"
                        value={String(validCertificatesCount)}
                        detail="Certificados generados"
                        tone="green"
                        icon={<Award className="h-7 w-7" />}
                    />

                    <SummaryCard
                        title="Cursos finalizados"
                        value={String(validCertificatesCount)}
                        detail="Con certificado generado"
                        tone="orange"
                        icon={<CheckCircle2 className="h-7 w-7" />}
                    />

                    <SummaryCard
                        title="Horas certificadas"
                        value={`${validCertificatesCount * 40}h`}
                        detail="Horas de formación"
                        tone="blue"
                        icon={<Clock3 className="h-7 w-7" />}
                    />
                </div>

                <CertificatesToolbar
                    totalCertificates={certificates.length}
                    validCertificatesCount={validCertificatesCount}
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
                ) : filteredCertificates.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {filteredCertificates.map((certificate) => (
                            <CertificateCard
                                key={certificate.id}
                                certificate={certificate}
                                onPreview={openPreviewModal}
                            />
                        ))}
                    </div>
                )}
            </section>

            <PreviewModal
                certificate={selectedCertificate}
                onClose={closePreviewModal}
            />
        </>
    );
}

export default StudentCertificatesView;
