"use client";

import { useEnrollmentsAdminPanel } from "./hook";
import { EnrollmentFormModal } from "./ui/EnrollmentFormModal";
import { EnrollmentsHero } from "./ui/EnrollmentsHero";
import { EnrollmentsList } from "./ui/EnrollmentsList";
import { EnrollmentsToolbar } from "./ui/EnrollmentsToolbar";
import { NoticeAlert } from "./ui/NoticeAlert";
import { RejectModal } from "./ui/RejectModal";
import { VoucherModal } from "./ui/VoucherModal";

export function EnrollmentsAdminPanel() {
    const panel =
        useEnrollmentsAdminPanel();

    return (
        <>
            <section className="min-w-0 space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3">
                <EnrollmentsHero
                    isLoading={panel.isLoading}
                    stats={panel.stats}
                />

                <NoticeAlert
                    error={panel.error}
                    success={panel.success}
                    hidden={
                        panel.enrollmentModalOpen ||
                        panel.rejectModalOpen
                    }
                />

                <EnrollmentsToolbar
                    search={panel.search}
                    statusFilter={
                        panel.statusFilter
                    }
                    isRefreshing={
                        panel.isRefreshing
                    }
                    isLoading={panel.isLoading}
                    onSearchChange={(value) => {
                        panel.setSearch(value);
                        panel.setCurrentPage(1);
                    }}
                    onStatusFilterChange={(
                        value,
                    ) => {
                        panel.setStatusFilter(
                            value,
                        );

                        panel.setCurrentPage(1);
                    }}
                    onCreate={
                        panel.openEnrollmentModal
                    }
                    onRefresh={() =>
                        void panel.loadEnrollments(
                            true,
                        )
                    }
                />

                <EnrollmentsList
                    isLoading={panel.isLoading}
                    allEnrollmentsCount={
                        panel.enrollments.length
                    }
                    filteredCount={
                        panel.filteredEnrollments
                            .length
                    }
                    paginatedEnrollments={
                        panel.paginatedEnrollments
                    }
                    activePage={
                        panel.activePage
                    }
                    totalPages={
                        panel.totalPages
                    }
                    updatingId={
                        panel.updatingId
                    }
                    deletingId={
                        panel.deletingId
                    }
                    onApprove={(enrollment) =>
                        void panel.handleApprove(
                            enrollment,
                        )
                    }
                    onRevision={(enrollment) =>
                        void panel.handleRevision(
                            enrollment,
                        )
                    }
                    onReject={
                        panel.openRejectModal
                    }
                    onDelete={(enrollmentId) =>
                        void panel.handleDelete(
                            enrollmentId,
                        )
                    }
                    onOpenVoucher={
                        panel.openVoucherModal
                    }
                    onPrevious={() =>
                        panel.setCurrentPage(
                            (page) =>
                                Math.max(
                                    1,
                                    page - 1,
                                ),
                        )
                    }
                    onNext={() =>
                        panel.setCurrentPage(
                            (page) =>
                                Math.min(
                                    panel.totalPages,
                                    page + 1,
                                ),
                        )
                    }
                />
            </section>

            <EnrollmentFormModal
                panel={panel}
                onSubmit={
                    panel.handleSubmit
                }
            />

            <VoucherModal
                url={panel.voucherModalUrl}
                title={
                    panel.voucherModalTitle
                }
                onClose={
                    panel.closeVoucherModal
                }
            />

            <RejectModal panel={panel} />
        </>
    );
}

export default EnrollmentsAdminPanel;
