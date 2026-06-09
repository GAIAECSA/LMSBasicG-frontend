import {
    ZoomLtiCoursePanel,
} from "@/components/live-classes/ZoomLtiCoursePanel";

type TeacherLiveClassesCoursePageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function TeacherLiveClassesCoursePage({
    params,
}: TeacherLiveClassesCoursePageProps) {
    const {
        courseId,
    } = await params;

    const numericCourseId =
        Number(courseId);

    if (
        !Number.isInteger(numericCourseId) ||
        numericCourseId <= 0
    ) {
        return (
            <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                    El curso seleccionado no es válido.
                </div>
            </section>
        );
    }

    return (
        <ZoomLtiCoursePanel
            courseId={numericCourseId}
            audience="teacher"
        />
    );
}