import {
    API_URL,
    appendFormValue,
    getFormUrlEncodedHeaders,
    getJsonHeaders,
    getMultipartHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const HOMEWORK_RESPONSE_ENDPOINT = `${API_URL}/api/v1/homework-response/homework-response`;

export type HomeworkResponseStatus =
    | "PENDIENTE"
    | "ENTREGADO"
    | "CALIFICADO"
    | "RECHAZADO"
    | "APROBADO"
    | "RECHAZADA"
    | string;

export type HomeworkResponse = {
    id: number;
    enrollment_id: number;
    lesson_block_id: number;
    submitted_file_url: string | null;
    submitted_filename: string | null;
    comment: string | null;
    score: string | number | null;
    status: HomeworkResponseStatus | null;
    deleted: boolean;
    created_at?: string | null;
    updated_at?: string | null;
};

export type CreateHomeworkResponsePayload = {
    enrollment_id: number;
    lesson_block_id: number;
    comment?: string | null;
    status?: HomeworkResponseStatus | null;
    file?: File | Blob | null;
};

export type UpdateHomeworkResponsePayload = {
    comment?: string | null;
    status?: HomeworkResponseStatus | null;
    file?: File | Blob | null;
};

export type GradeHomeworkResponsePayload = {
    score: number | string;
    comment?: string | null;
    status?: HomeworkResponseStatus | null;
};

function appendOptionalFile(
    formData: FormData,
    file?: File | Blob | null,
): void {
    if (!file) return;

    const isFile = typeof File !== "undefined" && file instanceof File;
    const isBlob = typeof Blob !== "undefined" && file instanceof Blob;

    if (!isFile && !isBlob) {
        throw new Error("El archivo seleccionado no es válido.");
    }

    formData.append("file", file);
}

function buildCreateFormData(
    payload: CreateHomeworkResponsePayload,
): FormData {
    const data = new FormData();

    appendFormValue(
        data,
        "enrollment_id",
        validateId(payload.enrollment_id, "ID de matrícula"),
    );

    appendFormValue(
        data,
        "lesson_block_id",
        validateId(payload.lesson_block_id, "ID del bloque"),
    );

    if (payload.comment !== undefined && payload.comment !== null) {
        appendFormValue(data, "comment", payload.comment);
    }

    /*
     * Al crear una entrega mediante POST, siempre debe enviarse
     * el estado ENTREGADO, salvo que se indique otro estado explícitamente.
     */
    appendFormValue(
        data,
        "status",
        payload.status ?? "ENTREGADO",
    );

    appendOptionalFile(data, payload.file);

    return data;
}

function buildUpdateFormData(
    payload: UpdateHomeworkResponsePayload,
): FormData {
    const data = new FormData();

    if (payload.comment !== undefined && payload.comment !== null) {
        appendFormValue(data, "comment", payload.comment);
    }

    /*
     * Al reemplazar un archivo mediante PUT, también se establece
     * automáticamente el estado ENTREGADO.
     */
    const status =
        payload.status ??
        (payload.file ? "ENTREGADO" : undefined);

    if (status !== undefined && status !== null) {
        appendFormValue(data, "status", status);
    }

    appendOptionalFile(data, payload.file);

    return data;
}

function buildGradeBody(
    payload: GradeHomeworkResponsePayload,
): URLSearchParams {
    const data = new URLSearchParams();

    data.set("score", String(payload.score));

    if (payload.comment !== undefined && payload.comment !== null) {
        data.set("comment", payload.comment);
    }

    if (payload.status !== undefined && payload.status !== null) {
        data.set("status", payload.status);
    }

    return data;
}

function isActiveHomeworkResponse(
    response: HomeworkResponse,
): boolean {
    return response.deleted !== true;
}

export async function createHomeworkResponse(
    payload: CreateHomeworkResponsePayload,
): Promise<HomeworkResponse> {
    const response = await fetch(HOMEWORK_RESPONSE_ENDPOINT, {
        method: "POST",
        headers: getMultipartHeaders(),
        body: buildCreateFormData(payload),
    });

    return handleApiResponse<HomeworkResponse>(response);
}

export async function updateHomeworkResponse(
    homeworkResponseId: number,
    payload: UpdateHomeworkResponsePayload,
): Promise<HomeworkResponse> {
    const validHomeworkResponseId = validateId(
        homeworkResponseId,
        "ID de respuesta de tarea",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/${validHomeworkResponseId}`,
        {
            method: "PUT",
            headers: getMultipartHeaders(),
            body: buildUpdateFormData(payload),
        },
    );

    return handleApiResponse<HomeworkResponse>(response);
}

export async function deleteHomeworkResponse(
    homeworkResponseId: number,
): Promise<HomeworkResponse> {
    const validHomeworkResponseId = validateId(
        homeworkResponseId,
        "ID de respuesta de tarea",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/${validHomeworkResponseId}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
        },
    );

    return handleApiResponse<HomeworkResponse>(response);
}

export async function getHomeworkResponse(
    homeworkResponseId: number,
): Promise<HomeworkResponse> {
    const validHomeworkResponseId = validateId(
        homeworkResponseId,
        "ID de respuesta de tarea",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/${validHomeworkResponseId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<HomeworkResponse>(response);
}

export async function gradeHomeworkResponse(
    homeworkResponseId: number,
    payload: GradeHomeworkResponsePayload,
): Promise<HomeworkResponse> {
    const validHomeworkResponseId = validateId(
        homeworkResponseId,
        "ID de respuesta de tarea",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/${validHomeworkResponseId}/grade`,
        {
            method: "PUT",
            headers: getFormUrlEncodedHeaders(),
            body: buildGradeBody(payload),
        },
    );

    return handleApiResponse<HomeworkResponse>(response);
}

export async function getHomeworkResponsesByEnrollment(
    enrollmentId: number,
): Promise<HomeworkResponse[]> {
    const validEnrollmentId = validateId(
        enrollmentId,
        "ID de matrícula",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/enrollment/${validEnrollmentId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<HomeworkResponse[]>(
        response,
    );

    return Array.isArray(data)
        ? data.filter(isActiveHomeworkResponse)
        : [];
}

export async function getHomeworkResponsesByLessonBlock(
    lessonBlockId: number,
): Promise<HomeworkResponse[]> {
    const validLessonBlockId = validateId(
        lessonBlockId,
        "ID del bloque",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/lesson-block/${validLessonBlockId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<HomeworkResponse[]>(
        response,
    );

    return Array.isArray(data)
        ? data.filter(isActiveHomeworkResponse)
        : [];
}

export async function getHomeworkResponseByEnrollmentAndBlock(
    enrollmentId: number,
    lessonBlockId: number,
): Promise<HomeworkResponse> {
    const validEnrollmentId = validateId(
        enrollmentId,
        "ID de matrícula",
    );

    const validLessonBlockId = validateId(
        lessonBlockId,
        "ID del bloque",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/enrollment/${validEnrollmentId}/lesson-block/${validLessonBlockId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<HomeworkResponse>(response);
}

export async function getHomeworkResponsesByCourse(
    courseId: number,
): Promise<HomeworkResponse[]> {
    const validCourseId = validateId(
        courseId,
        "ID de curso",
    );

    const response = await fetch(
        `${HOMEWORK_RESPONSE_ENDPOINT}/course/${validCourseId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<HomeworkResponse[]>(
        response,
    );

    return Array.isArray(data)
        ? data.filter(isActiveHomeworkResponse)
        : [];
}