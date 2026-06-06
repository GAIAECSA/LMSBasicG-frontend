import { MdtRequiredFilesView } from "@/components/teacher/mdt-required-files";

type TeacherMdtRequiredFilesPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default function TeacherMdtRequiredFilesPage({
    params,
}: TeacherMdtRequiredFilesPageProps) {
    return <MdtRequiredFilesView params={params} />;
}
