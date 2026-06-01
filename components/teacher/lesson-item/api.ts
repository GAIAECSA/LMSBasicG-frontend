import * as ForumResponseService from "@/services/forum-response.service";
import * as SurveyResponseService from "@/services/survey-response.service";
import type {
    ActivityResponse,
    AsyncServiceFunction,
    ServiceModule,
} from "./types";

export function getServiceFunction(
    service: ServiceModule,
    names: string[],
    label: string,
): AsyncServiceFunction {
    for (const name of names) {
        const value = service[name];

        if (typeof value === "function") {
            return value as AsyncServiceFunction;
        }
    }

    throw new Error(
        `No se encontró la función para ${label}. Revisa que el servicio exporte una de estas funciones: ${names.join(", ")}.`,
    );
}

export async function callService<T>(
    service: ServiceModule,
    names: string[],
    label: string,
    argSets: unknown[][],
): Promise<T> {
    const fn = getServiceFunction(service, names, label);
    let lastError: unknown = null;

    for (const args of argSets) {
        try {
            return (await fn(...args)) as T;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error(`No se pudo ejecutar ${label}.`);
}

export function normalizeList<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];

    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;

        if (Array.isArray(record.data)) return record.data as T[];
        if (Array.isArray(record.items)) return record.items as T[];
        if (Array.isArray(record.results)) return record.results as T[];
    }

    return [];
}

export async function getSurveyResponsesByBlock(blockId: number) {
    const response = await callService<unknown>(
        SurveyResponseService as ServiceModule,
        [
            "getSurveyResponsesByLessonBlock",
            "getSurveyResponsesByBlock",
            "getSurveyResponsesByLessonBlockId",
            "getByLessonBlock",
        ],
        "consultar respuestas de encuesta",
        [[blockId], [{ lesson_block_id: blockId }]],
    );

    return normalizeList<ActivityResponse>(response);
}

export async function getForumResponsesByBlock(blockId: number) {
    const response = await callService<unknown>(
        ForumResponseService as ServiceModule,
        [
            "getForumResponsesByLessonBlock",
            "getForumResponsesByBlock",
            "getForumResponsesByLessonBlockId",
            "getByLessonBlock",
        ],
        "consultar respuestas de foro",
        [[blockId], [{ lesson_block_id: blockId }]],
    );

    return normalizeList<ActivityResponse>(response);
}