import type {
    FormState,
    LessonCompletionType,
    LessonItemType,
} from "./types";

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

export const BLOCK_TYPE_IDS: Record<LessonItemType, number> = {
    video: 1,
    quiz: 2,
    text: 3,
    image: 4,
    pdf: 5,
    homework: 6,
    survey: 7,
    forum: 8,
};

export const DEFAULT_COMPLETION_TYPE: Record<
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

export const DEFAULT_COMPLETION_VALUE: Partial<Record<LessonItemType, number>> =
{
    video: 80,
    quiz: 7,
    homework: 0,
    survey: 0,
    forum: 0,
};

export const emptyForm: FormState = {
    title: "",
    description: "",
    text: "",
    video_url: "",
    file_url: "",
    video_provider: "youtube",
    quiz_instructions: "",
    quiz_questions: [],
    survey_instructions: "",
    survey_questions: [],
    forum_prompt: "",
    completion_value: 0,
    is_required: true,
    is_active: true,
};