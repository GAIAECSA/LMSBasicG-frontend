import type { LessonBlock } from "@/services/lessons.service";
import type { QuizzResponse, QuizzResponseByLessonBlock } from "@/services/quizz-response.service";
import { MAX_QUIZ_ATTEMPTS } from "./constants";
import type { QuizQuestion } from "./types";
import { getLessonItemType } from "./utils";

export function normalizeQuizQuestions(value: unknown): QuizQuestion[] {
    if (!Array.isArray(value)) return [];
    return value.map((question, index) => {
        const item = question as Partial<QuizQuestion>;
        return {
            id: typeof item.id === "number" ? item.id : index + 1,
            question: typeof item.question === "string" ? item.question : "",
            options: Array.isArray(item.options) ? item.options.map((option) => (typeof option === "string" ? option : "")) : [],
            correct_answer: typeof item.correct_answer === "number" ? item.correct_answer : 0,
            points: typeof item.points === "number" ? item.points : 1,
        };
    });
}

export function parseStoredQuizResponse(value: string | null | undefined) {
    if (!value) return { attempts: 0, history: [] as unknown[] };
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        const history = Array.isArray(parsed.history) ? parsed.history : Array.isArray(parsed.attempts_history) ? parsed.attempts_history : [];
        const attempts = Number(parsed.attempts);
        return {
            attempts: Number.isFinite(attempts) ? attempts : history.length > 0 ? history.length : 1,
            history,
        };
    } catch {
        return { attempts: 1, history: [] as unknown[] };
    }
}

export function getQuizResponseForBlock(responses: QuizzResponse[], lessonBlockId: number) {
    return responses.find((response) => Number(response.lesson_block_id) === lessonBlockId) ?? null;
}

export function mapLessonBlockQuizResponseToQuizResponse(item: QuizzResponseByLessonBlock): QuizzResponse {
    return {
        id: item.id,
        enrollment_id: Number(item.enrollment?.id),
        lesson_block_id: item.lesson_block_id,
        quizz: item.quizz,
        response: item.response,
        score: item.score,
        is_passed: item.is_passed,
        created_at: item.created_at,
    };
}

export function getQuizResponseForEnrollmentFromLessonBlock(responses: QuizzResponseByLessonBlock[], enrollmentId: number) {
    const foundResponse = responses.find((response) => Number(response.enrollment?.id) === enrollmentId);
    return foundResponse ? mapLessonBlockQuizResponseToQuizResponse(foundResponse) : null;
}

export function upsertQuizResponse(responses: QuizzResponse[], responseToSave: QuizzResponse) {
    const exists = responses.some((item) => item.id === responseToSave.id);
    return exists ? responses.map((item) => (item.id === responseToSave.id ? responseToSave : item)) : [...responses, responseToSave];
}

export function getQuizAttemptsCount(response: QuizzResponse | null) {
    if (!response) return 0;
    const parsed = parseStoredQuizResponse(response.response);
    return Math.max(parsed.attempts, parsed.history.length, 1);
}

export function getQuizLimitMessage(responses: QuizzResponse[], block: LessonBlock | null) {
    if (!block || getLessonItemType(block) !== "quiz") return "";
    const response = getQuizResponseForBlock(responses, block.id);
    return getQuizAttemptsCount(response) >= MAX_QUIZ_ATTEMPTS ? "Ya alcanzaste el máximo de 3 intentos para esta evaluación." : "";
}
