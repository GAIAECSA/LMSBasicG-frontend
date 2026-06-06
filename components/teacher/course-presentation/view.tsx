import {
    getCourseById,
    getModulesByCourse,
} from "./api";
import type { TeacherCoursePresentationViewProps } from "./types";
import { CourseHero } from "./ui/CourseHero";
import { CourseModulesSummary } from "./ui/CourseModulesSummary";
import { CourseNotFound } from "./ui/CourseNotFound";
import { CourseQuickSummary } from "./ui/CourseQuickSummary";
import { CourseToolbar } from "./ui/CourseToolbar";

export async function TeacherCoursePresentationView({
    courseId,
    backHref = "/student/courses",
    backLabel = "Volver a mis cursos",
    viewLabel = "Vista docente",
}: TeacherCoursePresentationViewProps) {
    const [course, modules] =
        await Promise.all([
            getCourseById(courseId),
            getModulesByCourse(courseId),
        ]);

    if (!course) {
        return (
            <CourseNotFound
                backHref={backHref}
                backLabel={backLabel}
            />
        );
    }

    return (
        <section className="min-h-screen w-full overflow-x-hidden bg-slate-50 px-3 py-4 pb-8 sm:px-5 sm:py-5 lg:px-6 lg:py-6 [@media(max-height:760px)]:lg:py-4">
            <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 sm:space-y-5">
                <CourseToolbar
                    course={course}
                    backHref={backHref}
                    backLabel={backLabel}
                />

                <CourseHero
                    course={course}
                    modules={modules}
                    viewLabel={viewLabel}
                />

                <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <CourseModulesSummary
                        modules={modules}
                    />

                    <CourseQuickSummary
                        course={course}
                    />
                </div>
            </div>
        </section>
    );
}

export default TeacherCoursePresentationView;
