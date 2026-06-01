import { MdtCertificadosProfesorView } from "@/components/teacher/mdt-certificados/mdt-certificados-profesor";


type PageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function MdtCertificadosProfesorCursoPage({
    params,
}: PageProps) {
    const { courseId } = await params;

    const cursoId = Number(courseId);

    return (
        <MdtCertificadosProfesorView
            cursoIdInicial={Number.isFinite(cursoId) ? cursoId : 0}
            bloquearCurso
        />
    );
}