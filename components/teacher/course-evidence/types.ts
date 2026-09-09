import type {
    LessonBlock,
} from "@/services/lessons.service";

export type MdtEvidenceViewProps = {
    courseId: string | number;
};

export type EvidenceContent = {
    title: string;
    description: string;
    instructions: string;
    required: boolean;
    maxSizeMb: number;
};

export type EvidenceItem = {
    block: LessonBlock;
    content: EvidenceContent;

    /*
     * Archivo que pertenece al propio bloque.
     * NO pertenece a una matrícula.
     */
    fileUrl: string;
    filename: string;
};