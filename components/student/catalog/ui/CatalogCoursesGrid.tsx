import type {
    StudentCatalogState,
} from "../hook";
import {
    CourseCatalogCard,
} from "./CourseCatalogCard";
import {
    EmptyState,
} from "./EmptyState";

type CatalogCoursesGridProps = {
    catalog: StudentCatalogState;
};

export function CatalogCoursesGrid({
    catalog,
}: CatalogCoursesGridProps) {
    if (
        catalog.visibleCourses.length ===
        0
    ) {
        return <EmptyState />;
    }

    return (
        <section className="min-w-0">
            <div className="grid min-w-0 max-w-[1320px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalog.visibleCourses.map(
                    (course) => (
                        <CourseCatalogCard
                            key={
                                course.id
                            }
                            course={
                                course
                            }
                            enrollmentInfo={
                                catalog.courseEnrollmentMap.get(
                                    course.id,
                                ) ?? {
                                    enrollment:
                                        null,
                                    state:
                                        "available",
                                }
                            }
                        />
                    ),
                )}
            </div>

            <p className="mt-5 text-center text-xs font-semibold text-slate-500 sm:text-sm">
                Mostrando{" "}
                {
                    catalog.visibleCourses
                        .length
                }{" "}
                de{" "}
                {
                    catalog.stats
                        .total
                }{" "}
                curso
                {catalog.stats.total ===
                    1
                    ? ""
                    : "s"}{" "}
                disponible
                {catalog.stats.total ===
                    1
                    ? ""
                    : "s"}
            </p>
        </section>
    );
}

export default CatalogCoursesGrid;