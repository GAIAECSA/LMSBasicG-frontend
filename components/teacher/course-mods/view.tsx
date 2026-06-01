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

export function TeacherCourseModulesPage({
    courseId,
    params,
}: TeacherCourseModulesPageProps) {
    const mods = useCourseMods({ courseId, params });

    if (mods.isLoading) {
        return (
            <section className="min-h-screen w-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
                    <Loading numericCourseId={mods.numericCourseId} />
                </div>
            </section>
        );
    }

    if (mods.numericCourseId <= 0) {
        return (
            <section className="min-h-screen w-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
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
        <section className="min-h-screen w-full bg-slate-50 px-4 py-6 pb-10 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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

                <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-sm">
                    <Header
                        selectedCourseName={mods.selectedCourseName}
                        modulesCount={mods.modules.length}
                    />

                    <div className="p-5 sm:p-6 md:p-8 lg:p-9">
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