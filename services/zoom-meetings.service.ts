import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
} from "@/services/api-client.service";

const ZOOM_API_URL = (
    process.env.NEXT_PUBLIC_ZOOM_API_URL ??
    API_URL
).replace(/\/+$/, "");

const ZOOM_API_PATH =
    "/api/v1/zoom";

export type ZoomMeeting = {
    id: number;
    course_id: number;
    teacher_id: number;
    zoom_meeting_id: string;
    zoom_host_user_id: string;
    topic: string;
    start_time: string;
    duration: number;
    timezone: string;
    password: string;
    join_url: string;
    created_at: string;
    updated_at: string;
};

export type CreateZoomMeetingPayload = {
    course_id: number;
    topic: string;
    start_time: string;
    duration: number;
    timezone: string;
    password: string;
};

export type UpdateZoomMeetingPayload = {
    topic?: string;
    start_time?: string;
    duration?: number;
    timezone?: string;
    password?: string;
};

export type StartZoomMeetingResponse = {
    meeting_id: number;
    zoom_meeting_id: string;
    start_url: string;
};

/*
 * Se utiliza en el módulo general para consultar las reuniones
 * de varios cursos sin depender de un endpoint /my-meetings.
 */
export type ZoomCourseReference = {
    id: number;
    name?: string | null;
};

export type ZoomMeetingWithCourse =
    ZoomMeeting & {
        course_name?: string | null;
    };

function normalizeCourseId(
    courseId: number,
): number {
    const numericCourseId =
        Number(
            courseId,
        );

    if (
        !Number.isInteger(
            numericCourseId,
        ) ||
        numericCourseId <= 0
    ) {
        throw new Error(
            "El identificador del curso no es válido.",
        );
    }

    return numericCourseId;
}

function normalizeMeetingId(
    meetingId: number | string,
): string {
    const normalizedMeetingId =
        String(
            meetingId,
        ).trim();

    if (!normalizedMeetingId) {
        throw new Error(
            "El identificador de la reunión no es válido.",
        );
    }

    return encodeURIComponent(
        normalizedMeetingId,
    );
}

function normalizeTopic(
    topic: string,
): string {
    const normalizedTopic =
        topic.trim();

    if (!normalizedTopic) {
        throw new Error(
            "Debes ingresar el tema de la reunión.",
        );
    }

    return normalizedTopic;
}

function normalizeStartTime(
    startTime: string,
): string {
    const normalizedStartTime =
        startTime.trim();

    if (
        !normalizedStartTime ||
        Number.isNaN(
            Date.parse(
                normalizedStartTime,
            ),
        )
    ) {
        throw new Error(
            "La fecha y hora de inicio no son válidas.",
        );
    }

    return normalizedStartTime;
}

function normalizeDuration(
    duration: number,
): number {
    const numericDuration =
        Number(
            duration,
        );

    if (
        !Number.isInteger(
            numericDuration,
        ) ||
        numericDuration <= 0
    ) {
        throw new Error(
            "La duración debe ser un número entero mayor a cero.",
        );
    }

    return numericDuration;
}

function normalizeTimezone(
    timezone?: string,
): string {
    return (
        timezone?.trim() ||
        "America/Guayaquil"
    );
}

function validateZoomUrl(
    value: string,
    label: string,
): string {
    const normalizedValue =
        value.trim();

    if (!normalizedValue) {
        throw new Error(
            `El backend no devolvió ${label}.`,
        );
    }

    let zoomUrl: URL;

    try {
        zoomUrl =
            new URL(
                normalizedValue,
            );
    } catch {
        throw new Error(
            `${label} no es una URL válida.`,
        );
    }

    if (
        zoomUrl.protocol !==
        "https:"
    ) {
        throw new Error(
            `${label} debe utilizar HTTPS.`,
        );
    }

    const hostname =
        zoomUrl.hostname.toLowerCase();

    const validHostname =
        hostname === "zoom.us" ||
        hostname.endsWith(
            ".zoom.us",
        );

    if (!validHostname) {
        throw new Error(
            `${label} no pertenece a un dominio autorizado de Zoom.`,
        );
    }

    return zoomUrl.toString();
}

/*
 * POST /api/v1/zoom/meetings
 *
 * Solo docente.
 * Crea una nueva reunión de Zoom vinculada con un curso.
 */
export async function createZoomMeeting(
    payload: CreateZoomMeetingPayload,
): Promise<ZoomMeeting> {
    const response =
        await fetch(
            `${ZOOM_API_URL}${ZOOM_API_PATH}/meetings`,
            {
                method: "POST",
                headers:
                    getJsonHeaders(),
                body:
                    JSON.stringify({
                        course_id:
                            normalizeCourseId(
                                payload.course_id,
                            ),
                        topic:
                            normalizeTopic(
                                payload.topic,
                            ),
                        start_time:
                            normalizeStartTime(
                                payload.start_time,
                            ),
                        duration:
                            normalizeDuration(
                                payload.duration,
                            ),
                        timezone:
                            normalizeTimezone(
                                payload.timezone,
                            ),
                        password:
                            payload.password.trim(),
                    }),
                cache: "no-store",
            },
        );

    return handleApiResponse<ZoomMeeting>(
        response,
    );
}

/*
 * GET /api/v1/zoom/courses/{course_id}/meetings
 *
 * Docente y estudiantes matriculados.
 * Devuelve las reuniones vinculadas con un curso específico.
 */
export async function listZoomMeetingsByCourse(
    courseId: number,
): Promise<ZoomMeeting[]> {
    const validCourseId =
        normalizeCourseId(
            courseId,
        );

    const response =
        await fetch(
            `${ZOOM_API_URL}${ZOOM_API_PATH}/courses/${validCourseId}/meetings`,
            {
                method: "GET",
                headers:
                    getJsonHeaders(),
                cache: "no-store",
            },
        );

    return handleApiResponse<ZoomMeeting[]>(
        response,
    );
}

/*
 * Consulta reuniones de varios cursos utilizando exclusivamente:
 *
 * GET /api/v1/zoom/courses/{course_id}/meetings
 *
 * Esta función reemplaza el uso incorrecto de /my-meetings.
 */
export async function listZoomMeetingsByCourses(
    courses: ZoomCourseReference[],
): Promise<ZoomMeetingWithCourse[]> {
    const uniqueCourses =
        new Map<
            number,
            ZoomCourseReference
        >();

    courses.forEach(
        (
            course,
        ) => {
            const courseId =
                Number(
                    course.id,
                );

            if (
                !Number.isInteger(
                    courseId,
                ) ||
                courseId <= 0
            ) {
                return;
            }

            uniqueCourses.set(
                courseId,
                {
                    id:
                        courseId,
                    name:
                        course.name?.trim() ||
                        null,
                },
            );
        },
    );

    const validCourses =
        Array.from(
            uniqueCourses.values(),
        );

    if (
        validCourses.length ===
        0
    ) {
        return [];
    }

    const results =
        await Promise.allSettled(
            validCourses.map(
                async (
                    course,
                ) => {
                    const meetings =
                        await listZoomMeetingsByCourse(
                            course.id,
                        );

                    return (
                        Array.isArray(
                            meetings,
                        )
                            ? meetings
                            : []
                    ).map(
                        (
                            meeting,
                        ) => ({
                            ...meeting,
                            course_name:
                                course.name ??
                                null,
                        }),
                    );
                },
            ),
        );

    return results.flatMap(
        (
            result,
        ) =>
            result.status ===
                "fulfilled"
                ? result.value
                : [],
    );
}



/*
 * GET /api/v1/zoom/meetings/{meeting_id}
 *
 * Consulta una reunión mediante su identificador interno
 * o mediante el zoom_meeting_id.
 */
export async function getZoomMeeting(
    meetingId: number | string,
): Promise<ZoomMeeting> {
    const validMeetingId =
        normalizeMeetingId(
            meetingId,
        );

    const response =
        await fetch(
            `${ZOOM_API_URL}${ZOOM_API_PATH}/meetings/${validMeetingId}`,
            {
                method: "GET",
                headers:
                    getJsonHeaders(),
                cache: "no-store",
            },
        );

    return handleApiResponse<ZoomMeeting>(
        response,
    );
}

/*
 * PUT /api/v1/zoom/meetings/{meeting_id}
 *
 * Solo docente.
 * Actualiza los datos modificados de una reunión.
 */
export async function updateZoomMeeting(
    meetingId: number | string,
    payload: UpdateZoomMeetingPayload,
): Promise<ZoomMeeting> {
    const validMeetingId =
        normalizeMeetingId(
            meetingId,
        );

    const body: UpdateZoomMeetingPayload =
        {};

    if (
        payload.topic !==
        undefined
    ) {
        body.topic =
            normalizeTopic(
                payload.topic,
            );
    }

    if (
        payload.start_time !==
        undefined
    ) {
        body.start_time =
            normalizeStartTime(
                payload.start_time,
            );
    }

    if (
        payload.duration !==
        undefined
    ) {
        body.duration =
            normalizeDuration(
                payload.duration,
            );
    }

    if (
        payload.timezone !==
        undefined
    ) {
        body.timezone =
            normalizeTimezone(
                payload.timezone,
            );
    }

    if (
        payload.password !==
        undefined
    ) {
        body.password =
            payload.password.trim();
    }

    if (
        Object.keys(
            body,
        ).length === 0
    ) {
        throw new Error(
            "No existen cambios para actualizar la reunión.",
        );
    }

    const response =
        await fetch(
            `${ZOOM_API_URL}${ZOOM_API_PATH}/meetings/${validMeetingId}`,
            {
                method: "PUT",
                headers:
                    getJsonHeaders(),
                body:
                    JSON.stringify(
                        body,
                    ),
                cache: "no-store",
            },
        );

    return handleApiResponse<ZoomMeeting>(
        response,
    );
}

/*
 * DELETE /api/v1/zoom/meetings/{meeting_id}
 *
 * Solo docente.
 * Elimina la reunión en Zoom y la marca como eliminada
 * dentro de la base de datos del LMS.
 */
export async function deleteZoomMeeting(
    meetingId: number | string,
): Promise<void> {
    const validMeetingId =
        normalizeMeetingId(
            meetingId,
        );

    const response =
        await fetch(
            `${ZOOM_API_URL}${ZOOM_API_PATH}/meetings/${validMeetingId}`,
            {
                method: "DELETE",
                headers:
                    getJsonHeaders(),
                cache: "no-store",
            },
        );

    if (
        response.status ===
        204
    ) {
        return;
    }

    await handleApiResponse<unknown>(
        response,
    );
}

/*
 * GET /api/v1/zoom/meetings/{meeting_id}/start
 *
 * Solo docente.
 * Obtiene un start_url actualizado directamente desde Zoom.
 */
export async function getZoomMeetingStartUrl(
    meetingId: number | string,
): Promise<StartZoomMeetingResponse> {
    const validMeetingId =
        normalizeMeetingId(
            meetingId,
        );

    const response =
        await fetch(
            `${ZOOM_API_URL}${ZOOM_API_PATH}/meetings/${validMeetingId}/start`,
            {
                method: "GET",
                headers:
                    getJsonHeaders(),
                cache: "no-store",
            },
        );

    const data =
        await handleApiResponse<StartZoomMeetingResponse>(
            response,
        );

    return {
        ...data,
        start_url:
            validateZoomUrl(
                data.start_url,
                "el enlace para iniciar la reunión",
            ),
    };
}

/*
 * Abre el join_url guardado en la reunión.
 *
 * Se utiliza para que el estudiante ingrese a la clase.
 */
export function openZoomMeetingForStudent(
    joinUrl: string,
): boolean {
    if (
        typeof window ===
        "undefined"
    ) {
        throw new Error(
            "Zoom solamente puede abrirse desde el navegador.",
        );
    }

    const validJoinUrl =
        validateZoomUrl(
            joinUrl,
            "el enlace para ingresar a la reunión",
        );

    const zoomWindow =
        window.open(
            validJoinUrl,
            "_blank",
            "noopener,noreferrer",
        );

    return Boolean(
        zoomWindow,
    );
}

/*
 * Consulta un start_url actualizado y luego abre Zoom.
 *
 * Se utiliza para que el docente inicie la clase.
 */
export async function openZoomMeetingForTeacher(
    meetingId: number | string,
): Promise<boolean> {
    if (
        typeof window ===
        "undefined"
    ) {
        throw new Error(
            "Zoom solamente puede abrirse desde el navegador.",
        );
    }

    /*
     * La pestaña se abre inmediatamente después del clic.
     * Esto evita que el navegador la bloquee mientras espera
     * la respuesta del backend.
     */
    const zoomWindow =
        window.open(
            "about:blank",
            "_blank",
        );

    if (!zoomWindow) {
        return false;
    }

    try {
        zoomWindow.opener =
            null;

        const data =
            await getZoomMeetingStartUrl(
                meetingId,
            );

        zoomWindow.location.replace(
            data.start_url,
        );

        return true;
    } catch (error) {
        zoomWindow.close();

        throw error;
    }
}