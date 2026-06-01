import type { Certificate } from "@/services/certificates.service";
import type { LessonBlock } from "@/services/lessons.service";
import type { QuizzResponse } from "@/services/quizz-response.service";
import { getQuizResponseForBlock } from "./quiz";
import { getAverageQuizScore, getQuizBlocks } from "./utils";

export function canGenerateCertificate(allBlocks: LessonBlock[], completedBlocks: number[], quizResponses: QuizzResponse[]) {
    const completedSet = new Set(completedBlocks);
    const allBlocksCompleted = allBlocks.length > 0 && allBlocks.every((block) => completedSet.has(block.id));
    const allQuizzesApproved = getQuizBlocks(allBlocks).every((block) => getQuizResponseForBlock(quizResponses, block.id)?.is_passed === true);
    return allBlocksCompleted && allQuizzesApproved;
}

export function buildCertificateValues(params: {
    studentName: string;
    courseName: string;
    courseId: number;
    certificate: Certificate | null;
    quizResponses: QuizzResponse[];
    allBlocks: LessonBlock[];
}) {
    return {
        studentName: params.studentName || "Estudiante",
        courseName: params.courseName || `Curso #${params.courseId}`,
        completionDate: new Date().toLocaleDateString("es-EC"),
        instructorName: "Instructor",
        certificateCode: params.certificate?.certificate_code ?? "",
        finalGrade: getAverageQuizScore(params.quizResponses, params.allBlocks),
    };
}
