import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const SURVEY_RESPONSE_ENDPOINT = `${API_URL}/api/v1/survey-response`;

export type SurveyJson = Record<string, unknown>;

export type SurveyResponsePayload = {
    enrollment_id: number;
    lesson_block_id: number;
    survey: SurveyJson;
    response: SurveyJson;
    score?: number;
};

export type UpdateSurveyResponsePayload = {
    survey?: SurveyJson;
    response?: SurveyJson;
    score?: number;
    deleted?: boolean;
};

export type SurveyResponse = {
    id: number;
    enrollment_id: number;
    lesson_block_id: number;
    survey: SurveyJson;
    response: SurveyJson;
    score: string | number | null;
    deleted: boolean;
    created_at?: string;
};

export async function getAllSurveyResponses(): Promise<SurveyResponse[]> {
    const response = await fetch(`${SURVEY_RESPONSE_ENDPOINT}/`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    const data = await handleApiResponse<SurveyResponse[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function createSurveyResponse(
    payload: SurveyResponsePayload,
): Promise<SurveyResponse> {
    validateId(payload.enrollment_id, "ID de matrícula");
    validateId(payload.lesson_block_id, "ID del bloque");

    const response = await fetch(`${SURVEY_RESPONSE_ENDPOINT}/`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });

    return handleApiResponse<SurveyResponse>(response);
}

export async function getSurveyResponse(
    surveyResponseId: number,
): Promise<SurveyResponse> {
    const validSurveyResponseId = validateId(
        surveyResponseId,
        "ID de respuesta de encuesta",
    );

    const response = await fetch(
        `${SURVEY_RESPONSE_ENDPOINT}/${validSurveyResponseId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<SurveyResponse>(response);
}

export async function updateSurveyResponse(
    surveyResponseId: number,
    payload: UpdateSurveyResponsePayload,
): Promise<SurveyResponse> {
    const validSurveyResponseId = validateId(
        surveyResponseId,
        "ID de respuesta de encuesta",
    );

    const response = await fetch(
        `${SURVEY_RESPONSE_ENDPOINT}/${validSurveyResponseId}`,
        {
            method: "PUT",
            headers: getJsonHeaders(),
            body: JSON.stringify(payload),
        },
    );

    return handleApiResponse<SurveyResponse>(response);
}

export async function deleteSurveyResponse(
    surveyResponseId: number,
): Promise<SurveyResponse> {
    const validSurveyResponseId = validateId(
        surveyResponseId,
        "ID de respuesta de encuesta",
    );

    const response = await fetch(
        `${SURVEY_RESPONSE_ENDPOINT}/${validSurveyResponseId}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
        },
    );

    return handleApiResponse<SurveyResponse>(response);
}

export async function getSurveyResponsesByEnrollment(
    enrollmentId: number,
): Promise<SurveyResponse[]> {
    const validEnrollmentId = validateId(enrollmentId, "ID de matrícula");

    const response = await fetch(
        `${SURVEY_RESPONSE_ENDPOINT}/enrollment/${validEnrollmentId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<SurveyResponse[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function getSurveyResponsesByLessonBlock(
    lessonBlockId: number,
): Promise<SurveyResponse[]> {
    const validLessonBlockId = validateId(lessonBlockId, "ID del bloque");

    const response = await fetch(
        `${SURVEY_RESPONSE_ENDPOINT}/lesson-block/${validLessonBlockId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<SurveyResponse[]>(response);

    return Array.isArray(data) ? data : [];
}