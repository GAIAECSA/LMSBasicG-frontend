import { MdtCertificadosProfesorView } from "@/components/teacher/mdt-certificados/mdt-certificados-profesor";

type AdminMdtCertificadosCoursePageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function AdminMdtCertificadosCoursePage({
    params,
}: AdminMdtCertificadosCoursePageProps) {
    const { courseId } = await params;

    const cursoIdInicial = Number(courseId);

    return (
        <MdtCertificadosProfesorView
            cursoIdInicial={Number.isFinite(cursoIdInicial) ? cursoIdInicial : 0}
            bloquearCurso
        />
    );
}