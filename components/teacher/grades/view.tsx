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
            <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
                    <Loading currentCourseId={grades.currentCourseId} />
                </div>
            </div>
        );
    }

    if (grades.currentCourseId <= 0) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
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
        <section className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-6">
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

                <div className="space-y-3">
                    <Alert type="success" message={grades.notice} />
                    <Alert type="error" message={grades.errorMessage} />
                </div>

                <div className="rounded-[2rem] border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 md:p-6 lg:p-7">
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
                </div>

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

                <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-sm">
                    <div className="p-4 sm:p-5 md:p-6 lg:p-7">
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
                </div>
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