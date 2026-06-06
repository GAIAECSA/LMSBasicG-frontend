import { MdtRequiredFilesView } from "@/components/teacher/mdt-required-files";

type AdminMdtRequiredFilesCoursePageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default function AdminMdtRequiredFilesCoursePage({
    params,
}: AdminMdtRequiredFilesCoursePageProps) {
    return <MdtRequiredFilesView params={params} />;
}
