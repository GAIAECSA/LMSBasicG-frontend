import type { LessonReviewItemType } from "./types";

export const TEACHER_ROLE_ID = 3;
export const STUDENT_ROLE_ID = 2;

export const BLOCK_TYPE_IDS: Record<LessonReviewItemType, number> = {
    video: 1,
    quiz: 2,
    text: 3,
    image: 4,
    pdf: 5,
    homework: 6,
    survey: 7,
    forum: 8,
    unknown: 0,
};

export const ITEM_TYPE_LABELS: Record<LessonReviewItemType, string> = {
    video: "Video",
    quiz: "Evaluación",
    text: "Texto",
    image: "Imagen",
    pdf: "PDF",
    homework: "Tarea",
    survey: "Encuesta",
    forum: "Foro",
    unknown: "Ítem",
};

export const ITEM_TYPE_BADGES: Record<
    LessonReviewItemType,
    {
        label: string;
        className: string;
    }
> = {
    video: {
        label: "Vista previa",
        className: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    quiz: {
        label: "Revisión",
        className: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    text: {
        label: "Vista previa",
        className: "bg-slate-100 text-slate-700 ring-slate-200",
    },
    image: {
        label: "Vista previa",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    pdf: {
        label: "Vista previa",
        className: "bg-red-50 text-red-700 ring-red-100",
    },
    homework: {
        label: "Calificación",
        className: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    survey: {
        label: "Respuestas",
        className: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    },
    forum: {
        label: "Participación",
        className: "bg-orange-50 text-orange-700 ring-orange-100",
    },
    unknown: {
        label: "Revisión",
        className: "bg-slate-100 text-slate-700 ring-slate-200",
    },
};

export const REVIEWABLE_TYPES: LessonReviewItemType[] = [
    "homework",
    "quiz",
    "survey",
    "forum",
];