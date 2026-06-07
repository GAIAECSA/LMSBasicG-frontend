"use client";

import { usePrivacyAdminPanel } from "./hook";
import { Alerts } from "./ui/Alerts";
import { CreatePolicyModal } from "./ui/CreatePolicyModal";
import { Loading } from "./ui/Loading";
import { PoliciesList } from "./ui/PoliciesList";
import { PrivacyHero } from "./ui/PrivacyHero";
import { SummaryCards } from "./ui/SummaryCards";

export function PrivacyAdminPanel() {
    const privacy = usePrivacyAdminPanel();

    if (privacy.initialLoading) {
        return <Loading />;
    }

    return (
        <>
            <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1450px] space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-3">
                    <PrivacyHero
                        loading={privacy.isRefreshing}
                        onCreate={privacy.startCreate}
                        onRefresh={() =>
                            void privacy.handleRefreshPolicies()
                        }
                    />

                    <Alerts
                        errorMessage={privacy.pageErrorMessage}
                    />

                    <SummaryCards summary={privacy.summary} />

                    <PoliciesList
                        loading={privacy.initialLoading}
                        policies={privacy.sortedPolicies}
                        onCreate={privacy.startCreate}
                    />
                </div>
            </section>

            <CreatePolicyModal
                open={privacy.isModalOpen}
                saving={privacy.saving}
                error={privacy.modalErrorMessage}
                form={privacy.form}
                setForm={privacy.setForm}
                onClose={privacy.closeModal}
                onFileChange={privacy.handleFileChange}
                onRemoveFile={privacy.removeSelectedFile}
                onSubmit={privacy.handleSubmit}
            />
        </>
    );
}

export default PrivacyAdminPanel;
