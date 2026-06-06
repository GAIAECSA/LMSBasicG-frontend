import type {
    StudentCoursesState,
} from "../hook";
import type {
    EnrollmentWithExtraFields,
} from "../types";
import {
    getCourseAccessRole,
    getEnrollmentCourseId,
    getResolvedProgress,
} from "../utils";
import {
    CourseCard,
} from "./CourseCard";
import {
    EmptyState,
} from "./EmptyState";
import {
    LoadingState,
} from "./LoadingState";

type CoursesListProps = {
    courses: StudentCoursesState;
};

export function CoursesList({
    courses,
}: CoursesListProps) {
    if (courses.isLoading) {
        return <LoadingState />;
    }

    if (
        courses.filteredEnrollments
            .length === 0
    ) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-3">
            {courses.filteredEnrollments.map(
                (enrollment) => {
                    const courseId =
                        getEnrollmentCourseId(
                            enrollment,
                        );

                    const course =
                        courses.coursesById[
                            courseId
                        ] ??
                        (
                            enrollment as EnrollmentWithExtraFields
                        ).course ??
                        null;

                    const accessRole =
                        getCourseAccessRole(
                            enrollment,
                            courses.sessionUser,
                            courses.currentUserId,
                        );

                    const progress =
                        getResolvedProgress(
                            enrollment,
                            course,
                            courses.progressByEnrollment,
                        );

                    return (
                        <CourseCard
                            key={`${enrollment.id}-${courseId}-${accessRole}`}
                            enrollment={
                                enrollment
                            }
                            course={course}
                            accessRole={
                                accessRole
                            }
                            progress={
                                progress
                            }
                        />
                    );
                },
            )}

            <p className="pb-3 text-center text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
                Mostrando{" "}
                {
                    courses
                        .filteredEnrollments
                        .length
                }{" "}
                de{" "}
                {
                    courses.enrollments
                        .length
                }{" "}
                cursos activos
            </p>
        </div>
    );
}

export default CoursesList;
