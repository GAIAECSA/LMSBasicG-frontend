import type { LessonCompletionType, LessonItemType } from "./types";

export const DEFAULT_LESSON_BLOCK_TYPE_IDS: Record<LessonItemType, number> = {
    video: 1,
    quiz: 2,
    text: 3,
    image: 4,
    pdf: 5,
    homework: 6,
    survey: 7,
    forum: 8,
};

export const DEFAULT_LESSON_COMPLETION_TYPE: Record<
    LessonItemType,
    LessonCompletionType
> = {
    video: "VER",
    quiz: "RESPONDER",
    text: "VER",
    image: "VER",
    pdf: "VER",
    homework: "SUBIR",
    survey: "RESPONDER",
    forum: "RESPONDER",
};

export const DEFAULT_LESSON_COMPLETION_VALUE: Record<LessonItemType, number> = {
    video: 80,
    quiz: 7,
    text: 0,
    image: 0,
    pdf: 0,
    homework: 0,
    survey: 0,
    forum: 0,
};

export const LESSON_ITEM_TYPES: LessonItemType[] = [
    "text",
    "image",
    "pdf",
    "video",
    "quiz",
    "homework",
    "survey",
    "forum",
];