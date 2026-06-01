import * as HomeworkResponseService from "@/services/homework-response.service";
import type {
    AsyncServiceFunction,
    GradeResponse,
    ServiceModule,
} from "./types";

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

export async function getHomeworkResponsesByLessonBlockFlexible(
    blockId: number,
): Promise<GradeResponse[]> {
    const value = await callService<unknown>(
        HomeworkResponseService as ServiceModule,
        [
            "getHomeworkResponsesByLessonBlock",
            "getHomeworkResponsesByBlock",
            "getHomeworkResponsesByLessonBlockId",
            "getByLessonBlock",
            "getHomeworkResponseByLessonBlock",
        ],
        "consultar respuestas de tareas",
        [[blockId], [{ lesson_block_id: blockId }]],
    );

    return normalizeList<GradeResponse>(value);
}

export async function updateHomeworkResponseFlexible(
    responseId: number,
    payload: Record<string, unknown>,
): Promise<unknown> {
    return callService<unknown>(
        HomeworkResponseService as ServiceModule,
        [
            "updateHomeworkResponse",
            "updateHomeworkResponseById",
            "updateResponse",
            "gradeHomeworkResponse",
        ],
        "actualizar calificación de tarea",
        [
            [responseId, payload],
            [{ id: responseId, ...payload }],
        ],
    );
}