import { MdtCertificadosProfesorView } from "@/components/teacher/mdt-certificados";

type AdminMdtCertificadosCoursePageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function AdminMdtCertificadosCoursePage({
    params,
}: AdminMdtCertificadosCoursePageProps) {
    const { courseId } = await params;

    const numericCourseId = Number(courseId);

    return (
        <MdtCertificadosProfesorView
            cursoIdInicial={
                Number.isFinite(numericCourseId)
                    ? numericCourseId
                    : 0
            }
            bloquearCurso
        />
    );
}
