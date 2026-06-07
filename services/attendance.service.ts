import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const COURSE_ATTENDANCE_ENDPOINT = `${API_URL}/api/v1/course_attendance/course-attendance`;
const ATTENDANCE_ENDPOINT = `${API_URL}/api/v1/attendance/attendance`;

export type CourseAttendancePayload = {
    course_id: number;
    day: string;
    start_time: string;
    end_time: string;
};

export type CourseAttendance = {
    id: number;
    course_id: number;
    day: string;
    start_time: string;
    end_time: string;
};

export type AttendanceState = "PENDIENTE" | "PRESENTE" | "FALTA";

export type AttendancePayload = {
    enrollment_id?: number;
    course_attendance_id?: number;

    /**
     * Campo correcto enviado al backend.
     */
    attendance_state?: AttendanceState | string;

    /**
     * Se conserva para no romper llamadas anteriores.
     * El servicio lo transforma a attendance_state antes de enviar.
     */
    state?: AttendanceState | string;

    deleted?: boolean;
};

export type AttendanceUser = {
    id: number;
    firstname: string;
    lastname: string;
    role_id: number;
    idnumber?: string;
};

export type AttendanceEnrollment = {
    id: number;
    user?: AttendanceUser | null;
};

export type Attendance = {
    id: number;
    enrollment_id: number;
    course_attendance_id: number;

    /**
     * Campo real que viene del backend.
     */
    attendance_state: AttendanceState;

    /**
     * Alias para no romper pantallas que todavía leen state.
     */
    state?: AttendanceState;

    deleted: boolean;
    created_at?: string;
    updated_at?: string | null;
    enrollment?: AttendanceEnrollment | null;
};

export type AttendanceWithEnrollmentResponse = Attendance & {
    course_attendance?: CourseAttendance | null;
};

function normalizeAttendanceState(value: unknown): AttendanceState {
    const normalized = String(value ?? "PENDIENTE").trim().toUpperCase();

    if (
        normalized === "PRESENTE" ||
        normalized === "PRESENT" ||
        normalized === "PRESENTADO" ||
        normalized === "REGISTRADO"
    ) {
        return "PRESENTE";
    }

    if (
        normalized === "FALTA" ||
        normalized === "AUSENTE" ||
        normalized === "ABSENT"
    ) {
        return "FALTA";
    }

    return "PENDIENTE";
}

function normalizeAttendance(item: Attendance): Attendance {
    const attendanceState = normalizeAttendanceState(
        item.attendance_state ?? item.state,
    );

    return {
        ...item,
        attendance_state: attendanceState,
        state: attendanceState,
        deleted: Boolean(item.deleted),
        updated_at: item.updated_at ?? null,
    };
}

export async function createCourseAttendance(
    payload: CourseAttendancePayload,
): Promise<CourseAttendance> {
    validateId(payload.course_id, "ID del curso");

    const response = await fetch(COURSE_ATTENDANCE_ENDPOINT, {
        method: "POST",
        headers: getJsonHeaders(),
        cache: "no-store",
        body: JSON.stringify(payload),
    });

    return handleApiResponse<CourseAttendance>(response);
}

export async function updateCourseAttendance(
    attendanceId: number,
    payload: Partial<CourseAttendancePayload>,
): Promise<CourseAttendance> {
    const validAttendanceId = validateId(
        attendanceId,
        "ID de asistencia del curso",
    );

    const response = await fetch(
        `${COURSE_ATTENDANCE_ENDPOINT}/${validAttendanceId}`,
        {
            method: "PUT",
            headers: getJsonHeaders(),
            cache: "no-store",
            body: JSON.stringify(payload),
        },
    );

    return handleApiResponse<CourseAttendance>(response);
}

export async function deleteCourseAttendance(
    attendanceId: number,
): Promise<string> {
    const validAttendanceId = validateId(
        attendanceId,
        "ID de asistencia del curso",
    );

    const response = await fetch(
        `${COURSE_ATTENDANCE_ENDPOINT}/${validAttendanceId}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<string>(response);
}

export async function getCourseAttendance(
    attendanceId: number,
): Promise<CourseAttendance> {
    const validAttendanceId = validateId(
        attendanceId,
        "ID de asistencia del curso",
    );

    const response = await fetch(
        `${COURSE_ATTENDANCE_ENDPOINT}/${validAttendanceId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<CourseAttendance>(response);
}

export async function getCourseAttendancesByCourse(
    courseId: number,
): Promise<CourseAttendance[]> {
    const validCourseId = validateId(courseId, "ID del curso");

    const response = await fetch(
        `${COURSE_ATTENDANCE_ENDPOINT}/course/${validCourseId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<CourseAttendance[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function updateAttendance(
    attendanceId: number,
    payload: AttendancePayload,
): Promise<Attendance> {
    const validAttendanceId = validateId(attendanceId, "ID de asistencia");

    if (payload.enrollment_id !== undefined) {
        validateId(payload.enrollment_id, "ID de matrícula");
    }

    if (payload.course_attendance_id !== undefined) {
        validateId(payload.course_attendance_id, "ID de asistencia del curso");
    }

    const body = {
        enrollment_id: payload.enrollment_id,
        course_attendance_id: payload.course_attendance_id,
        attendance_state: normalizeAttendanceState(
            payload.attendance_state ?? payload.state ?? "PENDIENTE",
        ),
        deleted: payload.deleted ?? false,
    };

    const response = await fetch(`${ATTENDANCE_ENDPOINT}/${validAttendanceId}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        cache: "no-store",
        body: JSON.stringify(body),
    });

    const data = await handleApiResponse<Attendance>(response);

    return normalizeAttendance(data);
}

export async function createAttendance(
    payload: AttendancePayload,
): Promise<Attendance> {
    if (payload.enrollment_id !== undefined) {
        validateId(payload.enrollment_id, "ID de matrícula");
    }

    if (payload.course_attendance_id !== undefined) {
        validateId(payload.course_attendance_id, "ID de asistencia del curso");
    }

    const body = {
        enrollment_id: payload.enrollment_id,
        course_attendance_id: payload.course_attendance_id,
        attendance_state: normalizeAttendanceState(
            payload.attendance_state ?? payload.state ?? "PENDIENTE",
        ),
        deleted: payload.deleted ?? false,
    };

    const response = await fetch(ATTENDANCE_ENDPOINT, {
        method: "POST",
        headers: getJsonHeaders(),
        cache: "no-store",
        body: JSON.stringify(body),
    });

    const data = await handleApiResponse<Attendance>(response);

    return normalizeAttendance(data);
}

export async function changeAttendanceState(
    attendance: Attendance,
    attendanceState: AttendanceState,
): Promise<Attendance> {
    return updateAttendance(attendance.id, {
        enrollment_id: attendance.enrollment_id,
        course_attendance_id: attendance.course_attendance_id,
        attendance_state: attendanceState,
        deleted: attendance.deleted ?? false,
    });
}

export async function getAttendance(attendanceId: number): Promise<Attendance> {
    const validAttendanceId = validateId(attendanceId, "ID de asistencia");

    const response = await fetch(`${ATTENDANCE_ENDPOINT}/${validAttendanceId}`, {
        method: "GET",
        headers: getJsonHeaders(),
        cache: "no-store",
    });

    const data = await handleApiResponse<Attendance>(response);

    return normalizeAttendance(data);
}

export async function getAttendancesByCourseAttendance(
    courseAttendanceId: number,
): Promise<Attendance[]> {
    const validCourseAttendanceId = validateId(
        courseAttendanceId,
        "ID de asistencia del curso",
    );

    const response = await fetch(
        `${ATTENDANCE_ENDPOINT}/course-attendance/${validCourseAttendanceId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<Attendance[]>(response);

    return Array.isArray(data) ? data.map(normalizeAttendance) : [];
}

export async function getAttendancesByEnrollment(
    enrollmentId: number,
): Promise<AttendanceWithEnrollmentResponse[]> {
    const validEnrollmentId = validateId(enrollmentId, "ID de matrícula");

    const response = await fetch(
        `${ATTENDANCE_ENDPOINT}/enrollment/${validEnrollmentId}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data =
        await handleApiResponse<AttendanceWithEnrollmentResponse[]>(response);

    return Array.isArray(data) ? data.map(normalizeAttendance) : [];
}
