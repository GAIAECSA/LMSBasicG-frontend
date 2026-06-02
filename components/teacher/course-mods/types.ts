import type {
    Lesson as ApiLesson,
    LessonBlock,
    LessonBlockPayload,
} from "@/services/lessons.service";
import type { CourseModule as ApiCourseModule } from "@/services/modules.service";

export type TeacherCourseModulesPageProps = {
    courseId?: string;
    params?: {
        courseId?: string;
    };
};

export type LessonItemType =
    | "video"
    | "quiz"
    | "text"
    | "image"
    | "pdf"
    | "homework"
    | "survey"
    | "forum";

export type LessonCompletionType = "VER" | "RESPONDER" | "SUBIR";

export type CourseModuleView = {
    id: string;
    title: string;
    order: number;
    raw: ApiCourseModule;
    lessons: LessonView[];
};

export type LessonView = {
    id: string;
    title: string;
    order: number;
    moduleId: string;
    raw: ApiLesson;
    items: LessonItemView[];
};

export type LessonItemView = {
    id: string;
    title: string;
    type: LessonItemType;
    order: number;
    lessonId: string;
    raw: LessonBlock;

    default?: boolean;
    counts_toward_grade?: boolean;
    is_active?: boolean;
    content?: LessonBlock["content"];
    block_type_id?: number | string | null;
    completion_type?: LessonBlock["completion_type"];
    lesson_block_type?: {
        id?: number | string | null;
        key?: string | null;
    };
};

export type CreateModalState =
    | {
        type: "module";
    }
    | {
        type: "lesson";
        moduleId: string;
    }
    | {
        type: "item";
        lessonId: string;
        itemType: LessonItemType;
    };

export type EditModalState =
    | {
        type: "module";
        id: string;
    }
    | {
        type: "lesson";
        id: string;
        moduleId: string;
    }
    | {
        type: "item";
        id: string;
        lessonId: string;
        itemType: LessonItemType;
        raw: LessonBlock;
    };

export type DeleteModalState =
    | {
        type: "module";
        id: string;
        title: string;
    }
    | {
        type: "lesson";
        id: string;
        title: string;
    }
    | {
        type: "item";
        id: string;
        title: string;
    };

export type DragState =
    | {
        type: "module";
        id: string;
    }
    | {
        type: "lesson";
        id: string;
        moduleId: string;
    }
    | {
        type: "item";
        id: string;
        lessonId: string;
    };

export type LessonBlockWithOptionalType = LessonBlock & {
    block_type_id?: number | string | null;
    lesson_block_type?: {
        id?: number | string | null;
        key?: string | null;
    };
};

export type LessonBlockPayloadWithOptionalFile = Omit<
    LessonBlockPayload,
    "content" | "file"
> & {
    content?: LessonBlockPayload["content"];
    file?: File | null;
};

export type BlockFormState = {
    completion_type: LessonCompletionType;
    completion_value: string;
    order: string;
    default: boolean;
    counts_toward_grade: boolean;
    date_available: string;
    is_active: boolean;
    content: string;
    file: File | null;
};