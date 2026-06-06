"use client";

import { MdtCertificatesTeacherView } from "./view";

type MdtCertificadosProfesorViewProps = {
    cursoIdInicial?: number;
    bloquearCurso?: boolean;
};

export function MdtCertificadosProfesorView({
    cursoIdInicial = 0,
    bloquearCurso = false,
}: MdtCertificadosProfesorViewProps) {
    return (
        <MdtCertificatesTeacherView
            initialCourseId={cursoIdInicial}
            lockCourse={bloquearCurso}
        />
    );
}

export default MdtCertificadosProfesorView;
