"use client";

import type { TeacherCourseModulesPageProps } from "./types";
import { useCourseMods } from "./hook";
import {
    getCreateModalDescription,
    getCreateModalTitle,
    getEditModalTitle,
} from "./utils";
import { Loading } from "./ui/Loading";
import { CourseSelect } from "./ui/CourseSelect";
import { Toolbar } from "./ui/Toolbar";
import { Alerts } from "./ui/Alerts";
import { Header } from "./ui/Header";
import { EmptyState } from "./ui/EmptyState";
import { ModulesList } from "./ui/ModulesList";
import { FormModal } from "./ui/FormModal";
import { DeleteModal } from "./ui/DeleteModal";

const PAGE_CLASS =
    "min-h-screen w-full bg-slate-50 px-3 py-3 pb-8 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3";

const CONTAINER_CLASS =
    "mx-auto w-full max-w-[1480px] min-w-0 space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3";

export function TeacherCourseModulesPage({
    courseId,
    params,
}: TeacherCourseModulesPageProps) {
    const mods = useCourseMods({ courseId, params });

    if (mods.isLoading) {
        return (
            <section className={PAGE_CLASS}>
                <div className="mx-auto w-full max-w-[1480px] min-w-0">
                    <Loading numericCourseId={mods.numericCourseId} />
                </div>
            </section>
        );
    }

    if (mods.numericCourseId <= 0) {
        return (
            <section className={PAGE_CLASS}>
                <div className="mx-auto w-full max-w-[1480px] min-w-0">
                    <CourseSelect
                        courseOptions={mods.courseOptions}
                        errorMessage={mods.errorMessage}
                        onSelectCourse={mods.handleSelectCourse}
                    />
                </div>
            </section>
        );
    }

    return (
        <section className={PAGE_CLASS}>
            <div className={CONTAINER_CLASS}>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 [@media(max-height:760px)]:p-3">
                    <Toolbar
                        backHref={mods.backHref}
                        backLabel={mods.backLabel}
                        isLoading={mods.isLoading}
                        numericCourseId={mods.numericCourseId}
                        onCreateModule={mods.openCreateModuleModal}
                    />
                </div>

                <Alerts
                    errorMessage={mods.errorMessage}
                    actionError={mods.actionError}
                />

                <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm sm:rounded-3xl">
                    <Header
                        selectedCourseName={mods.selectedCourseName}
                        modulesCount={mods.modules.length}
                    />

                    <div className="min-w-0 p-3 sm:p-4 md:p-5 lg:p-6 [@media(max-height:760px)]:p-3">
                        {mods.modules.length === 0 ? (
                            <EmptyState
                                onCreateModule={mods.openCreateModuleModal}
                            />
                        ) : (
                            <ModulesList mods={mods} />
                        )}
                    </div>
                </div>
            </div>

            {mods.createModal ? (
                <FormModal
                    title={getCreateModalTitle(mods.createModal)}
                    description={getCreateModalDescription(mods.createModal)}
                    submitLabel="Guardar"
                    itemType={
                        mods.createModal.type === "item"
                            ? mods.createModal.itemType
                            : null
                    }
                    mods={mods}
                    onClose={mods.closeCreateModal}
                    onSubmit={mods.handleCreateSubmit}
                />
            ) : null}

            {mods.editModal ? (
                <FormModal
                    title={getEditModalTitle(mods.editModal)}
                    description="Actualiza las propiedades principales."
                    submitLabel="Guardar cambios"
                    itemType={
                        mods.editModal.type === "item"
                            ? mods.editModal.itemType
                            : null
                    }
                    mods={mods}
                    onClose={mods.closeEditModal}
                    onSubmit={mods.handleEditSubmit}
                />
            ) : null}

            {mods.deleteModal ? (
                <DeleteModal
                    deleteModal={mods.deleteModal}
                    isSaving={mods.isSaving}
                    onClose={mods.closeDeleteModal}
                    onConfirm={mods.handleConfirmDelete}
                />
            ) : null}
        </section>
    );
}

export default TeacherCourseModulesPage;
