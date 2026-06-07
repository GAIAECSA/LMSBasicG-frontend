"use client";

import type { TeacherQuizGradesViewProps } from "./types";
import { useGrades } from "./hook";
import { Loading } from "./ui/Loading";
import { CourseSelector } from "./ui/CourseSelector";
import { Alert } from "./ui/Alert";
import { Header } from "./ui/Header";
import { Filters } from "./ui/Filters";
import { Stats } from "./ui/Stats";
import { Table } from "./ui/Table";
import { Modal } from "./ui/Modal";

export function TeacherQuizGradesView({
    courseId,
    params,
}: TeacherQuizGradesViewProps) {
    const grades = useGrades({ courseId, params });

    if (grades.isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1480px]">
                    <Loading />
                </div>
            </div>
        );
    }

    if (grades.currentCourseId <= 0) {
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1480px]">
                    <CourseSelector
                        courseOptions={grades.courseOptions}
                        errorMessage={grades.errorMessage}
                        onSelectCourse={grades.handleSelectCourse}
                    />
                </div>
            </div>
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1480px] space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3">
                <Header
                    isAdminRoute={grades.isAdminRoute}
                    course={grades.course}
                    currentCourseId={grades.currentCourseId}
                    averageScore={grades.averageScore}
                    passedCount={grades.passedCount}
                    failedCount={grades.failedCount}
                    generatedCertificatesCount={
                        grades.generatedCertificatesCount
                    }
                />

                <div className="space-y-2 sm:space-y-3">
                    <Alert type="error" message={grades.errorMessage} />
                </div>

                <Filters
                    isAdminRoute={grades.isAdminRoute}
                    routeCourseId={grades.routeCourseId}
                    currentCourseId={grades.currentCourseId}
                    isRefreshing={grades.isRefreshing}
                    searchTerm={grades.searchTerm}
                    selectedBlockId={grades.selectedBlockId}
                    activityBlocks={grades.activityBlocks}
                    courseOptions={grades.courseOptions}
                    setSearchTerm={grades.setSearchTerm}
                    setSelectedBlockId={grades.setSelectedBlockId}
                    setCurrentPage={grades.setCurrentPage}
                    onRefresh={() => void grades.loadGrades(true)}
                    onSelectCourse={grades.handleSelectCourse}
                />

                <Stats
                    course={grades.course}
                    currentCourseId={grades.currentCourseId}
                    groupedGradesLength={grades.groupedGrades.length}
                    gradesLength={grades.grades.length}
                    quizBlocksLength={grades.quizBlocks.length}
                    homeworkBlocksLength={grades.homeworkBlocks.length}
                    generatedCertificatesCount={
                        grades.generatedCertificatesCount
                    }
                />

                <Table
                    groupedGradesLength={grades.groupedGrades.length}
                    paginatedGroups={grades.paginatedGroups}
                    startItem={grades.startItem}
                    endItem={grades.endItem}
                    activePage={grades.activePage}
                    totalPages={grades.totalPages}
                    generatingCertificateUserId={
                        grades.generatingCertificateUserId
                    }
                    setCurrentPage={grades.setCurrentPage}
                    openGroupModal={grades.openGroupModal}
                    handleGenerateOrReissueCertificate={
                        grades.handleGenerateOrReissueCertificate
                    }
                />
            </div>

            <Modal
                groupModal={grades.groupModal}
                modalError={grades.modalError}
                savingResponseId={grades.savingResponseId}
                generatingCertificateUserId={
                    grades.generatingCertificateUserId
                }
                editScores={grades.editScores}
                editPassed={grades.editPassed}
                closeGroupModal={grades.closeGroupModal}
                setEditScores={grades.setEditScores}
                setEditPassed={grades.setEditPassed}
                setModalError={grades.setModalError}
                handleSaveGrade={grades.handleSaveGrade}
                handleGenerateOrReissueCertificate={
                    grades.handleGenerateOrReissueCertificate
                }
            />
        </section>
    );
}

export default TeacherQuizGradesView;
