import { MdtCertificadosProfesorView } from "@/components/teacher/mdt-certificados";

type TeacherMdtCertificadosPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function TeacherMdtCertificadosPage({
    params,
}: TeacherMdtCertificadosPageProps) {
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
