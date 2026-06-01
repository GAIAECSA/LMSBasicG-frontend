import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const FORUM_RESPONSE_ENDPOINT = `${API_URL}/api/v1/forum-response`;

export type ForumResponsePayload = {
    enrollment_id: number;
    lesson_block_id: number;
    comment: string;
    forum_response_id?: number | null;
};

export type UpdateForumResponsePayload = {
    comment?: string;
    deleted?: boolean;
};

export type ForumResponse = {
    id: number;
    enrollment_id: number;
    lesson_block_id: number;
    comment: string;
    forum_response_id: number | null;
    deleted: boolean;
    created_at?: string;
};

export async function getAllForumResponses(): Promise<ForumResponse[]> {
    const response = await fetch(`${FORUM_RESPONSE_ENDPOINT}/`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    const data = await handleApiResponse<ForumResponse[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function createForumResponse(
    payload: ForumResponsePayload,
): Promise<ForumResponse> {
    const validEnrollmentId = validateId(
        payload.enrollment_id,
        "ID de matrícula",
    );

    const validLessonBlockId = validateId(
        payload.lesson_block_id,
        "ID del bloque",
    );

    const comment = String(payload.comment ?? "").trim();

    if (!comment) {
        throw new Error("Escribe tu participación antes de publicar.");
    }

    const body = {
        enrollment_id: validEnrollmentId,
        lesson_block_id: validLessonBlockId,
        comment,
        forum_response_id: payload.forum_response_id ?? null,
    };

    const response = await fetch(`${FORUM_RESPONSE_ENDPOINT}/`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(body),
    });

    return handleApiResponse<ForumResponse>(response);
}

export async function getForumResponse(
    forumResponseId: number,
): Promise<ForumResponse> {
    const validForumResponseId = validateId(
        forumResponseId,
        "ID de respuesta de foro",
    );

    const response = await fetch(
        `${FORUM_RESPONSE_ENDPOINT}/${validForumResponseId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<ForumResponse>(response);
}

export async function updateForumResponse(
    forumResponseId: number,
    payload: UpdateForumResponsePayload,
): Promise<ForumResponse> {
    const validForumResponseId = validateId(
        forumResponseId,
        "ID de respuesta de foro",
    );

    const response = await fetch(
        `${FORUM_RESPONSE_ENDPOINT}/${validForumResponseId}`,
        {
            method: "PUT",
            headers: getJsonHeaders(),
            body: JSON.stringify(payload),
        },
    );

    return handleApiResponse<ForumResponse>(response);
}

export async function deleteForumResponse(
    forumResponseId: number,
): Promise<ForumResponse> {
    const validForumResponseId = validateId(
        forumResponseId,
        "ID de respuesta de foro",
    );

    const response = await fetch(
        `${FORUM_RESPONSE_ENDPOINT}/${validForumResponseId}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
        },
    );

    return handleApiResponse<ForumResponse>(response);
}

export async function getForumResponsesByLessonBlock(
    lessonBlockId: number,
): Promise<ForumResponse[]> {
    const validLessonBlockId = validateId(lessonBlockId, "ID del bloque");

    const response = await fetch(
        `${FORUM_RESPONSE_ENDPOINT}/lesson-block/${validLessonBlockId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<ForumResponse[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function getForumReplies(
    forumResponseId: number,
): Promise<ForumResponse[]> {
    const validForumResponseId = validateId(
        forumResponseId,
        "ID de respuesta de foro",
    );

    const response = await fetch(
        `${FORUM_RESPONSE_ENDPOINT}/replies/${validForumResponseId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<ForumResponse[]>(response);

    return Array.isArray(data) ? data : [];
}

