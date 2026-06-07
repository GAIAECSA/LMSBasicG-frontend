"use client";

import type { MdtRequiredFilesPageProps } from "./types";
import { useMdtRequiredFiles } from "./hook";
import { Alerts } from "./ui/Alerts";
import { Loading } from "./ui/Loading";
import { Hero } from "./ui/Hero";
import { Toolbar } from "./ui/Toolbar";
import { FilesList } from "./ui/FilesList";
import { FormModal } from "./ui/FormModal";
import { VerifyModal } from "./ui/VerifyModal";
import { DeleteModal } from "./ui/DeleteModal";

export function MdtRequiredFilesView({
    params,
}: MdtRequiredFilesPageProps) {
    const files = useMdtRequiredFiles(params);

    if (files.isInitialLoading) {
        return <Loading />;
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1480px] space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-3">
                <Alerts error={files.error} />

                <Hero
                    isAdminRoute={files.isAdminRoute}
                    filesCount={files.requiredBlocks.length}
                    lessonsCount={files.lessons.length}
                />

                <Toolbar
                    searchTerm={files.searchTerm}
                    isLoading={files.isLoading}
                    isBusy={files.isBusy}
                    courseId={files.courseId}
                    lessonsCount={files.lessons.length}
                    visibleCount={files.filteredBlocks.length}
                    onSearchChange={files.setSearchTerm}
                    onRefresh={() => void files.loadData(true, true)}
                    onCreate={files.openCreateModal}
                    onClearSearch={() => files.setSearchTerm("")}
                />

                <FilesList files={files} />
            </div>

            <FormModal files={files} />
            <VerifyModal files={files} />
            <DeleteModal files={files} />
        </section>
    );
}

export default MdtRequiredFilesView;
