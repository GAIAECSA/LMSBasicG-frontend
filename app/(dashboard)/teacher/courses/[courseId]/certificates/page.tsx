import { CertificateTemplateWorkspace } from "@/components/teacher/certificate-template";

export default async function TeacherCourseCertificatesPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;

    return <CertificateTemplateWorkspace courseId={courseId} />;
}