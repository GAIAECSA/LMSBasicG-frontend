import {
    getDefaultLessonBlocksByCourseAndType,
    updateLessonBlock,
    type LessonBlock,
} from "@/services/lessons.service";

/* =====================================================
   EVIDENCIA MDT = DOCUMENTO / PDF
===================================================== */

export const MDT_EVIDENCE_BLOCK_TYPE_ID = 5;

/* =====================================================
   OBTENER EVIDENCIAS DEL CURSO
===================================================== */

export async function getMdtEvidenceBlocks(
    courseId: number,
): Promise<LessonBlock[]> {
    return getDefaultLessonBlocksByCourseAndType(
        courseId,
        MDT_EVIDENCE_BLOCK_TYPE_ID,
    );
}

/* =====================================================
   SUBIR / REEMPLAZAR ARCHIVO DE EVIDENCIA

   NO usa matrícula.
   NO usa homework-response.
===================================================== */

export async function saveMdtEvidence(params: {
    lessonBlockId: number;
    file: File;
}): Promise<LessonBlock> {
    const {
        lessonBlockId,
        file,
    } = params;

    return updateLessonBlock(
        lessonBlockId,
        {
            file,
        },
    );
}