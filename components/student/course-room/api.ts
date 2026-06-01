import type { LessonBlock } from "@/services/lessons.service";
import * as HomeworkResponseService from "@/services/homework-response.service";
import * as SurveyResponseService from "@/services/survey-response.service";
import * as ForumResponseService from "@/services/forum-response.service";
import type {
    AsyncServiceFunction,
    ServiceModule,
    StudentBlockResponse,
    StudentResponseMaps,
} from "./types";
import {
    getLessonItemType,
    normalizeList,
    responseBelongsToEnrollment,
} from "./utils";

type FlexiblePayload = Record<string, unknown>;

function getServiceFunction(
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
        `No se encontró la función para ${label}. Revisa que el servicio exporte una de estas funciones: ${names.join(
            ", ",
        )}.`,
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

function getPayloadNumber(
    payload: FlexiblePayload,
    keys: string[],
    label: string,
): number {
    for (const key of keys) {
        const value = payload[key];

        if (value === undefined || value === null || value === "") {
            continue;
        }

        const numericValue = Number(value);

        if (Number.isFinite(numericValue) && numericValue > 0) {
            return numericValue;
        }
    }

    throw new Error(`${label} no válido.`);
}

function getPayloadText(
    payload: FlexiblePayload,
    keys: string[],
): string | null {
    for (const key of keys) {
        const value = payload[key];

        if (typeof value === "string") {
            const cleanValue = value.trim();

            if (cleanValue) return cleanValue;
        }

        if (typeof value === "number") {
            return String(value);
        }
    }

    return null;
}

function isUploadFile(value: unknown): value is File | Blob {
    if (!value) return false;

    const isFile =
        typeof File !== "undefined" && value instanceof File;

    const isBlob =
        typeof Blob !== "undefined" && value instanceof Blob;

    return isFile || isBlob;
}

function getPayloadFile(payload: FlexiblePayload): File | Blob | null {
    const possibleValues = [
        payload.file,
        payload.homeworkFile,
        payload.evidenceFile,
        payload.submitted_file,
        payload.submittedFile,
    ];

    for (const value of possibleValues) {
        if (isUploadFile(value)) {
            return value;
        }
    }

    return null;
}

function buildHomeworkCreatePayload(payload: FlexiblePayload): FlexiblePayload {
    const enrollmentId = getPayloadNumber(
        payload,
        ["enrollment_id", "enrollmentId"],
        "ID de matrícula",
    );

    const lessonBlockId = getPayloadNumber(
        payload,
        ["lesson_block_id", "lessonBlockId", "block_id", "blockId"],
        "ID del bloque",
    );

    const comment = getPayloadText(payload, [
        "comment",
        "answer",
        "text",
        "responseText",
    ]);

    const file = getPayloadFile(payload);

    const formPayload: FlexiblePayload = {
        enrollment_id: enrollmentId,
        lesson_block_id: lessonBlockId,
    };

    if (comment !== null) {
        formPayload.comment = comment;
    }

    if (file) {
        formPayload.file = file;
    }

    return formPayload;
}

function buildHomeworkUpdatePayload(payload: FlexiblePayload): FlexiblePayload {
    const comment = getPayloadText(payload, [
        "comment",
        "answer",
        "text",
        "responseText",
    ]);

    const status = getPayloadText(payload, ["status"]);
    const file = getPayloadFile(payload);

    const formPayload: FlexiblePayload = {};

    if (comment !== null) {
        formPayload.comment = comment;
    }

    if (status !== null) {
        formPayload.status = status;
    }

    if (file) {
        formPayload.file = file;
    }

    return formPayload;
}

export async function getHomeworkResponsesByBlock(blockId: number) {
    const value = await callService<unknown>(
        HomeworkResponseService as ServiceModule,
        [
            "getHomeworkResponsesByLessonBlock",
            "getHomeworkResponsesByBlock",
            "getHomeworkResponsesByLessonBlockId",
            "getByLessonBlock",
        ],
        "consultar respuestas de tarea",
        [[blockId], [{ lesson_block_id: blockId }]],
    );

    return normalizeList<StudentBlockResponse>(value);
}

export async function getSurveyResponsesByBlock(blockId: number) {
    const value = await callService<unknown>(
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

    return normalizeList<StudentBlockResponse>(value);
}

export async function getForumResponsesByBlock(blockId: number) {
    const value = await callService<unknown>(
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

    return normalizeList<StudentBlockResponse>(value);
}

export async function createHomeworkResponseFlexible(
    payload: FlexiblePayload,
) {
    const normalizedPayload = buildHomeworkCreatePayload(payload);

    return callService<StudentBlockResponse>(
        HomeworkResponseService as ServiceModule,
        [
            "createHomeworkResponse",
            "saveHomeworkResponse",
            "submitHomeworkResponse",
            "createResponse",
        ],
        "guardar respuesta de tarea",
        [[normalizedPayload]],
    );
}

export async function updateHomeworkResponseFlexible(
    responseId: number,
    payload: FlexiblePayload,
) {
    const normalizedPayload = buildHomeworkUpdatePayload(payload);

    return callService<StudentBlockResponse>(
        HomeworkResponseService as ServiceModule,
        [
            "updateHomeworkResponse",
            "updateHomeworkResponseById",
            "updateResponse",
        ],
        "actualizar respuesta de tarea",
        [[responseId, normalizedPayload]],
    );
}

export async function createSurveyResponseFlexible(
    payload: FlexiblePayload,
) {
    return callService<StudentBlockResponse>(
        SurveyResponseService as ServiceModule,
        [
            "createSurveyResponse",
            "saveSurveyResponse",
            "submitSurveyResponse",
            "createResponse",
        ],
        "guardar respuesta de encuesta",
        [[payload]],
    );
}

export async function updateSurveyResponseFlexible(
    responseId: number,
    payload: FlexiblePayload,
) {
    return callService<StudentBlockResponse>(
        SurveyResponseService as ServiceModule,
        [
            "updateSurveyResponse",
            "updateSurveyResponseById",
            "updateResponse",
        ],
        "actualizar respuesta de encuesta",
        [[responseId, payload]],
    );
}

export async function createForumResponseFlexible(
    payload: FlexiblePayload,
) {
    return callService<StudentBlockResponse>(
        ForumResponseService as ServiceModule,
        [
            "createForumResponse",
            "saveForumResponse",
            "submitForumResponse",
            "createResponse",
        ],
        "guardar respuesta de foro",
        [[payload], [payload.lesson_block_id, payload]],
    );
}

function getResponseDateValue(response: StudentBlockResponse): number {
    const value = response.updated_at ?? response.created_at ?? "";
    const time = new Date(value).getTime();

    return Number.isFinite(time) ? time : 0;
}

function latestOwnResponse(
    responses: StudentBlockResponse[],
    enrollmentId: number,
) {
    return (
        responses
            .filter((response) =>
                responseBelongsToEnrollment(response, enrollmentId),
            )
            .sort(
                (a, b) =>
                    getResponseDateValue(b) - getResponseDateValue(a),
            )[0] ?? null
    );
}

export async function loadStudentResponseMaps(
    blocks: LessonBlock[],
    enrollmentId: number,
): Promise<StudentResponseMaps> {
    const maps: StudentResponseMaps = {
        homework: {},
        survey: {},
        forum: {},
    };

    await Promise.all(
        blocks.map(async (block) => {
            const type = getLessonItemType(block);

            try {
                if (type === "homework") {
                    const responses = await getHomeworkResponsesByBlock(
                        block.id,
                    );

                    maps.homework[block.id] = latestOwnResponse(
                        responses,
                        enrollmentId,
                    );
                }

                if (type === "survey") {
                    const responses = await getSurveyResponsesByBlock(
                        block.id,
                    );

                    maps.survey[block.id] = latestOwnResponse(
                        responses,
                        enrollmentId,
                    );
                }

                if (type === "forum") {
                    const responses = await getForumResponsesByBlock(block.id);

                    maps.forum[block.id] = responses.sort(
                        (a, b) =>
                            getResponseDateValue(b) -
                            getResponseDateValue(a),
                    );
                }
            } catch {
                if (type === "homework") {
                    maps.homework[block.id] = null;
                }

                if (type === "survey") {
                    maps.survey[block.id] = null;
                }

                if (type === "forum") {
                    maps.forum[block.id] = [];
                }
            }
        }),
    );

    return maps;
}