"use client";

import { useStudentCourses } from "./hook";
import { CoursesAlert } from "./ui/CoursesAlert";
import { CoursesHeader } from "./ui/CoursesHeader";
import { CoursesList } from "./ui/CoursesList";
import { CoursesToolbar } from "./ui/CoursesToolbar";

export function StudentCoursesView() {
    const courses =
        useStudentCourses();

    return (
        <section className="min-h-screen bg-[var(--background)] px-3 py-3 pt-16 text-[var(--foreground)] sm:px-4 sm:py-4 md:px-5 md:pt-4 lg:px-6 xl:px-7 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1450px] space-y-3 sm:space-y-4">
                <CoursesHeader
                    roleLabel={
                        courses.roleLabel
                    }
                    initials={
                        courses.initials
                    }
                />

                <CoursesToolbar
                    activeFilter={
                        courses.activeFilter
                    }
                    totalCount={
                        courses.enrollments
                            .length
                    }
                    inProgressCount={
                        courses.inProgressCount
                    }
                    completedCount={
                        courses.completedCount
                    }
                    searchTerm={
                        courses.searchTerm
                    }
                    isRefreshing={
                        courses.isRefreshing
                    }
                    onFilterChange={
                        courses.setActiveFilter
                    }
                    onSearchChange={
                        courses.setSearchTerm
                    }
                    onRefresh={() => {
                        void courses.handleRefreshCourses();
                    }}
                />

                <CoursesAlert
                    errorMessage={
                        courses.errorMessage
                    }
                />

                <CoursesList
                    courses={
                        courses
                    }
                />
            </div>
        </section>
    );
}

export default StudentCoursesView;