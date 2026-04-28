import { CertificateTemplateWorkspace } from "@/components/teacher/certificate-template-workspace";

export default async function TeacherCourseCertificatesPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;

    return <CertificateTemplateWorkspace courseId={courseId} />;
}