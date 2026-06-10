import {
    ZoomCoursePanel,
} from "@/components/live-classes/ZoomCoursePanel";

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
        Number(
            courseId,
        );

    if (
        !Number.isInteger(
            numericCourseId,
        ) ||
        numericCourseId <= 0
    ) {
        return (
            <section className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 shadow-sm">
                    El curso seleccionado no es válido.
                </div>
            </section>
        );
    }

    return (
        <ZoomCoursePanel
            courseId={
                numericCourseId
            }
            audience="teacher"
        />
    );
}