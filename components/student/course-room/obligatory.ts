import {
    API_URL,
    appendFormValue,
    getJsonHeaders,
    getMultipartHeaders,
    handleApiResponse,
    validateId,
} from "../../../services/api-client.service";

const ENDPOINT_MDT_REQUIRED_FILES = `${API_URL}/api/v1/mdt-required-files`;

export type MdtRequiredFile = {
    id: number;
    course_id: number;
    title: string;
    description?: string | null;
    is_required?: boolean | null;
    accepted_file_types?: string | null;
    max_file_size_mb?: number | string | null;
    template_url?: string | null;
    deleted?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
};

export type MdtRequiredFileSubmission = {
    id: number;
    required_file_id: number;
    course_id: number;
    id_number: string;
    file_url: string;
    file_name: string;
    comment?: string | null;
    status?: "pending" | "approved" | "rejected" | string | null;
    review_comment?: string | null;
    deleted?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
};

export type CreateMdtRequiredFileSubmissionPayload = {
    required_file_id: number;
    course_id: number;
    id_number: string;
    file: File | Blob;
    comment?: string | null;
};

function normalizarTexto(valor: unknown, etiqueta: string): string {
    const valorLimpio = String(valor ?? "").trim();

    if (!valorLimpio) {
        throw new Error(`${etiqueta} es obligatorio.`);
    }

    return valorLimpio;
}

function normalizarCedula(valor: unknown): string {
    return String(valor ?? "").trim().replace(/\s+/g, "");
}

function validarArchivo(archivo: File | Blob) {
    const esArchivo = typeof File !== "undefined" && archivo instanceof File;
    const esBlob = typeof Blob !== "undefined" && archivo instanceof Blob;

    if (!esArchivo && !esBlob) {
        throw new Error("El archivo seleccionado no es válido.");
    }
}

function construirFormularioEnvio(
    payload: CreateMdtRequiredFileSubmissionPayload,
): FormData {
    const formData = new FormData();

    validarArchivo(payload.file);

    appendFormValue(
        formData,
        "required_file_id",
        validateId(payload.required_file_id, "ID de archivo obligatorio"),
    );

    appendFormValue(
        formData,
        "course_id",
        validateId(payload.course_id, "ID de curso"),
    );

    appendFormValue(
        formData,
        "id_number",
        normalizarCedula(
            normalizarTexto(payload.id_number, "Número de identificación"),
        ),
    );

    formData.append("file", payload.file);

    const comment = String(payload.comment ?? "").trim();

    if (comment) {
        appendFormValue(formData, "comment", comment);
    }

    return formData;
}

export async function getMdtRequiredFilesByCourse(
    courseId: number,
): Promise<MdtRequiredFile[]> {
    const courseIdValido = validateId(courseId, "ID de curso");

    const response = await fetch(
        `${ENDPOINT_MDT_REQUIRED_FILES}/course/${courseIdValido}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<MdtRequiredFile[]>(response);

    return Array.isArray(data)
        ? data.filter((item) => item.deleted !== true)
        : [];
}

export async function getMdtRequiredFileSubmissionsByStudent(
    courseId: number,
    idNumber: string,
): Promise<MdtRequiredFileSubmission[]> {
    const courseIdValido = validateId(courseId, "ID de curso");
    const idNumberValido = encodeURIComponent(
        normalizarCedula(
            normalizarTexto(idNumber, "Número de identificación"),
        ),
    );

    const response = await fetch(
        `${ENDPOINT_MDT_REQUIRED_FILES}/submissions/student/${idNumberValido}/course/${courseIdValido}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data = await handleApiResponse<MdtRequiredFileSubmission[]>(response);

    return Array.isArray(data)
        ? data.filter((item) => item.deleted !== true)
        : [];
}

export async function createMdtRequiredFileSubmission(
    payload: CreateMdtRequiredFileSubmissionPayload,
): Promise<MdtRequiredFileSubmission> {
    const response = await fetch(
        `${ENDPOINT_MDT_REQUIRED_FILES}/submissions/`,
        {
            method: "POST",
            headers: getMultipartHeaders(),
            body: construirFormularioEnvio(payload),
        },
    );

    return handleApiResponse<MdtRequiredFileSubmission>(response);
}

export async function getMdtRequiredFilesWithSubmissions(
    courseId: number,
    idNumber: string,
): Promise<{
    requiredFiles: MdtRequiredFile[];
    submissions: MdtRequiredFileSubmission[];
}> {
    const [requiredFiles, submissions] = await Promise.all([
        getMdtRequiredFilesByCourse(courseId),
        getMdtRequiredFileSubmissionsByStudent(courseId, idNumber),
    ]);

    return {
        requiredFiles,
        submissions,
    };
}

export const obtenerArchivosObligatoriosMdtPorCurso =
    getMdtRequiredFilesByCourse;

export const obtenerEnviosArchivosObligatoriosMdt =
    getMdtRequiredFileSubmissionsByStudent;

export const crearEnvioArchivoObligatorioMdt =
    createMdtRequiredFileSubmission;

export const obtenerArchivosObligatoriosMdtConEnvios =
    getMdtRequiredFilesWithSubmissions;