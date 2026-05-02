import { CertificateTemplateWorkspace } from "@/components/teacher/certificate-template-workspace";

type AdminCourseCertificatesPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function AdminCourseCertificatesPage({
    params,
}: AdminCourseCertificatesPageProps) {
    const { courseId } = await params;

    return <CertificateTemplateWorkspace courseId={courseId} />;
}