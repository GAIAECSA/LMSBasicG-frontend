import TeacherMdtRequiredFilesPage from "@/app/(dashboard)/teacher/courses/[courseId]/mdt-required-files/page";

type AdminMdtRequiredFilesCoursePageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function AdminMdtRequiredFilesCoursePage({
    params,
}: AdminMdtRequiredFilesCoursePageProps) {
    return <TeacherMdtRequiredFilesPage params={params} />;
}