"use client";

import {
    CourseFormModal,
} from "./ui/CourseFormModal";
import {
    CoursesHero,
} from "./ui/CoursesHero";
import {
    CoursesList,
} from "./ui/CoursesList";
import {
    CoursesToolbar,
} from "./ui/CoursesToolbar";
import {
    DeleteCourseModal,
} from "./ui/DeleteCourseModal";
import {
    Loading,
} from "./ui/Loading";
import {
    NoticeAlert,
} from "./ui/NoticeAlert";
import {
    TeacherAssignmentModal,
} from "./ui/TeacherAssignmentModal";
import {
    useCoursesAdminPanel,
} from "./hook";

export function CoursesAdminPanel() {
    const panel =
        useCoursesAdminPanel();

    if (
        panel.isLoading
    ) {
        return (
            <Loading />
        );
    }

    return (
        <>
            <section className="min-w-0 space-y-4 sm:space-y-5 lg:space-y-6 [@media(max-height:760px)]:space-y-4">
                <CoursesHero
                    isLoading={
                        panel.isLoading
                    }
                    stats={
                        panel.stats
                    }
                    canUseMdt={
                        panel.canUseMdt
                    }
                />

                <NoticeAlert
                    notice={
                        panel.notice
                    }
                />

                <CoursesToolbar
                    search={
                        panel.search
                    }
                    isRefreshing={
                        panel.isRefreshing
                    }
                    onSearchChange={(
                        value,
                    ) => {
                        panel.setSearch(
                            value,
                        );

                        panel.setCurrentPage(
                            1,
                        );
                    }}
                    onCreate={
                        panel.openCreateModal
                    }
                    onRefresh={() =>
                        void panel.loadCoursesData(
                            true,
                        )
                    }
                />

                <CoursesList
                    isLoading={
                        panel.isLoading
                    }
                    paginatedCourses={
                        panel.paginatedCourses
                    }
                    filteredCount={
                        panel.filteredCourses
                            .length
                    }
                    activePage={
                        panel.activePage
                    }
                    totalPages={
                        panel.totalPages
                    }
                    categoryMap={
                        panel.categoryMap
                    }
                    subcategoryMap={
                        panel.subcategoryMap
                    }
                    onPrevious={() =>
                        panel.setCurrentPage(
                            (
                                page,
                            ) =>
                                Math.max(
                                    1,
                                    page -
                                    1,
                                ),
                        )
                    }
                    onNext={() =>
                        panel.setCurrentPage(
                            (
                                page,
                            ) =>
                                Math.min(
                                    panel.totalPages,
                                    page +
                                    1,
                                ),
                        )
                    }
                    onEdit={
                        panel.handleEdit
                    }
                    onAssignTeacher={(
                        course,
                    ) =>
                        void panel.openAssignTeacherModal(
                            course,
                        )
                    }
                    onDelete={
                        panel.openDeleteModal
                    }
                    
                    onViewAsTeacher={panel.handleViewAsTeacher}
                />
            </section>

            <TeacherAssignmentModal
                open={
                    panel.isTeacherModalOpen
                }
                course={
                    panel.assigningCourse
                }
                users={
                    panel.paginatedUsers
                }
                usersLoading={
                    panel.usersLoading
                }
                assignedTeacherUserIds={
                    panel.assignedTeacherUserIds
                }
                assigningTeacherId={
                    panel.assigningTeacherId
                }
                search={
                    panel.userSearch
                }
                activePage={
                    panel.activeUserPage
                }
                totalPages={
                    panel.userTotalPages
                }
                totalUsers={
                    panel.filteredUsers
                        .length
                }
                onClose={
                    panel.closeTeacherModal
                }
                onSearchChange={(
                    value,
                ) => {
                    panel.setUserSearch(
                        value,
                    );

                    panel.setUserCurrentPage(
                        1,
                    );
                }}
                onPrevious={() =>
                    panel.setUserCurrentPage(
                        (
                            page,
                        ) =>
                            Math.max(
                                1,
                                page -
                                1,
                            ),
                    )
                }
                onNext={() =>
                    panel.setUserCurrentPage(
                        (
                            page,
                        ) =>
                            Math.min(
                                panel.userTotalPages,
                                page +
                                1,
                            ),
                    )
                }
                onToggleTeacher={(
                    user,
                    isTeacher,
                ) =>
                    void panel.handleToggleTeacher(
                        user,
                        isTeacher,
                    )
                }
            />

            <CourseFormModal
                open={
                    panel.isModalOpen
                }
                editingCourseId={
                    panel.editingCourseId
                }
                form={
                    panel.form
                }
                canUseMdt={
                    panel.canUseMdt
                }
                previewSrc={
                    panel.previewSrc
                }
                selectedImageFile={
                    panel.selectedImageFile
                }
                categories={
                    panel.categories
                }
                subcategories={
                    panel.subcategories
                }
                availableSubcategories={
                    panel.availableSubcategories
                }
                categoriesLoading={
                    panel.categoriesLoading
                }
                subcategoriesLoading={
                    panel.subcategoriesLoading
                }
                isSaving={
                    panel.isSaving
                }
                onClose={
                    panel.closeModal
                }
                onSubmit={
                    panel.handleSubmit
                }
                onImageChange={
                    panel.handleImageChange
                }
                onCategoryChange={
                    panel.handleCategoryChange
                }
                onUpdateForm={
                    panel.updateForm
                }
            />

            <DeleteCourseModal
                course={
                    panel.deleteCandidate
                }
                isDeleting={
                    panel.isDeleting
                }
                onClose={
                    panel.closeDeleteModal
                }
                onConfirm={() =>
                    void panel.confirmDeleteCourse()
                }
            />
        </>
    );
}

export default CoursesAdminPanel;
