import type {
    LessonBlock,
    LessonBlockPayload,
} from "@/services/lessons.service";

export type LessonItemEditorPageProps = {
    courseId: string;
    itemId: string;
};

export type LessonItemType =
    | "text"
    | "image"
    | "pdf"
    | "video"
    | "quiz"
    | "homework"
    | "survey"
    | "forum";

export type LessonCompletionType = "VER" | "RESPONDER" | "SUBIR";

export type QuizQuestion = {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    points: number;
};

export type SurveyQuestion = {
    id: number;
    question: string;
    type: "text" | "single";
    options: string[];
    required: boolean;
};

export type FormState = {
    title: string;
    description: string;
    text: string;
    video_url: string;
    video_provider: string;
    quiz_instructions: string;
    quiz_questions: QuizQuestion[];
    survey_instructions: string;
    survey_questions: SurveyQuestion[];
    forum_prompt: string;
    completion_value: number;
    is_required: boolean;
    is_active: boolean;
};

export type LessonBlockWithOptionalType = LessonBlock & {
    block_type_id?: number;
    deleted?: boolean;
    lesson_block_type?: {
        id?: number;
        key?: string;
    };
};

export type LessonBlockPayloadWithFile = Omit<
    LessonBlockPayload,
    "completion_value"
> & {
    completion_value?: number;
    deleted?: boolean;
    file?: File | null;
};

export type AsyncServiceFunction = (...args: unknown[]) => Promise<unknown>;

export type ServiceModule = Record<string, unknown>;

export type ActivityResponse = {
    id?: number;
    lesson_block_id?: number;
    lessonBlockId?: number;
    enrollment_id?: number;
    enrollmentId?: number;
    user_id?: number;
    userId?: number;
    response?: string | Record<string, unknown> | null;
    answer?: string | null;
    content?: string | null;
    message?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    enrollment?: {
        id?: number;
        user?: {
            id?: number;
            firstname?: string | null;
            lastname?: string | null;
            email?: string | null;
        } | null;
    } | null;
    user?: {
        id?: number;
        firstname?: string | null;
        lastname?: string | null;
        email?: string | null;
    } | null;
};