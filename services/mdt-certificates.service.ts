import {
    API_URL,
    appendFormValue,
    getFormUrlEncodedHeaders,
    getJsonHeaders,
    getMultipartHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const ENDPOINT_CERTIFICADOS_MDT = `${API_URL}/api/v1/mdt-certificates`;

const TIPOS_CERTIFICADO_CONSULTA = [
    "MDT",
    "INSTITUTIONAL",
] as const;

export type MdtCertificate = {
    id: number;
    course_id: number;
    file_url: string;
    file_name: string;
    id_number: string;
    certificate_type: string;
    deleted: boolean;
    created_at: string;
    updated_at: string;
};

export type CreateMdtCertificatePayload = {
    file: File | Blob;
    course_id: number;
    id_number: string;
    certificate_type: string;
};

export type CreateMdtCertificatesBulkPayload = {
    files: Array<File | Blob>;
    course_id: number;
    certificate_type: string;
    id_number?: string;
};

export type UpdateMdtCertificatePayload = {
    deleted?: boolean;
};

export type CertificadoMdt = MdtCertificate;
export type CrearCertificadoMdtPayload = CreateMdtCertificatePayload;
export type CrearCertificadosMdtMasivoPayload =
    CreateMdtCertificatesBulkPayload;
export type ActualizarCertificadoMdtPayload =
    UpdateMdtCertificatePayload;

function normalizarTexto(valor: unknown, etiqueta: string): string {
    const valorLimpio = String(valor ?? "").trim();

    if (!valorLimpio) {
        throw new Error(`${etiqueta} es obligatorio.`);
    }

    return valorLimpio;
}

function normalizarTextoOpcional(valor: unknown): string {
    return String(valor ?? "").trim();
}

function normalizarCedula(valor: unknown): string {
    return String(valor ?? "")
        .trim()
        .replace(/\s+/g, "");
}

function validarArchivo(archivo: File | Blob, mensaje: string) {
    const esArchivo =
        typeof File !== "undefined" && archivo instanceof File;

    const esBlob =
        typeof Blob !== "undefined" && archivo instanceof Blob;

    if (!esArchivo && !esBlob) {
        throw new Error(mensaje);
    }
}

function validarListaArchivos(files: Array<File | Blob>) {
    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("Debe seleccionar al menos un archivo.");
    }

    files.forEach((file) => {
        validarArchivo(
            file,
            "Uno de los archivos seleccionados no es válido.",
        );
    });
}

function construirFormularioCrearCertificadoMdt(
    payload: CreateMdtCertificatePayload,
): FormData {
    const data = new FormData();

    validarArchivo(
        payload.file,
        "El archivo del certificado no es válido.",
    );

    data.append("file", payload.file);

    appendFormValue(
        data,
        "course_id",
        validateId(payload.course_id, "ID de curso"),
    );

    appendFormValue(
        data,
        "id_number",
        normalizarTexto(
            payload.id_number,
            "Número de identificación",
        ),
    );

    appendFormValue(
        data,
        "certificate_type",
        normalizarTexto(
            payload.certificate_type,
            "Tipo de certificado",
        ),
    );

    return data;
}

function construirFormularioCrearCertificadosMdtMasivo(
    payload: CreateMdtCertificatesBulkPayload,
): FormData {
    const data = new FormData();

    validarListaArchivos(payload.files);

    payload.files.forEach((file) => {
        data.append("files", file);
    });

    appendFormValue(
        data,
        "course_id",
        validateId(payload.course_id, "ID de curso"),
    );

    appendFormValue(
        data,
        "certificate_type",
        normalizarTexto(
            payload.certificate_type,
            "Tipo de certificado",
        ),
    );

    const idNumber = normalizarTextoOpcional(payload.id_number);

    if (idNumber) {
        appendFormValue(data, "id_number", idNumber);
    }

    return data;
}

function construirCuerpoActualizarCertificadoMdt(
    payload: UpdateMdtCertificatePayload,
): URLSearchParams {
    const body = new URLSearchParams();

    if (
        payload.deleted !== undefined &&
        payload.deleted !== null
    ) {
        body.append("deleted", String(payload.deleted));
    }

    return body;
}

function getCertificateTimestamp(
    certificate: MdtCertificate,
): number {
    const updatedAt = new Date(
        certificate.updated_at,
    ).getTime();

    const createdAt = new Date(
        certificate.created_at,
    ).getTime();

    if (Number.isFinite(updatedAt)) return updatedAt;
    if (Number.isFinite(createdAt)) return createdAt;

    return 0;
}

export function isMdtCertificate(
    certificate: MdtCertificate | null | undefined,
): boolean {
    if (!certificate) return false;

    const type = String(certificate.certificate_type ?? "")
        .trim()
        .toLowerCase();

    return (
        type === "mdt" ||
        type.includes("mdt") ||
        type.includes("ministerio") ||
        type.includes("trabajo")
    );
}

export function isActiveMdtCertificate(
    certificate: MdtCertificate | null | undefined,
): boolean {
    if (!certificate) return false;

    return !certificate.deleted && isMdtCertificate(certificate);
}

export function filterActiveMdtCertificates(
    certificates: MdtCertificate[],
): MdtCertificate[] {
    return certificates.filter((certificate) =>
        isActiveMdtCertificate(certificate),
    );
}

export async function createMdtCertificate(
    payload: CreateMdtCertificatePayload,
): Promise<MdtCertificate> {
    const response = await fetch(
        `${ENDPOINT_CERTIFICADOS_MDT}/`,
        {
            method: "POST",
            headers: getMultipartHeaders(),
            body: construirFormularioCrearCertificadoMdt(payload),
        },
    );

    return handleApiResponse<MdtCertificate>(response);
}

export async function createMdtCertificatesBulk(
    payload: CreateMdtCertificatesBulkPayload,
): Promise<string> {
    const response = await fetch(
        `${ENDPOINT_CERTIFICADOS_MDT}/bulk`,
        {
            method: "POST",
            headers: getMultipartHeaders(),
            body: construirFormularioCrearCertificadosMdtMasivo(
                payload,
            ),
        },
    );

    return handleApiResponse<string>(response);
}

export async function getMdtCertificateById(
    certificateId: number,
): Promise<MdtCertificate> {
    const certificateIdValido = validateId(
        certificateId,
        "ID de certificado MDT",
    );

    const response = await fetch(
        `${ENDPOINT_CERTIFICADOS_MDT}/${certificateIdValido}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    return handleApiResponse<MdtCertificate>(response);
}

export async function updateMdtCertificate(
    certificateId: number,
    payload: UpdateMdtCertificatePayload,
): Promise<MdtCertificate> {
    const certificateIdValido = validateId(
        certificateId,
        "ID de certificado MDT",
    );

    const response = await fetch(
        `${ENDPOINT_CERTIFICADOS_MDT}/${certificateIdValido}`,
        {
            method: "PUT",
            headers: getFormUrlEncodedHeaders(),
            body: construirCuerpoActualizarCertificadoMdt(payload),
        },
    );

    return handleApiResponse<MdtCertificate>(response);
}

export async function deleteMdtCertificate(
    certificateId: number,
): Promise<MdtCertificate> {
    const certificateIdValido = validateId(
        certificateId,
        "ID de certificado MDT",
    );

    const response = await fetch(
        `${ENDPOINT_CERTIFICADOS_MDT}/${certificateIdValido}`,
        {
            method: "DELETE",
            headers: getJsonHeaders(),
        },
    );

    return handleApiResponse<MdtCertificate>(response);
}

export async function getMdtCertificatesByCourseId(
    courseId: number,
): Promise<MdtCertificate[]> {
    const courseIdValido = validateId(
        courseId,
        "ID de curso",
    );

    const response = await fetch(
        `${ENDPOINT_CERTIFICADOS_MDT}/course/${courseIdValido}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    const data =
        await handleApiResponse<MdtCertificate[]>(response);

    return Array.isArray(data) ? data : [];
}

export async function getMdtCertificateByCourseAndIdNumber(
    courseId: number,
    idNumber: string,
    certificateType: string,
): Promise<MdtCertificate | null> {
    const validCourseId = validateId(
        courseId,
        "ID del curso",
    );

    const normalizedIdNumber = normalizarCedula(
        normalizarTexto(
            idNumber,
            "Número de identificación",
        ),
    );

    const normalizedCertificateType = normalizarTexto(
        certificateType,
        "Tipo de certificado",
    );

    const params = new URLSearchParams({
        course_id: String(validCourseId),
        certificate_type: normalizedCertificateType,
    });

    const response = await fetch(
        `${ENDPOINT_CERTIFICADOS_MDT}/id-number/${encodeURIComponent(
            normalizedIdNumber,
        )}?${params.toString()}`,
        {
            method: "GET",
            headers: getJsonHeaders(),
            cache: "no-store",
        },
    );

    if (response.status === 404) {
        return null;
    }

    return handleApiResponse<MdtCertificate>(response);
}

export async function getMdtCertificatesByCourseAndIdNumber(
    courseId: number,
    idNumber: string,
): Promise<MdtCertificate[]> {
    const certificates = await Promise.all(
        TIPOS_CERTIFICADO_CONSULTA.map((certificateType) =>
            getMdtCertificateByCourseAndIdNumber(
                courseId,
                idNumber,
                certificateType,
            ),
        ),
    );

    const uniqueCertificates = new Map<number, MdtCertificate>();

    certificates.forEach((certificate) => {
        if (!certificate || certificate.deleted) return;

        uniqueCertificates.set(certificate.id, certificate);
    });

    return Array.from(uniqueCertificates.values()).sort(
        (a, b) =>
            getCertificateTimestamp(b) -
            getCertificateTimestamp(a),
    );
}

export async function getMdtCertificatesByIdNumber(
    idNumber: string,
    courseId: number,
): Promise<MdtCertificate[]> {
    return getMdtCertificatesByCourseAndIdNumber(
        courseId,
        idNumber,
    );
}

/* Alias en español */

export const crearCertificadoMdt = createMdtCertificate;

export const crearCertificadosMdtMasivo =
    createMdtCertificatesBulk;

export const obtenerCertificadoMdtPorId =
    getMdtCertificateById;

export const actualizarCertificadoMdt =
    updateMdtCertificate;

export const eliminarCertificadoMdt =
    deleteMdtCertificate;

export const obtenerCertificadosMdtPorCurso =
    getMdtCertificatesByCourseId;

export const obtenerCertificadosMdtPorNumeroIdentificacion =
    getMdtCertificatesByIdNumber;

export const obtenerCertificadoMdtPorCursoYCedula =
    getMdtCertificateByCourseAndIdNumber;

export const obtenerCertificadosMdtPorCursoYCedula =
    getMdtCertificatesByCourseAndIdNumber;
